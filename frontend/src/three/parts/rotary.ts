import { BoxGeometry, CylinderGeometry, Matrix4, Shape, Vector2, Vector3 } from "three";
import type {
    BoltProps,
    CylinderProps,
    HousingProps,
    LaminationStackProps,
    MagnetRingProps,
    RingProps,
    WindingCoilsProps,
} from "../../../../src/supply-chain/scenes/spec";
import {
    type Piece,
    TAU,
    aroundZ,
    circleLine,
    circlePath,
    extrude,
    mergeAll,
    polar,
    polygonPath,
    polygonShape,
    polylines,
    revolve,
    ringGeometry,
    rod,
} from "./geometry";

export function cylinderPart(p: CylinderProps): Piece[] {
    const geometry = p.bore ? ringGeometry(p.radius, p.bore, p.length) : rod(p.radius, p.length, 64);
    return [{ geometry, edges: 30 }];
}

export function ringPart(p: RingProps): Piece[] {
    return [{ geometry: ringGeometry(p.outer, p.inner, p.length), edges: 30 }];
}

function housingProfile(p: HousingProps): [number, number][] {
    const h = p.length / 2;
    const ri = p.outer - p.wall;
    if (p.profile === "cup") {
        const bore = p.bore ?? 0;
        return [
            [bore, -h],
            [p.outer, -h],
            [p.outer, h],
            [ri, h],
            [ri, -h + p.wall],
            [bore, -h + p.wall],
            [bore, -h],
        ];
    }
    if (p.profile === "flange") {
        const fr = p.outer * 1.22;
        const ft = p.wall * 1.6;
        return [
            [ri, -h],
            [fr, -h],
            [fr, -h + ft],
            [p.outer, -h + ft],
            [p.outer, h],
            [ri, h],
            [ri, -h],
        ];
    }
    return [
        [ri, -h],
        [p.outer, -h],
        [p.outer, h],
        [ri, h],
        [ri, -h],
    ];
}

export function housingPart(p: HousingProps): Piece[] {
    const pieces: Piece[] = [{ geometry: revolve(housingProfile(p), 96), edges: 30 }];
    if (p.ribs) {
        const depth = p.wall * 0.9;
        const rib = new BoxGeometry(depth, p.wall * 0.5, p.length * 0.62);
        pieces.push({ geometry: rib, matrices: aroundZ(p.ribs, p.outer + depth / 2), edges: 30 });
    }
    const bolts = p.bolts ?? 0;
    if (bolts > 0) {
        const r = p.outer - p.wall / 2;
        const hole = Math.min(p.wall * 0.32, 1.6);
        const lines = Array.from({ length: bolts }, (_, i) => {
            const a = (i / bolts) * TAU + Math.PI / bolts;
            return circleLine(hole, p.length / 2 + 0.05, r * Math.cos(a), r * Math.sin(a), 16);
        });
        pieces.push({ geometry: polylines(lines, true), tone: "lines" });
    }
    return pieces;
}

export function boltPart(p: BoltProps): Piece[] {
    const head = new CylinderGeometry(p.diameter * 0.85, p.diameter * 0.85, p.diameter * 0.65, 6);
    head.rotateX(Math.PI / 2);
    head.translate(0, 0, p.length / 2 - (p.diameter * 0.65) / 2);
    const shank = rod(p.diameter / 2, p.length - p.diameter * 0.65, 12);
    shank.translate(0, 0, -(p.diameter * 0.65) / 2);
    const geometry = mergeAll([head, shank]);
    const count = p.count ?? 1;
    const matrices = count > 1 || p.circle ? aroundZ(count, p.circle ?? 0, 0, undefined, Math.PI / count) : undefined;
    return [{ geometry, matrices, edges: 40 }];
}

// Outline of a slotted lamination: teeth radiate from a yoke circle `yoke`
// to tip radius `tip` (tip < yoke for an inner-teeth stator).
function toothedOutline(slots: number, yoke: number, tip: number): Vector2[] {
    const pitch = TAU / slots;
    const shoe = tip + (yoke - tip) * 0.16;
    const body = Math.min(tip, yoke) * pitch * 0.42;
    const half = (r: number) => body / 2 / Math.max(r, 0.001);
    const tipHalf = pitch * 0.4;
    const pts: Vector2[] = [];
    for (let i = 0; i < slots; i++) {
        const a = i * pitch;
        pts.push(
            polar(yoke, a - pitch / 2),
            polar(yoke, a - half(yoke)),
            polar(shoe, a - half(shoe)),
            polar(shoe, a - tipHalf),
            polar(tip, a - tipHalf),
            polar(tip, a + tipHalf),
            polar(shoe, a + tipHalf),
            polar(shoe, a + half(shoe)),
            polar(yoke, a + half(yoke)),
        );
    }
    return pts;
}

function statorShape(p: LaminationStackProps): { shape: Shape; outline: Vector2[] } {
    const span = p.outer - p.inner;
    if ((p.teeth ?? "inner") === "outer") {
        const outline = toothedOutline(p.slots, p.inner + span * 0.3, p.outer);
        return { shape: polygonShape(outline, [circlePath(p.inner)]), outline };
    }
    const outline = toothedOutline(p.slots, p.outer - span * 0.3, p.inner);
    const shape = new Shape();
    shape.absarc(0, 0, p.outer, 0, TAU, false);
    shape.holes.push(polygonPath(outline));
    return { shape, outline };
}

export function laminationPart(p: LaminationStackProps): Piece[] {
    const { shape, outline } = statorShape(p);
    const pieces: Piece[] = [{ geometry: extrude(shape, p.length), edges: 25 }];
    const sheets = p.sheets ?? 0;
    if (sheets > 1) {
        const lines: Vector3[][] = [];
        for (let i = 1; i < sheets; i++) {
            const z = -p.length / 2 + (i / sheets) * p.length;
            lines.push(outline.map((v) => new Vector3(v.x, v.y, z)));
        }
        pieces.push({ geometry: polylines(lines, true), tone: "lines" });
    }
    return pieces;
}

// One concentrated coil per tooth, a rectangular frame around the tooth body.
export function windingPart(p: WindingCoilsProps): Piece[] {
    const span = p.outer - p.inner;
    const outward = (p.teeth ?? "inner") === "outer";
    const yoke = outward ? p.inner + span * 0.3 : p.outer - span * 0.3;
    const tip = outward ? p.outer : p.inner;
    const pitch = TAU / p.slots;
    const body = Math.min(yoke, tip) * pitch * 0.42;
    const wire = Math.min(pitch * Math.min(yoke, tip) * 0.26, span * 0.2);
    const radial = Math.abs(yoke - tip) * 0.62;
    const w = body / 2 + wire;
    const l = p.length / 2 + wire;
    const frame = new Shape([
        new Vector2(-l, -w),
        new Vector2(l, -w),
        new Vector2(l, w),
        new Vector2(-l, w),
    ]);
    frame.holes.push(
        polygonPath([
            new Vector2(-p.length / 2, -body / 2),
            new Vector2(p.length / 2, -body / 2),
            new Vector2(p.length / 2, body / 2),
            new Vector2(-p.length / 2, body / 2),
        ]),
    );
    // Frame lies in (axial, tangential); extrude it radially along +X.
    const coil = extrude(frame, radial, 4);
    coil.rotateY(Math.PI / 2);
    const shoe = tip + (yoke - tip) * 0.16;
    const r0 = (yoke + shoe) / 2;
    return [{ geometry: coil, matrices: aroundZ(p.slots, r0), tone: "alt", edges: 30 }];
}

// Arc-segment magnets on a back-iron ring; alternate poles alternate tone.
export function magnetRingPart(p: MagnetRingProps): Piece[] {
    const back = p.backIron ?? 0;
    const outerSide = (p.backIronSide ?? "outer") === "outer";
    const mOuter = outerSide ? p.outer - back : p.outer;
    const mInner = outerSide ? p.inner : p.inner + back;
    const pitch = TAU / p.poles;
    const half = (pitch * 0.86) / 2;
    const seg = new Shape();
    seg.absarc(0, 0, mOuter, -half, half, false);
    seg.absarc(0, 0, mInner, half, -half, true);
    const geometry = extrude(seg, p.length * 0.96, 6);
    const even = Array.from({ length: Math.ceil(p.poles / 2) }, (_, i) =>
        new Matrix4().makeRotationZ(2 * i * pitch),
    );
    const odd = Array.from({ length: Math.floor(p.poles / 2) }, (_, i) =>
        new Matrix4().makeRotationZ((2 * i + 1) * pitch),
    );
    const pieces: Piece[] = [
        { geometry, matrices: even, edges: 30 },
        { geometry, matrices: odd, tone: "alt", edges: 30 },
    ];
    if (back > 0) {
        const ring = outerSide
            ? ringGeometry(p.outer, p.outer - back, p.length)
            : ringGeometry(p.inner + back, p.inner, p.length);
        pieces.push({ geometry: ring, edges: 30 });
    }
    return pieces;
}
