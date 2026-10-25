// Server-side view of the datasets the frontend build emits into
// frontend/src/data/. Kept separate from frontend/src/types.ts so the server
// never pulls React-side modules into its build.

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

export interface Category {
    slug: CategorySlug;
    label: string;
    description: string;
}

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
    actuator_id: string | null;
}

export interface RobotJoint {
    role: string;
    motor: string;
    count: number;
}

// What kind of machine a catalog robot is; drives the card's stats and
// fallback art.
export type RobotKind = "robot_arm" | "humanoid";

export type RobotAvailability = "shipping" | "preorder" | "quote_only" | "discontinued";

export interface Robot {
    id: string;
    name: string;
    brand: string;
    kind: RobotKind;
    country: string | null;
    country_flag: string | null;
    dof: number;
    payload_kg: number | null;
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
    power?: "battery" | "mains";
    // Best quoted runtime per charge; runtime_note carries editions or caveats.
    runtime_h?: number | null;
    runtime_note?: string | null;
    // What the maker publishes: mechanical CAD, a URDF/MJCF model, SDK source
    // and a bill of materials.
    openness?: { cad: boolean; urdf: boolean; sdk: boolean; bom: boolean };
    // Whether the joint actuators are the maker's own design or bought in.
    actuator_sourcing?: "in_house" | "off_the_shelf" | null;
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
