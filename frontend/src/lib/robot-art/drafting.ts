// The "drafting" X-ray: an engineering drawing of the robot. Visible edges
// are thin cyan lines, hidden edges are dashed, and every joint is a detailed
// actuator in cyan hidden-line with its gear stage, keyed shaft, rotation
// arrow, centre mark and dash-dot axis line. Tiles add joint callouts, an
// actuator count and a loupe with one actuator exploded.
import { V, type Vec3 } from "./math";
import { type Camera, camera, type Face, type Frame, buildFaces, featureEdges, fit, polyPath, strokeEdges } from "./core";
import { type Motor, Scene, isActuator } from "./scene";

const LINE = "rgba(195,255,253,0.55)";
const HIDDEN = "rgba(155,164,166,0.22)";
const CYAN = "#c3fffd";
const MUTED = "#9ba4a6";
const DIM = "#6c7476";

export interface Sheet {
    ctx: CanvasRenderingContext2D;
    W: number;
    H: number;
    // Pixel unit: 1 at a 400x300 tile, scales with the canvas.
    u: number;
}

interface View extends Sheet {
    scene: Scene;
    cam: Camera;
    fr: Frame;
}

export interface Annotation {
    count: number;
    title: string;
    // Joint name of the actuator shown exploded in the loupe.
    hero: string;
}

function mono(s: Sheet, px: number, weight = 500): void {
    s.ctx.font = `${weight} ${px * s.u}px 'JetBrains Mono', ui-monospace, monospace`;
}

function seg(ctx: CanvasRenderingContext2D, a: [number, number], b: [number, number]): void {
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
}

function sheet({ ctx, W, H, u }: Sheet, step: number): void {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "#0d1414";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0.5; x < W; x += step * u) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
    }
    for (let y = 0.5; y < H; y += step * u) {
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
    }
    ctx.stroke();
}

// On-screen radius of a motor, which decides how much detail is legible.
function screenRadius(v: View, m: Motor): number {
    const a = v.fr.P(v.cam.to(m.c));
    const b = v.fr.P(v.cam.to(V.add(m.c, V.mul(v.cam.up, m.r))));
    return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

// `inset` (the loupe) drops the rotation arrow and the internal stator.
function drawDetails(v: View, m: Motor, inset: boolean): void {
    const { ctx, scene, cam, fr, u } = v;
    const rp = screenRadius(v, m);
    for (const d of scene.details) {
        if (d.mid !== m.mid) continue;
        const facing = V.dot(d.n, V.sub(cam.pos, d.c)) > 0;
        // The stator sits inside the housing, so the X-ray shows it from any side.
        if (d.kind !== "stator" && !facing) continue;
        if (inset && (d.kind === "arc" || d.kind === "stator")) continue;
        if ((d.kind === "gear" || d.kind === "planet" || d.kind === "stator") && rp < 9 * u) continue;
        if ((d.kind === "arc" && rp < 6 * u) || (d.kind === "key" && rp < 4 * u)) continue;
        const P = d.pts.map((q) => fr.P(cam.to(q)));
        ctx.beginPath();
        P.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        if (d.closed) ctx.closePath();
        if (d.kind === "key") {
            ctx.fillStyle = CYAN;
            ctx.fill();
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 0.6 * u;
            ctx.stroke();
        } else if (d.kind === "arc") {
            ctx.strokeStyle = "rgba(195,255,253,0.9)";
            ctx.lineWidth = 1.1 * u;
            ctx.stroke();
            // Arrowhead along the arc's last segment.
            const e = P[P.length - 1];
            const f = P[P.length - 3];
            const l = Math.hypot(e[0] - f[0], e[1] - f[1]) || 1;
            const ux = (e[0] - f[0]) / l;
            const uy = (e[1] - f[1]) / l;
            const h = 3.2 * u;
            ctx.fillStyle = "rgba(195,255,253,0.9)";
            ctx.beginPath();
            ctx.moveTo(e[0] + ux * h * 0.6, e[1] + uy * h * 0.6);
            ctx.lineTo(e[0] - ux * h - uy * h * 0.7, e[1] - uy * h + ux * h * 0.7);
            ctx.lineTo(e[0] - ux * h + uy * h * 0.7, e[1] - uy * h - ux * h * 0.7);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.strokeStyle = d.kind === "stator" ? "rgba(195,255,253,0.35)" : "rgba(195,255,253,0.75)";
            ctx.lineWidth = (d.kind === "gear" ? 0.8 : 0.7) * u;
            ctx.stroke();
        }
    }
}

// Actuators back to front, each in cyan hidden-line with its details on top,
// drawn over the body so they read through it.
function drawMotors(v: View, faces: Face[], inset = false): void {
    const { ctx, scene, cam, fr, u } = v;
    const byMotor = new Map<number, Face[]>();
    for (const fc of faces) {
        if (!fc.front || fc.m.mid == null) continue;
        const list = byMotor.get(fc.m.mid);
        if (list) list.push(fc);
        else byMotor.set(fc.m.mid, [fc]);
    }
    const order = [...scene.motors].sort((a, b) => cam.to(b.c)[2] - cam.to(a.c)[2]);
    for (const m of order) {
        for (const fc of (byMotor.get(m.mid) ?? []).sort((a, b) => b.z - a.z)) {
            polyPath(ctx, fc, fr);
            ctx.fillStyle = "#000";
            ctx.fill();
            strokeEdges(ctx, fc, fr, CYAN, 0.7 * u, 1.1 * u, 0.6);
        }
        drawDetails(v, m, inset);
    }
}

function drawBody(v: View, faces: Face[]): void {
    const { ctx, fr, u } = v;
    const body = faces.filter((x) => !isActuator(x.m));
    for (const fc of body.filter((x) => x.front).sort((a, b) => b.z - a.z)) {
        polyPath(ctx, fc, fr);
        ctx.fillStyle = "#000";
        ctx.fill();
        strokeEdges(ctx, fc, fr, LINE, 0.7 * u, 1.1 * u, 0.82);
    }
    // Hidden edges: silhouettes of the far side, dashed, over everything.
    ctx.setLineDash([3 * u, 2.5 * u]);
    ctx.lineWidth = 0.6 * u;
    ctx.strokeStyle = HIDDEN;
    for (const fc of body) {
        if (fc.front) continue;
        for (const [i, j, kind] of featureEdges(fc, 0.9)) if (kind === 2) seg(ctx, fr.P(fc.s[i]), fr.P(fc.s[j]));
    }
    ctx.setLineDash([]);
}

function centreMarks(v: View): void {
    const { ctx, scene, cam, fr, u } = v;
    ctx.strokeStyle = "rgba(195,255,253,0.8)";
    ctx.lineWidth = 0.7 * u;
    for (const m of scene.motors) {
        const reach = V.mul(m.a, 0.09);
        ctx.setLineDash([6 * u, 2 * u, 1.5 * u, 2 * u]);
        seg(ctx, fr.P(cam.to(V.sub(m.c, reach))), fr.P(cam.to(V.add(m.c, reach))));
        ctx.setLineDash([]);
        const [x, y] = fr.P(cam.to(m.c));
        const s = 3.5 * u;
        seg(ctx, [x - s, y], [x + s, y]);
        seg(ctx, [x, y - s], [x, y + s]);
    }
}

// Joint callouts stacked down the left of the robot.
function callouts(v: View): void {
    const { ctx, scene, cam, fr, u } = v;
    mono(v, 9);
    const used: number[] = [];
    for (const lb of scene.labels) {
        const [px, py] = fr.P(cam.to(lb.p));
        const tw = ctx.measureText(lb.text).width + 4 * u;
        const tx = Math.max(8 * u + tw, fr.bounds[0] - 16 * u);
        let ty = py;
        while (used.some((y) => Math.abs(y - ty) < 13 * u)) ty += 13 * u;
        used.push(ty);
        ctx.strokeStyle = "rgba(195,255,253,0.45)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - 8 * u, ty);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        ctx.fillStyle = CYAN;
        ctx.beginPath();
        ctx.arc(px, py, 1.8 * u, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = MUTED;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(lb.text, tx - 4 * u, ty);
    }
}

function header(v: View, a: Annotation): void {
    const { ctx, u } = v;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    mono(v, 10, 600);
    ctx.fillStyle = CYAN;
    ctx.fillText(`${a.count} ACTUATORS`, 10 * u, 18 * u);
    mono(v, 8);
    ctx.fillStyle = DIM;
    ctx.fillText(a.title, 10 * u, 29 * u);
}

// Round inset with the hero actuator exploded, like an instrument bezel,
// joined to its joint by a dashed leader.
function loupe(v: View, hero: string): void {
    const { ctx, W, H, u, cam, fr } = v;
    const m = v.scene.motors.filter((x) => x.jn === hero).sort((a, b) => cam.to(a.c)[2] - cam.to(b.c)[2])[0];
    if (!m) return;
    const R = 0.155 * W;
    const cx = W - R - 12 * u;
    const cy = H - R - 26 * u;
    const [jx, jy] = fr.P(cam.to(m.c));
    const ang = Math.atan2(jy - cy, jx - cx);
    ctx.strokeStyle = "rgba(195,255,253,0.5)";
    ctx.lineWidth = 0.8 * u;
    ctx.setLineDash([2 * u, 2 * u]);
    seg(ctx, [cx + Math.cos(ang) * R, cy + Math.sin(ang) * R], [jx, jy]);
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(jx, jy, 7 * u, 0, Math.PI * 2);
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();
    sheet(v, 10);
    const part = new Scene();
    part.motor([0, 0, 0], [0, 0, 1], m.r, m.L, { jn: m.jn, nm: m.nm }, 1);
    const cam2 = camera({ yaw: 0.72, pitch: 0.32, dist: m.L * 14 + m.r * 10, target: [0, 0, m.L * 0.5] });
    const fr2 = fit([part], cam2, { x: cx - R * 0.86, y: cy - R * 0.7, w: R * 1.72, h: R * 1.4, ay: 0.5 });
    const axis = (z: number): Vec3 => [0, 0, z * m.L];
    ctx.strokeStyle = "rgba(195,255,253,0.35)";
    ctx.lineWidth = 0.7 * u;
    ctx.setLineDash([5 * u, 2 * u, 1 * u, 2 * u]);
    seg(ctx, fr2.P(cam2.to(axis(-1.6))), fr2.P(cam2.to(axis(2.9))));
    ctx.setLineDash([]);
    drawMotors({ ...v, scene: part, cam: cam2, fr: fr2 }, buildFaces(part, cam2), true);
    ctx.restore();

    ctx.strokeStyle = "rgba(195,255,253,0.7)";
    ctx.lineWidth = u;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 24; i++) {
        const t = (i / 24) * Math.PI * 2;
        const l = (i % 6 ? 3 : 6) * u;
        seg(ctx, [cx + Math.cos(t) * R, cy + Math.sin(t) * R], [cx + Math.cos(t) * (R - l), cy + Math.sin(t) * (R - l)]);
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    mono(v, 8, 600);
    ctx.fillStyle = CYAN;
    ctx.fillText(`${m.jn} · ${m.nm} N·m`, cx, cy + R + 5 * u);
    mono(v, 7);
    ctx.fillStyle = DIM;
    ctx.fillText("EXPLODED VIEW", cx, cy + R + 15 * u);
}

export function drawDrafting(s: Sheet, scene: Scene, cam: Camera, fr: Frame, annotation?: Annotation): void {
    const v: View = { ...s, scene, cam, fr };
    sheet(s, 20);
    const faces = buildFaces(scene, cam);
    drawBody(v, faces);
    drawMotors(v, faces);
    centreMarks(v);
    if (!annotation) return;
    callouts(v);
    header(v, annotation);
    loupe(v, annotation.hero);
}
