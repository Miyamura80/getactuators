import type { Sourced } from "./sourced";

export const ACTUATOR_TYPES = [
    "qdd",
    "planetary",
    "harmonic",
    "cycloidal",
    "linear-roller-screw",
    "linear-ball-screw",
    "hydraulic",
    "tendon",
    "other",
] as const;
export type ActuatorType = (typeof ACTUATOR_TYPES)[number];

export const ACTUATOR_TYPE_LABEL: Record<ActuatorType, string> = {
    qdd: "Rotary QDD",
    planetary: "Planetary",
    harmonic: "Harmonic",
    cycloidal: "Cycloidal",
    "linear-roller-screw": "Roller screw",
    "linear-ball-screw": "Ball screw",
    hydraulic: "Hydraulic",
    tendon: "Tendon",
    other: "Undisclosed",
};

// Data colors (one per type), bright on black; "other" stays neutral grey.
export const ACTUATOR_TYPE_COLOR: Record<ActuatorType, string> = {
    qdd: "#51cf66",
    planetary: "#4dabf7",
    harmonic: "#9775fa",
    cycloidal: "#ffb547",
    "linear-roller-screw": "#ff6b9a",
    "linear-ball-screw": "#ff922b",
    hydraulic: "#ffe066",
    tendon: "#66d9e8",
    other: "#5b6466",
};

export const SIDED = [
    "shoulder-pitch",
    "shoulder-roll",
    "shoulder-yaw",
    "elbow",
    "wrist",
    "hand",
    "hip-yaw",
    "hip-roll",
    "hip-pitch",
    "knee",
    "ankle-pitch",
    "ankle-roll",
] as const;
export type SidedJoint = (typeof SIDED)[number];
export const CENTRAL = ["neck", "waist"] as const;
export type CentralJoint = (typeof CENTRAL)[number];
export type CanonicalJoint = CentralJoint | `${"l" | "r"}-${SidedJoint}`;

// Motor size class, picked from the joint's peak torque or force (see
// ./magnet). Drives the magnet mass estimate.
export type SizeClass = "xs" | "s" | "m" | "l" | "xl";

export interface HumanoidJoint {
    canonical: CanonicalJoint;
    // Actuators at this node: 2 for a two-motor ankle, 3 for a 3-DOF wrist,
    // the motor count for a hand.
    count: number;
    actuatorType: ActuatorType;
    typeConfidence: "reported" | "estimated";
    // What an estimated type was inferred from.
    inferredFrom?: string;
    actuatorId?: string;
    motor?: string;
    reducer?: string;
    peakTorqueNm?: Sourced<number>;
    peakForceN?: Sourced<number>;
    sizeClass: SizeClass;
    // Per node, i.e. already multiplied by count. Always estimated.
    magnetMassG: Sourced<number>;
    sources: string[];
}

export interface Humanoid {
    id: string;
    name: string;
    brand: string;
    // ISO 3166-1 alpha-2, e.g. "CN"; rendered as a flag (src/country-flag.ts).
    country: string;
    // Matching record in frontend/src/data/robots.json, when there is one.
    robotId?: string;
    dof: number | null;
    height_m: number | null;
    weight_kg: number | null;
    price_usd: number | null;
    price_max_usd: number | null;
    product_url: string | null;
    summary: string;
    // Joints the sources do not cover (e.g. undocumented hands), so totals
    // read as a floor.
    notCounted?: string;
    joints: HumanoidJoint[];
    sources: string[];
}

export interface Ree<T> {
    nd: T;
    pr: T;
    dy: T;
    tb: T;
}

export interface HumanoidTotals {
    actuators: number;
    actuatorCountByType: Partial<Record<ActuatorType, number>>;
    magnetMassKg: Sourced<number>;
    reeKg: Ree<Sourced<number>>;
    // Share of actuators whose type is reported (not estimated), 0 to 1.
    reportedShare: number;
}
