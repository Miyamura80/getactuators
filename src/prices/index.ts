export * from "./types";
export * from "./history";
export * from "./learning-curve";
export * from "./distribution";
export * from "./metals-index";

export const PRICES_PATH = "/prices";
// Month the merged history was last rebuilt by hand; weekly snapshot PRs
// add points after it.
export const PRICES_AS_OF = "November 2026";

export const pricesUrl = (actuatorId: string): string =>
    `${PRICES_PATH}?actuator=${encodeURIComponent(actuatorId)}`;

export const priceHistoryApiPath = (actuatorId: string): string =>
    `/api/v1/prices/${encodeURIComponent(actuatorId)}`;
