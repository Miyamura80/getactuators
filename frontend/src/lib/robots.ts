import type { Robot, RobotCredit, RobotData, RobotKind, RobotMotor } from "../types";
import raw from "../data/robots.json";

const data = raw as unknown as RobotData;

export const ROBOTS: Robot[] = data.robots;
export const ROBOT_MOTORS: Record<string, RobotMotor> = data.motors;
export const ROBOT_CREDIT: RobotCredit = data.credit;

// One resolved joint row: the motor spec plus how many of it sit at that role.
export interface ResolvedJoint {
    role: string;
    count: number;
    motor: RobotMotor;
}

// Join a robot's joint list against the motor catalog, dropping any joint whose
// motor key is missing so a typo can never crash the render.
export function resolveJoints(robot: Robot): ResolvedJoint[] {
    const out: ResolvedJoint[] = [];
    for (const j of robot.joints) {
        const motor = ROBOT_MOTORS[j.motor];
        if (motor) out.push({ role: j.role, count: j.count, motor });
    }
    return out;
}

// Total actuator count across a robot's joints (0 when the loadout is unknown).
export function motorCount(robot: Robot): number {
    return robot.joints.reduce((n, j) => n + j.count, 0);
}

// Chart colour per robot type; same hues as the robot-type cards on the home page.
export const KIND_COLOR: Record<RobotKind, string> = {
    humanoid: "hsl(262 60% 66%)",
    robot_arm: "hsl(210 70% 62%)",
};

// Runtime per charge for battery robots, or null for mains power and for
// unpublished figures. Every chart and card reads runtime through this.
export function runtimeHours(r: Robot): number | null {
    return r.power === "battery" ? (r.runtime_h ?? null) : null;
}

// Payload as a share of the robot's own mass, or null when either is missing.
export function liftRatio(r: Robot): number | null {
    return r.payload_kg != null && r.weight_kg ? r.payload_kg / r.weight_kg : null;
}

// Sum of peak torque across every joint motor. Null when the loadout is
// unknown, a joint's motor key does not resolve, or any peak is unpublished,
// so a partial loadout is never plotted as a total.
export function totalPeakTorque(r: Robot): number | null {
    const joints = resolveJoints(r);
    if (joints.length === 0 || joints.length !== r.joints.length) return null;
    let total = 0;
    for (const j of joints) {
        if (j.motor.peak_torque_nm == null) return null;
        total += j.count * j.motor.peak_torque_nm;
    }
    return total;
}
