import { BoxGeometry, Matrix4, Shape, Vector3 } from "three";
import type {
    BroachProps,
    FinishingStoneProps,
    GratingDiscProps,
    GrindingWheelProps,
    HobProps,
} from "../../../../src/supply-chain/scenes/spec";
import {
    type Piece,
    TAU,
    circleLine,
    extrude,
    gearPoints,
    helixLine,
    polygonShape,
    polylines,
    revolve,
    ringGeometry,
    rod,
} from "./geometry";

// Cutting and finishing tools drawn in the /manufacturing precision chain:
// thread-grinding wheel, gear hob, broach, superfinishing stone and a
// graduated encoder disc. Rotary tools are built about local Z.

export function grindingWheelPart(p: GrindingWheelProps): Piece[] {
    const bore = p.bore ?? p.radius * 0.25;
    const ribs = Math.max(0, Math.round(p.ribs ?? 0));
    if (ribs === 0) return [{ geometry: ringGeometry(p.radius, bore, p.width), edges: 30 }];
    // A thread-grinding wheel: the rim carries `ribs` V ridges, the thread
    // form dressed into it. Revolve the (r, z) outline of the ridged rim.
    const tip = p.width * 0.1;
    const pitch = p.width / ribs;
    const profile: [number, number][] = [[bore, -p.width / 2]];
    for (let i = 0; i < ribs; i++) {
        const z0 = -p.width / 2 + i * pitch;
        profile.push([p.radius, z0], [p.radius + tip, z0 + pitch / 2]);
    }
    profile.push([p.radius, p.width / 2], [bore, p.width / 2], [bore, -p.width / 2]);
    return [{ geometry: revolve(profile, 72), edges: 40 }];
}

export function hobPart(p: HobProps): Piece[] {
    const gashes = Math.max(3, Math.round(p.gashes));
    const body = p.radius * 0.82;
    const shank = rod(p.radius * 0.35, p.length * 1.3, 24);
    // Gashed body: a gear-like section with `gashes` deep flutes.
    const section = extrude(polygonShape(gearPoints(gashes, (2 * body) / (gashes + 2))), p.length, 4);
    // Cutting teeth: short blocks set on a single-start helix, one per
    // gash crossing, standing proud of the body.
    const tooth = new BoxGeometry(p.radius * 0.3, p.radius * 0.18, p.lead * 0.45);
    const turns = p.length / p.lead;
    const count = Math.max(gashes, Math.floor(turns * gashes));
    const matrices: Matrix4[] = [];
    for (let i = 0; i < count; i++) {
        const a = (i / gashes) * TAU;
        const z = -p.length / 2 + p.lead * 0.25 + (i / gashes) * p.lead;
        if (z > p.length / 2 - p.lead * 0.25) break;
        matrices.push(
            new Matrix4()
                .makeRotationZ(a)
                .multiply(new Matrix4().makeTranslation(p.radius, 0, z)),
        );
    }
    const helix = helixLine(p.radius * 1.02, p.lead, -p.length / 2, p.length / 2);
    return [
        { geometry: shank, edges: 30 },
        { geometry: section, edges: 30 },
        { geometry: tooth, matrices, tone: "alt", edges: 30 },
        { geometry: polylines([helix]), tone: "lines" },
    ];
}

export function broachPart(p: BroachProps): Piece[] {
    const teeth = Math.max(1, Math.round(p.teeth));
    const pitch = p.length / (teeth + 2);
    const pieces: Piece[] = [{ geometry: rod(p.radius, p.length, 32), edges: 30 }];
    const splines = Math.max(0, Math.round(p.splines ?? 0));
    for (let i = 0; i < teeth; i++) {
        const r = p.radius + (i + 1) * p.rise;
        const z = -p.length / 2 + (i + 1.5) * pitch;
        // Each ring is a toothed disc when the broach cuts splines.
        const g =
            splines > 0
                ? extrude(polygonShape(gearPoints(splines, (2 * r) / (splines + 2))), pitch * 0.4, 2)
                : ringGeometry(r, 0, pitch * 0.4);
        g.translate(0, 0, z);
        pieces.push({ geometry: g, tone: i === teeth - 1 ? "alt" : "body", edges: 30 });
    }
    return pieces;
}

export function finishingStonePart(p: FinishingStoneProps): Piece[] {
    // The X-Y section: a rectangle whose bottom face is hollowed into an arc
    // of `radius`, centred below the stone, extruded through the depth.
    const w = p.width / 2;
    const h = p.height / 2;
    const r = Math.max(p.radius, w * 1.01);
    const yc = -h - Math.sqrt(r * r - w * w);
    const a = Math.atan2(-h - yc, w);
    const s = new Shape();
    s.moveTo(-w, -h);
    s.lineTo(-w, h);
    s.lineTo(w, h);
    s.lineTo(w, -h);
    s.absarc(0, yc, r, a, Math.PI - a, false);
    s.closePath();
    return [{ geometry: extrude(s, p.depth, 24), edges: 30 }];
}

export function gratingDiscPart(p: GratingDiscProps): Piece[] {
    const t = p.thickness;
    const hub = p.hub ?? p.radius * 0.2;
    const tracks = Math.max(1, Math.round(p.tracks ?? 1));
    const lines: Vector3[][] = [];
    const z = t / 2 + 0.05;
    // Outer incremental track: `lines` radial graduations.
    const r0 = p.radius * 0.8;
    const r1 = p.radius * 0.95;
    for (let i = 0; i < p.lines; i++) {
        const a = (i / p.lines) * TAU;
        lines.push([
            new Vector3(r0 * Math.cos(a), r0 * Math.sin(a), z),
            new Vector3(r1 * Math.cos(a), r1 * Math.sin(a), z),
        ]);
    }
    // Inner code tracks: arcs of varying length, a stand-in for the absolute
    // code pattern, with a circle between tracks.
    const span = (r0 - hub * 1.4) / Math.max(1, tracks);
    for (let k = 1; k < tracks; k++) {
        const ri = r0 - k * span;
        const n = 8 * k + 3;
        for (let i = 0; i < n; i++) {
            if ((i * 7 + k) % 3 === 0) continue;
            const a0 = (i / n) * TAU;
            const a1 = a0 + (TAU / n) * 0.55;
            const arc: Vector3[] = [];
            for (let j = 0; j <= 6; j++) {
                const a = a0 + ((a1 - a0) * j) / 6;
                arc.push(new Vector3(ri * Math.cos(a), ri * Math.sin(a), z));
            }
            lines.push(arc);
        }
    }
    return [
        { geometry: ringGeometry(p.radius, hub, t), edges: 30 },
        { geometry: ringGeometry(hub * 1.3, hub, t * 2.2), edges: 30, tone: "alt" },
        { geometry: polylines(lines), tone: "lines" },
        { geometry: polylines([circleLine(r0 * 0.99, z, 0, 0, 96)], true), tone: "lines" },
    ];
}
