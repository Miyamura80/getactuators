// One measured test run of one catalog actuator. Runs live as
// data/benchmarks/<actuator-id>/<run-id>/run.json; the validator
// (scripts/validate-benchmarks.ts) checks them and bundles them into
// runs.generated.json, which the site reads. Protocol: docs/benchmarks/protocol.md.

export const BENCHMARK_ORIGINS = ["published", "lab", "community"] as const;
export type BenchmarkOrigin = (typeof BENCHMARK_ORIGINS)[number];

// How the numbers were obtained: read from the source's tables or text, or
// digitised from a plot (which needs an uncertainty and is never raw data).
export const BENCHMARK_METHODS = ["reported", "digitised", "raw"] as const;
export type BenchmarkMethod = (typeof BENCHMARK_METHODS)[number];

export interface TorqueSpeedPoint {
    rpm: number;
    torqueNm: number;
    efficiency?: number;
}

// tToLimitS null: held without reaching the thermal limit (continuous).
export interface ThermalPoint {
    torqueNm: number;
    tToLimitS: number | null;
    windingRiseC?: number;
}

// Unknown rig details stay null for published runs; lab and community runs
// must fill every field.
export interface BenchmarkRig {
    torqueSensor: string | null;
    accuracyPct: number | null;
    encoder: string | null;
    ambientC: number | null;
    busV: number | null;
    controller: string | null;
    firmware?: string;
}

export const SCALAR_METRICS = [
    "backlashArcmin",
    "stiffnessNmPerRad",
    "frictionNm",
    "ripplePct",
    "bandwidthHz",
    "latencyMs",
    "repeatabilityArcmin",
] as const;
export type ScalarMetric = (typeof SCALAR_METRICS)[number];

// Keys allowed in `uncertainty`: the scalar metrics plus the curve channels.
export const UNCERTAINTY_KEYS = [
    ...SCALAR_METRICS,
    "torqueNm",
    "rpm",
    "efficiency",
    "tToLimitS",
    "windingRiseC",
] as const;
export type UncertaintyKey = (typeof UNCERTAINTY_KEYS)[number];

// A datasheet value the catalog does not hold, quoted with its source, so the
// datasheet-vs-measured view has something to compare against.
export interface DatasheetClaim {
    metric: ScalarMetric;
    value: number;
    source: string;
}

export interface BenchmarkRun {
    actuatorId: string;
    runId: string;
    // Test or publication date (YYYY, YYYY-MM or YYYY-MM-DD); for an undated
    // source, the month it was read.
    date: string;
    origin: BenchmarkOrigin;
    method: BenchmarkMethod;
    source?: { url: string; title: string; locator?: string };
    submitter?: string;
    // Hardware revision and setup the source names.
    unit: string;
    rig: BenchmarkRig;
    torqueSpeed?: TorqueSpeedPoint[];
    thermal?: ThermalPoint[];
    backlashArcmin?: number;
    stiffnessNmPerRad?: number;
    frictionNm?: number;
    ripplePct?: number;
    bandwidthHz?: number;
    latencyMs?: number;
    repeatabilityArcmin?: number;
    uncertainty: Partial<Record<UncertaintyKey, number>>;
    claims?: DatasheetClaim[];
    // Required when the measured peak is outside 0.3x to 1.5x the datasheet.
    plausibilityNote?: string;
    notes?: string;
}
