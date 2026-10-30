import {
    BufferGeometry,
    CylinderGeometry,
    EdgesGeometry,
    ExtrudeGeometry,
    Float32BufferAttribute,
    LatheGeometry,
    Matrix4,
    Path,
    Shape,
    Vector2,
    Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// Shared builders for the procedural part library. Every rotary part is
// built around local +Z, centred on the origin, in millimetres.

// A piece of a part. Repeated pieces (magnet segments, rollers, planets) are
// one geometry with one matrix per copy, drawn as a single InstancedMesh.
export interface Piece {
    geometry: BufferGeometry;
    matrices?: Matrix4[];
    // Face tone: the part's body, a lighter second material (windings, the
    // other magnet pole, rolling elements), or a line-only detail layer.
    tone?: "body" | "alt" | "lines";
    // Crease angle (degrees) for edge lines; false draws no edges.
    edges?: number | false;
}

export const TAU = Math.PI * 2;
const ARC = 72;

export const polar = (r: number, a: number): Vector2 =>
    new Vector2(r * Math.cos(a), r * Math.sin(a));

export function circlePath(r: number): Path {
    const p = new Path();
    p.absarc(0, 0, r, 0, TAU, false);
    return p;
}

export function ringShape(outer: number, inner: number): Shape {
    const s = new Shape();
    s.absarc(0, 0, outer, 0, TAU, false);
    if (inner > 0) s.holes.push(circlePath(inner));
    return s;
}

export function polygonShape(points: Vector2[], holes: Path[] = []): Shape {
    const s = new Shape(points);
    s.holes.push(...holes);
    return s;
}

export function polygonPath(points: Vector2[]): Path {
    return new Path(points);
}

// Extrude a shape along +Z, centred on z = 0.
export function extrude(shape: Shape | Shape[], depth: number, curveSegments = ARC): BufferGeometry {
    const g = new ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments });
    g.translate(0, 0, -depth / 2);
    return g;
}

export function ringGeometry(outer: number, inner: number, length: number): BufferGeometry {
    return extrude(ringShape(outer, inner), length);
}

// Solid cylinder about Z.
export function rod(radius: number, length: number, segments = 48): BufferGeometry {
    const g = new CylinderGeometry(radius, radius, length, segments, 1);
    g.rotateX(Math.PI / 2);
    return g;
}

// Revolve a closed (r, z) profile about Z.
export function revolve(profile: [number, number][], segments = ARC): BufferGeometry {
    const pts = profile.map(([r, z]) => new Vector2(Math.max(r, 0.001), z));
    const g = new LatheGeometry(pts, segments);
    g.rotateX(Math.PI / 2);
    return g;
}

// Tooth outline of a gear: one tooth per pitch, tooth centres at k * TAU / n.
// For an internal gear the "tip" sits inside the pitch circle.
export function gearPoints(teeth: number, module: number, internal = false): Vector2[] {
    const rp = (teeth * module) / 2;
    const tip = internal ? rp - module : rp + module;
    const root = internal ? rp + 1.25 * module : rp - 1.25 * module;
    const tau = TAU / teeth;
    const hRoot = tau * 0.31;
    const hPitch = tau * 0.25;
    const hTip = tau * 0.14;
    const pts: Vector2[] = [];
    for (let k = 0; k < teeth; k++) {
        const a = k * tau;
        pts.push(
            polar(root, a - hRoot),
            polar(rp, a - hPitch),
            polar(tip, a - hTip),
            polar(tip, a + hTip),
            polar(rp, a + hPitch),
            polar(root, a + hRoot),
        );
    }
    return pts;
}

// Merge copies of a geometry placed by `matrices` into one.
export function mergeCopies(geometry: BufferGeometry, matrices: Matrix4[]): BufferGeometry {
    const copies = matrices.map((m) => geometry.clone().applyMatrix4(m));
    const merged = mergeGeometries(copies, false);
    for (const c of copies) c.dispose();
    return merged ?? new BufferGeometry();
}

export function mergeAll(geometries: BufferGeometry[]): BufferGeometry {
    const flat = geometries.map((g) => (g.index ? g.toNonIndexed() : g));
    return mergeGeometries(flat, false) ?? new BufferGeometry();
}

// Crease lines of a piece, with every instance baked into one geometry so a
// hundred magnet segments still cost one draw call.
export function edgeLines(piece: Piece): BufferGeometry | null {
    if (piece.edges === false || piece.tone === "lines") return null;
    const edges = new EdgesGeometry(piece.geometry, piece.edges ?? 20);
    if (!piece.matrices) return edges;
    const merged = mergeCopies(edges, piece.matrices);
    edges.dispose();
    return merged;
}

// Line segments from a list of polylines.
export function polylines(lines: Vector3[][], closed = false): BufferGeometry {
    const pos: number[] = [];
    for (const line of lines) {
        const n = closed ? line.length : line.length - 1;
        for (let i = 0; i < n; i++) {
            const a = line[i] as Vector3;
            const b = line[(i + 1) % line.length] as Vector3;
            pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
        }
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(pos, 3));
    return g;
}

export function circleLine(r: number, z: number, cx = 0, cy = 0, segments = ARC): Vector3[] {
    const pts: Vector3[] = [];
    for (let i = 0; i < segments; i++) {
        const a = (i / segments) * TAU;
        pts.push(new Vector3(cx + r * Math.cos(a), cy + r * Math.sin(a), z));
    }
    return pts;
}

export function helixLine(r: number, lead: number, z0: number, z1: number, phase = 0): Vector3[] {
    const turns = Math.abs(z1 - z0) / lead;
    const n = Math.max(8, Math.ceil(turns * 36));
    const pts: Vector3[] = [];
    for (let i = 0; i <= n; i++) {
        const t = i / n;
        const a = phase + t * turns * TAU;
        pts.push(new Vector3(r * Math.cos(a), r * Math.sin(a), z0 + (z1 - z0) * t));
    }
    return pts;
}

// Matrices for `count` copies spun evenly about Z at radius r (copy local +X
// points outward), optionally with a fixed extra transform first.
export function aroundZ(count: number, r: number, z = 0, pre?: Matrix4, offset = 0): Matrix4[] {
    const out: Matrix4[] = [];
    for (let i = 0; i < count; i++) {
        const a = offset + (i / count) * TAU;
        const m = new Matrix4().makeRotationZ(a).multiply(new Matrix4().makeTranslation(r, 0, z));
        if (pre) m.multiply(pre);
        out.push(m);
    }
    return out;
}
