import { PriceHistorySchema, priceHistoryResult } from "@/api/prices";
import { z } from "zod";
import { actuatorIdSchema } from "../schemas";
import { ToolInputError, defineTool } from "../tool";

// /prices over MCP: one actuator's dated list prices.

const getPriceHistory = defineTool({
    name: "get_price_history",
    title: "Get an actuator's price history",
    description:
        "Dated list prices for one catalog actuator from /prices, oldest first: weekly product page snapshots, Wayback Machine snapshots, curated points and the current catalog price. Each point gives the US$ price, the currency and price the page listed, the FX rate used, the page URL, how it was read (jsonld, shopify, woocommerce, selector, wayback, manual), an out-of-stock flag, $/N·m and sources. Also returns the latest price and its change over one year (null when there is no price a year earlier). Most actuators have only the current catalog price so far; quote short histories as such.",
    input: z.object({ actuator_id: actuatorIdSchema }),
    output: PriceHistorySchema,
    run: ({ actuator_id }) => {
        const r = priceHistoryResult(actuator_id);
        if ("error" in r) throw new ToolInputError(r.error);
        return r.view;
    },
});

export const priceTools = [getPriceHistory];
