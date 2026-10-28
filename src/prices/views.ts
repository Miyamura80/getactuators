import { z } from "zod";
import { historyOf, summarize } from "./history";
import { PRICE_METHODS, type PricedActuator } from "./types";

// Wire shape of one actuator's price history for REST and MCP: snake_case,
// nulls for unknowns, every point with its method, source URL and FX rate.
// Server side only (zod).

const pointOut = z.object({
    date: z.string().describe("YYYY-MM-DD the page was read."),
    price_usd: z
        .number()
        .nullable()
        .describe("Listed price in USD; null when out of stock."),
    currency: z.string().describe("ISO 4217 code of the listed price."),
    original_price: z.number().nullable().describe("Price in the listed currency."),
    fx_rate: z
        .number()
        .describe("USD per unit of currency on that date (ECB reference rate)."),
    url: z
        .string()
        .describe("Page the price was read from (an archive URL for wayback)."),
    method: z.enum(PRICE_METHODS),
    in_stock: z
        .boolean()
        .nullable()
        .describe("false when the listing was out of stock."),
    variant: z
        .string()
        .nullable()
        .describe("Variant picked when the page lists several."),
    note: z.string().nullable(),
});

export const priceHistoryOut = z.object({
    actuator_id: z.string(),
    name: z.string(),
    brand: z.string(),
    peak_torque_nm: z.number().nullable(),
    latest_price_usd: z.number().nullable(),
    latest_date: z.string().nullable(),
    usd_per_nm: z.number().nullable().describe("Latest price over peak torque."),
    year_change: z
        .number()
        .nullable()
        .describe(
            "Fractional change over the year before the latest point; null under a year of history.",
        ),
    out_of_stock: z.boolean(),
    page_url: z.string().describe("Per-actuator chart on actuatorlist.com/prices."),
    points: z.array(pointOut),
});

export type PriceHistoryView = z.infer<typeof priceHistoryOut>;

export function priceHistoryView(a: PricedActuator, pageUrl: string): PriceHistoryView {
    const s = summarize(a.id);
    const latest = s.latest;
    return {
        actuator_id: a.id,
        name: a.name,
        brand: a.brand,
        peak_torque_nm: a.peak_torque_nm,
        latest_price_usd: latest?.priceUsd ?? null,
        latest_date: latest?.date ?? null,
        usd_per_nm:
            latest && a.peak_torque_nm
                ? Math.round((latest.priceUsd / a.peak_torque_nm) * 1000) / 1000
                : null,
        year_change: s.yearChange,
        out_of_stock: s.outOfStock,
        page_url: pageUrl,
        points: historyOf(a.id).map((p) => ({
            date: p.date,
            price_usd: p.priceUsd,
            currency: p.currency,
            original_price: p.originalPrice,
            fx_rate: p.fxRate,
            url: p.url,
            method: p.method,
            in_stock: p.inStock ?? null,
            variant: p.variant ?? null,
            note: p.note ?? null,
        })),
    };
}
