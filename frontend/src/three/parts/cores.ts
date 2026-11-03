import { CatmullRomCurve3, Path, Shape, TubeGeometry, type Vector2 } from "three";
import type { CoilProps, RotorCoreProps } from "../../../../src/supply-chain/scenes/spec";
import { type Piece, TAU, aroundZ, circlePath, extrude, helixLine, mergeAll, polar, ringGeometry, rod } from "./geometry";

// Rotor cores for the rare-earth-free motors on /alts (salient, flux-barrier,
// cage and spoke rotors) and a helical coil for springs, twisted fibres,
// braided sleeves and cable wraps.

// Outline of a salient-pole rotor: `poles` flat-topped teeth on a round root.
function salientPoints(poles: number, outer: number, root: number): Vector2[] {
    const pitch = TAU / poles;
    const half = pitch * 0.22;
    const pts: Vector2[] = [];
    for (let k = 0; k < poles; k++) {
        const a = k * pitch;
        const steps = 6;
        for (let i = 0; i <= steps; i++) pts.push(polar(outer, a - half + (2 * half * i) / steps));
        const gap = pitch - 2 * half;
        for (let i = 1; i < steps; i++) pts.push(polar(root, a + half + (gap * i) / steps));
    }
    return pts;
}

// An annular sector hole, centred on angle `at`.
function sectorPath(rIn: number, rOut: number, at: number, span: number): Path {
    const p = new Path();
    p.absarc(0, 0, rOut, at - span / 2, at + span / 2, false);
    p.absarc(0, 0, rIn, at + span / 2, at - span / 2, true);
    p.closePath();
    return p;
}

function rectPath(cx: number, cy: number, a: number, len: number, wid: number): Path {
    const c = Math.cos(a);
    const s = Math.sin(a);
    const pt = (u: number, v: number): [number, number] => [cx + u * c - v * s, cy + u * s + v * c];
    const p = new Path();
    p.moveTo(...pt(-len / 2, -wid / 2));
    p.lineTo(...pt(len / 2, -wid / 2));
    p.lineTo(...pt(len / 2, wid / 2));
    p.lineTo(...pt(-len / 2, wid / 2));
    p.closePath();
    return p;
}

export function rotorCorePart(p: RotorCoreProps): Piece[] {
    const poles = Math.max(2, Math.round(p.poles));
    const pitch = TAU / poles;
    const bore = circlePath(p.inner);
    if (p.kind === "salient") {
        const shape = new Shape(salientPoints(poles, p.outer, p.inner + (p.outer - p.inner) * 0.55));
        shape.holes.push(bore);
        return [{ geometry: extrude(shape, p.length, 12), edges: 30 }];
    }
    const disc = new Shape();
    disc.absarc(0, 0, p.outer, 0, TAU, false);
    disc.holes.push(bore);
    if (p.kind === "flux-barrier") {
        // Layered air slots, deepest under the q-axis between two poles.
        const layers = Math.max(1, Math.round(p.layers ?? 3));
        const band = (p.outer - p.inner) / (layers * 2 + 1.5);
        for (let k = 0; k < poles; k++) {
            const q = k * pitch + pitch / 2;
            for (let j = 0; j < layers; j++) {
                const rOut = p.outer - band * (1 + 2 * j);
                disc.holes.push(sectorPath(rOut - band * 0.6, rOut, q, pitch * (0.78 - 0.16 * j)));
            }
        }
        return [{ geometry: extrude(disc, p.length, 48), edges: 30 }];
    }
    if (p.kind === "cage") {
        const bars = Math.max(6, Math.round(p.bars ?? 24));
        const rBar = (p.outer - p.inner) * 0.09;
        const rAt = p.outer - rBar * 2.2;
        for (let i = 0; i < bars; i++) {
            const at = polar(rAt, (i / bars) * TAU);
            const hole = new Path();
            hole.absarc(at.x, at.y, rBar, 0, TAU, false);
            disc.holes.push(hole);
        }
        const ends = [-1, 1].map((s) => {
            const g = ringGeometry(rAt + rBar, rAt - rBar, p.length * 0.08);
            g.translate(0, 0, s * p.length * 0.54);
            return g;
        });
        return [
            { geometry: extrude(disc, p.length, 48), edges: 30 },
            { geometry: rod(rBar * 0.95, p.length * 1.08, 10), matrices: aroundZ(bars, rAt), tone: "alt", edges: false },
            { geometry: mergeAll(ends), tone: "alt", edges: 30 },
        ];
    }
    // Spoke rotor: radial slots holding tangentially magnetised ferrite blocks.
    const len = (p.outer - p.inner) * 0.72;
    const wid = Math.min(len * 0.35, ((p.inner + p.outer) / 2) * pitch * 0.3);
    const rMid = p.inner + (p.outer - p.inner) * 0.5;
    for (let k = 0; k < poles; k++) {
        const a = k * pitch;
        const c = polar(rMid, a);
        disc.holes.push(rectPath(c.x, c.y, a, len, wid));
    }
    const magnet = extrude(
        (() => {
            const s = new Shape();
            s.moveTo(-len / 2, -wid / 2);
            s.lineTo(len / 2, -wid / 2);
            s.lineTo(len / 2, wid / 2);
            s.lineTo(-len / 2, wid / 2);
            s.closePath();
            return s;
        })(),
        p.length * 0.96,
        2,
    );
    return [
        { geometry: extrude(disc, p.length, 48), edges: 30 },
        { geometry: magnet, matrices: aroundZ(poles, rMid), tone: "alt", edges: 30 },
    ];
}

export function coilPart(p: CoilProps): Piece[] {
    const strands = Math.max(1, Math.round(p.strands ?? 1));
    const h = (p.turns * p.pitch) / 2;
    const lead = p.pitch * strands;
    const tube = (phase: number, hand: 1 | -1) => {
        const pts = helixLine(p.radius, lead, -h, h, phase).map((v) => {
            v.y *= hand;
            return v;
        });
        return new TubeGeometry(new CatmullRomCurve3(pts), Math.max(24, pts.length * 2), p.wire, 6, false);
    };
    const one = Array.from({ length: strands }, (_, i) => tube((i / strands) * TAU, 1));
    // A high crease angle keeps only the lines running along the wire.
    const pieces: Piece[] = [{ geometry: mergeAll(one), edges: 50 }];
    if (p.crossed) {
        const other = Array.from({ length: strands }, (_, i) => tube((i / strands) * TAU, -1));
        pieces.push({ geometry: mergeAll(other), tone: "alt", edges: 50 });
    }
    return pieces;
}
