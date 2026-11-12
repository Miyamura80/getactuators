import {
    BENCHMARKS_AS_OF,
    BENCHMARKS_PATH,
    BENCHMARK_ORIGINS,
    BENCHMARK_RUNS,
    type BenchmarkRun,
    DELTA_METRICS,
    GROUP_LABEL,
    INDEPENDENCE_LABEL,
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
import { mdLink, mdTable, mdText } from "../md";
import type { Page } from "../page-types";
import {
    actuatorLink,
    badge,
    fmt,
    metricLine,
    nameOf,
    pct,
    runLink,
    sourceCell,
} from "./markdown";

// Markdown twin of /benchmarks (datasheet against measured, leaderboard,
// curves, thermal derating and every run) and its Dataset JSON-LD.

const TITLE = "Measured actuator benchmarks";
const DESCRIPTION =
    "Measured robot actuator performance next to datasheet claims: torque-speed curves, thermal derating, backlash and friction from vendor test reports, papers and blogs, each with its method and uncertainty.";

function deltaTable(): string {
    const rows = datasheetDeltas(ACTUATORS);
    return mdTable(
        [
            "Actuator",
            "Metric",
            "Datasheet",
            "Measured",
            "Measured vs datasheet",
            "Independence",
            "Verdict",
            "Run",
        ],
        rows.map((d) => {
            const m = DELTA_METRICS[d.metric];
            return [
                actuatorLink(d.actuator.id),
                m.label,
                `${d.bound === "max" ? "max " : ""}${fmt(d.datasheet, m.unit)}`,
                fmt(d.measured, m.unit),
                formatRatio(d.ratio),
                INDEPENDENCE_LABEL[d.run.independence],
                d.status,
                runLink(d.run),
            ];
        }),
    );
}

function leaderboardTable(): string {
    return mdTable(
        [
            "Rank",
            "Actuator",
            "Continuous torque",
            "Weight",
            "Measured N·m/kg",
            "Independence",
            "Run",
        ],
        measuredLeaderboard(ACTUATORS).map((row, i) => [
            String(i + 1),
            actuatorLink(row.actuator.id),
            fmt(row.continuousNm, "N·m"),
            `${row.weightG} g`,
            fmt(row.densityNmPerKg, "", 3),
            INDEPENDENCE_LABEL[row.run.independence],
            runLink(row.run),
        ]),
    );
}

const runCell = (r: BenchmarkRun) => `${runLink(r)} (${badge(r)})`;

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
        [
            "Actuator",
            "Bus",
            "Method",
            "Points (rpm: N·m)",
            "Uncertainty",
            "Peak efficiency",
            "Run",
        ],
        BENCHMARK_RUNS.filter((r) => r.torqueSpeed?.length).map((r) => [
            nameOf(r.actuatorId),
            r.rig.busV === null ? "not stated" : `${r.rig.busV} V`,
            r.dataMethod,
            tnCell(r),
            `±${r.uncertainty.torqueSpeed} N·m`,
            pct(peakEfficiency(r)),
            runCell(r),
        ]),
    );
}

function thermalTable(): string {
    return mdTable(
        [
            "Actuator",
            "Ambient",
            "Torque: time to limit",
            "Uncertainty",
            "Continuous",
            "Run",
        ],
        BENCHMARK_RUNS.filter((r) => r.thermal?.length).map((r) => [
            nameOf(r.actuatorId),
            r.rig.ambientC === null ? "not stated" : `${r.rig.ambientC} °C`,
            thermalCell(r),
            `±${r.uncertainty.thermal} N·m`,
            fmt(continuousTorque(r), "N·m"),
            runCell(r),
        ]),
    );
}

// Per run: its figures with uncertainty, then method, caveats and notes.
function runNotes(): string {
    return BENCHMARK_RUNS.map((r) => {
        const lines = [
            `Measured: ${mdText(metricLine(r).join("; "))}.`,
            r.methodNote ? `Method: ${mdText(r.methodNote)}` : "",
            `Independence: ${INDEPENDENCE_LABEL[r.independence]}. ${mdText(r.independenceNote)}`,
            r.revision ? `Revision: ${mdText(r.revision)}` : "",
            ...(r.claims ?? []).map(
                (c) =>
                    `Datasheet claim: ${METRICS[c.metric].label} ${c.bound === "max" ? "at most " : ""}${fmt(c.value, METRICS[c.metric].unit)} (${mdText(c.source)})`,
            ),
            r.notRanked ? `Not ranked: ${mdText(r.notRanked)}` : "",
            r.plausibilityNote ? `Flagged: ${mdText(r.plausibilityNote)}` : "",
            r.note ? `Note: ${mdText(r.note)}` : "",
        ].filter(Boolean);
        return `### ${r.actuatorId}/${r.runId}\n\n${lines.join("\n\n")}`;
    }).join("\n\n");
}

function runsTable(): string {
    return mdTable(
        [
            "Run",
            "Actuator",
            "Date",
            "Origin",
            "Independence",
            "Method",
            "Groups",
            "Source",
        ],
        BENCHMARK_RUNS.map((r) => [
            `\`${r.actuatorId}/${r.runId}\``,
            actuatorLink(r.actuatorId),
            r.date,
            badge(r),
            INDEPENDENCE_LABEL[r.independence],
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

Datasheets are claims; these are measurements. ${BENCHMARK_RUNS.length} runs on ${benchmarkedIds().length} catalog actuators (${byOrigin}), as of ${BENCHMARKS_AS_OF}. Each run states its rig, how the numbers were taken (raw rig data, a table, a plot digitised by us, or figures quoted in the text) and an uncertainty per metric. A digitised plot is never raw data. Each run is also labelled by who ran it: **Vendor** (the maker's own test), **Vendor-affiliated** (someone who sells products built on the actuator) or **Independent**. Interactive charts: ${absoluteUrl(BENCHMARKS_PATH)}. JSON: ${absoluteUrl("/api/v1/benchmarks")}. MCP tool: get_benchmarks.

## Datasheet vs measured

Measured figures against the datasheet: peak and continuous torque (the best run per actuator, since a curve that stops below the stall rating is a lower bound), no-load speed and backlash (every ranked run). The datasheet value is the catalog's, or a claim the run's source quotes. Only independent runs get a verdict; vendor rows read "Maker-reported" and vendor-affiliated rows "Affiliated test". For a typical value, within 10% is a match, otherwise below datasheet or beats (lower is better for backlash). For a maximum ("or less"), the result is within spec or over limit. Independent runs come first.

${deltaTable()}

## Measured leaderboard

Continuous torque density: the highest torque a run held for 10 minutes or without reaching the thermal limit, per kg of catalog weight. Heat sinks and ambient differ between runs; read the run before ranking two close entries. The Independence column says when a row rests on the maker's own data.

${leaderboardTable()}

## Torque-speed curves

${curvesTable()}

## Thermal derating

${thermalTable()}

## All runs

${runsTable()}

## Run notes

${runNotes()}

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
