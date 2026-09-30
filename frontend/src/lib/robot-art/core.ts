// Projection, face building, framing and edge extraction. Rendering is a
// painter's algorithm over flat faces: good enough at thumbnail size, and it
// keeps the output crisp and dependency-free (no WebGL).
import { V, type Vec3 } from "./math";
import type { Mesh, Scene } from "./scene";

export interface CamSpec {
    yaw: number;
    pitch: number;
    dist: number;
    target: Vec3;
}

export interface Camera {
    pos: Vec3;
    fw: Vec3;
    rt: Vec3;
    up: Vec3;
    to(p: Vec3): Vec3;
}

export function camera(o: CamSpec): Camera {
    const { yaw, pitch, dist, target } = o;
    const pos = V.add(target, [dist * Math.cos(pitch) * Math.sin(yaw), dist * Math.sin(pitch), dist * Math.cos(pitch) * Math.cos(yaw)]);
    const fw = V.norm(V.sub(target, pos));
    const rt = V.norm(V.cross(fw, [0, 1, 0]));
    const up = V.cross(rt, fw);
    const f = 2.4;
    return {
        pos,
        fw,
        rt,
        up,
        to(p) {
            const d = V.sub(p, pos);
            const z = V.dot(d, fw);
            return [(V.dot(d, rt) / z) * f, (-V.dot(d, up) / z) * f, z];
        },
    };
}

export interface Face {
    m: Mesh;
    fi: number;
    f: number[];
    n: Vec3;
    c: Vec3;
    front: boolean;
    z: number;
    s: Vec3[];
    all: Face[];
}

// Newell's method: a robust normal for any planar-ish polygon.
function newell(pts: Vec3[]): Vec3 {
    let n: Vec3 = [0, 0, 0];
    for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        n = V.add(n, [(a[1] - b[1]) * (a[2] + b[2]), (a[2] - b[2]) * (a[0] + b[0]), (a[0] - b[0]) * (a[1] + b[1])]);
    }
    return n;
}

export function buildFaces(scene: Scene, cam: Camera): Face[] {
    const out: Face[] = [];
    for (const m of scene.meshes) {
        const wv = m.v;
        const cv = wv.map((p) => cam.to(p));
        const mc = m.c;
        const list: Face[] = [];
        m.f.forEach((f, fi) => {
            const pts = f.map((i) => wv[i]);
            let n = V.norm(newell(pts));
            let c: Vec3 = [0, 0, 0];
            for (const p of pts) c = V.add(c, p);
            c = V.mul(c, 1 / pts.length);
            // Primitives are convex, so "outward" is away from the mesh centre.
            if (V.dot(n, V.sub(c, mc)) < 0) n = V.mul(n, -1);
            let z = 0;
            for (const i of f) z += cv[i][2];
            list.push({ m, fi, f, n, c, front: V.dot(n, V.sub(cam.pos, c)) > 0, z: z / f.length, s: f.map((i) => cv[i]), all: list });
        });
        out.push(...list);
    }
    return out;
}

export interface Box {
    x: number;
    y: number;
    w: number;
    h: number;
    // Alignment inside the box: 0 = left/top, 1 = right/bottom.
    ax?: number;
    ay?: number;
}

export interface Frame {
    P(q: Vec3): [number, number];
    bounds: [number, number, number, number];
}

// Scale and place the projected robot(s) inside a pixel box.
export function fit(scenes: Scene[], cam: Camera, box: Box): Frame {
    let x0 = 1e9;
    let y0 = 1e9;
    let x1 = -1e9;
    let y1 = -1e9;
    for (const s of scenes)
        for (const m of s.meshes) {
            for (const p of m.v) {
                const q = cam.to(p);
                x0 = Math.min(x0, q[0]);
                x1 = Math.max(x1, q[0]);
                y0 = Math.min(y0, q[1]);
                y1 = Math.max(y1, q[1]);
            }
        }
    const sc = Math.min(box.w / (x1 - x0), box.h / (y1 - y0));
    const ox = box.x + (box.w - (x1 - x0) * sc) * (box.ax ?? 0.5) - x0 * sc;
    const oy = box.y + (box.h - (y1 - y0) * sc) * (box.ay ?? 1) - y0 * sc;
    return { P: (q) => [ox + q[0] * sc, oy + q[1] * sc], bounds: [ox + x0 * sc, oy + y0 * sc, ox + x1 * sc, oy + y1 * sc] };
}

export function polyPath(ctx: CanvasRenderingContext2D, fc: Face, fr: Frame): void {
    ctx.beginPath();
    fc.s.forEach((q, i) => {
        const [x, y] = fr.P(q);
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
    });
    ctx.closePath();
}

function edgeMap(m: Mesh): Map<string, number[]> {
    if (m.edges) return m.edges;
    const e = new Map<string, number[]>();
    m.f.forEach((f, fi) => {
        f.forEach((a, k) => {
            const b = f[(k + 1) % f.length];
            const key = a < b ? `${a},${b}` : `${b},${a}`;
            const list = e.get(key);
            if (list) list.push(fi);
            else e.set(key, [fi]);
        });
    });
    m.edges = e;
    return e;
}

// Edges worth drawing: silhouettes (neighbour faces away, kind 2) and creases
// sharper than acos(cosT) (kind 1).
export function featureEdges(fc: Face, cosT: number): [number, number, 1 | 2][] {
    const res: [number, number, 1 | 2][] = [];
    const edges = edgeMap(fc.m);
    const f = fc.f;
    for (let k = 0; k < f.length; k++) {
        const a = f[k];
        const b = f[(k + 1) % f.length];
        if (V.len(V.sub(fc.m.v[a], fc.m.v[b])) < 1e-7) continue;
        const nb = (edges.get(a < b ? `${a},${b}` : `${b},${a}`) ?? []).filter((x) => x !== fc.fi);
        let kind: 0 | 1 | 2 = nb.length ? 0 : 2;
        for (const gi of nb) {
            const g = fc.all[gi];
            if (!g.front) kind = 2;
            else if (V.dot(fc.n, g.n) < cosT && kind === 0) kind = 1;
        }
        if (kind) res.push([k, (k + 1) % f.length, kind]);
    }
    return res;
}

export function strokeEdges(ctx: CanvasRenderingContext2D, fc: Face, fr: Frame, color: string, crease: number, silhouette: number, cosT: number): void {
    ctx.strokeStyle = color;
    for (const [i, j, kind] of featureEdges(fc, cosT)) {
        const w = kind === 2 ? silhouette : crease;
        if (w <= 0) continue;
        const a = fr.P(fc.s[i]);
        const b = fr.P(fc.s[j]);
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.stroke();
    }
}
