// Mesh builder for the robot art: every robot is assembled from a handful of
// primitives (frustum tubes, joint drums, superquadric shells) placed in world
// space by the model's forward kinematics.
import { V, basis, type Vec3 } from "./math";

export type Material =
    | "shell"
    | "dark"
    | "act"
    | "metal"
    | "rubber"
    | "glass"
    | "accent"
    | "accent2";

export interface Mesh {
    v: Vec3[];
    f: number[][];
    mat: Material;
    c: Vec3;
    part: number;
    edges?: Map<string, number[]>;
}

export interface Label {
    p: Vec3;
    text: string;
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

export class Scene {
    meshes: Mesh[] = [];
    labels: Label[] = [];
    // End effector or foot, for motion traces.
    tip: Vec3 = [0, 0, 0];
    private part = 0;

    private add(v: Vec3[], f: number[][], mat: Material): Mesh {
        let c: Vec3 = [0, 0, 0];
        for (const p of v) c = V.add(c, p);
        const m: Mesh = { v, f, mat, c: V.mul(c, 1 / v.length), part: this.part };
        this.meshes.push(m);
        return m;
    }

    // Start a new rigid part (used to group meshes for the exploded view).
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
}
