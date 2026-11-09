import { absoluteUrl } from "@/server/site";
import { SOURCE_REUSE } from "@/supply-chain/reuse";
import {
    TRENDS_AS_OF,
    TRENDS_PATH,
    TREND_CHARTS,
    TREND_SECTIONS,
    type TrendChart,
    isEstimatedSeries,
    perNm,
    sourceOf,
    yearSpan,
} from "@/trends";
import { z } from "zod";
import { type ApiContext, json } from "./http";
import { parseQuery } from "./params";
import { ApiError } from "./problem";
import { schemaRegistry } from "./schemas";

// /api/v1/trends: the /trends charts as dated, cited points. Same wire shape
// as the MCP tool get_trends.

const CHART_IDS = TREND_CHARTS.map((c) => c.id) as [string, ...string[]];

const sourceOut = z.object({
    id: z.string(),
    title: z.string(),
    url: z.string(),
    reuse: z.enum(SOURCE_REUSE),
});

const pointOut = z.object({
    date: z.string().describe("YYYY or YYYY-MM."),
    value: z.number(),
    range: z.tuple([z.number(), z.number()]).optional(),
    torque_nm: z
        .number()
        .optional()
        .describe("Peak torque of the unit priced, actuator prices only."),
    usd_per_nm: z.number().optional(),
    label: z.string().optional(),
    confidence: z.enum(["reported", "estimated", "modeled"]),
    note: z.string().optional(),
    sources: z.array(sourceOut),
});

const chartOut = z.object({
    id: z.string(),
    section: z.enum(TREND_SECTIONS),
    title: z.string(),
    question: z.string(),
    unit: z.string(),
    kind: z.enum(["line", "scatter", "bars"]),
    log_scale: z.boolean(),
    sparse: z
        .boolean()
        .describe("True when the points are too thin to read as a trend."),
    year_span: z.tuple([z.number(), z.number()]),
    licence: z.string(),
    original: z.object({ label: z.string(), url: z.string() }).optional(),
    notes: z.array(z.string()),
    url: z.string(),
    series: z.array(
        z.object({
            id: z.string(),
            label: z.string(),
            actuator_id: z.string().optional(),
            estimated: z.boolean(),
            note: z.string().optional(),
            points: z.array(pointOut),
        }),
    ),
});

const trendListOut = z.object({
    as_of: z.string(),
    count: z.number().int(),
    results: z.array(chartOut),
});

export const TrendListSchema = trendListOut;
schemaRegistry.add(TrendListSchema, { id: "TrendList" });

export const TrendParams = z.object({
    section: z.enum(TREND_SECTIONS).optional().describe("actuators, ai or misc."),
    chart: z
        .enum(CHART_IDS)
        .optional()
        .describe(`Chart id: ${CHART_IDS.join(", ")}.`),
});

function chartView(c: TrendChart): z.infer<typeof chartOut> {
    return {
        id: c.id,
        section: c.section,
        title: c.title,
        question: c.question,
        unit: c.unit,
        kind: c.kind,
        log_scale: Boolean(c.log),
        sparse: Boolean(c.sparse),
        year_span: [...yearSpan(c)],
        licence: c.licence,
        ...(c.original ? { original: c.original } : {}),
        notes: c.notes,
        url: absoluteUrl(`${TRENDS_PATH}#${c.id}`),
        series: c.series.map((s) => ({
            id: s.id,
            label: s.label,
            ...(s.actuatorId ? { actuator_id: s.actuatorId } : {}),
            estimated: isEstimatedSeries(s),
            ...(s.note ? { note: s.note } : {}),
            points: s.points.map((p) => {
                const nm = perNm(p);
                return {
                    date: p.date,
                    value: p.value,
                    ...(p.range
                        ? { range: [p.range[0], p.range[1]] as [number, number] }
                        : {}),
                    ...(p.torqueNm ? { torque_nm: p.torqueNm } : {}),
                    ...(nm === null ? {} : { usd_per_nm: Math.round(nm * 100) / 100 }),
                    ...(p.label ? { label: p.label } : {}),
                    confidence: p.confidence,
                    ...(p.note ? { note: p.note } : {}),
                    sources: p.sources.map((id) => {
                        const src = sourceOf(id);
                        return {
                            id,
                            ...src,
                            url: src.url.startsWith("/")
                                ? absoluteUrl(src.url)
                                : src.url,
                        };
                    }),
                };
            }),
        })),
    };
}

export function trendListView(
    filter: z.infer<typeof TrendParams> = {},
): z.infer<typeof trendListOut> {
    const results = TREND_CHARTS.filter(
        (c) =>
            (!filter.section || c.section === filter.section) &&
            (!filter.chart || c.id === filter.chart),
    ).map(chartView);
    return { as_of: TRENDS_AS_OF, count: results.length, results };
}

export function trendList({ url }: ApiContext) {
    const view = trendListView(parseQuery(TrendParams, url));
    if (view.count === 0)
        throw new ApiError("not_found", {
            detail: "No chart matches this section and chart id.",
            hint: "List every chart with GET /api/v1/trends.",
        });
    return view;
}

export const listTrendsHandler = (ctx: ApiContext): Response => json(trendList(ctx));
