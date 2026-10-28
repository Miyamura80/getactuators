// Price history of catalog actuators. One observation per actuator per
// snapshot: the listed price on its product page, converted to USD with the
// day's rate (stored). Shared by the snapshot scripts, the server and the
// browser bundle, so relative imports only.

export const PRICE_METHODS = [
    "jsonld",
    "shopify",
    "woocommerce",
    "selector",
    "wayback",
    "manual",
] as const;
export type PriceMethod = (typeof PRICE_METHODS)[number];

// How each method reads a price, for the page and the markdown twin.
export const METHOD_LABEL: Record<PriceMethod, string> = {
    jsonld: "schema.org Product/Offer JSON-LD on the product page",
    shopify: "Shopify product JSON (/products/<handle>.js)",
    woocommerce: "WooCommerce Store API JSON",
    selector: "CSS selector on the product page",
    wayback: "Internet Archive snapshot, read by the same extractors",
    manual: "Price recorded in the catalog (actuators.json) at that commit",
};

export interface PriceObservation {
    actuatorId: string;
    // YYYY-MM-DD the page was read (for wayback: the snapshot's date).
    date: string;
    // Null when the page shows the product out of stock: that is a flag, not
    // a price.
    priceUsd: number | null;
    // ISO 4217 code of the listed price.
    currency: string;
    originalPrice: number | null;
    // US dollars per one unit of `currency` on `date` (1 for USD).
    fxRate: number;
    url: string;
    method: PriceMethod;
    // Present and false when the listing was out of stock.
    inStock?: boolean;
    // Variant title picked when the page lists several.
    variant?: string;
    // For wayback points: which extractor read the archived page.
    extractor?: Exclude<PriceMethod, "wayback" | "manual">;
    note?: string;
}

// A point that needs a person to confirm it before it counts (wayback reads
// where the variant or currency was ambiguous).
export interface PriceReviewItem {
    actuatorId: string;
    date: string;
    url: string;
    reason: string;
}

export interface PriceHistoryFile {
    schema: 1;
    // Date of the last run that wrote the file.
    updated: string;
    points: PriceObservation[];
    review: PriceReviewItem[];
}

// The catalog facts the analysis needs; a subset of the catalog Actuator.
export interface PricedActuator {
    id: string;
    name: string;
    brand: string;
    category: string;
    country: string | null;
    peak_torque_nm: number | null;
    price_usd: number | null;
    product_url: string | null;
}
