import type { PriceObservation, PricedActuator } from "../../src/prices/types";
import {
    type Reading,
    extractJsonLd,
    extractSelector,
    extractShopify,
    extractWoo,
    isWooPage,
    pageCurrency,
} from "./extract";
import type { FetchText } from "./fetcher";

// One product page -> one price observation, or a failure with a reason the
// bot PR lists. The fetcher and FX lookup are injected so tests run on saved
// fixtures.

export type FxLookup = (currency: string, date: string) => Promise<number | null>;

export type Outcome =
    | { kind: "price"; point: PriceObservation; doubts: string[] }
    | { kind: "failure"; actuatorId: string; url: string; reason: string };

const fail = (a: PricedActuator, url: string, reason: string): Outcome => ({
    kind: "failure",
    actuatorId: a.id,
    url,
    reason,
});

const round2 = (n: number) => Math.round(n * 100) / 100;
const hintOf = (a: PricedActuator) => `${a.name} ${a.id}`;

function httpFailure(status: number): string {
    if (status === 999) return "blocked by robots.txt";
    if (status === 404 || status === 410)
        return `product page removed (HTTP ${status})`;
    return `HTTP ${status}`;
}

// Shopify answers /products/<handle>.js with the product's variants.
function shopifyJsUrl(url: string): string | null {
    const u = new URL(url);
    const path = u.pathname.replace(/\/$/, "");
    return /\/products\/[^/]+$/.test(path) ? `${u.origin}${path}.js` : null;
}

function wooApiUrl(url: string): string {
    const u = new URL(url);
    const slug = u.pathname.replace(/\/$/, "").split("/").at(-1) ?? "";
    return `${u.origin}/wp-json/wc/store/v1/products?slug=${encodeURIComponent(slug)}`;
}

function json(text: string): unknown {
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

const usable = (r: Reading | null): r is Reading =>
    r !== null && (r.amount !== null || r.inStock === false);

// The tiers in order on a live page.
async function readLive(
    a: PricedActuator,
    url: string,
    html: string,
    fetchText: FetchText,
): Promise<Reading | null> {
    const js = shopifyJsUrl(url);
    if (js) {
        const res = await fetchText(js, "application/json");
        const r =
            res?.status === 200
                ? extractShopify(json(res.text), hintOf(a), pageCurrency(html))
                : null;
        if (usable(r)) return r;
    }
    const ld = extractJsonLd(html, hintOf(a));
    if (usable(ld)) return ld;
    if (isWooPage(html)) {
        const res = await fetchText(wooApiUrl(url), "application/json");
        const r = res?.status === 200 ? extractWoo(json(res.text), hintOf(a)) : null;
        if (usable(r)) return r;
    }
    const sel = await extractSelector(html);
    return usable(sel) ? sel : null;
}

// Archived pages: only what is in the HTML itself.
export async function readArchivedHtml(
    a: PricedActuator,
    html: string,
): Promise<Reading | null> {
    const ld = extractJsonLd(html, hintOf(a));
    if (usable(ld)) return ld;
    const sel = await extractSelector(html);
    return usable(sel) ? sel : null;
}

export async function toObservation(
    a: PricedActuator,
    reading: Reading,
    date: string,
    url: string,
    fx: FxLookup,
    archived: boolean,
): Promise<Outcome> {
    if (!reading.currency) return fail(a, url, "currency not detected");
    const rate = await fx(reading.currency, date);
    if (rate === null)
        return fail(a, url, `no FX rate for ${reading.currency} on ${date}`);
    const out = reading.inStock === false;
    const point: PriceObservation = {
        actuatorId: a.id,
        date,
        priceUsd: out || reading.amount === null ? null : round2(reading.amount * rate),
        currency: reading.currency,
        originalPrice: out ? null : reading.amount,
        fxRate: rate,
        url,
        method: archived ? "wayback" : reading.method,
        ...(out ? { inStock: false } : {}),
        ...(reading.variant ? { variant: reading.variant } : {}),
        ...(archived ? { extractor: reading.method } : {}),
    };
    return { kind: "price", point, doubts: reading.doubts };
}

export async function readProduct(
    a: PricedActuator,
    date: string,
    fetchText: FetchText,
    fx: FxLookup,
): Promise<Outcome> {
    const url = a.product_url;
    if (!url) return fail(a, "", "no product_url in the catalog");
    const page = await fetchText(url);
    if (!page) return fail(a, url, "network error or timeout");
    if (page.status !== 200) return fail(a, url, httpFailure(page.status));
    const reading = await readLive(a, url, page.text, fetchText);
    if (!reading) return fail(a, url, "no price found (page layout may have changed)");
    return toObservation(a, reading, date, url, fx, false);
}
