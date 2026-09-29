// Projection, face building, framing and shared drawing helpers. Rendering is
// a painter's algorithm over flat-shaded faces: good enough at thumbnail
// size, and it keeps the output crisp and dependency-free (no WebGL).
import { V, type Vec3 } from "./math";
import type { Mesh, Scene } from "./scene";

export type Rgb = [number, number, number];
export const CYAN: Rgb = [195, 255, 253];

export const rgb = (c: Rgb, a?: number) =>
    a == null ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
export const mix = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

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

type Offset = (m: Mesh) => Vec3;
const noOffset: Offset = () => [0, 0, 0];

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

export function buildFaces(scene: Scene, cam: Camera, offset: Offset = noOffset): Face[] {
    const out: Face[] = [];
    for (const m of scene.meshes) {
        const o = offset(m);
        const wv = m.v.map((p) => V.add(p, o));
        const cv = wv.map((p) => cam.to(p));
        const mc = V.add(m.c, o);
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

export const frontToBack = (faces: Face[]) => faces.filter((x) => x.front).sort((a, b) => b.z - a.z);

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
export function fit(scenes: Scene[], cam: Camera, box: Box, offset: Offset = noOffset): Frame {
    let x0 = 1e9;
    let y0 = 1e9;
    let x1 = -1e9;
    let y1 = -1e9;
    for (const s of scenes)
        for (const m of s.meshes) {
            const o = offset(m);
            for (const p of m.v) {
                const q = cam.to(V.add(p, o));
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

export interface Lights {
    key: Vec3;
    fill: Vec3;
    rim: Vec3;
}

// Studio lights fixed relative to the camera: key upper left, fill right, rim behind.
export function lights(cam: Camera): Lights {
    const back = V.mul(cam.fw, -1);
    return {
        key: V.norm(V.add(V.add(V.mul(cam.rt, -0.55), V.mul(cam.up, 0.85)), V.mul(back, 0.55))),
        fill: V.norm(V.add(V.mul(cam.rt, 0.8), V.mul(back, 0.4))),
        rim: V.norm(V.add(V.add(V.mul(cam.rt, 0.6), V.mul(cam.up, 0.35)), V.mul(back, -0.75))),
    };
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

// Fill a face and stroke it in the same colour to hide anti-aliasing seams.
export function paint(ctx: CanvasRenderingContext2D, fc: Face, fr: Frame, color: string): void {
    polyPath(ctx, fc, fr);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.6;
    ctx.stroke();
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

// Floor shadow: every face projected onto y = 0 along a light from above.
export function floorShadow(ctx: CanvasRenderingContext2D, scene: Scene, cam: Camera, fr: Frame, color: string, alpha: number, blur: number): void {
    const { width: W, height: H } = ctx.canvas;
    const oc = document.createElement("canvas");
    oc.width = W;
    oc.height = H;
    const o = oc.getContext("2d");
    if (!o) return;
    const ls = V.norm([0.25, 1, 0.35]);
    o.fillStyle = color;
    for (const m of scene.meshes)
        for (const f of m.f) {
            o.beginPath();
            f.forEach((i, k) => {
                const p = m.v[i];
                const [x, y] = fr.P(cam.to(V.sub(p, V.mul(ls, p[1] / ls[1]))));
                if (k) o.lineTo(x, y);
                else o.moveTo(x, y);
            });
            o.fill();
        }
    ctx.save();
    ctx.globalAlpha = alpha;
    if (blur) ctx.filter = `blur(${blur}px)`;
    ctx.drawImage(oc, 0, 0);
    ctx.restore();
}

// Deterministic 0..1 noise, so point clouds are identical on every paint.
export function hash(a: number, b: number): number {
    let h = (a * 374761393 + b * 668265263) | 0;
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
