import { pricePageUrl } from "@/api/prices";
import { priceHistoryOut, priceHistoryView } from "@/prices/views";
import { z } from "zod";
import { actuatorIdSchema } from "../schemas";
import { defineTool } from "../tool";
import { requireActuator } from "../views";

// Recorded listed prices of one catalog actuator, from the weekly snapshot
// file. Same wire shape as GET /api/v1/prices/{actuatorId}.

const getPriceHistory = defineTool({
    name: "get_price_history",
    title: "Get actuator price history",
    description:
        "Every recorded listed price of one actuator, oldest first: USD price, original currency and FX rate, method (jsonld, shopify, woocommerce, selector, wayback or manual) and source URL per point, plus the latest price, $/Nm and the one-year change (null under a year of history). Out-of-stock reads have in_stock false and no price.",
    input: z.object({ actuatorId: actuatorIdSchema }),
    output: priceHistoryOut,
    run: ({ actuatorId }) => {
        const a = requireActuator(actuatorId);
        return priceHistoryView(a, pricePageUrl(a.id));
    },
});

export const priceTools = [getPriceHistory];
