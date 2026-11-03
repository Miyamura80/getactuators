import {
    BENCHMARKS_AS_OF,
    BENCHMARKS_PATH,
    BENCHMARK_ORIGINS,
    BENCHMARK_RUNS,
    type BenchmarkRun,
    GROUP_LABEL,
    METRICS,
    PROTOCOL_URL,
    SUBMIT_URL,
    benchmarkedIds,
    continuousTorque,
    datasheetDeltas,
    formatRatio,
    groupsCovered,
    measuredLeaderboard,
    peakEfficiency,
} from "@/benchmarks";
import { ACTUATORS } from "@/catalog";
import { DATA_LICENSE, SITE_URL, absoluteUrl } from "../../site";
import * as ld from "../jsonld";
import { mdLink, mdTable } from "../md";
import type { Page } from "../page-types";
import { actuatorLink, badge, fmt, nameOf, pct, runLink, sourceCell } from "./markdown";

// Markdown twin of /benchmarks (datasheet against measured, leaderboard,
// curves, thermal derating and every run) and its Dataset JSON-LD.

const TITLE = "Measured actuator benchmarks";
const DESCRIPTION =
    "Dyno and bench measurements of robot actuators next to their datasheet claims: torque-speed curves, thermal derating, backlash and friction from published tests and community runs.";

function deltaTable(): string {
    const rows = datasheetDeltas(ACTUATORS);
    return mdTable(
        [
            "Actuator",
            "Datasheet peak",
            "Measured peak",
            "Measured vs datasheet",
            "Run",
            "Origin",
        ],
        rows.map((d) => [
            actuatorLink(d.actuator.id),
            fmt(d.peak?.datasheet, "N·m"),
            fmt(d.peak?.measured, "N·m"),
            d.peak ? formatRatio(d.peak.ratio) : "n/a",
            runLink(d.run),
            badge(d.run),
        ]),
    );
}

function leaderboardTable(): string {
    return mdTable(
        ["Rank", "Actuator", "Continuous torque", "Weight", "Measured N·m/kg", "Run"],
        measuredLeaderboard(ACTUATORS).map((row, i) => [
            String(i + 1),
            actuatorLink(row.actuator.id),
            fmt(row.continuousNm, "N·m"),
            `${row.weightG} g`,
            fmt(row.densityNmPerKg, "", 3),
            runLink(row.run),
        ]),
    );
}

const tnCell = (r: BenchmarkRun) =>
    (r.torqueSpeed ?? []).map((p) => `${p.rpm} rpm: ${p.torqueNm}`).join("; ");
const thermalCell = (r: BenchmarkRun) =>
    (r.thermal ?? [])
        .map(
            (p) =>
                `${p.torqueNm} N·m: ${p.tToLimitS === null ? "continuous" : `${p.tToLimitS} s`}`,
        )
        .join("; ");

function curvesTable(): string {
    return mdTable(
        ["Actuator", "Bus", "Method", "Points (rpm: N·m)", "Peak efficiency", "Run"],
        BENCHMARK_RUNS.filter((r) => r.torqueSpeed?.length).map((r) => [
            nameOf(r.actuatorId),
            r.rig.busV === null ? "not stated" : `${r.rig.busV} V`,
            r.dataMethod,
            tnCell(r),
            pct(peakEfficiency(r)),
            runLink(r),
        ]),
    );
}

function thermalTable(): string {
    return mdTable(
        ["Actuator", "Ambient", "Torque: time to limit", "Continuous", "Run"],
        BENCHMARK_RUNS.filter((r) => r.thermal?.length).map((r) => [
            nameOf(r.actuatorId),
            r.rig.ambientC === null ? "not stated" : `${r.rig.ambientC} °C`,
            thermalCell(r),
            fmt(continuousTorque(r), "N·m"),
            runLink(r),
        ]),
    );
}

function runsTable(): string {
    return mdTable(
        ["Run", "Actuator", "Date", "Origin", "Method", "Groups", "Source"],
        BENCHMARK_RUNS.map((r) => [
            `\`${r.actuatorId}/${r.runId}\``,
            actuatorLink(r.actuatorId),
            r.date,
            badge(r),
            r.dataMethod,
            groupsCovered(r)
                .map((g) => GROUP_LABEL[g])
                .join(", "),
            sourceCell(r),
        ]),
    );
}

export function benchmarksBody(): string {
    const byOrigin = BENCHMARK_ORIGINS.map(
        (o) => `${BENCHMARK_RUNS.filter((r) => r.origin === o).length} ${o}`,
    ).join(", ");
    return `# ${TITLE}

Datasheets are claims; these are measurements. ${BENCHMARK_RUNS.length} runs on ${benchmarkedIds().length} catalog actuators (${byOrigin}), as of ${BENCHMARKS_AS_OF}. Each run states its rig, how the numbers were taken (raw rig data, a table, a plot digitised by us, or figures quoted in the text) and an uncertainty per metric. A digitised plot is never raw data, and vendor test reports are the maker's own measurements, not independent ones. Interactive charts: ${absoluteUrl(BENCHMARKS_PATH)}. JSON: ${absoluteUrl("/api/v1/benchmarks")}. MCP tool: get_benchmarks.

## Datasheet vs measured

Highest measured peak torque per actuator against the catalog's datasheet peak, biggest shortfall first. A curve that stops below the stall rating counts as a shortfall: the run never saw more.

${deltaTable()}

## Measured leaderboard

Continuous torque density: the highest torque a run held for 10 minutes or without reaching the thermal limit, per kg of catalog weight. Heat sinks and ambient differ between runs; read the run before ranking two close entries.

${leaderboardTable()}

## Torque-speed curves

${curvesTable()}

## Thermal derating

${thermalTable()}

## All runs

${runsTable()}

## Submit a run

Anyone can add a run by pull request: one folder \`data/benchmarks/<actuator-id>/<run-id>/\` with \`run.json\`, raw CSVs, a rig description and rig photos, measured to the ${mdLink("test protocol", PROTOCOL_URL)}. CI checks units, protocol and plausibility, a maintainer reviews it, and it is badged community. ${mdLink("How to submit", SUBMIT_URL)}.`;
}

export const BENCHMARKS_PAGE: Page = {
    path: BENCHMARKS_PATH,
    kind: "spa",
    title: TITLE,
    description: DESCRIPTION,
    body: benchmarksBody,
    jsonLd: () => [
        ld.webPage("WebPage", BENCHMARKS_PATH, TITLE),
        ld.breadcrumbs([
            { name: "Home", path: "/" },
            { name: TITLE, path: BENCHMARKS_PATH },
        ]),
        {
            "@type": "Dataset",
            "@id": `${SITE_URL}${BENCHMARKS_PATH}#runs`,
            name: "Measured robot actuator performance",
            description: DESCRIPTION,
            url: absoluteUrl(BENCHMARKS_PATH),
            isAccessibleForFree: true,
            license: DATA_LICENSE.url,
            dateModified: BENCHMARKS_AS_OF,
            variableMeasured: Object.values(METRICS).map((m) => m.label),
            measurementTechnique:
                "Dynamometer and bench tests; published curves digitised with stated uncertainty",
            distribution: [
                {
                    "@type": "DataDownload",
                    encodingFormat: "application/json",
                    contentUrl: absoluteUrl("/api/v1/benchmarks"),
                },
                {
                    "@type": "DataDownload",
                    encodingFormat: "text/markdown",
                    contentUrl: absoluteUrl(`${BENCHMARKS_PATH}.md`),
                },
            ],
        },
    ],
};
