// Measured actuator performance shared by /benchmarks, its markdown twin, the
// actuator pages, /compare, REST and MCP. Dependency-neutral: no catalog
// import (callers pass catalog rows), filesystem, server or React. Relative
// imports only: the browser bundle reuses this module.

import { REPO_URL } from "../repo-link";
import { continuousTorque, isRanked, measuredNoLoad, measuredPeak } from "./measures";
import { RUNS } from "./runs.generated";
import type { BenchmarkRun } from "./types";

export * from "./measures";
export * from "./types";

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

export interface DatasheetDelta {
    run: BenchmarkRun;
    actuator: DatasheetRow;
    peak?: { measured: number; datasheet: number; ratio: number };
    continuous?: { measured: number; datasheet: number; ratio: number };
    noLoad?: { measured: number; datasheet: number; ratio: number };
}

function pair(measured: number | undefined, datasheet: number | null) {
    const r = ratio(measured, datasheet);
    return r === undefined || measured === undefined || datasheet === null
        ? undefined
        : { measured, datasheet, ratio: r };
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
        peak: pair(measuredPeak(run), actuator.peak_torque_nm),
        continuous: pair(continuousTorque(run), actuator.rated_torque_nm),
        noLoad: pair(measuredNoLoad(run), actuator.max_speed_rpm),
    };
}

// One row per actuator: its strongest measured peak against the datasheet,
// sorted from the biggest shortfall (most over-promised) up.
export function datasheetDeltas(catalog: readonly DatasheetRow[]): DatasheetDelta[] {
    const rows: DatasheetDelta[] = [];
    for (const id of benchmarkedIds()) {
        const actuator = catalog.find((a) => a.id === id);
        if (!actuator) continue;
        const deltas = rankableRuns(id)
            .map((r) => datasheetDelta(r, actuator))
            .filter((d) => d.peak);
        const best = deltas.sort(
            (a, b) => (b.peak?.ratio ?? 0) - (a.peak?.ratio ?? 0),
        )[0];
        if (best) rows.push(best);
    }
    return rows.sort((a, b) => (a.peak?.ratio ?? 0) - (b.peak?.ratio ?? 0));
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
