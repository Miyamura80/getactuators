import { getActuator } from "@/catalog";
import { PRICES_PATH } from "@/prices";
import { priceHistoryOut, priceHistoryView } from "@/prices/views";
import { absoluteUrl } from "@/server/site";
import { type ApiContext, json } from "./http";
import { ApiError } from "./problem";
import { schemaRegistry } from "./schemas";

// /api/v1/prices/{actuatorId}: one actuator's price history, the same wire
// shape as the MCP tool get_price_history.

schemaRegistry.add(priceHistoryOut, { id: "PriceHistory" });
export const PriceHistorySchema = priceHistoryOut;

export const pricePageUrl = (id: string) =>
    absoluteUrl(`${PRICES_PATH}?actuator=${encodeURIComponent(id)}`);

export function getPriceHistoryHandler({ params }: ApiContext): Response {
    const id = params.actuatorId ?? "";
    const a = getActuator(id);
    if (!a)
        throw new ApiError("not_found", {
            detail: `No actuator "${id}".`,
            hint: "List actuator ids with GET /api/v1/actuators.",
        });
    return json(priceHistoryView(a, pricePageUrl(a.id)));
}
