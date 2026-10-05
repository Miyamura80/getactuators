// The calculator's arm, drawn in the /robots cobot style (UR-class housings,
// slim link tubes, short base, parallel gripper) but built from the model's
// own numbers: link lengths to scale, each pitch joint's housing sized by its
// actuator mass, and the payload block held at the tip, where the
// calculation puts it.
import type { Arm } from "../../../../src/engineering/arm-torque";
import type { Vec3 } from "./math";
import { Scene } from "./scene";

const X: Vec3 = [1, 0, 0];
const Z: Vec3 = [0, 0, 1];
const AXES: [Vec3, Vec3, Vec3] = [X, [0, 1, 0], Z];

// Housing radius (m) from actuator mass (kg): cube-root scaling puts a 1 kg
// joint near a UR elbow (45 mm); clamped so missing masses stay visible.
function radiusFor(kg: number): number {
    return Math.min(0.07, Math.max(0.028, 0.045 * Math.cbrt(Math.max(kg, 0.15))));
}

export interface FreeBodyGeometry {
    scene: Scene;
    // Pitch joint centres, the tip (payload centre) and the arm's axis height.
    joints: Vec3[];
    tip: Vec3;
    height: number;
    length: number;
    // Lowest point of the drawn arm, for laying out load arrows below it.
    underside: number;
}

export function freeBodyArm(arm: Arm): FreeBodyGeometry {
    const s = new Scene();
    const length = arm.links.reduce((sum, l) => sum + l.length, 0);
    // Joint i's actuator is carried by link i - 1. Joint 1 sits on the base
    // (its mass loads nothing), so it is drawn one size up from the largest.
    const masses = arm.links.map((_, i) => (i === 0 ? 0 : (arm.links[i - 1]?.actuatorMass ?? 0)));
    const radii = masses.map((m, i) => radiusFor(i === 0 ? Math.max(...masses, 0.6) * 1.5 : m));
    const r0 = radii[0] ?? 0.05;
    const h = r0 * 2.4 + 0.06;

    // Base: floor flange, pedestal and the J1 cap, as on the /robots cobot.
    s.tube([0, 0, 0], [0, 0.014, 0], r0 * 1.55, r0 * 1.55, "dark");
    s.tube([0, 0.014, 0], [0, 0.03, 0], r0 * 1.18, r0 * 1.18, "metal");
    s.tube([0, 0.03, 0], [0, h - r0 * 1.15, 0], r0, r0, "shell");
    s.tube([0, h - r0 * 1.15, 0], [0, h - r0 * 1.05, 0], r0 * 1.03, r0 * 1.03, "shell");

    const joints: Vec3[] = [];
    let x = 0;
    arm.links.forEach((l, i) => {
        const r = radii[i] ?? 0.04;
        const c: Vec3 = [x, h, 0];
        joints.push(c);
        s.next();
        // Housing with its side cap, and the actuator inside it.
        s.drum(c, Z, r * 1.08, r * 2, "shell");
        s.drum([x, h, r * 1.08], Z, r * 1.1, r * 0.2, "shell");
        s.motor(c, Z, r * 0.9, r * 1.75, { jn: `J${i + 1}`, nm: 0 });
        const end = x + l.length;
        const last = i === arm.links.length - 1;
        if (!last) {
            const rn = radii[i + 1] ?? r;
            s.tube([x + r * 0.95, h, 0], [end - rn * 0.95, h, 0], Math.min(r, rn) * 0.7, Math.min(r, rn) * 0.7, "shell");
        } else {
            // The gripper ends where the payload sits: the link's far end.
            const g = Math.max(0.3, Math.min(r / 0.044, (l.length - r * 1.3) / 0.16));
            const flange = end - 0.15 * g;
            s.tube([x + r * 0.95, h, 0], [flange - 0.012 * g, h, 0], r * 0.62, r * 0.62, "shell");
            s.tube([flange - 0.012 * g, h, 0], [flange, h, 0], r * 0.7, r * 0.7, "metal");
            s.next();
            s.link([flange, h, 0], [flange + 0.07 * g, h, 0], 0.1 * g, 0.055 * g, "dark", { hint: Z, e1: 0.25, e2: 0.25 });
            const side = Math.min(0.11 * g, Math.max(0.03, 0.045 * Math.cbrt(Math.max(arm.payload, 0.05))));
            for (const zs of [-1, 1]) {
                const z = zs * (side * 0.5 + 0.006 * g);
                s.link([flange + 0.065 * g, h, z], [end + side * 0.35, h, z], 0.014 * g, 0.03 * g, "metal", { hint: Z, e1: 0.3, e2: 0.3 });
            }
            s.next();
            s.box([end, h, 0], AXES, [side * 0.5, side * 0.5, side * 0.5], "dark", 0.2, 0.2);
        }
        x = end;
    });
    const tip: Vec3 = [x, h, 0];
    s.tip = tip;
    const underside = h - Math.max(...radii) * 1.1;
    return { scene: s, joints, tip, height: h, length, underside };
}

