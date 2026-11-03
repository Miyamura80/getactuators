// Figures derived from one run, shared by ./index (pages, REST, MCP) and
// ./validate (CI). No import of the generated run list, so the validator
// still loads when a run folder is missing or its run.json is malformed.
// Relative imports only: the browser bundle reuses this module.

import {
    type BenchmarkRun,
    METRICS,
    METRIC_KEYS,
    type MetricGroup,
    type MetricKey,
    type ThermalPoint,
} from "./types";

// Torque held this long or longer counts as continuous (10 minutes); a
// thermal point with no limit reached counts too.
export const CONTINUOUS_S = 600;

// Measured peak torque outside this band of the datasheet peak needs a
// plausibilityNote (see scripts/validate-benchmarks.ts).
export const PLAUSIBLE_PEAK_RATIO = [0.3, 1.5] as const;

// Metrics a run reports, in METRICS order.
export function reportedMetrics(run: BenchmarkRun): MetricKey[] {
    return METRIC_KEYS.filter((k) => {
        const v = run[k];
        return Array.isArray(v) ? v.length > 0 : typeof v === "number";
    });
}

export function groupsCovered(run: BenchmarkRun): MetricGroup[] {
    return [...new Set(reportedMetrics(run).map((k) => METRICS[k].group))];
}

const max = (xs: number[]) => (xs.length > 0 ? Math.max(...xs) : undefined);

const curveTorques = (run: BenchmarkRun) => [
    ...(run.torqueSpeed ?? []).map((p) => p.torqueNm),
    ...(run.thermal ?? []).map((p) => p.torqueNm),
];

// Highest torque the run saw: its stated peak, else the top of its curves.
export function measuredPeak(run: BenchmarkRun): number | undefined {
    return run.peakTorqueNm ?? max(curveTorques(run));
}

// Highest torque anywhere in the run, stated peak and curves together. The
// plausibility check uses it so a stated peak cannot hide a unit slip in a
// curve.
export function highestTorque(run: BenchmarkRun): number | undefined {
    return max([
        ...(run.peakTorqueNm === undefined ? [] : [run.peakTorqueNm]),
        ...curveTorques(run),
    ]);
}

// Only a measured no-load speed: the top of a loaded T-N curve is not one.
export function measuredNoLoad(run: BenchmarkRun): number | undefined {
    return run.noLoadRpm;
}

const isContinuous = (p: ThermalPoint) =>
    p.tToLimitS === null || p.tToLimitS >= CONTINUOUS_S;

// Highest torque held for CONTINUOUS_S or without reaching the limit.
export function continuousTorque(run: BenchmarkRun): number | undefined {
    return max((run.thermal ?? []).filter(isContinuous).map((p) => p.torqueNm));
}

export function peakEfficiency(run: BenchmarkRun): number | undefined {
    return max(
        (run.torqueSpeed ?? []).flatMap((p) =>
            p.efficiency === undefined ? [] : [p.efficiency],
        ),
    );
}

// Ranked and set against the datasheet: the catalog revision, and no
// stated reason to keep it out.
export const isRanked = (run: BenchmarkRun) => !run.otherRevision && !run.notRanked;

// Short caveat for badges: why a shown run is not ranked.
export function rankCaveat(run: BenchmarkRun): string | undefined {
    if (run.otherRevision) return "other revision";
    if (run.notRanked) return "not ranked";
    return undefined;
}
