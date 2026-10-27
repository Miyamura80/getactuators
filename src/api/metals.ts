import { getMetal } from "@/supply-chain/metals/elements";
import { getSeries } from "@/supply-chain/metals/prices";
import { METAL_STAGES } from "@/supply-chain/metals/stage-shares";
import {
    PRICE_SERIES_IDS,
    metalListOut,
    metalListView,
    metalPricesOut,
    metalPricesView,
    metalSupplyOut,
    metalSupplyView,
} from "@/supply-chain/metals/views";
import { z } from "zod";
import { type ApiContext, json } from "./http";
import { parseQuery } from "./params";
import { ApiError } from "./problem";
import { schemaRegistry } from "./schemas";

// /api/v1/metals and /api/v1/metal-prices: the /metals dataset over REST.
// Same wire shapes as the MCP tools get_metal_supply and get_metal_prices.

function named<T extends z.ZodType>(id: string, schema: T): T {
    schemaRegistry.add(schema, { id });
    return schema;
}

export const MetalListSchema = named("MetalList", metalListOut);
export const MetalSupplySchema = named("MetalSupply", metalSupplyOut);
export const MetalPricesSchema = named("MetalPrices", metalPricesOut);

const month = z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "use YYYY-MM")
    .optional();

export const MetalSupplyParams = z.object({
    stage: z
        .enum(METAL_STAGES)
        .optional()
        .describe("Only this stage: mining, separation, metal-alloy or magnet."),
});

export const MetalPriceParams = z.object({
    from: month.describe("First month, YYYY-MM."),
    to: month.describe("Last month, YYYY-MM."),
});

export function listMetalsHandler(): Response {
    return json(metalListView());
}

export function getMetalHandler({ params, url }: ApiContext): Response {
    const id = params.element ?? "";
    const metal = getMetal(id);
    if (!metal)
        throw new ApiError("not_found", {
            detail: `No metal "${id}".`,
            hint: "Use nd, pr, dy, tb, sm or co; list them with GET /api/v1/metals.",
        });
    const { stage } = parseQuery(MetalSupplyParams, url);
    return json(metalSupplyView(metal, stage));
}

export function getMetalPricesHandler({ params, url }: ApiContext): Response {
    const id = params.series ?? "";
    const series = getSeries(id);
    if (!series)
        throw new ApiError("not_found", {
            detail: `No price series "${id}".`,
            hint: `Series ids: ${PRICE_SERIES_IDS.join(", ")}.`,
        });
    const { from, to } = parseQuery(MetalPriceParams, url);
    return json(metalPricesView(series, from, to));
}
