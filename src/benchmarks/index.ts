import { ACTUATORS } from "../catalog";
import type { Actuator } from "../catalog/types";
import bundle from "./runs.generated.json";
import type {
    BenchmarkOrigin,
    BenchmarkRun,
    ScalarMetric,
    ThermalPoint,
} from "./types";

// /benchmarks: measured actuator performance next to the datasheet. Data and
// derived views only (no zod), so the React app can import it too. The runs
// come from data/benchmarks via scripts/validate-benchmarks.ts --write.

export type * from "./types";

export const BENCHMARKS_PATH = "/benchmarks";
export const PROTOCOL_URL =
    "https://github.com/Miyamura80/getactuators/blob/main/docs/benchmarks/protocol.md";
export const SUBMIT_URL =
    "https://github.com/Miyamura80/getactuators/blob/main/CONTRIBUTING.md#benchmark-submissions";

export const BENCHMARK_RUNS: readonly BenchmarkRun[] = (
    bundle as unknown as { runs: BenchmarkRun[] }
).runs;

export const ORIGIN_LABEL: Record<BenchmarkOrigin, string> = {
    published: "Published",
    lab: "Lab",
    community: "Community",
};

export function runsFor(actuatorId: string): BenchmarkRun[] {
    return BENCHMARK_RUNS.filter((r) => r.actuatorId === actuatorId);
}

const byId = new Map(ACTUATORS.map((a) => [a.id, a]));

export function benchmarkActuator(id: string): Actuator | undefined {
    return byId.get(id);
}

// Actuators with at least one run, in catalog order.
export function measuredActuators(): Actuator[] {
    const ids = new Set(BENCHMARK_RUNS.map((r) => r.actuatorId));
    return ACTUATORS.filter((a) => ids.has(a.id));
}

// Comparable headline metrics: what the datasheet claims and what was measured.
export const DELTA_METRICS = [
    { key: "peakTorqueNm", label: "Peak torque", unit: "Nm", better: "higher" },
    {
        key: "continuousTorqueNm",
        label: "Continuous torque",
        unit: "Nm",
        better: "higher",
    },
    { key: "noLoadRpm", label: "No-load speed", unit: "rpm", better: "higher" },
    { key: "backlashArcmin", label: "Backlash", unit: "arcmin", better: "lower" },
    {
        key: "repeatabilityArcmin",
        label: "Repeatability",
        unit: "arcmin",
        better: "lower",
    },
] as const;
export type DeltaMetric = (typeof DELTA_METRICS)[number]["key"];

const CATALOG_FIELD: Record<DeltaMetric, keyof Actuator> = {
    peakTorqueNm: "peak_torque_nm",
    continuousTorqueNm: "rated_torque_nm",
    noLoadRpm: "max_speed_rpm",
    backlashArcmin: "backlash_arcmin",
    repeatabilityArcmin: "repeatability_arcmin",
};

// Short holds (1 s or less) count as peak torque.
const PEAK_HOLD_S = 1;

function measured(run: BenchmarkRun, metric: DeltaMetric): number | undefined {
    const thermal = run.thermal ?? [];
    switch (metric) {
        case "peakTorqueNm": {
            const all = [
                ...(run.torqueSpeed ?? []).map((p) => p.torqueNm),
                ...thermal
                    .filter((p) => p.tToLimitS !== null && p.tToLimitS <= PEAK_HOLD_S)
                    .map((p) => p.torqueNm),
            ];
            return all.length > 0 ? Math.max(...all) : undefined;
        }
        case "continuousTorqueNm": {
            const held = thermal.filter((p) => p.tToLimitS === null);
            return held.length > 0
                ? Math.max(...held.map((p) => p.torqueNm))
                : undefined;
        }
        case "noLoadRpm": {
            const free = (run.torqueSpeed ?? []).filter((p) => p.torqueNm === 0);
            return free.length > 0 ? Math.max(...free.map((p) => p.rpm)) : undefined;
        }
        default:
            return run[metric];
    }
}

export type Verdict = "over-promised" | "matches" | "beats";

export interface DeltaRow {
    actuatorId: string;
    metric: DeltaMetric;
    label: string;
    unit: string;
    claimed: number;
    claimSource: string;
    measured: number;
    run: BenchmarkRun;
    // measured / claimed.
    ratio: number;
    verdict: Verdict;
}

// Within 10% of the claim counts as a match.
const TOLERANCE = 0.1;

function verdictFor(ratio: number, better: "higher" | "lower"): Verdict {
    const worse = better === "higher" ? ratio < 1 - TOLERANCE : ratio > 1 + TOLERANCE;
    const nicer = better === "higher" ? ratio > 1 + TOLERANCE : ratio < 1 - TOLERANCE;
    if (worse) return "over-promised";
    return nicer ? "beats" : "matches";
}

function claimFor(
    a: Actuator,
    run: BenchmarkRun,
    metric: DeltaMetric,
): { value: number; source: string } | undefined {
    const value = a[CATALOG_FIELD[metric]];
    if (typeof value === "number" && value > 0)
        return { value, source: "Catalog datasheet value" };
    const claim = run.claims?.find((c) => c.metric === (metric as ScalarMetric));
    return claim ? { value: claim.value, source: claim.source } : undefined;
}

// Datasheet vs measured, one row per run and metric where both exist.
export function datasheetDeltas(actuatorId?: string): DeltaRow[] {
    const rows: DeltaRow[] = [];
    const runs = actuatorId ? runsFor(actuatorId) : BENCHMARK_RUNS;
    for (const run of runs) {
        const a = byId.get(run.actuatorId);
        if (!a) continue;
        for (const m of DELTA_METRICS) {
            const value = measured(run, m.key);
            const claim = claimFor(a, run, m.key);
            if (value === undefined || !claim) continue;
            const ratio = value / claim.value;
            rows.push({
                actuatorId: a.id,
                metric: m.key,
                label: m.label,
                unit: m.unit,
                claimed: claim.value,
                claimSource: claim.source,
                measured: value,
                run,
                ratio,
                verdict: verdictFor(ratio, m.better),
            });
        }
    }
    return rows;
}

export interface LeaderboardRow {
    actuator: Actuator;
    continuousTorqueNm: number;
    massKg: number;
    // Measured continuous torque per kg of actuator.
    densityNmPerKg: number;
    run: BenchmarkRun;
}

// Ranked by measured continuous torque density. Only runs that held a torque
// without reaching the thermal limit qualify; short holds are not continuous.
export function measuredLeaderboard(): LeaderboardRow[] {
    const best = new Map<string, LeaderboardRow>();
    for (const run of BENCHMARK_RUNS) {
        const a = byId.get(run.actuatorId);
        const torque = measured(run, "continuousTorqueNm");
        if (!a?.weight_g || torque === undefined) continue;
        const massKg = a.weight_g / 1000;
        const row = {
            actuator: a,
            continuousTorqueNm: torque,
            massKg,
            densityNmPerKg: torque / massKg,
            run,
        };
        const prev = best.get(a.id);
        if (!prev || row.densityNmPerKg > prev.densityNmPerKg) best.set(a.id, row);
    }
    return [...best.values()].sort((x, y) => y.densityNmPerKg - x.densityNmPerKg);
}

export interface CurveSeries<P> {
    actuatorId: string;
    name: string;
    run: BenchmarkRun;
    points: P[];
}

function series<P>(pick: (r: BenchmarkRun) => P[] | undefined): CurveSeries<P>[] {
    return BENCHMARK_RUNS.flatMap((run) => {
        const points = pick(run);
        if (!points?.length) return [];
        const name = byId.get(run.actuatorId)?.name ?? run.actuatorId;
        return [{ actuatorId: run.actuatorId, name, run, points }];
    });
}

export function torqueSpeedSeries(ids?: readonly string[]) {
    const all = series((r) => [...(r.torqueSpeed ?? [])].sort((a, b) => a.rpm - b.rpm));
    return ids ? all.filter((s) => ids.includes(s.actuatorId)) : all;
}

export function thermalSeries(): CurveSeries<ThermalPoint>[] {
    return series((r) =>
        [...(r.thermal ?? [])].sort((a, b) => b.torqueNm - a.torqueNm),
    );
}

export function describeRig(run: BenchmarkRun): string {
    const r = run.rig;
    const parts = [
        r.torqueSensor &&
            `torque: ${r.torqueSensor}${r.accuracyPct ? ` (${r.accuracyPct}%)` : ""}`,
        r.encoder && `position: ${r.encoder}`,
        r.busV !== null && `${r.busV} V bus`,
        r.ambientC !== null && `${r.ambientC} C ambient`,
        r.controller && `driver: ${r.controller}`,
        r.firmware && `firmware ${r.firmware}`,
    ].filter((p): p is string => Boolean(p));
    return parts.length > 0 ? parts.join(", ") : "Rig not described by the source";
}

// Compact list of what a run measured, for tables and panels.
export function measuredSummary(run: BenchmarkRun): string {
    const parts: string[] = [];
    if (run.torqueSpeed?.length)
        parts.push(
            run.torqueSpeed.length === 1 && run.torqueSpeed[0]?.rpm === 0
                ? `stall ${run.torqueSpeed[0].torqueNm} Nm`
                : `T-N curve (${run.torqueSpeed.length} points)`,
        );
    if (run.thermal?.length) parts.push(`thermal (${run.thermal.length} holds)`);
    const scalar: [ScalarMetric, string][] = [
        ["backlashArcmin", "arcmin backlash"],
        ["stiffnessNmPerRad", "Nm/rad stiffness"],
        ["frictionNm", "Nm friction"],
        ["ripplePct", "% ripple"],
        ["bandwidthHz", "Hz bandwidth"],
        ["latencyMs", "ms latency"],
        ["repeatabilityArcmin", "arcmin repeatability"],
    ];
    for (const [k, label] of scalar) {
        const v = run[k];
        if (v !== undefined) parts.push(`${v} ${label}`);
    }
    return parts.join(", ");
}

export function holdLabel(t: number | null): string {
    if (t === null) return "continuous";
    if (t < 60) return `${t} s`;
    return `${Math.round((t / 60) * 10) / 10} min`;
}
