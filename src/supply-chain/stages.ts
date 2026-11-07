// The steps an actuator passes through, ore to robot. Ids are stable and used
// in URLs, so rename labels, never ids.
export const STAGES = [
    "mining",
    "separation",
    "metal-alloy",
    "magnet",
    "motor",
    "gearing",
    "bearing",
    "screw",
    "electronics",
    "actuator",
    "robot",
] as const;

export type Stage = (typeof STAGES)[number];

export const STAGE_LABEL: Record<Stage, string> = {
    mining: "Mining",
    separation: "Separation",
    "metal-alloy": "Metal & alloy",
    magnet: "Magnets",
    motor: "Motors",
    gearing: "Gearing",
    bearing: "Bearings",
    screw: "Screws",
    electronics: "Electronics",
    actuator: "Actuators",
    robot: "Robots",
};
