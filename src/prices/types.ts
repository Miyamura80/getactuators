// /prices: dated list prices per catalog actuator. Points come from three
// places: the curated /trends sample (archived pages, papers, forums), the
// catalog's current price, and data/prices/history.json, which the weekly
// snapshot workflow and the Wayback back-fill append to.

export const PRICE_METHODS = [
    "jsonld",
    "shopify",
    "woocommerce",
    "selector",
    "wayback",
    "manual",
] as const;
export type PriceMethod = (typeof PRICE_METHODS)[number];

export const METHOD_LABEL: Record<PriceMethod, string> = {
    jsonld: "Product JSON-LD",
    shopify: "Shopify product JSON",
    woocommerce: "WooCommerce Store API",
    selector: "Page price element",
    wayback: "Wayback Machine snapshot",
    manual: "Curated",
};

// One record in data/prices/history.json, as the snapshot scripts write it.
export interface PriceRecord {
    actuatorId: string;
    // YYYY-MM-DD the page was read (the capture day for Wayback points).
    // Only curated /trends points (PricePoint) may be YYYY-MM.
    date: string;
    // Listed price in US dollars: originalPrice x fxRate, rounded to cents.
    priceUsd: number;
    // ISO 4217 code the page listed the price in.
    currency: string;
    originalPrice: number;
    // US dollars per unit of currency on that day (1 for USD).
    fxRate: number;
    // Page the price was read from (the archived URL for Wayback points).
    url: string;
    method: PriceMethod;
    // The page showed the item as out of stock. The listed price is kept but
    // flagged points are left out of fits and the index.
    outOfStock?: boolean;
    // Variant title picked when the page lists several.
    variant?: string;
    note?: string;
}

// A record's identity in history.json: one point per actuator, day and
// method. The merge and the audit both use it.
export const pointKey = (r: Pick<PriceRecord, "actuatorId" | "date" | "method">) =>
    `${r.actuatorId}@${r.date}/${r.method}`;

export interface HistoryFile {
    // Written by scripts/price-snapshot; edit by hand only to remove a point.
    points: PriceRecord[];
}

// A point as the page, API and twin read it: a record plus where it came
// from and the torque of the unit priced.
export interface PricePoint extends PriceRecord {
    // Source ids: keys of the /trends registry, "catalog:<id>" for the
    // catalog price, or "url:<url>" for a snapshot of a product page.
    sources: string[];
    // Peak torque of the unit priced (N·m); null when unknown.
    torqueNm: number | null;
    usdPerNm: number | null;
    // Price range when the source gives one (low, high).
    range?: readonly [number, number];
}
