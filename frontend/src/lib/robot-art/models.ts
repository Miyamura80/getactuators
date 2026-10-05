// The three robots, modelled at real-world scale (metres, y up, facing +x)
// with forward kinematics so poses stay physically plausible:
//   arm       - UR5e-class 6-DOF cobot, gripper pointing down
//   humanoid  - Unitree G1-class biped, about 1.3 m tall
//   quadruped - Unitree Go2-class dog, knees bent backwards
// Every joint carries a detailed actuator with its name and a typical peak
// torque for the reference robot class.
import { M, type Mat4, V, type Vec3 } from "./math";
import { Scene } from "./scene";

// A joint actuator sized to the drum it replaces (radius r, length L).
function joint(s: Scene, c: Vec3, axis: Vec3, r: number, L: number, jn: string, nm: number): void {
    s.motor(c, axis, r * 0.92, L * 0.9, { jn, nm });
}

const X: Vec3 = [1, 0, 0];
const Y: Vec3 = [0, 1, 0];
const Z: Vec3 = [0, 0, 1];

type Axes = [Vec3, Vec3, Vec3];
const axesOf = (m: Mat4): Axes => [M.d(m, X), M.d(m, Y), M.d(m, Z)];

export interface ArmPose {
    q1?: number;
    q2?: number;
    q3?: number;
    q4?: number;
    q5?: number;
    q6?: number;
    grip?: number;
}

export function arm(q: ArmPose = {}): Scene {
    const { q1 = 0.3, q2 = 1.2, q3 = -1.45, q4 = 0.25, q5 = 0, q6 = 0, grip = 0.02 } = q;
    const s = new Scene();
    const L1 = 0.425;
    const L2 = 0.392;

    // Base: floor flange, pedestal and the J1 cap.
    s.tube([0, 0, 0], [0, 0.014, 0], 0.1, 0.1, "dark");
    s.tube([0, 0.014, 0], [0, 0.03, 0], 0.075, 0.075, "metal");
    s.tube([0, 0.03, 0], [0, 0.1, 0], 0.064, 0.064, "shell");
    s.tube([0, 0.1, 0], [0, 0.116, 0], 0.066, 0.066, "shell");
    s.label([0, 0.108, 0.066], "J1 BASE");

    const F1 = M.chain(M.T(0, 0.116, 0), M.Ry(q1));
    s.next();
    s.tube(M.p(F1, [0, 0, 0]), M.p(F1, [0, 0.05, 0]), 0.062, 0.062, "shell");
    s.drum(M.p(F1, [0, 0.1, 0.01]), M.d(F1, Z), 0.064, 0.16, "shell");
    s.drum(M.p(F1, [0, 0.1, -0.075]), M.d(F1, Z), 0.066, 0.014, "shell");

    // Upper arm between the shoulder (J2) and elbow (J3) housings.
    const F2 = M.chain(F1, M.T(0, 0.1, 0.14), M.Rz(q2));
    s.next();
    s.drum(M.p(F2, [0, 0, 0]), M.d(F2, Z), 0.064, 0.12, "shell");
    s.drum(M.p(F2, [0, 0, 0.067]), M.d(F2, Z), 0.066, 0.014, "shell");
    s.label(M.p(F2, [0, 0, 0.07]), "J2 SHOULDER");
    s.tube(M.p(F2, [0.04, 0, 0]), M.p(F2, [L1 - 0.04, 0, 0]), 0.046, 0.046, "shell");
    s.drum(M.p(F2, [L1, 0, 0]), M.d(F2, Z), 0.054, 0.11, "shell");
    s.drum(M.p(F2, [L1, 0, 0.061]), M.d(F2, Z), 0.056, 0.012, "shell");

    // Forearm out to the first wrist joint.
    const F3 = M.chain(F2, M.T(L1, 0, -0.115), M.Rz(q3));
    s.next();
    s.drum(M.p(F3, [0, 0, 0]), M.d(F3, Z), 0.052, 0.1, "shell");
    s.drum(M.p(F3, [0, 0, -0.056]), M.d(F3, Z), 0.054, 0.012, "shell");
    s.label(M.p(F3, [0, 0, -0.06]), "J3 ELBOW");
    s.tube(M.p(F3, [0.035, 0, 0]), M.p(F3, [L2 - 0.03, 0, 0]), 0.037, 0.037, "shell");
    s.drum(M.p(F3, [L2, 0, 0]), M.d(F3, Z), 0.044, 0.09, "shell");
    s.drum(M.p(F3, [L2, 0, -0.05]), M.d(F3, Z), 0.045, 0.01, "shell");

    // Wrist: three compact joints with alternating axes.
    const F4 = M.chain(F3, M.T(L2, 0, 0.095), M.Rz(q4));
    s.next();
    s.drum(M.p(F4, [0, 0, 0]), M.d(F4, Z), 0.044, 0.1, "shell");
    s.drum(M.p(F4, [0, 0, 0.055]), M.d(F4, Z), 0.045, 0.01, "shell");
    s.tube(M.p(F4, [0, -0.03, 0]), M.p(F4, [0, -0.07, 0]), 0.04, 0.04, "shell");
    s.drum(M.p(F4, [0, -0.1, 0]), M.d(F4, X), 0.044, 0.1, "shell");
    s.drum(M.p(F4, [0.055, -0.1, 0]), M.d(F4, X), 0.045, 0.01, "shell");
    s.label(M.p(F4, [0.06, -0.1, 0]), "J4-J6 WRIST");

    const F5 = M.chain(F4, M.T(0, -0.1, 0), M.Rx(q5));
    s.next();
    s.drum(M.p(F5, [0, -0.075, 0]), M.d(F5, Y), 0.044, 0.07, "shell");
    s.drum(M.p(F5, [0, -0.115, 0]), M.d(F5, Y), 0.045, 0.01, "shell");
    s.tube(M.p(F5, [0, -0.12, 0]), M.p(F5, [0, -0.13, 0]), 0.032, 0.032, "metal");

    // Parallel gripper on the tool flange.
    const F6 = M.chain(F5, M.T(0, -0.13, 0), M.Ry(q6));
    s.next();
    s.link(M.p(F6, [0, 0, 0]), M.p(F6, [0, -0.075, 0]), 0.1, 0.055, "dark", { hint: M.d(F6, Z), e1: 0.25, e2: 0.25 });
    for (const side of [-1, 1]) {
        const z = side * (0.012 + grip);
        s.link(M.p(F6, [0, -0.07, z]), M.p(F6, [0, -0.13, z]), 0.014, 0.03, "metal", { hint: M.d(F6, Z), e1: 0.3, e2: 0.3 });
    }
    s.tip = M.p(F6, [0, -0.13, 0]);

    // The drives inside the housings (UR5e: size-3 joints 150 N·m, wrists 28 N·m).
    s.motor([0, 0.06, 0], Y, 0.052, 0.085, { jn: "J1 BASE", nm: 150 });
    s.motor(M.p(F2, [0, 0, -0.01]), M.d(F2, Z), 0.052, 0.1, { jn: "J2 SHOULDER", nm: 150 });
    s.motor(M.p(F2, [L1, 0, -0.005]), M.d(F2, Z), 0.045, 0.09, { jn: "J3 ELBOW", nm: 150 });
    s.motor(M.p(F3, [L2, 0, 0]), M.d(F3, Z), 0.036, 0.075, { jn: "J4 WRIST 1", nm: 28 });
    s.motor(M.p(F4, [0, -0.1, 0]), M.d(F4, X), 0.036, 0.08, { jn: "J5 WRIST 2", nm: 28 });
    s.motor(M.p(F5, [0, -0.07, 0]), M.d(F5, [0, -1, 0]), 0.036, 0.055, { jn: "J6 WRIST 3", nm: 28 });
    return s;
}

export interface HumanoidPose {
    hipL?: number;
    hipR?: number;
    kneeL?: number;
    kneeR?: number;
    shL?: number;
    shR?: number;
    elL?: number;
    elR?: number;
    x?: number;
}

export function humanoid(q: HumanoidPose = {}): Scene {
    const { hipL = 0.18, hipR = -0.14, kneeL = -0.3, kneeR = -0.12, shL = -0.25, shR = 0.3, elL = 0.45, elR = 0.35, x = 0 } = q;
    const s = new Scene();
    const P = M.T(x, 0.72, 0);
    const PA = axesOf(P);

    // Legs: hip yaw and pitch drums, thigh, knee, shin with a shin guard, foot.
    for (const [side, hip, knee] of [
        [1, hipL, kneeL],
        [-1, hipR, kneeR],
    ]) {
        s.next();
        joint(s, M.p(P, [0, 0, side * 0.1]), Y, 0.045, 0.06, "HIP", 88);
        const H = M.chain(P, M.T(0, -0.06, side * 0.1), M.Rz(hip));
        joint(s, M.p(H, [0, 0, 0]), V.mul(M.d(H, Z), side), 0.058, 0.085, "HIP", 88);
        s.link(M.p(H, [0.005, -0.02, 0]), M.p(H, [0.005, -0.28, 0]), 0.1, 0.115, "shell", { hint: M.d(H, Z), e1: 0.45, e2: 0.4, taper: [1.15, 1.1] });
        const K = M.chain(H, M.T(0, -0.3, 0), M.Rz(knee));
        joint(s, M.p(K, [0, 0, 0]), V.mul(M.d(K, Z), side), 0.052, 0.1, "KNEE", 120);
        s.link(M.p(K, [-0.008, -0.03, 0]), M.p(K, [-0.004, -0.28, 0]), 0.075, 0.085, "dark", { hint: M.d(K, Z), e1: 0.45, e2: 0.45, taper: [1.2, 1.15] });
        s.link(M.p(K, [0.03, -0.06, 0]), M.p(K, [0.028, -0.2, 0]), 0.06, 0.03, "shell", { hint: M.d(K, Z), e1: 0.4, e2: 0.4 });
        // Ankle counter-rotates so the sole stays flat on the floor.
        const A = M.chain(K, M.T(0, -0.3, 0), M.Rz(-(hip + knee)));
        joint(s, M.p(A, [0, 0, 0]), V.mul(M.d(A, Z), side), 0.03, 0.07, "ANKLE", 50);
        s.box(M.p(A, [0.035, -0.045, 0]), axesOf(A), [0.11, 0.024, 0.045], "dark", 0.3, 0.35);
        s.box(M.p(A, [0.035, -0.066, 0]), axesOf(A), [0.112, 0.006, 0.047], "rubber", 0.2, 0.35);
        if (side === 1) {
            s.label(M.p(H, [0, 0, 0.05]), "HIP");
            s.label(M.p(K, [0, 0, 0.05]), "KNEE");
        }
    }

    // Torso: pelvis, waist actuator, abdomen, chest shell and backpack.
    s.next();
    s.drum(M.p(P, [0, 0.02, 0]), Y, 0.075, 0.1, "dark");
    s.box(M.p(P, [0, -0.02, 0]), PA, [0.07, 0.05, 0.14], "dark", 0.4, 0.4);
    joint(s, M.p(P, [0, 0.1, 0]), Y, 0.07, 0.05, "WAIST", 88);
    s.label(M.p(P, [0.07, 0.1, 0]), "WAIST");
    s.box(M.p(P, [0, 0.17, 0]), PA, [0.07, 0.06, 0.1], "dark", 0.5, 0.45);
    s.sq(M.p(P, [0, 0.31, 0]), PA, [0.1, 0.13, 0.16], 0.4, 0.45, "shell", { taper: [1.05, 1.12] });
    s.box(M.p(P, [0.098, 0.33, 0]), PA, [0.006, 0.012, 0.07], "accent");
    s.box(M.p(P, [-0.1, 0.3, 0]), PA, [0.035, 0.1, 0.11], "dark", 0.35, 0.35);

    // Arms: shoulder pitch and roll, upper arm, elbow, forearm, hand.
    for (const [side, sh, el] of [
        [1, shL, elL],
        [-1, shR, elR],
    ]) {
        s.next();
        const S = M.chain(P, M.T(0, 0.4, side * 0.2), M.Rz(sh), M.Rx(side * 0.12));
        joint(s, M.p(S, [0, 0, 0]), V.mul(M.d(S, Z), side), 0.05, 0.08, "SHOULDER", 25);
        joint(s, M.p(S, [0, -0.055, side * 0.02]), M.d(S, Y), 0.042, 0.05, "SHOULDER", 25);
        s.link(M.p(S, [0, -0.08, side * 0.02]), M.p(S, [0, -0.22, side * 0.02]), 0.068, 0.072, "shell", { hint: M.d(S, Z), e1: 0.5, e2: 0.5 });
        const E = M.chain(S, M.T(0, -0.24, side * 0.02), M.Rz(el));
        joint(s, M.p(E, [0, 0, 0]), V.mul(M.d(E, Z), side), 0.042, 0.075, "ELBOW", 25);
        s.link(M.p(E, [0, -0.02, 0]), M.p(E, [0, -0.19, 0]), 0.058, 0.06, "dark", { hint: M.d(E, Z), e1: 0.5, e2: 0.5, taper: [1.1, 1.1] });
        s.box(M.p(E, [0.005, -0.245, 0]), axesOf(E), [0.035, 0.045, 0.018], "dark", 0.5, 0.5);
        s.anchor(M.p(E, [0.005, -0.245, 0]), "WRIST");
        if (side === 1) {
            s.label(M.p(S, [0, 0, 0.045]), "SHOULDER");
            s.label(M.p(E, [0, 0, 0.04]), "ELBOW");
        }
    }

    // Head: neck, rounded helmet, glass visor with a status light.
    s.next();
    s.tube(M.p(P, [0, 0.44, 0]), M.p(P, [0, 0.5, 0]), 0.035, 0.035, "dark");
    s.sq(M.p(P, [0, 0.575, 0]), PA, [0.085, 0.095, 0.075], 0.55, 0.7, "shell");
    s.sq(M.p(P, [0.045, 0.58, 0]), PA, [0.048, 0.05, 0.064], 0.45, 0.55, "glass");
    s.box(M.p(P, [0.092, 0.585, 0]), PA, [0.003, 0.005, 0.034], "accent");
    s.tip = M.p(P, [0, 0.67, 0]);
    return s;
}

export interface QuadrupedPose {
    h?: number;
    x?: number;
    // Per-leg foot offset [forward, lift] from under the hip: FL, FR, HL, HR.
    feet?: [number, number][];
}

export function quadruped(q: QuadrupedPose = {}): Scene {
    const { h = 0.3, x = 0, feet = [[0.02, 0], [0.02, 0], [-0.01, 0], [-0.01, 0]] } = q;
    const s = new Scene();
    const B = M.T(x, h, 0);
    const ax = axesOf(B);

    // Body shell, top rail panel, belly, head block with two eye lights, lidar.
    s.box(M.p(B, [0, 0, 0]), ax, [0.29, 0.058, 0.115], "shell", 0.3, 0.28);
    s.box(M.p(B, [-0.02, 0.066, 0]), ax, [0.2, 0.01, 0.075], "dark");
    s.box(M.p(B, [0, -0.05, 0]), ax, [0.24, 0.02, 0.09], "dark");
    s.box(M.p(B, [0.29, -0.005, 0]), ax, [0.05, 0.05, 0.095], "dark", 0.35, 0.4);
    for (const ez of [-0.04, 0.04]) s.box(M.p(B, [0.336, 0.008, ez]), ax, [0.006, 0.01, 0.022], "accent", 0.5, 0.5);
    s.tube(M.p(B, [0.25, 0.05, 0]), M.p(B, [0.25, 0.1, 0]), 0.034, 0.03, "dark");
    s.tube(M.p(B, [0.25, 0.085, 0]), M.p(B, [0.25, 0.092, 0]), 0.034, 0.034, "accent2");

    // Legs: hip ab/ad drum, thigh drum, two-link leg solved by IK.
    const l = 0.213;
    let i = 0;
    for (const fx of [1, -1])
        for (const side of [1, -1]) {
            s.next();
            const hx = fx * 0.19;
            joint(s, M.p(B, [hx, -0.005, side * 0.085]), V.mul(X, fx), 0.046, 0.085, "HIP AB/AD", 24);
            const hp = M.p(B, [hx, -0.01, side * 0.155]);
            joint(s, hp, V.mul(Z, side), 0.05, 0.06, "THIGH", 24);
            joint(s, M.p(B, [hx, -0.01, side * 0.2]), V.mul(Z, side), 0.05, 0.035, "KNEE", 45);
            const [dx, dy] = feet[i++];
            const foot: Vec3 = [hp[0] + dx, 0.022 + dy, hp[2]];
            const vx = foot[0] - hp[0];
            const vy = foot[1] - hp[1];
            const dist = Math.min(Math.hypot(vx, vy), 2 * l - 1e-3);
            const al = Math.atan2(vy, vx);
            const be = Math.acos(dist / (2 * l));
            const knee: Vec3 = [hp[0] + l * Math.cos(al - be), hp[1] + l * Math.sin(al - be), hp[2]];
            s.link(hp, knee, 0.05, 0.075, "shell", { hint: Z, e1: 0.5, e2: 0.4, ext: 0.02, taper: [0.7, 1] });
            s.drum(knee, Z, 0.022, 0.035, "dark");
            s.tube(knee, foot, 0.016, 0.01, "dark");
            s.ball(foot, 0.022, "rubber");
            if (fx === 1 && side === 1) {
                s.label(hp, "THIGH");
                s.label(M.p(B, [hx, 0.03, side * 0.085]), "HIP AB/AD");
                s.label(knee, "KNEE");
                s.tip = foot;
            }
        }
    return s;
}
