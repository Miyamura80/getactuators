import { z } from "zod";
import { absoluteUrl } from "../server/site";
import {
    BENCHMARKS_PATH,
    BENCHMARK_RUNS,
    PROTOCOL_URL,
    VERDICTS,
    benchmarkActuator,
    datasheetDeltas,
    deltaStatusLabel,
    measuredLeaderboard,
    runsFor,
} from "./index";
import {
    BENCHMARK_INDEPENDENCE,
    BENCHMARK_ORIGINS,
    type BenchmarkIndependence,
    type BenchmarkOrigin,
    CLAIM_BOUNDS,
} from "./types";
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
    claim_bound: z
        .enum(CLAIM_BOUNDS)
        .describe(
            'typical: a nominal figure. max: an upper limit ("0.5 deg or less"), judged within-spec or over-limit, never beats.',
        ),
    measured: z.number(),
    ratio: z.number().describe("measured / claimed."),
    independence: z
        .enum(BENCHMARK_INDEPENDENCE)
        .describe(
            "Who ran the test: vendor (the maker), vendor-affiliated (a company selling products built on it) or independent.",
        ),
    independence_note: z.string(),
    verdict: z
        .enum(VERDICTS)
        .nullable()
        .describe(
            "Only independent runs get a verdict; null for vendor (maker-reported) and vendor-affiliated (affiliated test) runs. Typical claims: within 10% is matches, otherwise below-datasheet or beats; for backlash and repeatability lower is better. Max claims: within-spec or over-limit.",
        ),
    status: z
        .string()
        .describe(
            "Display text: the verdict, or Maker-reported / Affiliated test when there is none.",
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
export const INDEPENDENCE = BENCHMARK_INDEPENDENCE;

export function benchmarkListView(filter: {
    actuator?: string;
    origin?: BenchmarkOrigin;
    independence?: BenchmarkIndependence;
}) {
    const runs = BENCHMARK_RUNS.filter(
        (r) =>
            (!filter.actuator || r.actuatorId === filter.actuator) &&
            (!filter.origin || r.origin === filter.origin) &&
            (!filter.independence || r.independence === filter.independence),
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
            claim_bound: d.claimBound,
            measured: d.measured,
            ratio: d.ratio,
            independence: d.run.independence,
            independence_note: d.run.independenceNote,
            verdict: d.verdict,
            status: deltaStatusLabel(d),
            run_id: d.run.runId,
        })),
        measured_continuous_torque_density_nm_per_kg: density,
    };
}
