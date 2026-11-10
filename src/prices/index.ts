export * from "./types";
export * from "./history";
export * from "./learning-curve";
export * from "./distribution";
export * from "./metals-index";

import { PRICE_POINTS } from "./history";

export const PRICES_PATH = "/prices";
// Month of the newest point, so weekly snapshot points move it forward.
export const PRICES_AS_OF = ((): string => {
    const last = PRICE_POINTS.map((p) => p.date)
        .sort()
        .at(-1);
    if (!last) return "n/a";
    const [y, m] = last.split("-").map(Number);
    return new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, 1)).toLocaleString("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    });
})();

export const pricesUrl = (actuatorId: string): string =>
    `${PRICES_PATH}?actuator=${encodeURIComponent(actuatorId)}`;

export const priceHistoryApiPath = (actuatorId: string): string =>
    `/api/v1/prices/${encodeURIComponent(actuatorId)}`;
