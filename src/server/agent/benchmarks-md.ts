import {
    BENCHMARKS_PATH,
    BENCHMARK_RUNS,
    type BenchmarkRun,
    INDEPENDENCE_LABEL,
    ORIGIN_LABEL,
    PROTOCOL_URL,
    SUBMIT_URL,
    benchmarkActuator,
    datasheetDeltas,
    deltaStatusLabel,
    describeRig,
    holdLabel,
    measuredActuators,
    measuredLeaderboard,
    measuredSummary,
    runsFor,
    thermalSeries,
    torqueSpeedSeries,
} from "@/benchmarks";
import { absoluteUrl } from "../site";
import { bullets, mdLink, mdTable, mdText } from "./md";

// Markdown twin of /benchmarks, plus the "Measured" section of each actuator's
// twin. Same derived views as the React page.

// Local copy of catalog-md's actuatorPath: catalog-md imports this module.
const actuatorPath = (id: string) => `/actuators/${encodeURIComponent(id)}`;

export const TITLE = "Actuator benchmarks";
export const DESCRIPTION =
    "Measured actuator performance next to the datasheet: torque, thermal holds and backlash from published tests and community dyno runs, every run linked to its source.";

const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

function actuatorLink(id: string): string {
    const a = benchmarkActuator(id);
    return mdLink(a ? `${a.name} (${a.brand})` : id, absoluteUrl(actuatorPath(id)));
}

function sourceLink(run: BenchmarkRun): string {
    if (run.source) return mdLink(mdText(run.source.title), run.source.url);
    return run.submitter ? `@${run.submitter}` : run.runId;
}

function deltaTable(actuatorId?: string): string {
    const rows = datasheetDeltas(actuatorId);
    if (rows.length === 0)
        return "No metric with both a datasheet value and a measurement yet.";
    return mdTable(
        [
            "Actuator",
            "Metric",
            "Datasheet",
            "Measured",
            "Delta",
            "Independence",
            "Verdict",
            "Run",
        ],
        rows.map((d) => [
            actuatorLink(d.actuatorId),
            d.label,
            `${d.claimBound === "max" ? "max " : ""}${fmt(d.claimed)} ${d.unit}`,
            `${fmt(d.measured)} ${d.unit}`,
            `${d.ratio >= 1 ? "+" : ""}${Math.round((d.ratio - 1) * 100)}%`,
            INDEPENDENCE_LABEL[d.run.independence],
            deltaStatusLabel(d),
            sourceLink(d.run),
        ]),
    );
}

function torqueSpeedSection(): string {
    const series = torqueSpeedSeries();
    if (series.length === 0) return "## Torque-speed\n\nNo torque-speed runs yet.";
    const rows = series.flatMap((s) =>
        s.points.map((p) => [
            actuatorLink(s.actuatorId),
            fmt(p.rpm),
            fmt(p.torqueNm),
            p.efficiency === undefined ? "" : `${fmt(p.efficiency * 100)}%`,
            `${s.run.rig.busV ?? "n/a"}`,
            sourceLink(s.run),
        ]),
    );
    return `## Torque-speed

Measured points; a single 0 rpm point is a stall test, not a curve.

${mdTable(["Actuator", "rpm", "Torque Nm", "Efficiency", "Bus V", "Run"], rows)}`;
}

function thermalSection(): string {
    const rows = thermalSeries().flatMap((s) =>
        s.points.map((p) => [
            actuatorLink(s.actuatorId),
            fmt(p.torqueNm),
            holdLabel(p.tToLimitS),
            p.windingRiseC === undefined ? "not reported" : `${fmt(p.windingRiseC)} C`,
            `${s.run.rig.ambientC ?? "n/a"}`,
            sourceLink(s.run),
        ]),
    );
    return `## Thermal derating

How long each torque was held before the thermal limit. "continuous" means held without reaching it.

${mdTable(["Actuator", "Torque Nm", "Time to limit", "Winding rise", "Ambient C", "Run"], rows)}`;
}

function leaderboardSection(): string {
    const board = measuredLeaderboard();
    const ranked = new Set(board.map((r) => r.actuator.id));
    const unranked = measuredActuators().filter((a) => !ranked.has(a.id));
    const table = mdTable(
        ["Rank", "Actuator", "Continuous Nm", "Mass kg", "Nm/kg", "Run"],
        board.map((r, i) => [
            `${i + 1}`,
            actuatorLink(r.actuator.id),
            fmt(r.continuousTorqueNm),
            fmt(r.massKg),
            fmt(r.densityNmPerKg),
            sourceLink(r.run),
        ]),
    );
    const rest =
        unranked.length > 0
            ? `\n\nNot ranked yet (no measured continuous hold): ${unranked.map((a) => mdLink(a.name, absoluteUrl(actuatorPath(a.id)))).join(", ")}.`
            : "";
    return `## Measured leaderboard

Ranked by measured continuous torque per kg of actuator. Short holds do not count.

${table}${rest}`;
}

function runRow(run: BenchmarkRun): string[] {
    return [
        actuatorLink(run.actuatorId),
        ORIGIN_LABEL[run.origin],
        INDEPENDENCE_LABEL[run.independence],
        run.date,
        mdText(measuredSummary(run)),
        mdText(describeRig(run)),
        sourceLink(run),
    ];
}

const RUN_HEADERS = [
    "Actuator",
    "Origin",
    "Independence",
    "Date",
    "Measured",
    "Rig",
    "Source",
];

function runNote(r: BenchmarkRun): string {
    const notes = r.notes ? ` ${mdText(r.notes)}` : "";
    return `${actuatorLink(r.actuatorId)}, ${sourceLink(r)}: ${INDEPENDENCE_LABEL[r.independence]} (${mdText(r.independenceNote)}).${notes}`;
}

function runsSection(): string {
    return `## All runs

${mdTable(RUN_HEADERS, BENCHMARK_RUNS.map(runRow))}

${bullets(BENCHMARK_RUNS.map(runNote))}`;
}

export function benchmarksBody(): string {
    const n = measuredActuators().length;
    return `# ${TITLE}

This page lists ${BENCHMARK_RUNS.length} measured runs on ${n} catalog actuators and sets each against the datasheet. Origin: **Published** (a paper, vendor test report or reviewer test, linked), **Lab** (run by the maintainers) and **Community** (submitted by pull request under the test protocol and reviewed). Independence: **Vendor** (the maker's own test), **Vendor-affiliated** (run by a company that sells products built on the actuator) and **Independent**.

## Datasheet vs measured

Only independent runs get a verdict. Vendor rows read "Maker-reported" and vendor-affiliated rows "Affiliated test", with no verdict. For a typical datasheet value, within 10% is a match; for a maximum ("or less") the result is within spec or over limit. For backlash and repeatability, lower is better.

${deltaTable()}

${torqueSpeedSection()}

${thermalSection()}

${leaderboardSection()}

${runsSection()}

## Submit a run

${bullets([
    `Test protocol (rig, procedures, uncertainty): ${PROTOCOL_URL}`,
    `How to submit by pull request: ${SUBMIT_URL}`,
    `JSON: ${absoluteUrl("/api/v1/benchmarks")}; MCP tool get_benchmarks`,
])}`;
}

// The "Measured" section of an actuator's markdown twin, when runs exist.
export function measuredSection(actuatorId: string): string | undefined {
    const runs = runsFor(actuatorId);
    if (runs.length === 0) return undefined;
    const deltas = datasheetDeltas(actuatorId);
    return `## Measured

${mdTable(
    RUN_HEADERS.slice(1),
    runs.map((r) => runRow(r).slice(1)),
)}
${deltas.length > 0 ? `\n${deltaTable(actuatorId)}\n` : ""}
All runs: ${absoluteUrl(BENCHMARKS_PATH)}`;
}
