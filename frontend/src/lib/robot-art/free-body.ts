// The calculator's arm, drawn in the /robots cobot style (UR-class housings
// with side caps, slim link tubes, a short pedestal) but built from the
// model's own numbers: link lengths to scale, each pitch joint's housing
// sized by its actuator mass, and a claw closed around the payload ball at
// the tip, where the calculation puts the payload.
import { type Arm, jointName } from "../../../../src/engineering/arm-torque";
import type { Vec3 } from "./math";
import { Scene } from "./scene";

const Z: Vec3 = [0, 0, 1];

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

// Two hinged jaws that bow out and hook back in around the payload ball: a
// pincer drawn in the side plane, mounted on a short palm.
function claw(s: Scene, palmStart: number, centre: number, h: number, R: number): void {
    const palm = palmStart + R * 0.45;
    s.tube([palmStart, h, 0], [palm, h, 0], R * 0.55, R * 0.7, "dark");
    const w = R * 0.24;
    for (const sy of [1, -1]) {
        const hinge: Vec3 = [palm, h + sy * R * 0.5, 0];
        const knee: Vec3 = [centre - R * 0.15, h + sy * R * 1.28, 0];
        const tip: Vec3 = [centre + R * 0.78, h + sy * R * 0.42, 0];
        s.drum(hinge, Z, R * 0.2, R * 0.55, "metal");
        s.link(hinge, knee, w * 1.15, R * 0.42, "dark", { hint: Z, e1: 0.35, e2: 0.35 });
        s.drum(knee, Z, R * 0.15, R * 0.48, "metal");
        s.link(knee, tip, w, R * 0.36, "dark", { hint: Z, e1: 0.35, e2: 0.35, taper: [1, 0.55] });
    }
    s.next();
    s.ball([centre, h, 0], R * 0.92, "shell");
}

export function freeBodyArm(arm: Arm): FreeBodyGeometry {
    const s = new Scene();
    const length = arm.links.reduce((sum, l) => sum + l.length, 0);
    const n = arm.links.length;
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
        s.motor(c, Z, r * 0.9, r * 1.75, { jn: jointName(i, n).toUpperCase(), nm: 0 });
        const end = x + l.length;
        if (i < n - 1) {
            const rn = radii[i + 1] ?? r;
            const rl = Math.min(r, rn) * 0.7;
            s.tube([x + r * 0.95, h, 0], [end - rn * 0.95, h, 0], rl, rl, "shell");
        } else {
            // Last link out to a tool flange, then the claw. The payload ball
            // grows with its mass and is centred on the tip.
            const R = Math.min(0.07, Math.max(0.026, 0.034 * Math.cbrt(Math.max(arm.payload, 0.05))));
            const flange = Math.max(x + r * 1.4, end - R * 2.3);
            const rl = r * 0.62;
            s.tube([x + r * 0.95, h, 0], [flange - 0.014, h, 0], rl, rl, "shell");
            s.tube([flange - 0.014, h, 0], [flange, h, 0], r * 0.78, r * 0.78, "metal");
            s.next();
            claw(s, flange, end, h, R);
        }
        x = end;
    });
    const tip: Vec3 = [x, h, 0];
    s.tip = tip;
    const underside = h - Math.max(...radii) * 1.1;
    return { scene: s, joints, tip, height: h, length, underside };
}
