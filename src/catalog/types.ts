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

export interface Robot {
    id: string;
    name: string;
    brand: string;
    country: string | null;
    country_flag: string | null;
    dof: number;
    payload_kg: number | null;
    reach_mm: number | null;
    weight_kg: number | null;
    price_usd: number | null;
    price_max_usd: number | null;
    product_url: string | null;
    image_url?: string | null;
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
