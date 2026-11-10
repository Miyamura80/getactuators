import { getActuator } from "@/catalog";
import {
    PRICES_AS_OF,
    PRICE_METHODS,
    type PricePoint,
    historyFor,
    latestPoint,
    pricesUrl,
    seriesNote,
    yearChange,
} from "@/prices";
import { absoluteUrl } from "@/server/site";
import { SOURCE_REUSE, type SourceReuse } from "@/supply-chain/reuse";
import { sourceOf } from "@/trends";
import { z } from "zod";
import { type ApiContext, json } from "./http";
import { ApiError } from "./problem";
import { schemaRegistry } from "./schemas";

// /api/v1/prices/{actuatorId}: one actuator's dated list prices. Same wire
// shape as the MCP tool get_price_history.

const sourceOut = z.object({
    id: z.string(),
    title: z.string(),
    url: z.string(),
    reuse: z.enum(SOURCE_REUSE),
});

const pointOut = z.object({
    date: z.string().describe("YYYY-MM-DD for snapshots; YYYY-MM for curated points."),
    price_usd: z.number(),
    currency: z.string().describe("Currency the page listed the price in."),
    original_price: z.number(),
    fx_rate: z.number().describe("US dollars per unit of currency on that day."),
    url: z.string().describe("Page the price was read from."),
    method: z.enum(PRICE_METHODS),
    out_of_stock: z
        .boolean()
        .describe("Listed but out of stock; left out of fits and the index."),
    torque_nm: z.number().nullable().describe("Peak torque of the unit priced."),
    usd_per_nm: z.number().nullable(),
    range: z.tuple([z.number(), z.number()]).optional(),
    variant: z.string().optional(),
    note: z.string().optional(),
    sources: z.array(sourceOut),
});

const priceHistoryOut = z.object({
    actuator_id: z.string(),
    name: z.string(),
    brand: z.string(),
    as_of: z.string(),
    count: z.number().int(),
    latest: pointOut.nullable(),
    change_1y: z
        .object({
            from_date: z.string(),
            from_price_usd: z.number(),
            change: z
                .number()
                .describe("Latest price over the price a year earlier, minus 1."),
        })
        .nullable()
        .describe("Null without a price a year before the latest."),
    note: z
        .string()
        .optional()
        .describe("Caveat on the whole series, e.g. a change of seller or version."),
    url: z.string().describe("Per-actuator chart on /prices."),
    actuator_url: z.string(),
    points: z.array(pointOut),
});

export const PriceHistorySchema = priceHistoryOut;
schemaRegistry.add(PriceHistorySchema, { id: "PriceHistory" });

export type PriceHistoryView = z.infer<typeof priceHistoryOut>;

function sourceView(id: string): z.infer<typeof sourceOut> {
    if (id.startsWith("url:")) {
        const url = id.slice("url:".length);
        return { id, title: "Product page snapshot", url, reuse: "facts" };
    }
    const src = sourceOf(id);
    return {
        id,
        title: src.title,
        url: src.url.startsWith("/") ? absoluteUrl(src.url) : src.url,
        reuse: src.reuse as SourceReuse,
    };
}

function pointView(p: PricePoint): z.infer<typeof pointOut> {
    return {
        date: p.date,
        price_usd: p.priceUsd,
        currency: p.currency,
        original_price: p.originalPrice,
        fx_rate: p.fxRate,
        url: p.url.startsWith("/") ? absoluteUrl(p.url) : p.url,
        method: p.method,
        out_of_stock: Boolean(p.outOfStock),
        torque_nm: p.torqueNm,
        usd_per_nm: p.usdPerNm,
        ...(p.range ? { range: [p.range[0], p.range[1]] as [number, number] } : {}),
        ...(p.variant ? { variant: p.variant } : {}),
        ...(p.note ? { note: p.note } : {}),
        sources: p.sources.map(sourceView),
    };
}

export function priceHistoryResult(
    id: string,
): { view: PriceHistoryView } | { error: string } {
    const a = getActuator(id);
    if (!a) return { error: `No catalog actuator "${id}".` };
    const points = historyFor(id).map(pointView);
    const yc = yearChange(id);
    const latest = latestPoint(id);
    return {
        view: {
            actuator_id: a.id,
            name: a.name,
            brand: a.brand,
            as_of: PRICES_AS_OF,
            count: points.length,
            latest: latest ? pointView(latest) : null,
            change_1y: yc
                ? {
                      from_date: yc.from.date,
                      from_price_usd: yc.from.priceUsd,
                      change: Math.round(yc.change * 10000) / 10000,
                  }
                : null,
            ...(seriesNote(a.id) ? { note: seriesNote(a.id) } : {}),
            url: absoluteUrl(pricesUrl(a.id)),
            actuator_url: absoluteUrl(`/actuators/${encodeURIComponent(a.id)}`),
            points,
        },
    };
}

export function priceHistory({ params }: ApiContext): PriceHistoryView {
    const r = priceHistoryResult(params.id ?? "");
    if ("error" in r)
        throw new ApiError("not_found", {
            detail: r.error,
            hint: "List actuator ids with GET /api/v1/actuators.",
        });
    return r.view;
}

export const priceHistoryHandler = (ctx: ApiContext): Response =>
    json(priceHistory(ctx));
