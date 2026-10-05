// A planar arm held horizontal, built from the calculator's model so the
// drawing matches the numbers: links to length, one actuator per pitch joint
// sized by its mass, the payload hanging at the tip. Same primitives and
// drafting look as the /robots arm.
import type { Arm } from "../../../../src/engineering/arm-torque";
import { M, type Vec3 } from "./math";
import { Scene } from "./scene";

const Z: Vec3 = [0, 0, 1];

// Housing radius (m) from actuator mass (kg): a cube-root law that puts a
// 1 kg joint near 45 mm, clamped so tiny or missing masses stay visible.
function radiusFor(kg: number): number {
    return Math.min(0.075, Math.max(0.026, 0.045 * Math.cbrt(Math.max(kg, 0.1))));
}

export interface FreeBodyGeometry {
    scene: Scene;
    // Joint centres, the link mass points and the payload, in metres.
    joints: Vec3[];
    tip: Vec3;
    payload: Vec3;
    height: number;
    length: number;
}

export function freeBodyArm(arm: Arm): FreeBodyGeometry {
    const s = new Scene();
    const length = arm.links.reduce((sum, l) => sum + l.length, 0);
    const h = Math.max(0.16, length * 0.26);
    // Actuator at joint i: joint 1 sits on the base (its mass loads nothing),
    // so it is drawn one size up from the largest documented joint.
    const masses = arm.links.map((_, i) => (i === 0 ? 0 : (arm.links[i - 1]?.actuatorMass ?? 0)));
    const largest = Math.max(...masses, 0.6);
    const radii = masses.map((m, i) => radiusFor(i === 0 ? largest * 1.4 : m));

    // Base: floor flange and pedestal up to the shoulder.
    const r0 = (radii[0] ?? 0.05) * 1.1;
    s.tube([0, 0, 0], [0, 0.014, 0], r0 * 1.6, r0 * 1.6, "dark");
    s.tube([0, 0.014, 0], [0, h - r0 * 1.1, 0], r0 * 0.95, r0 * 0.95, "shell");

    const joints: Vec3[] = [];
    let x = 0;
    for (let i = 0; i < arm.links.length; i++) {
        const c: Vec3 = [x, h, 0];
        const r = radii[i] ?? 0.04;
        joints.push(c);
        s.next();
        s.drum(c, Z, r * 1.12, r * 2.1, "shell");
        s.motor(M.p(M.T(0, 0, r * 0.15), c), Z, r, r * 1.6, { jn: `J${i + 1}`, nm: 0 });
        const l = arm.links[i];
        const next = x + (l?.length ?? 0);
        const rn = i + 1 < arm.links.length ? (radii[i + 1] ?? r) : r * 0.7;
        const w = Math.min(r, rn) * 1.25;
        s.link([x + r * 0.9, h, 0], [next - rn * 0.9, h, 0], w, w * 0.8, "shell", { hint: Z, e1: 0.45, e2: 0.45 });
        x = next;
    }
    // Tool flange and payload block hanging from it.
    const tip: Vec3 = [x, h, 0];
    const lastR = radii[radii.length - 1] ?? 0.04;
    s.drum(tip, [1, 0, 0], lastR * 0.75, lastR * 0.3, "metal");
    const side = Math.min(0.12, Math.max(0.035, 0.05 * Math.cbrt(Math.max(arm.payload, 0.05))));
    const payload: Vec3 = [x + side * 0.15, h - lastR * 0.75 - side * 0.6, 0];
    s.next();
    s.box(payload, [[1, 0, 0], [0, 1, 0], Z], [side * 0.5, side * 0.5, side * 0.5], "dark", 0.25, 0.25);
    s.tip = tip;
    return { scene: s, joints, tip, payload, height: h, length };
}
