import {
    BENCHMARKS_PATH,
    type BenchmarkRun,
    METRICS,
    ORIGIN_LABEL,
    continuousTorque,
    datasheetDelta,
    formatRatio,
    measuredPeak,
    reportedMetrics,
    runsFor,
} from "@/benchmarks";
import { ACTUATORS, type Actuator } from "@/catalog";
import { absoluteUrl } from "../../site";
import { bullets, mdLink, mdText } from "../md";

// Markdown pieces for measured runs shared by the /benchmarks twin and the
// "## Measured" section on actuator pages. No page or JSON-LD imports, so
// catalog-md can use it without a cycle.

export const nameOf = (id: string) => ACTUATORS.find((a) => a.id === id)?.name ?? id;
export const fmt = (v: number | undefined, unit = "", digits = 3) =>
    v === undefined
        ? "n/a"
        : `${Number(v.toPrecision(digits))}${unit ? ` ${unit}` : ""}`;
export const pct = (e: number | undefined) =>
    e === undefined ? "n/a" : `${Math.round(e * 100)}%`;
export const runLink = (r: BenchmarkRun) =>
    mdLink(r.runId, absoluteUrl(`${BENCHMARKS_PATH}#run=${r.actuatorId}/${r.runId}`));
export const actuatorLink = (id: string) =>
    mdLink(nameOf(id), absoluteUrl(`/actuators/${id}`));
export const sourceCell = (r: BenchmarkRun) =>
    r.source ? mdLink(r.source.title, r.source.url) : `@${r.submitter ?? "unknown"}`;
export const badge = (r: BenchmarkRun) =>
    `${ORIGIN_LABEL[r.origin]}${r.sourceKind ? ` (${r.sourceKind})` : ""}${r.otherRevision ? ", other revision" : ""}`;

const metricLine = (r: BenchmarkRun) =>
    reportedMetrics(r)
        .filter((k) => k !== "torqueSpeed" && k !== "thermal")
        .map((k) => {
            const v = r[k] as number;
            return `${METRICS[k].label} ${fmt(v, METRICS[k].unit)} (±${r.uncertainty[k]})`;
        });

// "## Measured" on an actuator's markdown page, when it has runs.
export function measuredSection(a: Actuator): string | undefined {
    const runs = runsFor(a.id);
    if (runs.length === 0) return undefined;
    const lines = runs.map((r) => {
        const d = datasheetDelta(r, a);
        const parts = [
            d.peak
                ? `peak ${fmt(d.peak.measured, "N·m")} vs ${fmt(d.peak.datasheet, "N·m")} datasheet (${formatRatio(d.peak.ratio)})`
                : undefined,
            continuousTorque(r) !== undefined
                ? `continuous ${fmt(continuousTorque(r), "N·m")}`
                : undefined,
            r.torqueSpeed?.length
                ? `T-N curve with ${r.torqueSpeed.length} points${r.rig.busV ? ` at ${r.rig.busV} V` : ""}`
                : undefined,
            ...metricLine(r),
        ].filter(Boolean);
        return `**${runLink(r)}** (${badge(r)}, ${r.date}, ${r.dataMethod}): ${mdText(parts.join("; "))}. Source: ${sourceCell(r)}.`;
    });
    const peak = Math.max(...runs.map((r) => measuredPeak(r) ?? 0));
    return `## Measured\n\n${runs.length} measured run${runs.length === 1 ? "" : "s"} on file${peak > 0 ? `, highest measured torque ${fmt(peak, "N·m")}` : ""}. See [all benchmarks](${absoluteUrl(BENCHMARKS_PATH)}).\n\n${bullets(lines)}`;
}
