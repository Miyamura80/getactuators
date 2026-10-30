// Small, hand-built Actuator fixtures for the pure filter/query tests. These
// stay in-test on purpose: the real actuators.json is large and would make the
// suite slower and non-deterministic as the dataset changes. Only the fields
// the code under test actually reads are given meaningful values; everything
// else is filled with a harmless default so the factory returns a valid
// Actuator without every call spelling out 40 fields.
import type { Actuator, CategorySlug } from "../src/types";

// Fields a caller commonly overrides for a given test scenario.
export interface ActuatorOverrides {
    id?: string;
    name?: string;
    brand?: string;
    category?: CategorySlug;
    use_cases?: string[];
    notes?: string | null;
    peak_torque_nm?: number | null;
    torque_density_nm_per_kg?: number | null;
    price_usd?: number | null;
    weight_g?: number | null;
}

export function makeActuator(overrides: ActuatorOverrides = {}): Actuator {
    return {
        id: overrides.id ?? "id",
        name: overrides.name ?? "Actuator",
        brand: overrides.brand ?? "Brand",
        category: overrides.category ?? "qdd_proprioceptive",
        use_cases: overrides.use_cases ?? [],
        image_url: null,
        product_url: null,
        datasheet_url: null,
        price_usd: overrides.price_usd ?? null,
        availability: null,

        peak_torque_nm: overrides.peak_torque_nm ?? null,
        rated_torque_nm: null,
        max_speed_rpm: null,
        gear_ratio: null,
        weight_g: overrides.weight_g ?? null,
        torque_density_nm_per_kg: overrides.torque_density_nm_per_kg ?? null,
        backdrivable: null,
        backlash_arcmin: null,
        repeatability_arcmin: null,

        voltage_v: null,
        peak_current_a: null,
        power_w: null,
        kt_nm_per_a: null,

        comm: [],
        control_modes: [],
        encoder: null,
        integrated_driver: null,
        ip_rating: null,

        notes: overrides.notes ?? null,
        sources: [],

        price_per_nm: null,
        data_source: "test",
        verified: false,
        country: overrides.country ?? null,
        country_flag: null,
        source_url: null,
        source_domain: null,
    };
}
