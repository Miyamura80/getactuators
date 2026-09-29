// The eight render directions. Each paints a full frame (background included)
// from the same scene, so a style is only a way of looking at the model.
import { V, type Vec3 } from "./math";
import {
    CYAN,
    type Camera,
    type Face,
    type Frame,
    type Lights,
    type Rgb,
    buildFaces,
    clamp01,
    featureEdges,
    floorShadow,
    frontToBack,
    hash,
    mix,
    paint,
    polyPath,
    rgb,
    strokeEdges,
} from "./core";
import type { Mesh, Scene } from "./scene";

export interface Ctx2D {
    ctx: CanvasRenderingContext2D;
    W: number;
    H: number;
    // Pixel unit: 1 at a 400x300 tile, scales with the canvas.
    u: number;
}

const ALBEDO: Record<string, Rgb> = {
    shell: [226, 230, 234],
    dark: [34, 37, 41],
    act: [58, 63, 70],
    metal: [150, 157, 164],
    rubber: [20, 20, 20],
    glass: [8, 10, 12],
    accent: CYAN,
    accent2: [60, 120, 120],
};

// Satin-metal shading: key + fill diffuse, a specular hit and a cyan rim.
export function studioColor(fc: Face, L: Lights, cam: Camera): Rgb {
    const { n } = fc;
    const mat = fc.m.mat;
    if (mat === "accent") return CYAN;
    const vd = V.norm(V.sub(cam.pos, fc.c));
    const dk = Math.max(0, V.dot(n, L.key));
    const df = Math.max(0, V.dot(n, L.fill));
    const r = V.sub(V.mul(n, 2 * V.dot(n, L.key)), L.key);
    const gloss = mat === "glass" ? 60 : mat === "shell" ? 18 : 30;
    const ks = mat === "glass" ? 0.9 : mat === "shell" ? 0.35 : mat === "rubber" ? 0.05 : 0.45;
    const sp = 255 * ks * Math.max(0, V.dot(r, vd)) ** gloss;
    const rim = (1 - Math.max(0, V.dot(n, vd))) ** 3 * Math.max(0, V.dot(n, L.rim) + 0.3);
    const base = ALBEDO[mat];
    const c = V.add(V.add(V.mul(base, 0.16 + 0.74 * dk + 0.14 * df), [sp, sp, sp]), V.mul(CYAN, rim * 0.45));
    return [Math.min(255, c[0]), Math.min(255, c[1]), Math.min(255, c[2])];
}

function fillBlack({ ctx, W, H }: Ctx2D): void {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
}

function grid({ ctx, W, H, u }: Ctx2D, color: string): void {
    const step = 20 * u;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0.5; x < W; x += step) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
    }
    for (let y = 0.5; y < H; y += step) {
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
    }
    ctx.stroke();
}

function floorGrid(ctx: CanvasRenderingContext2D, fr: Frame, cam: Camera, ext: [number, number, number, number], color: string): void {
    const [x0, x1, z0, z1] = ext;
    const seg = (a: Vec3, b: Vec3) => {
        ctx.moveTo(...fr.P(cam.to(a)));
        ctx.lineTo(...fr.P(cam.to(b)));
    };
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    for (let x = x0; x <= x1 + 1e-6; x += 0.1) seg([x, 0, z0], [x, 0, z1]);
    for (let z = z0; z <= z1 + 1e-6; z += 0.1) seg([x0, 0, z], [x1, 0, z]);
    ctx.stroke();
}

function mono(c: Ctx2D, size: number, weight = 500): void {
    c.ctx.font = `${weight} ${size * c.u}px 'JetBrains Mono', ui-monospace, monospace`;
}

export function studio(c: Ctx2D, scene: Scene, cam: Camera, fr: Frame, L: Lights, hue: number): void {
    const { ctx, W, H } = c;
    const g = ctx.createRadialGradient(W * 0.6, H * 0.3, 0, W * 0.6, H * 0.4, Math.max(W, H) * 0.8);
    g.addColorStop(0, `hsl(${hue} 30% 20%)`);
    g.addColorStop(0.55, `hsl(${hue} 30% 8%)`);
    g.addColorStop(1, "#040506");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    floorShadow(ctx, scene, cam, fr, "#000", 0.7, 6 * c.u);
    for (const fc of frontToBack(buildFaces(scene, cam))) paint(ctx, fc, fr, rgb(studioColor(fc, L, cam)));
}

// Four-step cel ramps in the brand greys; actuators step through teal to cyan.
const RAMPS: Record<string, string[]> = {
    shell: ["#383838", "#9ba4a6", "#d5dadb", "#f9f9f9"],
    dark: ["#141414", "#242424", "#383838", "#565c5e"],
    act: ["#1c2626", "#2f4a49", "#4f7775", "#7de6e2"],
    metal: ["#242424", "#383838", "#6c7476", "#9ba4a6"],
    rubber: ["#0a0a0a", "#121212", "#1a1a1a", "#242424"],
    glass: ["#050505", "#0a0a0a", "#141414", "#383838"],
    accent2: ["#2f4a49", "#4f7775", "#7de6e2", "#7de6e2"],
};

export function tonal(c: Ctx2D, scene: Scene, cam: Camera, fr: Frame, L: Lights): void {
    const { ctx, u } = c;
    fillBlack(c);
    floorShadow(ctx, scene, cam, fr, "#0f1111", 1, 0);
    for (const fc of frontToBack(buildFaces(scene, cam))) {
        let color = "#c3fffd";
        if (fc.m.mat !== "accent") {
            const d = 0.18 + Math.max(0, V.dot(fc.n, L.key)) * 0.72 + 0.2 * Math.max(0, V.dot(fc.n, L.fill));
            color = RAMPS[fc.m.mat][Math.min(3, Math.floor(d * 4.2))];
        }
        paint(ctx, fc, fr, color);
        strokeEdges(ctx, fc, fr, "#000", 0, 1.3 * u, 2);
    }
}

export function blueprint(c: Ctx2D, scene: Scene, cam: Camera, fr: Frame, caption: boolean): void {
    const { ctx, u } = c;
    fillBlack(c);
    grid(c, "#0d1414");
    floorGrid(ctx, fr, cam, [-0.6, 0.6, -0.6, 0.6], "rgba(195,255,253,0.08)");
    for (const fc of frontToBack(buildFaces(scene, cam))) {
        polyPath(ctx, fc, fr);
        ctx.fillStyle = "#000";
        ctx.fill();
        const bright = fc.m.mat === "act" || fc.m.mat === "accent";
        strokeEdges(ctx, fc, fr, bright ? "#c3fffd" : "rgba(195,255,253,0.62)", 0.8 * u, 1.3 * u, 0.82);
    }
    if (caption) {
        mono(c, 9);
        ctx.fillStyle = "rgba(155,164,166,0.8)";
        ctx.textAlign = "left";
        ctx.fillText("ISO VIEW  ·  1:10", 10 * u, 16 * u);
    }
}

export function rimLight(c: Ctx2D, scene: Scene, cam: Camera, fr: Frame, L: Lights): void {
    const { ctx } = c;
    fillBlack(c);
    for (const fc of frontToBack(buildFaces(scene, cam))) {
        const vd = V.norm(V.sub(cam.pos, fc.c));
        const fres = (1 - Math.max(0, V.dot(fc.n, vd))) ** 1.6;
        const rim = clamp01(fres * (0.35 + Math.max(0, V.dot(fc.n, L.rim) + 0.25) * 2.6));
        const key = Math.max(0, V.dot(fc.n, L.key)) ** 1.5 * (fc.m.mat === "shell" ? 0.22 : 0.09);
        const color = fc.m.mat === "accent" ? CYAN : mix([8, 10, 11], CYAN, clamp01(rim * 0.95 + key));
        paint(ctx, fc, fr, rgb(color));
    }
    const [bx0, , bx1, by1] = fr.bounds;
    const g = ctx.createLinearGradient(bx0, 0, bx1, 0);
    g.addColorStop(0, "rgba(195,255,253,0)");
    g.addColorStop(0.5, "rgba(195,255,253,0.35)");
    g.addColorStop(1, "rgba(195,255,253,0)");
    ctx.fillStyle = g;
    ctx.fillRect(bx0 - 20, by1 + 2, bx1 - bx0 + 40, 1);
}

function drawLabels(c: Ctx2D, scene: Scene, cam: Camera, fr: Frame): void {
    const { ctx, W, u } = c;
    mono(c, 9);
    const [bx0, , bx1] = fr.bounds;
    const used: number[] = [];
    for (const lb of scene.labels) {
        const [px, py] = fr.P(cam.to(lb.p));
        const right = px > (bx0 + bx1) / 2;
        const tx = right ? Math.min(W - 8, bx1 + 18) : Math.max(8, bx0 - 18);
        let ty = py;
        while (used.some((y) => Math.abs(y - ty) < 14 * u)) ty += 14 * u;
        used.push(ty);
        ctx.strokeStyle = "rgba(195,255,253,0.45)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + (right ? 8 : -8), ty);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.fillStyle = "#c3fffd";
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#9ba4a6";
        ctx.textAlign = right ? "left" : "right";
        ctx.textBaseline = "middle";
        ctx.fillText(lb.text, tx + (right ? 4 : -4), ty);
    }
}

export function xray(c: Ctx2D, scene: Scene, cam: Camera, fr: Frame, L: Lights, annotate: boolean, count: number): void {
    const { ctx, u } = c;
    fillBlack(c);
    grid(c, "#0a0f0f");
    const all = buildFaces(scene, cam);
    // Ghost shell: edges of every face, front and back, with no fill.
    ctx.lineWidth = 0.6 * u;
    for (const fc of all) {
        if (fc.m.mat === "act") continue;
        for (const [i, j, kind] of featureEdges(fc, 0.9)) {
            ctx.strokeStyle = kind === 2 ? "rgba(155,164,166,0.4)" : "rgba(155,164,166,0.14)";
            ctx.beginPath();
            ctx.moveTo(...fr.P(fc.s[i]));
            ctx.lineTo(...fr.P(fc.s[j]));
            ctx.stroke();
        }
    }
    for (const fc of frontToBack(all.filter((x) => x.m.mat === "act"))) {
        const d = 0.35 + 0.65 * Math.max(0, V.dot(fc.n, L.key));
        paint(ctx, fc, fr, rgb(mix([10, 40, 40], CYAN, d)));
    }
    if (!annotate) return;
    drawLabels(c, scene, cam, fr);
    mono(c, 10, 600);
    ctx.fillStyle = "#c3fffd";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(`${count} ACTUATORS`, 10 * u, 18 * u);
}

export function lidar(c: Ctx2D, scene: Scene, cam: Camera, fr: Frame): void {
    const { ctx, W, H, u } = c;
    fillBlack(c);
    const faces = frontToBack(buildFaces(scene, cam));
    // ID buffer: each mesh in a unique colour, so a point survives only where
    // its own mesh is the visible surface.
    const idc = document.createElement("canvas");
    idc.width = W;
    idc.height = H;
    const ic = idc.getContext("2d", { willReadFrequently: true });
    if (!ic) return;
    const ids = new Map<Mesh, number>(scene.meshes.map((m, i) => [m, i + 1]));
    const idColor = (id: number) => `rgb(${id & 255},${(id >> 8) & 255},7)`;
    for (const fc of faces) paint(ic, fc, fr, idColor(ids.get(fc.m) ?? 0));
    const buf = ic.getImageData(0, 0, W, H).data;
    let zmin = 1e9;
    let zmax = -1e9;
    for (const f of faces) {
        zmin = Math.min(zmin, f.z);
        zmax = Math.max(zmax, f.z);
    }
    const spacing = 2.3 * u;
    const [, by0, , by1] = fr.bounds;
    const scanY = by0 + (by1 - by0) * 0.42;
    for (const fc of faces) {
        const id = ids.get(fc.m) ?? 0;
        const P = fc.s.map((q) => fr.P(q));
        let area = 0;
        for (let i = 0; i < P.length; i++) {
            const a = P[i];
            const b = P[(i + 1) % P.length];
            area += a[0] * b[1] - b[0] * a[1];
        }
        const k = Math.abs(area) / 2 / (spacing * spacing);
        const count = Math.floor(k) + (hash(fc.fi, id * 97) < k % 1 ? 1 : 0);
        const t = clamp01((fc.z - zmin) / (zmax - zmin + 1e-9));
        const base: Rgb = fc.m.mat === "accent" ? CYAN : fc.m.mat === "act" ? mix(CYAN, [50, 120, 118], t) : mix([235, 245, 245], [45, 95, 97], t);
        for (let s = 0; s < count; s++) {
            let a = hash(fc.fi * 31 + s, id);
            let b = hash(fc.fi * 17 + s, id + 7);
            if (a + b > 1) {
                a = 1 - a;
                b = 1 - b;
            }
            const tri = P.length === 4 && hash(s, fc.fi + id) > 0.5 ? [P[0], P[2], P[3]] : [P[0], P[1], P[2]];
            const x = tri[0][0] + (tri[1][0] - tri[0][0]) * a + (tri[2][0] - tri[0][0]) * b;
            const y = tri[0][1] + (tri[1][1] - tri[0][1]) * a + (tri[2][1] - tri[0][1]) * b;
            const xi = x | 0;
            const yi = y | 0;
            if (xi < 0 || yi < 0 || xi >= W || yi >= H) continue;
            const q = (yi * W + xi) * 4;
            if (buf[q] !== (id & 255) || buf[q + 1] !== ((id >> 8) & 255) || buf[q + 2] !== 7) continue;
            const near = Math.max(0, 1 - Math.abs(y - scanY) / (14 * u));
            const r = (0.55 + near * 0.5) * u;
            ctx.fillStyle = rgb(mix(base, CYAN, near * 0.8));
            ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
        }
    }
    ctx.fillStyle = "rgba(195,255,253,0.45)";
    ctx.fillRect(0, scanY, W, Math.max(1, u * 0.6));
}

// Per-mesh displacement for the exploded view: parts move away from the
// robot's centre, and actuators slide further out of their joints.
export function explodeOffsets(scene: Scene, k: number): (m: Mesh) => Vec3 {
    const parts = new Map<number, { c: Vec3; n: number }>();
    for (const m of scene.meshes) {
        const p = parts.get(m.part) ?? { c: [0, 0, 0] as Vec3, n: 0 };
        p.c = V.add(p.c, m.c);
        p.n++;
        parts.set(m.part, p);
    }
    let centre: Vec3 = [0, 0, 0];
    for (const p of parts.values()) {
        p.c = V.mul(p.c, 1 / p.n);
        centre = V.add(centre, p.c);
    }
    centre = V.mul(centre, 1 / parts.size);
    return (m) => {
        const pc = parts.get(m.part)?.c ?? centre;
        const base = V.mul(V.sub(pc, centre), k);
        return m.mat === "act" ? V.add(base, V.mul(V.sub(m.c, pc), 0.45)) : base;
    };
}

export function exploded(c: Ctx2D, scene: Scene, cam: Camera, fr: Frame, L: Lights, off: (m: Mesh) => Vec3, k: number): void {
    const { ctx, u } = c;
    fillBlack(c);
    const partOnly = explodeOffsets(scene, k);
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = "rgba(195,255,253,0.25)";
    ctx.lineWidth = 0.8;
    for (const m of scene.meshes) {
        if (m.mat !== "act") continue;
        ctx.beginPath();
        ctx.moveTo(...fr.P(cam.to(V.add(m.c, off(m)))));
        ctx.lineTo(...fr.P(cam.to(V.add(m.c, partOnly({ ...m, mat: "shell" })))));
        ctx.stroke();
    }
    ctx.setLineDash([]);
    for (const fc of frontToBack(buildFaces(scene, cam, off))) {
        if (fc.m.mat === "act" || fc.m.mat === "accent") {
            paint(ctx, fc, fr, rgb(mix([10, 40, 40], CYAN, 0.3 + 0.7 * Math.max(0, V.dot(fc.n, L.key)))));
        } else {
            polyPath(ctx, fc, fr);
            ctx.fillStyle = "#050505";
            ctx.fill();
            strokeEdges(ctx, fc, fr, "rgba(195,255,253,0.55)", 0.7 * u, 1.1 * u, 0.8);
        }
    }
}

export function motion(c: Ctx2D, scenes: Scene[], trace: Vec3[], cam: Camera, fr: Frame, L: Lights): void {
    const { ctx, u } = c;
    fillBlack(c);
    floorGrid(ctx, fr, cam, [-0.8, 1.6, -0.3, 0.3], "rgba(155,164,166,0.07)");
    // Ghosts: earlier poses as fading silhouettes.
    scenes.slice(0, -1).forEach((sc, i) => {
        const a = 0.12 + 0.3 * (i / (scenes.length - 1));
        for (const fc of frontToBack(buildFaces(sc, cam))) {
            polyPath(ctx, fc, fr);
            ctx.fillStyle = "rgba(0,0,0,0.85)";
            ctx.fill();
            strokeEdges(ctx, fc, fr, `rgba(195,255,253,${a})`, 0, 0.9 * u, 2);
        }
    });
    ctx.strokeStyle = "rgba(195,255,253,0.8)";
    ctx.setLineDash([2, 4]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    trace.forEach((p, i) => {
        const [x, y] = fr.P(cam.to(p));
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
    const last = scenes[scenes.length - 1];
    for (const fc of frontToBack(buildFaces(last, cam))) paint(ctx, fc, fr, rgb(studioColor(fc, L, cam)));
}
