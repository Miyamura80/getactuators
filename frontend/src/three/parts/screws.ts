import { CylinderGeometry, IcosahedronGeometry, Matrix4, Vector3 } from "three";
import type {
    BallScrewProps,
    BearingProps,
    RollerScrewProps,
} from "../../../../src/supply-chain/scenes/spec";
import {
    type Piece,
    TAU,
    aroundZ,
    circleLine,
    extrude,
    gearPoints,
    helixLine,
    mergeAll,
    polygonShape,
    polylines,
    ringGeometry,
    rod,
} from "./geometry";

function threadedShaft(radius: number, length: number, lead: number, starts: number): Piece[] {
    const h = length / 2;
    const helices = Array.from({ length: starts }, (_, i) =>
        helixLine(radius * 1.004, lead, -h, h, (i / starts) * TAU),
    );
    return [
        { geometry: rod(radius, length, 48), edges: 30 },
        { geometry: polylines(helices), tone: "lines" },
    ];
}

export function ballScrewPart(p: BallScrewProps): Piece[] {
    const pieces = threadedShaft(p.diameter / 2, p.length, p.lead, 1);
    if (p.nutLength) {
        const outer = p.nutOuter ?? p.diameter * 0.95;
        const nut = ringGeometry(outer, p.diameter / 2 + 0.2, p.nutLength);
        const flange = ringGeometry(outer * 1.45, outer, p.nutLength * 0.22);
        flange.translate(0, 0, -p.nutLength * 0.39);
        pieces.push({ geometry: mergeAll([nut, flange]), edges: 30 });
    }
    return pieces;
}

// Planetary roller screw: a multi-start screw, N threaded rollers with spur
// teeth at both ends, and the nut. `piece` picks one so an explode can pull
// them apart.
export function rollerScrewPart(p: RollerScrewProps): Piece[] {
    const piece = p.piece ?? "assembly";
    const rs = p.screwDiameter / 2;
    const rr = p.rollerDiameter / 2;
    const out: Piece[] = [];
    if (piece === "assembly" || piece === "screw") {
        out.push(...threadedShaft(rs, p.length, p.lead, 5));
    }
    if (piece === "assembly" || piece === "rollers") {
        const end = p.rollerLength * 0.1;
        const body = rod(rr * 0.92, p.rollerLength - 2 * end, 16);
        const module = p.rollerDiameter / 12;
        const teeth = (z: number) => {
            const g = extrude(polygonShape(gearPoints(10, module)), end, 2);
            g.translate(0, 0, z);
            return g;
        };
        const roller = mergeAll([body, teeth(-(p.rollerLength - end) / 2), teeth((p.rollerLength - end) / 2)]);
        const r = rs + rr;
        out.push({ geometry: roller, matrices: aroundZ(p.rollers, r), tone: "alt", edges: 30 });
        const grooves: Vector3[][] = [];
        const pitch = p.lead / 5;
        for (let i = 0; i < p.rollers; i++) {
            const a = (i / p.rollers) * TAU;
            for (let z = -p.rollerLength / 2 + end + pitch; z < p.rollerLength / 2 - end; z += pitch) {
                grooves.push(circleLine(rr * 0.93, z, r * Math.cos(a), r * Math.sin(a), 14));
            }
        }
        out.push({ geometry: polylines(grooves, true), tone: "lines" });
    }
    if (piece === "assembly" || piece === "nut") {
        const outer = p.nutOuter ?? rs + p.rollerDiameter * 1.6;
        out.push({ geometry: ringGeometry(outer, rs + 2 * rr, p.rollerLength * 1.1), edges: 30 });
    }
    return out;
}

function rollingElements(p: BearingProps, rm: number, d: number) {
    const count = p.elements ?? Math.max(6, Math.floor((TAU * rm) / (d * 1.45)));
    if (p.kind === "deep-groove" || p.kind === "angular-contact") {
        return { geometry: new IcosahedronGeometry(d / 2, 2), matrices: aroundZ(count, rm) };
    }
    if (p.kind === "needle") {
        const n = Math.floor((TAU * rm) / (d * 0.62 * 1.3));
        return { geometry: rod(d * 0.31, p.width * 0.8, 10), matrices: aroundZ(n, rm) };
    }
    // Crossed rollers: short cylinders, alternate ones turned 90 degrees.
    const roller = new CylinderGeometry(d / 2, d / 2, d * 0.9, 14);
    const matrices = aroundZ(count, rm).map((m, i) =>
        m.multiply(new Matrix4().makeRotationX(i % 2 ? Math.PI / 4 : -Math.PI / 4)),
    );
    return { geometry: roller, matrices };
}

export function bearingPart(p: BearingProps): Piece[] {
    const span = p.outer - p.inner;
    const t = span * 0.26;
    const rm = (p.outer + p.inner) / 2;
    const d = Math.min(span - 2 * t + span * 0.1, p.width * 0.7);
    const outerW = p.kind === "angular-contact" ? p.width * 0.9 : p.width;
    const elements = rollingElements(p, rm, d);
    return [
        { geometry: ringGeometry(p.outer, p.outer - t, outerW), edges: 30 },
        { geometry: ringGeometry(p.inner + t, p.inner, p.width), edges: 30 },
        { ...elements, tone: "alt", edges: p.kind === "crossed-roller" ? 40 : false },
    ];
}
