import {
    TRENDS_AS_OF,
    TRENDS_PATH,
    TREND_CHARTS,
    TREND_SECTIONS,
    TREND_SECTION_LABEL,
    type TrendChart,
    type TrendPoint,
    chartSources,
    chartsIn,
    formatValue,
    perNm,
    sourceOf,
    yearSpan,
} from "@/trends";
import { DATA_LICENSE, absoluteUrl } from "../../site";
import * as ld from "../jsonld";
import { toAbsolute } from "../jsonld";
import { bullets, mdLink, mdTable, mdText } from "../md";
import type { Page } from "../page-types";

// Markdown twin and JSON-LD of /trends: one table of dated points per chart,
// with its notes, licence and numbered sources.

const TITLE = "Trends";

function valueCell(p: TrendPoint): string {
    const v = formatValue(p.value);
    return p.range
        ? `${v} (${formatValue(p.range[0])} to ${formatValue(p.range[1])})`
        : v;
}

// One chart: points table (numbered source refs), notes, licence, sources.
export function chartMarkdown(c: TrendChart, depth = 3): string {
    const ids = chartSources(c);
    const ref = (id: string) => `[${ids.indexOf(id) + 1}]`;
    const withNm = c.id === "actuator-prices";
    const rows = c.series.flatMap((s) =>
        s.points.map((p) => [
            s.actuatorId
                ? mdLink(s.label, `/actuators/${s.actuatorId}`)
                : mdText(p.label ?? s.label),
            p.date,
            valueCell(p),
            ...(withNm
                ? [perNm(p) === null ? "n/a" : formatValue(perNm(p) as number)]
                : []),
            p.confidence,
            p.sources.map(ref).join(" "),
            mdText(p.note ?? ""),
        ]),
    );
    const [y0, y1] = yearSpan(c);
    const head = [
        "Series",
        "Date",
        `Value (${c.unit})`,
        ...(withNm ? ["$/N·m"] : []),
        "Confidence",
        "Sources",
        "Note",
    ];
    return [
        `${"#".repeat(depth)} ${mdText(c.title)}`,
        `${mdText(c.question)} ${y0 === y1 ? y0 : `${y0} to ${y1}`}, ${rows.length} points.${c.sparse ? " Too thin to read as a trend; shown as the points we have." : ""}`,
        mdTable(head, rows),
        bullets([
            ...c.series.flatMap((s) =>
                s.note ? [`${mdText(s.label)}: ${mdText(s.note)}`] : [],
            ),
            ...c.notes.map(mdText),
        ]),
        `Licence: ${mdText(c.licence)}${c.original ? ` Original: ${mdLink(c.original.label, c.original.url)}.` : ""}`,
        `Sources:\n\n${ids.map((id, i) => `${i + 1}. ${mdLink(sourceOf(id).title, toAbsolute(sourceOf(id).url))} (${sourceOf(id).reuse})`).join("\n")}`,
    ].join("\n\n");
}

function trendsBody(): string {
    const sections = TREND_SECTIONS.map(
        (s) =>
            `## ${TREND_SECTION_LABEL[s]}\n\n${chartsIn(s)
                .map((c) => chartMarkdown(c))
                .join("\n\n")}`,
    );
    return `How key actuator, robotics and AI quantities have moved over time, mostly the last decade and as far back as cited data goes (the AI comparisons reach 1892): ${TREND_CHARTS.length} charts of dated points, each with its sources, a confidence (reported, estimated or modeled) and notes on gaps. As of ${TRENDS_AS_OF}.

Weekly price snapshots for the whole catalog are planned for /prices (issue #95); this page is a curated sample. Same data as JSON: ${mdLink("/api/v1/trends", absoluteUrl("/api/v1/trends"))}, or MCP get_trends.

${sections.join("\n\n")}`;
}

function trendsDataset(): Record<string, unknown> {
    const spans = TREND_CHARTS.map(yearSpan);
    const start = Math.min(...spans.map((s) => s[0]));
    const end = Math.max(...spans.map((s) => s[1]));
    return {
        "@type": "Dataset",
        name: "actuatorlist trends: actuator, robotics and AI prices over time",
        description: `Dated, cited points: ${TREND_CHARTS.map((c) => c.title.toLowerCase()).join("; ")}.`,
        url: absoluteUrl(TRENDS_PATH),
        license: DATA_LICENSE.url,
        creditText: DATA_LICENSE.credit,
        isAccessibleForFree: true,
        temporalCoverage: `${start}/${end}`,
        variableMeasured: TREND_CHARTS.map((c) => `${c.title} (${c.unit})`),
        distribution: [
            {
                "@type": "DataDownload",
                encodingFormat: "application/json",
                contentUrl: absoluteUrl("/api/v1/trends"),
            },
        ],
    };
}

export const TRENDS_PAGE: Page = {
    path: TRENDS_PATH,
    kind: "spa",
    title: TITLE,
    description:
        "Actuator prices and $/N·m, humanoid market share, roller screw cost, the price of AI against electricity and batteries, and humanoid battery runtime over time, every point cited.",
    body: trendsBody,
    jsonLd: () => [
        ld.webPage("CollectionPage", TRENDS_PATH, TITLE),
        ld.breadcrumbs([
            { name: "Home", path: "/" },
            { name: TITLE, path: TRENDS_PATH },
        ]),
        trendsDataset(),
    ],
};
