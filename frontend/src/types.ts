export type CategorySlug =
    | "qdd_proprioceptive"
    | "integrated_joint"
    | "smart_servo"
    | "harmonic_precision"
    | "frameless_driver"
    | "cycloidal_premium";

export interface Actuator {
    id: string;
    name: string;
    brand: string;
    category: CategorySlug;
    use_cases: string[];
    // Real product photo when we have one with rights to show it; absent or
    // null falls back to the schematic render in ActuatorThumb.
    image_url?: string | null;
    product_url: string | null;
    datasheet_url: string | null;
    price_usd: number | null;
    availability: string | null;

    peak_torque_nm: number | null;
    rated_torque_nm: number | null;
    max_speed_rpm: number | null;
    gear_ratio: string | null;
    weight_g: number | null;
    torque_density_nm_per_kg: number | null;
    backdrivable: boolean | null;
    backlash_arcmin: number | null;
    repeatability_arcmin: number | null;

    voltage_v: string | number | null;
    peak_current_a: number | null;
    power_w: number | null;
    kt_nm_per_a: number | null;

    // null means "not documented" (distinct from [] = "documented as none").
    comm: string[] | null;
    control_modes: string[] | null;
    encoder: string | null;
    integrated_driver: boolean | null;
    ip_rating: string | null;

    notes: string | null;
    sources: string[];

    price_per_nm: number | null;
    data_source: string;
    verified: boolean;
    country: string | null;
    country_flag: string | null;
    source_url: string | null;
    source_domain: string | null;
}

export interface CategoryMeta {
    slug: CategorySlug;
    label: string;
    hue: number; // used for the chip accent
}

export const CATEGORIES: CategoryMeta[] = [
    { slug: "qdd_proprioceptive", label: "QDD / Proprioceptive", hue: 152 },
    { slug: "integrated_joint", label: "Integrated Joint", hue: 210 },
    { slug: "smart_servo", label: "Smart Servo", hue: 262 },
    { slug: "harmonic_precision", label: "Harmonic / Precision", hue: 28 },
    { slug: "frameless_driver", label: "Frameless + Driver", hue: 340 },
    { slug: "cycloidal_premium", label: "Cycloidal / Premium", hue: 190 },
];

export const CATEGORY_MAP: Record<CategorySlug, CategoryMeta> = Object.fromEntries(
    CATEGORIES.map((c) => [c.slug, c]),
) as Record<CategorySlug, CategoryMeta>;

export const USE_CASE_LABELS: Record<string, string> = {
    quadruped_leg: "Quadruped leg",
    robot_arm: "Robot arm",
    legged_robot: "Legged robot",
    exoskeleton: "Exoskeleton",
    humanoid: "Humanoid",
    cobot: "Cobot",
};

// A real robot that ships with actuators, cross-referenced to the parts we
// track. Kept separate from Actuator so the leaderboard stays a parts catalog.
export interface RobotMotor {
    id: string;
    name: string;
    brand: string;
    rated_torque_nm: number | null;
    peak_torque_nm: number | null;
    rated_speed_rpm: number | null;
    gear_ratio: string | null;
    weight_g: number | null;
    torque_density_nm_per_kg: number | null;
    product_url: string | null;
    // Set when this motor also exists as a row in the actuators dataset.
    actuator_id: string | null;
}

export interface RobotJoint {
    role: string;
    motor: string; // key into RobotData.motors
    count: number;
}

// What kind of machine a catalog robot is; drives the card's stats and
// fallback art.
export type RobotKind = "robot_arm" | "humanoid";

// Whether a robot can be bought today. Distinct from an actuator's
// free-form `availability` string (e.g. "in_production").
export type RobotAvailability = "shipping" | "preorder" | "quote_only" | "discontinued";
export type RobotPower = "battery" | "mains";
// Whether the joint actuators are the maker's own design or bought in.
export type ActuatorSourcing = "in_house" | "off_the_shelf";
// What the maker publishes: mechanical CAD, a URDF/MJCF model, SDK source
// and a bill of materials.
export interface RobotOpenness {
    cad: boolean;
    urdf: boolean;
    sdk: boolean;
    bom: boolean;
}

export interface Robot {
    id: string;
    name: string;
    brand: string;
    kind: RobotKind;
    country: string | null;
    country_flag: string | null;
    dof: number | null;
    payload_kg: number | null;
    // "whole_body" when the payload is a carry figure for the whole robot
    // rather than per arm, so ratios against per-arm robots can say so.
    payload_basis?: "per_arm" | "whole_body";
    reach_mm: number | null;
    // Standing height, for humanoids.
    height_m?: number | null;
    weight_kg: number | null;
    price_usd: number | null;
    price_max_usd: number | null;
    product_url: string | null;
    image_url?: string | null;
    // "cover" for photos shot on their own backdrop, which should fill the
    // tile instead of sitting inset on the light studio panel.
    image_fit?: "contain" | "cover";
    // Build-time crop for the photo script; not used at runtime.
    image_crop?: [number, number, number, number];
    // Researched buying, power and openness facts. Optional so a robot can be
    // listed before it has been researched.
    power?: RobotPower;
    // Best quoted runtime per charge; runtime_note carries editions or caveats.
    runtime_h?: number | null;
    runtime_note?: string | null;
    openness?: RobotOpenness;
    // Null when the maker does not say whose actuators it uses.
    actuator_sourcing?: ActuatorSourcing | null;
    availability?: RobotAvailability;
    lead_time?: string | null;
    summary: string;
    joints: RobotJoint[];
    sources: string[];
}

export interface RobotCredit {
    name: string;
    org: string;
    org_url: string;
}

export interface RobotData {
    credit: RobotCredit;
    motors: Record<string, RobotMotor>;
    robots: Robot[];
}

export type SortDir = "asc" | "desc";

export interface ColumnDef {
    key: string;
    label: string;
    unit?: string;
    // numeric value for sorting/bars; null when not applicable
    value: (a: Actuator) => number | null;
    // how it renders as text
    display: (a: Actuator) => string;
    higherIsBetter: boolean;
    bar?: boolean; // draw an inline metric bar
    numeric: boolean;
}
