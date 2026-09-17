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

    comm: string[];
    control_modes: string[];
    encoder: string | null;
    integrated_driver: boolean | null;
    ip_rating: string | null;

    notes: string | null;
    sources: string[];

    price_per_nm: number | null;
    data_source: string;
    verified: boolean;
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
