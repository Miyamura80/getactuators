// Vector and 4x4 matrix helpers for the robot art renderer. Plain tuples and
// flat arrays keep the hot loops allocation-light and dependency-free.

export type Vec3 = [number, number, number];
export type Mat4 = number[];

export const V = {
    add: (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    sub: (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    mul: (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s],
    dot: (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a: Vec3, b: Vec3): Vec3 => [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    ],
    len: (a: Vec3): number => Math.hypot(a[0], a[1], a[2]),
    norm: (a: Vec3): Vec3 => {
        const l = Math.hypot(a[0], a[1], a[2]) || 1;
        return [a[0] / l, a[1] / l, a[2] / l];
    },
    lerp: (a: Vec3, b: Vec3, t: number): Vec3 => [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
    ],
};

// Row-major 4x4 matrices acting on column vectors.
export const M = {
    mul(a: Mat4, b: Mat4): Mat4 {
        const r = new Array<number>(16);
        for (let i = 0; i < 4; i++)
            for (let j = 0; j < 4; j++) {
                let s = 0;
                for (let k = 0; k < 4; k++) s += a[i * 4 + k] * b[k * 4 + j];
                r[i * 4 + j] = s;
            }
        return r;
    },
    T: (x: number, y: number, z: number): Mat4 => [1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z, 0, 0, 0, 1],
    Rx(t: number): Mat4 {
        const c = Math.cos(t);
        const s = Math.sin(t);
        return [1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1];
    },
    Ry(t: number): Mat4 {
        const c = Math.cos(t);
        const s = Math.sin(t);
        return [c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1];
    },
    Rz(t: number): Mat4 {
        const c = Math.cos(t);
        const s = Math.sin(t);
        return [c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    },
    // Transform a point (with translation) and a direction (without).
    p: (m: Mat4, v: Vec3): Vec3 => [
        m[0] * v[0] + m[1] * v[1] + m[2] * v[2] + m[3],
        m[4] * v[0] + m[5] * v[1] + m[6] * v[2] + m[7],
        m[8] * v[0] + m[9] * v[1] + m[10] * v[2] + m[11],
    ],
    d: (m: Mat4, v: Vec3): Vec3 => [
        m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
        m[4] * v[0] + m[5] * v[1] + m[6] * v[2],
        m[8] * v[0] + m[9] * v[1] + m[10] * v[2],
    ],
    chain: (...ms: Mat4[]): Mat4 => ms.reduce((a, b) => M.mul(a, b)),
};

// Orthonormal frame whose y axis runs along `dir`; z leans toward `hint`.
export function basis(dir: Vec3, hint?: Vec3): [Vec3, Vec3, Vec3] {
    const y = V.norm(dir);
    const h: Vec3 = hint ?? (Math.abs(y[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]);
    let z = V.sub(h, V.mul(y, V.dot(h, y)));
    if (V.len(z) < 1e-6) z = Math.abs(y[0]) < 0.9 ? [1, 0, 0] : [0, 0, 1];
    z = V.norm(z);
    return [V.cross(y, z), y, z];
}
