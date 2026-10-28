import { z } from "zod";
import { absoluteUrl } from "../server/site";
import {
    BENCHMARKS_PATH,
    BENCHMARK_RUNS,
    PROTOCOL_URL,
    benchmarkActuator,
    datasheetDeltas,
    measuredLeaderboard,
    runsFor,
} from "./index";
import { BENCHMARK_ORIGINS, type BenchmarkOrigin } from "./types";
import { benchmarkRunSchema } from "./validate";

// Wire shapes of /benchmarks for REST and MCP. Runs keep the run.json schema
// from docs/benchmarks/protocol.md; derived fields are snake_case.

const deltaOut = z.object({
    metric: z
        .string()
        .describe(
            "peakTorqueNm, continuousTorqueNm, noLoadRpm, backlashArcmin or repeatabilityArcmin.",
        ),
    label: z.string(),
    unit: z.string(),
    claimed: z.number().describe("Datasheet value."),
    claim_source: z.string(),
    measured: z.number(),
    ratio: z.number().describe("measured / claimed."),
    verdict: z
        .enum(["over-promised", "matches", "beats"])
        .describe(
            "Within 10% of the claim is a match; for backlash and repeatability lower is better.",
        ),
    run_id: z.string(),
});

export const benchmarkListOut = z.object({
    total: z.number(),
    page_url: z.string(),
    protocol_url: z.string(),
    runs: z.array(benchmarkRunSchema),
});

export const actuatorBenchmarksOut = z.object({
    actuator_id: z.string(),
    actuator_name: z.string(),
    page_url: z.string().describe("Actuator page on actuatorlist.com."),
    benchmarks_url: z.string(),
    runs: z.array(benchmarkRunSchema),
    datasheet_vs_measured: z.array(deltaOut),
    measured_continuous_torque_density_nm_per_kg: z
        .number()
        .nullable()
        .describe("Measured continuous torque per kg; null without a continuous hold."),
});

export const ORIGINS = BENCHMARK_ORIGINS;

export function benchmarkListView(filter: {
    actuator?: string;
    origin?: BenchmarkOrigin;
}) {
    const runs = BENCHMARK_RUNS.filter(
        (r) =>
            (!filter.actuator || r.actuatorId === filter.actuator) &&
            (!filter.origin || r.origin === filter.origin),
    );
    return {
        total: runs.length,
        page_url: absoluteUrl(BENCHMARKS_PATH),
        protocol_url: PROTOCOL_URL,
        runs: [...runs],
    };
}

// null when the actuator is not in the catalog.
export function actuatorBenchmarksView(id: string) {
    const a = benchmarkActuator(id);
    if (!a) return null;
    const density =
        measuredLeaderboard().find((r) => r.actuator.id === id)?.densityNmPerKg ?? null;
    return {
        actuator_id: a.id,
        actuator_name: a.name,
        page_url: absoluteUrl(`/actuators/${encodeURIComponent(a.id)}`),
        benchmarks_url: absoluteUrl(BENCHMARKS_PATH),
        runs: runsFor(id),
        datasheet_vs_measured: datasheetDeltas(id).map((d) => ({
            metric: d.metric,
            label: d.label,
            unit: d.unit,
            claimed: d.claimed,
            claim_source: d.claimSource,
            measured: d.measured,
            ratio: d.ratio,
            verdict: d.verdict,
            run_id: d.run.runId,
        })),
        measured_continuous_torque_density_nm_per_kg: density,
    };
}
