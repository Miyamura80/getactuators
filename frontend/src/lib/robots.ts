import type { Robot, RobotCredit, RobotData, RobotMotor } from "../types";
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
