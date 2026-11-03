import { z } from "zod";
import { absoluteUrl } from "../server/site";
import {
    BENCHMARKS_AS_OF,
    BENCHMARKS_PATH,
    BENCHMARK_ORIGINS,
    BENCHMARK_RUNS,
    DATA_METHODS,
    type DatasheetRow,
    METRIC_GROUPS,
    PROTOCOL_URL,
    SOURCE_KINDS,
    continuousTorque,
    datasheetDelta,
    groupsCovered,
    measuredNoLoad,
    measuredPeak,
    peakEfficiency,
    runsFor,
} from "./index";
import { BENCHMARK_SOURCES, sourceIdForUrl } from "./sources";
import type { BenchmarkRun } from "./types";

// Wire shape of measured runs for REST (/api/v1/benchmarks) and MCP
// (get_benchmarks): snake_case, nulls for unknowns, source inline. Server
// side only (zod).

const vsDatasheet = z
    .object({
        measured: z.number(),
        datasheet: z.number(),
        ratio: z.number().describe("Measured over datasheet; 0.8 = 20% short."),
    })
    .nullable();

export const benchmarkRunOut = z.object({
    actuator_id: z.string(),
    run_id: z.string(),
    url: z.string().describe("The run on /benchmarks."),
    date: z.string().describe("YYYY, YYYY-MM or YYYY-MM-DD."),
    origin: z
        .enum(BENCHMARK_ORIGINS)
        .describe("published (cited source), lab (our rig) or community (PR)."),
    source_kind: z.enum(SOURCE_KINDS).nullable(),
    source: z
        .object({
            title: z.string(),
            url: z.string(),
            reuse: z.enum(["open", "facts", "restricted"]),
        })
        .nullable(),
    submitter: z.string().nullable(),
    data_method: z
        .enum(DATA_METHODS)
        .describe(
            "raw (CSVs in the repo), tabulated, digitised (read off a plot, not raw data) or reported.",
        ),
    method_note: z.string().nullable(),
    revision: z.string().nullable(),
    other_revision: z
        .boolean()
        .describe("Tested hardware is not the catalog revision; not ranked."),
    not_ranked: z
        .string()
        .nullable()
        .describe(
            "Why a run on the catalog revision is still kept out of datasheet comparisons and the leaderboard; null when it is ranked.",
        ),
    rig: z.object({
        torque_sensor: z.string(),
        accuracy_pct: z.number().nullable(),
        encoder: z.string(),
        ambient_c: z.number().nullable(),
        bus_v: z.number().nullable(),
        controller: z.string(),
        firmware: z.string().nullable(),
    }),
    groups: z.array(z.enum(METRIC_GROUPS)).describe("Measurement groups covered."),
    torque_speed: z.array(
        z.object({
            rpm: z.number(),
            torque_nm: z.number(),
            efficiency: z.number().nullable(),
        }),
    ),
    thermal: z.array(
        z.object({
            torque_nm: z.number(),
            t_to_limit_s: z
                .number()
                .nullable()
                .describe("Null: held without reaching the thermal limit."),
            winding_rise_c: z.number().nullable(),
        }),
    ),
    peak_torque_nm: z.number().nullable(),
    no_load_rpm: z
        .number()
        .nullable()
        .describe(
            "Measured with the load decoupled; null when the run did not measure it.",
        ),
    continuous_torque_nm: z
        .number()
        .nullable()
        .describe("Highest torque held 600 s or without reaching the limit."),
    peak_efficiency: z.number().nullable(),
    backlash_arcmin: z.number().nullable(),
    stiffness_nm_per_rad: z.number().nullable(),
    friction_nm: z.number().nullable(),
    ripple_pct: z.number().nullable(),
    bandwidth_hz: z.number().nullable(),
    latency_ms: z.number().nullable(),
    repeatability_arcmin: z.number().nullable(),
    uncertainty: z
        .record(z.string(), z.number())
        .describe("Plus or minus per metric, in the metric's unit."),
    vs_datasheet: z
        .object({
            peak_torque: vsDatasheet,
            continuous_torque: vsDatasheet,
            no_load_speed: vsDatasheet,
        })
        .describe(
            "Null pairs for runs that are not ranked (other revision or not_ranked).",
        ),
    plausibility_note: z.string().nullable(),
    note: z.string().nullable(),
});

export const benchmarkListOut = z.object({
    as_of: z.string(),
    total: z.number(),
    actuators: z.number().describe("Distinct actuators with at least one run."),
    protocol_url: z.string(),
    results: z.array(benchmarkRunOut),
});

const n = (v: number | undefined) => v ?? null;

export function runUrl(r: Pick<BenchmarkRun, "actuatorId" | "runId">): string {
    return absoluteUrl(`${BENCHMARKS_PATH}#run=${r.actuatorId}/${r.runId}`);
}

function sourceView(r: BenchmarkRun) {
    if (!r.source) return null;
    const id = sourceIdForUrl(r.source.url);
    return {
        title: r.source.title,
        url: r.source.url,
        reuse: id ? BENCHMARK_SOURCES[id].reuse : ("facts" as const),
    };
}

const rigView = ({ rig }: BenchmarkRun) => ({
    torque_sensor: rig.torqueSensor,
    accuracy_pct: rig.accuracyPct,
    encoder: rig.encoder,
    ambient_c: rig.ambientC,
    bus_v: rig.busV,
    controller: rig.controller,
    firmware: rig.firmware ?? null,
});

export function benchmarkRunView(
    r: BenchmarkRun,
    actuator: DatasheetRow | undefined,
): z.infer<typeof benchmarkRunOut> {
    const delta = actuator ? datasheetDelta(r, actuator) : undefined;
    return {
        actuator_id: r.actuatorId,
        run_id: r.runId,
        url: runUrl(r),
        date: r.date,
        origin: r.origin,
        source_kind: r.sourceKind ?? null,
        source: sourceView(r),
        submitter: r.submitter ?? null,
        data_method: r.dataMethod,
        method_note: r.methodNote ?? null,
        revision: r.revision ?? null,
        other_revision: r.otherRevision ?? false,
        not_ranked: r.notRanked ?? null,
        rig: rigView(r),
        groups: groupsCovered(r),
        torque_speed: (r.torqueSpeed ?? []).map((p) => ({
            rpm: p.rpm,
            torque_nm: p.torqueNm,
            efficiency: n(p.efficiency),
        })),
        thermal: (r.thermal ?? []).map((p) => ({
            torque_nm: p.torqueNm,
            t_to_limit_s: p.tToLimitS,
            winding_rise_c: n(p.windingRiseC),
        })),
        peak_torque_nm: n(measuredPeak(r)),
        no_load_rpm: n(measuredNoLoad(r)),
        continuous_torque_nm: n(continuousTorque(r)),
        peak_efficiency: n(peakEfficiency(r)),
        backlash_arcmin: n(r.backlashArcmin),
        stiffness_nm_per_rad: n(r.stiffnessNmPerRad),
        friction_nm: n(r.frictionNm),
        ripple_pct: n(r.ripplePct),
        bandwidth_hz: n(r.bandwidthHz),
        latency_ms: n(r.latencyMs),
        repeatability_arcmin: n(r.repeatabilityArcmin),
        uncertainty: r.uncertainty,
        vs_datasheet: {
            peak_torque: delta?.peak ?? null,
            continuous_torque: delta?.continuous ?? null,
            no_load_speed: delta?.noLoad ?? null,
        },
        plausibility_note: r.plausibilityNote ?? null,
        note: r.note ?? null,
    };
}

export function benchmarkListView(
    catalog: readonly DatasheetRow[],
    filter: { actuatorId?: string; origin?: BenchmarkRun["origin"] } = {},
): z.infer<typeof benchmarkListOut> {
    const runs = (
        filter.actuatorId ? runsFor(filter.actuatorId) : BENCHMARK_RUNS
    ).filter((r) => !filter.origin || r.origin === filter.origin);
    return {
        as_of: BENCHMARKS_AS_OF,
        total: runs.length,
        actuators: new Set(runs.map((r) => r.actuatorId)).size,
        protocol_url: PROTOCOL_URL,
        results: runs.map((r) =>
            benchmarkRunView(
                r,
                catalog.find((a) => a.id === r.actuatorId),
            ),
        ),
    };
}
