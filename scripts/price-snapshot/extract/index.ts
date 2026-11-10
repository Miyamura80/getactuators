import type { PoliteFetcher } from "../fetch";
import { extractJsonLd } from "./jsonld";
import { extractSelector } from "./selector";
import {
    extractShopify,
    isShopifyPage,
    shopifyCurrency,
    shopifyJsUrl,
} from "./shopify";
import type { Extraction } from "./types";
import {
    type WooProduct,
    extractWooCommerce,
    isWooCommercePage,
    wooStoreUrl,
    wooVariationUrl,
} from "./woocommerce";

export type { Extraction, Offer } from "./types";
export { extractJsonLd, extractSelector, extractShopify, extractWooCommerce };

// Offers from a page's HTML alone (no extra requests), in the order the
// snapshot prefers them: JSON-LD, then the price element. Used for Wayback
// snapshots, where the shop's JSON endpoints were not archived.
export function extractFromHtml(html: string, selector?: string): Extraction | null {
    for (const e of [extractJsonLd(html), extractSelector(html, selector)])
        if (e.offers.length) return e;
    return null;
}

export interface PageRead {
    extraction: Extraction | null;
    // Currency the shop states for the page, for offers that give none.
    pageCurrency: string | null;
    // Why nothing was found, for the PR's failure list.
    error?: string;
}

const MAX_VARIATIONS = 12;

async function woo(fetcher: PoliteFetcher, url: string): Promise<Extraction | null> {
    const api = wooStoreUrl(url);
    if (!api) return null;
    const res = await fetcher.get(api, "application/json");
    if (!res.ok) return null;
    const products = (await res.json()) as WooProduct[];
    const variations: WooProduct[] = [];
    for (const v of (products[0]?.variations ?? []).slice(0, MAX_VARIATIONS)) {
        const r = await fetcher.get(wooVariationUrl(url, v.id), "application/json");
        if (r.ok) variations.push((await r.json()) as WooProduct);
    }
    const e = extractWooCommerce(variations.length ? variations : products);
    return e.offers.length ? e : null;
}

async function shopify(
    fetcher: PoliteFetcher,
    url: string,
    html: string,
): Promise<Extraction | null> {
    const api = shopifyJsUrl(url);
    if (!api) return null;
    const res = await fetcher.get(api, "application/json");
    if (!res.ok) return null;
    const e = extractShopify(await res.json(), shopifyCurrency(html));
    return e.offers.length ? e : null;
}

export async function readPage(
    fetcher: PoliteFetcher,
    url: string,
    selector?: string,
): Promise<PageRead> {
    const res = await fetcher.get(url);
    if (res.status === 404 || res.status === 410)
        return {
            extraction: null,
            pageCurrency: null,
            error: `product removed (HTTP ${res.status})`,
        };
    if (!res.ok)
        return { extraction: null, pageCurrency: null, error: `HTTP ${res.status}` };
    const html = await res.text();
    const pageCurrency = shopifyCurrency(html);
    if (isShopifyPage(html)) {
        const e = await shopify(fetcher, url, html);
        if (e) return { extraction: e, pageCurrency };
    }
    if (isWooCommercePage(html)) {
        const e = await woo(fetcher, url);
        if (e) return { extraction: e, pageCurrency };
    }
    const e = extractFromHtml(html, selector);
    return e
        ? { extraction: e, pageCurrency }
        : { extraction: null, pageCurrency, error: "no price found (page changed?)" };
}
