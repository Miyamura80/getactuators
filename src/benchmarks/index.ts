// Measured actuator performance shared by /benchmarks, its markdown twin, the
// actuator pages, /compare, REST and MCP. Dependency-neutral: no catalog
// import (callers pass catalog rows), filesystem, server or React. Relative
// imports only: the browser bundle reuses this module.

import { REPO_URL } from "../repo-link";
import { continuousTorque, isRanked, measuredNoLoad, measuredPeak } from "./measures";
import { RUNS } from "./runs.generated";
import type {
    BenchmarkIndependence,
    BenchmarkRun,
    ClaimBound,
    ClaimMetric,
} from "./types";
import { type Verdict, statusLabel, verdictForRun } from "./verdicts";

export * from "./measures";
export * from "./types";
export * from "./verdicts";

export const BENCHMARKS_PATH = "/benchmarks";
export const BENCHMARKS_AS_OF = "2026-11-03";
export const PROTOCOL_URL = `${REPO_URL}/blob/main/docs/benchmarks/protocol.md`;
export const SUBMIT_URL = `${REPO_URL}/blob/main/CONTRIBUTING.md#benchmark-submissions`;

export const BENCHMARK_RUNS: readonly BenchmarkRun[] = [...RUNS].sort(
    (a, b) =>
        a.actuatorId.localeCompare(b.actuatorId) ||
        b.date.localeCompare(a.date) ||
        a.runId.localeCompare(b.runId),
);

// The catalog fields a datasheet comparison reads.
export interface DatasheetRow {
    id: string;
    name: string;
    brand: string;
    peak_torque_nm: number | null;
    rated_torque_nm: number | null;
    max_speed_rpm: number | null;
    weight_g: number | null;
    backlash_arcmin: number | null;
}

export const runKey = (r: Pick<BenchmarkRun, "actuatorId" | "runId">) =>
    `${r.actuatorId}/${r.runId}`;

export function runsFor(actuatorId: string): BenchmarkRun[] {
    return BENCHMARK_RUNS.filter((r) => r.actuatorId === actuatorId);
}

export function getRun(actuatorId: string, runId: string): BenchmarkRun | undefined {
    return BENCHMARK_RUNS.find((r) => r.actuatorId === actuatorId && r.runId === runId);
}

// Runs on the catalog entry's own revision and not flagged notRanked, the
// only ones ranked or set against its datasheet.
export function rankableRuns(actuatorId: string): BenchmarkRun[] {
    return runsFor(actuatorId).filter(isRanked);
}

export function benchmarkedIds(): string[] {
    return [...new Set(BENCHMARK_RUNS.map((r) => r.actuatorId))];
}

// Measured over datasheet, or undefined when either side is missing.
export const ratio = (measured?: number, datasheet?: number | null) =>
    measured !== undefined && datasheet ? measured / datasheet : undefined;
// The datasheet comparisons, with the catalog field and, where a run.json
// claim can stand in for it, the run metric it is quoted for.
export const DELTA_METRICS = {
    peak: {
        label: "Peak torque",
        unit: "N·m",
        better: "higher",
        catalog: "peak_torque_nm",
        claim: "peakTorqueNm",
    },
    continuous: {
        label: "Continuous torque",
        unit: "N·m",
        better: "higher",
        catalog: "rated_torque_nm",
        claim: undefined,
    },
    noLoad: {
        label: "No-load speed",
        unit: "rpm",
        better: "higher",
        catalog: "max_speed_rpm",
        claim: "noLoadRpm",
    },
    backlash: {
        label: "Backlash",
        unit: "arcmin",
        better: "lower",
        catalog: "backlash_arcmin",
        claim: "backlashArcmin",
    },
} as const satisfies Record<
    string,
    {
        label: string;
        unit: string;
        better: "higher" | "lower";
        catalog: keyof DatasheetRow;
        claim: ClaimMetric | undefined;
    }
>;
export type DeltaKey = keyof typeof DELTA_METRICS;
export const DELTA_KEYS = Object.keys(DELTA_METRICS) as DeltaKey[];

const MEASURED: Record<DeltaKey, (r: BenchmarkRun) => number | undefined> = {
    peak: measuredPeak,
    continuous: continuousTorque,
    noLoad: measuredNoLoad,
    backlash: (r) => r.backlashArcmin,
};

export const CATALOG_CLAIM_SOURCE = "Catalog datasheet value";

export interface DeltaPair {
    measured: number;
    datasheet: number;
    ratio: number;
    bound: ClaimBound;
    claimSource: string;
    // Null unless the run is independent.
    verdict: Verdict | null;
    // The verdict, or "Maker-reported" / "Affiliated test" without one.
    status: string;
}

export interface DatasheetDelta {
    run: BenchmarkRun;
    actuator: DatasheetRow;
    peak?: DeltaPair;
    continuous?: DeltaPair;
    noLoad?: DeltaPair;
    backlash?: DeltaPair;
}

// The datasheet value for one comparison: the catalog's, else the run's own
// quoted claim.
function claimFor(
    run: BenchmarkRun,
    actuator: DatasheetRow,
    key: DeltaKey,
): { value: number; source: string; bound: ClaimBound } | undefined {
    const m = DELTA_METRICS[key];
    const value = actuator[m.catalog];
    if (typeof value === "number" && value > 0)
        return { value, source: CATALOG_CLAIM_SOURCE, bound: "typical" };
    const claim = m.claim ? run.claims?.find((c) => c.metric === m.claim) : undefined;
    return claim && claim.value > 0
        ? { value: claim.value, source: claim.source, bound: claim.bound ?? "typical" }
        : undefined;
}

function pair(run: BenchmarkRun, actuator: DatasheetRow, key: DeltaKey) {
    const measured = MEASURED[key](run);
    const claim = claimFor(run, actuator, key);
    const r = ratio(measured, claim?.value);
    if (r === undefined || measured === undefined || !claim) return undefined;
    const verdict = verdictForRun(
        run.independence,
        r,
        DELTA_METRICS[key].better,
        claim.bound,
    );
    return {
        measured,
        datasheet: claim.value,
        ratio: r,
        bound: claim.bound,
        claimSource: claim.source,
        verdict,
        status: statusLabel(run.independence, verdict),
    };
}

// Empty for a run that is not ranked (other revision or notRanked): its
// numbers are not set against this catalog entry's datasheet.
export function datasheetDelta(
    run: BenchmarkRun,
    actuator: DatasheetRow,
): DatasheetDelta {
    if (!isRanked(run)) return { run, actuator };
    return {
        run,
        actuator,
        peak: pair(run, actuator, "peak"),
        continuous: pair(run, actuator, "continuous"),
        noLoad: pair(run, actuator, "noLoad"),
        backlash: pair(run, actuator, "backlash"),
    };
}

export interface DeltaRow extends DeltaPair {
    metric: DeltaKey;
    run: BenchmarkRun;
    actuator: DatasheetRow;
}

// Independent runs first: they are the only ones with a verdict.
const INDEPENDENCE_ORDER: Record<BenchmarkIndependence, number> = {
    independent: 0,
    "vendor-affiliated": 1,
    vendor: 2,
};

// A measured peak or continuous torque is a lower bound (a curve can stop
// short of the stall rating), so one run stands for each actuator: an
// independent one if any, else the highest. No-load speed and backlash list
// every ranked run.
const ONE_PER_ACTUATOR: readonly DeltaKey[] = ["peak", "continuous"];

const byStanding = (a: DeltaRow, b: DeltaRow) =>
    INDEPENDENCE_ORDER[a.run.independence] - INDEPENDENCE_ORDER[b.run.independence] ||
    b.ratio - a.ratio;

// Datasheet against measured, one row per actuator, metric and run as above.
// Sorted independent runs first, then vendor-affiliated, then vendor; within
// each by metric, then actuator and run, so no row leads on its gap alone.
export function datasheetDeltas(catalog: readonly DatasheetRow[]): DeltaRow[] {
    const rows: DeltaRow[] = [];
    for (const id of benchmarkedIds()) {
        const actuator = catalog.find((a) => a.id === id);
        if (!actuator) continue;
        const deltas = rankableRuns(id).map((r) => datasheetDelta(r, actuator));
        for (const metric of DELTA_KEYS) {
            const found = deltas.flatMap((d) => {
                const p = d[metric];
                return p ? [{ ...p, metric, run: d.run, actuator }] : [];
            });
            const best = [...found].sort(byStanding)[0];
            if (ONE_PER_ACTUATOR.includes(metric)) {
                if (best) rows.push(best);
            } else rows.push(...found);
        }
    }
    return rows.sort(
        (a, b) =>
            INDEPENDENCE_ORDER[a.run.independence] -
                INDEPENDENCE_ORDER[b.run.independence] ||
            DELTA_KEYS.indexOf(a.metric) - DELTA_KEYS.indexOf(b.metric) ||
            a.actuator.id.localeCompare(b.actuator.id) ||
            a.run.runId.localeCompare(b.run.runId),
    );
}

export interface LeaderRow {
    actuator: DatasheetRow;
    run: BenchmarkRun;
    continuousNm: number;
    weightG: number;
    // Measured continuous torque per kg of actuator.
    densityNmPerKg: number;
}

// Measured leaderboard: continuous torque density from thermal runs, best
// run per actuator, highest first.
export function measuredLeaderboard(catalog: readonly DatasheetRow[]): LeaderRow[] {
    const rows: LeaderRow[] = [];
    for (const actuator of catalog) {
        if (!actuator.weight_g) continue;
        const weightG = actuator.weight_g;
        const best = rankableRuns(actuator.id)
            .map((run) => ({ run, continuousNm: continuousTorque(run) }))
            .filter((x): x is { run: BenchmarkRun; continuousNm: number } =>
                Boolean(x.continuousNm),
            )
            .sort((a, b) => b.continuousNm - a.continuousNm)[0];
        if (best)
            rows.push({
                actuator,
                ...best,
                weightG,
                densityNmPerKg: best.continuousNm / (weightG / 1000),
            });
    }
    return rows.sort((a, b) => b.densityNmPerKg - a.densityNmPerKg);
}

// Runs with a T-N curve, newest first per actuator, for the overlay chart.
export function curveRuns(): BenchmarkRun[] {
    return BENCHMARK_RUNS.filter((r) => (r.torqueSpeed?.length ?? 0) > 0);
}

export function thermalRuns(): BenchmarkRun[] {
    return BENCHMARK_RUNS.filter((r) => (r.thermal?.length ?? 0) > 0);
}

// The run whose curve stands for an actuator in overlays: the newest ranked
// run with a T-N curve, else the newest unranked one.
export function curveFor(actuatorId: string): BenchmarkRun | undefined {
    const withCurve = runsFor(actuatorId).filter(
        (r) => (r.torqueSpeed?.length ?? 0) > 0,
    );
    return withCurve.find(isRanked) ?? withCurve[0];
}

export function formatRatio(r: number): string {
    const pct = Math.round((r - 1) * 100);
    return pct === 0 ? "matches" : `${pct > 0 ? "+" : ""}${pct}%`;
}
