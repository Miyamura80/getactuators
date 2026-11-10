import type { PriceMethod } from "../../../src/prices/types";

// One buyable offer found on a product page: a variant, a JSON-LD Offer or
// a price element. Extractors return every offer they find; variant.ts picks
// the one that matches the catalog entry.
export interface Offer {
    price: number;
    // ISO 4217; null when the page gives no currency and the caller must
    // fall back on the shop's default.
    currency: string | null;
    // Variant or offer title, for matching against the catalog name.
    title?: string;
    sku?: string;
    // False when the page marks the offer out of stock; undefined when it
    // does not say.
    inStock?: boolean;
}

export interface Extraction {
    method: PriceMethod;
    offers: Offer[];
}
