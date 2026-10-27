import { z } from "zod";
import { concentration, normalizeShares } from "../concentration";
import { CONFIDENCES } from "../sourced";
import { STAGE_LABEL } from "../stages";
import { refs, sourceRefOut, sourced, sourcedOut } from "../views";
import { METALS, METAL_IDS, type Metal, type MetalId } from "./elements";
import { METAL_EVENTS } from "./events";
import {
    MARKET_LABEL,
    PRICE_SERIES,
    type PriceSeries,
    pricesBetween,
    sortedPoints,
} from "./prices";
import { type ReserveCommodity, reserveTable, yearsOfSupply } from "./reserves";
import {
    METAL_STAGES,
    type MetalStage,
    STAGE_LABEL_FOR,
    stageEntry,
} from "./stage-shares";

// Wire shapes of the /metals dataset for REST and MCP: snake_case, nulls for
// unknowns, every number with its sources inline. Server side only (zod).

export const metalOut = z.object({
    id: z.enum(METAL_IDS).describe("Element id: nd, pr, dy, tb, sm or co."),
    symbol: z.string(),
    name: z.string(),
    class: z.enum(["light", "heavy", "transition"]),
    magnet: z.enum(["NdFeB", "SmCo"]),
    role: z.string().describe("What the element does in the magnet."),
    sources: z.array(sourceRefOut),
});

const stageOut = z.object({
    stage: z.enum(METAL_STAGES),
    label: z.string(),
    status: z
        .enum(["shares", "gap"])
        .describe("`gap` when no public source splits this stage by country."),
    shares: z
        .array(z.object({ country: z.string(), share: z.number() }))
        .describe("Named countries as fractions of world output, largest first."),
    other_share: z.number().nullable().describe("Unattributed remainder."),
    top_country: z.string().nullable(),
    top_share: z.number().nullable(),
    hhi: z
        .number()
        .nullable()
        .describe("Herfindahl-Hirschman index over named countries, 0 to 10,000."),
    as_of: z.string().nullable(),
    confidence: z.enum(CONFIDENCES).nullable(),
    note: z.string().nullable().describe("Method, or what is known for a gap."),
    sources: z.array(sourceRefOut),
});

const reserveRowOut = z.object({
    country: z.string().describe("ISO 3166 alpha-2 code, or `other`."),
    production_2024: sourcedOut.nullable(),
    production_2025: sourcedOut,
    reserves: sourcedOut.nullable().describe("Null where USGS reports NA."),
    years_of_supply: sourcedOut
        .nullable()
        .describe("Reserves over 2025 mine production, at the current rate."),
});

const reservesOut = z.object({
    commodity: z.enum(["ree", "co"]),
    label: z.string(),
    basis: z.string().describe("`t REO` (rare earth oxide) or `t Co content`."),
    rows: z.array(reserveRowOut),
    world_production_2025: sourcedOut,
    world_reserves: sourcedOut,
});

const priceSeriesOut = z.object({
    id: z.string(),
    label: z.string(),
    element: z.string(),
    form: z.enum(["oxide", "metal", "alloy"]),
    market: z.enum(["cn-domestic", "fob-china", "lme"]),
    market_label: z.string(),
    unit: z.literal("USD/kg"),
});

const pricePointOut = z.object({
    date: z.string().describe("YYYY for an annual average, YYYY-MM-DD for a reading."),
    basis: z.enum(["annual-average", "year-end", "spot"]),
    price: sourcedOut,
});

const latestPriceOut = priceSeriesOut.extend({ latest: pricePointOut });

export const metalSupplyOut = z.object({
    metal: metalOut,
    stages: z.array(stageOut),
    reserves: reservesOut.describe(
        "Rare earths are reported together (REO); cobalt on its own.",
    ),
    prices: z.array(latestPriceOut).describe("Latest point of every price series."),
});

export const metalListOut = z.object({
    data: z.array(
        metalOut.extend({
            stages: z.array(
                stageOut.pick({ stage: true, top_country: true, top_share: true }),
            ),
        }),
    ),
});

const eventOut = z.object({
    id: z.string(),
    date: z.string(),
    title: z.string(),
    detail: z.string(),
    kind: z.enum(["policy", "supply", "market", "floor"]),
    elements: z.array(z.string()),
    sources: z.array(sourceRefOut),
});

export const metalPricesOut = z.object({
    series: priceSeriesOut,
    points: z.array(pricePointOut),
    events: z.array(eventOut).describe("Events that touched this element."),
});

export const PRICE_SERIES_IDS = PRICE_SERIES.map((s) => s.id) as [string, ...string[]];

function metalView(m: Metal): z.input<typeof metalOut> {
    return {
        id: m.id,
        symbol: m.symbol,
        name: m.name,
        class: m.class,
        magnet: m.magnet,
        role: m.role,
        sources: refs(m.sources),
    };
}

function stageView(metal: MetalId, stage: MetalStage): z.input<typeof stageOut> {
    const e = stageEntry(metal, stage);
    const label = STAGE_LABEL_FOR[metal][stage] ?? STAGE_LABEL[stage];
    if (e.kind === "gap")
        return {
            stage,
            label,
            status: "gap",
            shares: [],
            other_share: null,
            top_country: null,
            top_share: null,
            hhi: null,
            as_of: null,
            confidence: null,
            note: e.text,
            sources: refs(e.sources),
        };
    const s = e.shares;
    const n = normalizeShares(s.value);
    const c = concentration(s.value);
    return {
        stage,
        label,
        status: "shares",
        shares: n.countries.map((x) => ({ country: x.country, share: x.share })),
        other_share: n.other,
        top_country: c?.top.country ?? null,
        top_share: c?.top.share ?? null,
        hhi: c?.hhi ?? null,
        as_of: s.asOf,
        confidence: s.confidence,
        note: s.note ?? null,
        sources: refs(s.sources),
    };
}

function seriesView(s: PriceSeries): z.input<typeof priceSeriesOut> {
    return {
        id: s.id,
        label: s.label,
        element: s.element,
        form: s.form,
        market: s.market,
        market_label: MARKET_LABEL[s.market],
        unit: s.unit,
    };
}

const commodityOf = (m: MetalId): ReserveCommodity => (m === "co" ? "co" : "ree");

const relatesTo = (m: MetalId, element: PriceSeries["element"]) =>
    element === m || (element === "ndpr" && (m === "nd" || m === "pr"));

export function metalSupplyView(
    metal: Metal,
    stage?: MetalStage,
): z.input<typeof metalSupplyOut> {
    const t = reserveTable(commodityOf(metal.id));
    return {
        metal: metalView(metal),
        stages: (stage ? [stage] : [...METAL_STAGES]).map((st) =>
            stageView(metal.id, st),
        ),
        reserves: {
            commodity: t.commodity,
            label: t.label,
            basis: t.basis,
            rows: t.rows.map((r) => ({
                country: r.country,
                production_2024: sourced(r.production2024),
                production_2025: sourcedOrThrow(r.production2025),
                reserves: sourced(r.reserves),
                years_of_supply: sourced(yearsOfSupply(r) ?? undefined),
            })),
            world_production_2025: sourcedOrThrow(t.world.production2025),
            world_reserves: sourcedOrThrow(t.world.reserves),
        },
        prices: PRICE_SERIES.filter((s) => relatesTo(metal.id, s.element)).flatMap(
            (s) => {
                const p = sortedPoints(s).at(-1);
                return p ? [{ ...seriesView(s), latest: pointView(p) }] : [];
            },
        ),
    };
}

function sourcedOrThrow(s: Parameters<typeof sourced>[0]) {
    const out = sourced(s);
    if (!out) throw new Error("missing sourced value");
    return out;
}

function pointView(p: PriceSeries["points"][number]): z.input<typeof pricePointOut> {
    return { date: p.date, basis: p.basis, price: sourcedOrThrow(p.value) };
}

export function metalListView(): z.input<typeof metalListOut> {
    return {
        data: METALS.map((m) => ({
            ...metalView(m),
            stages: METAL_STAGES.map((st) => {
                const v = stageView(m.id, st);
                return {
                    stage: v.stage,
                    top_country: v.top_country,
                    top_share: v.top_share,
                };
            }),
        })),
    };
}

export function metalPricesView(
    s: PriceSeries,
    from?: string,
    to?: string,
): z.input<typeof metalPricesOut> {
    const touches = (els: readonly string[]) =>
        s.element === "ndpr"
            ? els.includes("nd") || els.includes("pr")
            : els.includes(s.element);
    return {
        series: seriesView(s),
        points: pricesBetween(s, from, to).map(pointView),
        events: METAL_EVENTS.filter((e) => touches(e.elements)).map((e) => ({
            id: e.id,
            date: e.date,
            title: e.title,
            detail: e.detail,
            kind: e.kind,
            elements: e.elements,
            sources: refs(e.sources),
        })),
    };
}
