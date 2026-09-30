// Mesh builder for the robot art: every robot is assembled from a handful of
// primitives (frustum tubes, joint drums, superquadric shells, boxes) placed
// in world space by the model's forward kinematics. Joints get a detailed
// actuator from `motor()`.
import { V, basis, type Vec3 } from "./math";

// "act*" materials belong to actuators: housing, dark (cap, fins, gear
// plate), bright (flange, hub) and bolts.
export type Material =
    | "shell"
    | "dark"
    | "metal"
    | "rubber"
    | "glass"
    | "accent"
    | "accent2"
    | "act"
    | "actD"
    | "actB"
    | "actK";

export const isActuator = (m: Mesh) => m.mat.startsWith("act");

// Joint data carried by an actuator: name and typical peak torque (N·m).
export interface JointTag {
    jn: string;
    nm: number;
}

export interface Mesh {
    v: Vec3[];
    f: number[][];
    mat: Material;
    c: Vec3;
    part: number;
    edges?: Map<string, number[]>;
    joint?: JointTag & { c: Vec3; ax: Vec3 };
    mid?: number;
}

export interface Label {
    p: Vec3;
    text: string;
}

export interface Motor extends JointTag {
    mid: number;
    c: Vec3;
    a: Vec3;
    r: number;
    L: number;
}

// Line work drawn on an actuator: gear teeth, the keyed shaft, a rotation
// arrow and (seen through the housing) the stator slots.
export interface Detail {
    kind: "gear" | "planet" | "key" | "arc" | "stator";
    mid: number;
    pts: Vec3[];
    c: Vec3;
    n: Vec3;
    closed: boolean;
}

interface TubeOpts {
    n?: number;
    hint?: Vec3;
}

interface SqOpts {
    nu?: number;
    nv?: number;
    taper?: [number, number];
}

interface LinkOpts extends SqOpts {
    hint?: Vec3;
    e1?: number;
    e2?: number;
    ext?: number;
}

const signedPow = (w: number, e: number) => Math.sign(w) * Math.abs(w) ** e;

// Axial offsets (in motor lengths) of each stage in the exploded view.
const EXPLODE = { cap: -0.9, body: 0, stage: 0.9, output: 1.8 } as const;
type Stage = keyof typeof EXPLODE;

export class Scene {
    meshes: Mesh[] = [];
    labels: Label[] = [];
    motors: Motor[] = [];
    details: Detail[] = [];
    // End effector or foot.
    tip: Vec3 = [0, 0, 0];
    part = 0;

    private add(v: Vec3[], f: number[][], mat: Material): Mesh {
        let c: Vec3 = [0, 0, 0];
        for (const p of v) c = V.add(c, p);
        const m: Mesh = { v, f, mat, c: V.mul(c, 1 / v.length), part: this.part };
        this.meshes.push(m);
        return m;
    }

    // Start a new rigid part.
    next(): this {
        this.part++;
        return this;
    }

    label(p: Vec3, text: string): void {
        this.labels.push({ p, text });
    }

    // Capped frustum from a to b, radius r0 at a and r1 at b.
    tube(a: Vec3, b: Vec3, r0: number, r1: number, mat: Material, o: TubeOpts = {}): Mesh {
        const n = o.n ?? 32;
        const [ex, , ez] = basis(V.sub(b, a), o.hint);
        const v: Vec3[] = [];
        const f: number[][] = [];
        for (const [end, r] of [
            [a, r0],
            [b, r1],
        ] as [Vec3, number][]) {
            for (let i = 0; i < n; i++) {
                const t = (i / n) * Math.PI * 2;
                const d = V.add(V.mul(ex, Math.cos(t)), V.mul(ez, Math.sin(t)));
                v.push(V.add(end, V.mul(d, r)));
            }
        }
        for (let i = 0; i < n; i++) f.push([i, (i + 1) % n, n + ((i + 1) % n), n + i]);
        const capA: number[] = [];
        const capB: number[] = [];
        for (let i = 0; i < n; i++) {
            capA.push(n - 1 - i);
            capB.push(n + i);
        }
        f.push(capA, capB);
        return this.add(v, f, mat);
    }

    // Joint drum: a cylinder centred on c along `axis`.
    drum(c: Vec3, axis: Vec3, r: number, len: number, mat: Material): Mesh {
        const a = V.mul(V.norm(axis), len / 2);
        return this.tube(V.sub(c, a), V.add(c, a), r, r, mat);
    }

    // Superquadric shell: half sizes s along axes; e1/e2 set the roundness
    // (0.3 is a softened box, 1 an ellipsoid). `taper` scales x/z at the top.
    sq(c: Vec3, axes: [Vec3, Vec3, Vec3], s: Vec3, e1: number, e2: number, mat: Material, o: SqOpts = {}): Mesh {
        const nu = o.nu ?? 36;
        const nv = o.nv ?? 20;
        const [tx1, tz1] = o.taper ?? [1, 1];
        const v: Vec3[] = [];
        const f: number[][] = [];
        for (let i = 0; i <= nv; i++) {
            const vv = -Math.PI / 2 + (i / nv) * Math.PI;
            const cv = Math.cos(vv);
            const yy = signedPow(Math.sin(vv), e1);
            const k = (yy + 1) / 2;
            const tx = 1 + (tx1 - 1) * k;
            const tz = 1 + (tz1 - 1) * k;
            for (let j = 0; j < nu; j++) {
                const u = -Math.PI + (j / nu) * Math.PI * 2;
                const x = s[0] * signedPow(cv, e1) * signedPow(Math.cos(u), e2) * tx;
                const z = s[2] * signedPow(cv, e1) * signedPow(Math.sin(u), e2) * tz;
                const p = V.add(V.mul(axes[0], x), V.add(V.mul(axes[1], s[1] * yy), V.mul(axes[2], z)));
                v.push(V.add(c, p));
            }
        }
        for (let i = 0; i < nv; i++)
            for (let j = 0; j < nu; j++) {
                const a = i * nu + j;
                const b = i * nu + ((j + 1) % nu);
                f.push([a, b, b + nu, a + nu]);
            }
        return this.add(v, f, mat);
    }

    // Rounded box spanning a to b, cross-section w (toward hint) by d.
    link(a: Vec3, b: Vec3, w: number, d: number, mat: Material, o: LinkOpts = {}): Mesh {
        const [ex, ey, ez] = basis(V.sub(b, a), o.hint ?? [0, 0, 1]);
        const half = V.len(V.sub(b, a)) / 2 + (o.ext ?? 0);
        return this.sq(V.lerp(a, b, 0.5), [ex, ey, ez], [d / 2, half, w / 2], o.e1 ?? 0.35, o.e2 ?? 0.35, mat, o);
    }

    box(c: Vec3, axes: [Vec3, Vec3, Vec3], s: Vec3, mat: Material, e1 = 0.3, e2 = 0.3): Mesh {
        return this.sq(c, axes, s, e1, e2, mat);
    }

    ball(c: Vec3, r: number, mat: Material): Mesh {
        return this.sq(c, [[1, 0, 0], [0, 1, 0], [0, 0, 1]], [r, r, r], 1, 1, mat, { nu: 16, nv: 10 });
    }

    // Plain 8-vertex box, cheap enough for cooling fins.
    cuboid(c: Vec3, axes: [Vec3, Vec3, Vec3], s: Vec3, mat: Material): Mesh {
        const v: Vec3[] = [];
        for (const i of [-1, 1])
            for (const j of [-1, 1])
                for (const k of [-1, 1])
                    v.push(V.add(c, V.add(V.mul(axes[0], i * s[0]), V.add(V.mul(axes[1], j * s[1]), V.mul(axes[2], k * s[2])))));
        const f = [
            [0, 1, 3, 2],
            [4, 6, 7, 5],
            [0, 4, 5, 1],
            [2, 3, 7, 6],
            [0, 2, 6, 4],
            [1, 5, 7, 3],
        ];
        return this.add(v, f, mat);
    }

    // Detailed rotary actuator centred on c, output face toward `ax`: encoder
    // cap, finned housing, planetary stage, flange with a bolt circle, hub and
    // keyed shaft. `explode` > 0 slides the stages apart along the axis.
    motor(c: Vec3, ax: Vec3, r: number, L: number, tag: JointTag, explode = 0): Motor {
        const a = V.norm(ax);
        const [ex, , ez] = basis(a);
        const mid = this.motors.length;
        const shift = (st: Stage) => V.mul(a, L * explode * EXPLODE[st]);
        const own = (m: Mesh, st: Stage) => {
            const o = shift(st);
            if (explode) {
                m.v = m.v.map((p) => V.add(p, o));
                m.c = V.add(m.c, o);
            }
            m.joint = { ...tag, c, ax: a };
            m.mid = mid;
        };
        const at = (base: Vec3, k: number) => V.add(base, V.mul(a, L * k));
        const radial = (t: number, rr: number) => V.add(V.mul(ex, Math.cos(t) * rr), V.mul(ez, Math.sin(t) * rr));
        const back = at(c, -0.5);
        const front = at(c, 0.5);

        own(this.tube(back, at(back, 0.1), r * 0.8, r * 0.8, "actD"), "cap");
        own(this.tube(at(back, 0.1), front, r, r, "act"), "body");
        for (let i = 0; i < 18; i++) {
            const d = radial((i / 18) * Math.PI * 2, 1);
            own(this.cuboid(V.add(at(c, -0.06), V.mul(d, r * 1.05)), [d, a, V.cross(d, a)], [r * 0.07, L * 0.3, r * 0.022], "actD"), "body");
        }
        const flangeTop = at(front, 0.12);
        own(this.tube(front, flangeTop, r * 0.55, r * 0.55, "actB"), "output");
        own(this.tube(flangeTop, at(front, 0.2), r * 0.2, r * 0.2, "actB"), "output");
        for (let i = 0; i < 6; i++) {
            const p = V.add(flangeTop, radial((i / 6) * Math.PI * 2 + 0.5, r * 0.4));
            own(this.tube(p, V.add(p, V.mul(a, L * 0.03)), r * 0.065, r * 0.065, "actK", { n: 8 }), "output");
        }
        if (explode) own(this.tube(front, at(front, 0.05), r * 0.95, r * 0.95, "actD"), "stage");

        // Toothed ring of n teeth, radius R, tooth height amp, centred at off.
        const ring = (o: Vec3, R: number, n: number, amp: number, rot = 0, off: Vec3 = [0, 0, 0]) => {
            const pts: Vec3[] = [];
            for (let i = 0; i < n * 4; i++) {
                const q = i % 4;
                pts.push(V.add(V.add(o, off), radial(rot + (i / (n * 4)) * Math.PI * 2, R + (q === 1 || q === 2 ? amp : 0))));
            }
            return pts;
        };
        const detail = (kind: Detail["kind"], st: Stage, pts: Vec3[], plane: Vec3, closed = true) => {
            const o = shift(st);
            this.details.push({ kind, mid, pts: pts.map((p) => V.add(p, o)), c: V.add(plane, o), n: a, closed });
        };
        const face = at(front, explode ? 0.05 : 1e-3);
        detail("gear", "stage", ring(face, r * 0.92, 40, -r * 0.06), face);
        for (let k = 0; k < 3; k++) detail("planet", "stage", ring(face, r * 0.11, 10, r * 0.035, 0.2, radial(k * 2.094 + 0.3, r * 0.72)), face);
        if (explode) detail("planet", "stage", ring(face, r * 0.2, 8, r * 0.05), face);
        const hubFace = at(front, 0.2 + 1e-3);
        const key = [0, 1, 2, 3].map((i) => V.add(hubFace, radial(Math.PI / 4 + (i * Math.PI) / 2, r * 0.1)));
        detail("key", "output", key, hubFace);
        const arcPlane = at(front, 0.08);
        const arc = Array.from({ length: 25 }, (_, i) => V.add(arcPlane, radial(-0.4 + (i / 24) * 1.9, r * 1.32)));
        detail("arc", "output", arc, arcPlane, false);
        detail("stator", "body", ring(c, r * 0.8, 12, -r * 0.14), c);

        const m: Motor = { ...tag, mid, c, a, r, L };
        this.motors.push(m);
        return m;
    }
}
