import { parseAmount, parseMoney } from "./currency";
import { pickVariant } from "./variants";

// Price extractors, most reliable first: the store's own product JSON
// (Shopify, WooCommerce), schema.org Product/Offer JSON-LD, then CSS selector
// fallbacks. Each takes what was fetched and the catalog entry's name as the
// variant hint, and returns one reading or null. Pure: no network, so the
// tests run them on saved fixtures and the Wayback back-fill reuses them on
// archived pages.

export type ExtractMethod = "shopify" | "woocommerce" | "jsonld" | "selector";

export interface Reading {
    method: ExtractMethod;
    // Null when out of stock with no price shown.
    amount: number | null;
    currency: string | null;
    inStock: boolean | null;
    variant?: string;
    // Reasons a person should confirm the reading.
    doubts: string[];
}

type Json = Record<string, unknown>;
const isObj = (v: unknown): v is Json =>
    typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown) =>
    typeof v === "string" ? v : typeof v === "number" ? String(v) : "";

// Currency the page states for itself: Shopify's JS object, OpenGraph product
// meta, or an itemprop.
export function pageCurrency(html: string): string | null {
    const m =
        html.match(/Shopify\.currency\s*=\s*\{[^}]*"active"\s*:\s*"([A-Z]{3})"/) ??
        html.match(
            /<meta[^>]+property=["'](?:og|product):price:currency["'][^>]+content=["']([A-Za-z]{3})["']/i,
        ) ??
        html.match(
            /<meta[^>]+content=["']([A-Za-z]{3})["'][^>]+property=["'](?:og|product):price:currency["']/i,
        ) ??
        html.match(/itemprop=["']priceCurrency["'][^>]+content=["']([A-Za-z]{3})["']/i);
    return m?.[1]?.toUpperCase() ?? null;
}

// Shopify /products/<handle>.js: variant prices in minor units (cents) and
// an `available` flag. The .js payload has no currency, so it comes from the
// page.
export function extractShopify(
    body: unknown,
    hint: string,
    currency: string | null,
): Reading | null {
    const product = isObj(body) && isObj(body.product) ? body.product : body;
    if (!isObj(product) || !Array.isArray(product.variants)) return null;
    const variants = product.variants
        .filter(isObj)
        .map((raw) => ({ raw, title: str(raw.title) }));
    const pick = pickVariant(variants, hint);
    if (!pick) return null;
    const { raw: v, title } = pick.variant;
    // .js gives integer cents; .json gives a decimal string.
    const price = v.price;
    const amount = typeof price === "number" ? price / 100 : parseAmount(str(price));
    const doubts: string[] = [];
    if (pick.ambiguous) doubts.push(`variant ambiguous among ${variants.length}`);
    if (!currency) doubts.push("currency not stated on the page");
    const available = typeof v.available === "boolean" ? v.available : null;
    return {
        method: "shopify",
        amount,
        currency,
        inStock: available,
        ...(variants.length > 1 ? { variant: title } : {}),
        doubts,
    };
}

// WooCommerce Store API (/wp-json/wc/store/v1/products?slug=...): prices as
// minor-unit strings with the currency and its minor unit alongside.
export function extractWoo(body: unknown, hint: string): Reading | null {
    const list = Array.isArray(body) ? body.filter(isObj) : isObj(body) ? [body] : [];
    const pick = pickVariant(
        list.map((raw) => ({ raw, title: str(raw.name) })),
        hint,
    );
    const p = pick?.variant.raw;
    if (!p || !isObj(p.prices)) return null;
    const minor = Number(p.prices.currency_minor_unit ?? 2);
    const cents = Number(str(p.prices.price));
    if (!Number.isFinite(cents) || cents <= 0) return null;
    return {
        method: "woocommerce",
        amount: cents / 10 ** minor,
        currency: str(p.prices.currency_code) || null,
        inStock: typeof p.is_in_stock === "boolean" ? p.is_in_stock : null,
        doubts: pick?.ambiguous ? ["product ambiguous in Store API result"] : [],
    };
}

function jsonLdBlocks(html: string): unknown[] {
    const out: unknown[] = [];
    const re =
        /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    for (const m of html.matchAll(re)) {
        try {
            out.push(JSON.parse(m[1] ?? ""));
        } catch {
            // A malformed block is skipped; the next tier may still read the page.
        }
    }
    return out;
}

const types = (n: Json) =>
    (Array.isArray(n["@type"]) ? n["@type"] : [n["@type"]]).map(str);

function walk(node: unknown, found: Json[]): void {
    if (Array.isArray(node)) for (const n of node) walk(n, found);
    else if (isObj(node)) {
        if (types(node).some((t) => t === "Product" || t === "ProductGroup"))
            found.push(node);
        if (node["@graph"]) walk(node["@graph"], found);
        if (node.hasVariant) walk(node.hasVariant, found);
    }
}

function offerOf(product: Json): Json | null {
    const offers = product.offers;
    const list = Array.isArray(offers)
        ? offers.filter(isObj)
        : isObj(offers)
          ? [offers]
          : [];
    return list[0] ?? null;
}

const stockOf = (availability: unknown): boolean | null => {
    const a = str(availability).toLowerCase();
    if (!a) return null;
    if (/outofstock|soldout|discontinued/.test(a)) return false;
    if (/instock|preorder|backorder|limitedavailability|onlineonly/.test(a))
        return true;
    return null;
};

// schema.org Product (or ProductGroup variants) with an Offer or
// AggregateOffer.
export function extractJsonLd(html: string, hint: string): Reading | null {
    const products: Json[] = [];
    walk(jsonLdBlocks(html), products);
    const priced = products
        .map((p) => ({ p, offer: offerOf(p), title: str(p.name) }))
        .filter((x): x is { p: Json; offer: Json; title: string } => x.offer !== null);
    const pick = pickVariant(priced, hint);
    if (!pick) return null;
    const { offer, title } = pick.variant;
    const spec = isObj(offer.priceSpecification) ? offer.priceSpecification : {};
    const rawPrice = offer.price ?? offer.lowPrice ?? spec.price;
    const amount = parseAmount(str(rawPrice));
    const currency =
        str(offer.priceCurrency ?? spec.priceCurrency).toUpperCase() ||
        pageCurrency(html);
    const doubts: string[] = [];
    if (pick.ambiguous) doubts.push(`variant ambiguous among ${priced.length}`);
    if (offer.lowPrice !== undefined && offer.price === undefined)
        doubts.push("AggregateOffer lowPrice");
    if (!currency) doubts.push("currency not stated");
    return {
        method: "jsonld",
        amount,
        currency: currency || null,
        inStock: stockOf(offer.availability),
        ...(priced.length > 1 ? { variant: title } : {}),
        doubts,
    };
}

// Last tier: product price meta tags, then itemprop and common price
// elements. Text is read with Bun's HTMLRewriter.
export const PRICE_SELECTORS = [
    '[itemprop="price"]',
    ".product-price",
    ".price .amount",
    ".product__price",
    ".price",
] as const;

async function firstText(html: string, selector: string): Promise<string | null> {
    let text = "";
    let content: string | null = null;
    let inside = false;
    let done = false;
    await new HTMLRewriter()
        .on(selector, {
            element(el) {
                if (done) return;
                content = el.getAttribute("content");
                inside = true;
                el.onEndTag(() => {
                    inside = false;
                    done = true;
                });
            },
            text(t) {
                if (inside && !done) text += t.text;
            },
        })
        .transform(new Response(html))
        .text();
    const out = (content ?? text).trim();
    return out || null;
}

export async function extractSelector(html: string): Promise<Reading | null> {
    const stated = pageCurrency(html);
    const meta =
        html.match(
            /<meta[^>]+property=["'](?:og|product):price:amount["'][^>]+content=["']([^"']+)["']/i,
        ) ??
        html.match(
            /<meta[^>]+content=["']([^"']+)["'][^>]+property=["'](?:og|product):price:amount["']/i,
        );
    const raw = meta?.[1] ?? (await firstOf(html));
    if (!raw) return null;
    const money = parseMoney(raw, stated);
    if (!money) return null;
    const doubts = ["read by CSS selector"];
    if (money.ambiguous)
        doubts.push(`currency guessed from symbol (${money.currency})`);
    const soldOut = /out of stock|sold out|ausverkauft|en rupture/i.test(html);
    return {
        method: "selector",
        amount: money.amount,
        currency: money.currency,
        inStock: soldOut ? false : null,
        doubts,
    };
}

async function firstOf(html: string): Promise<string | null> {
    for (const sel of PRICE_SELECTORS) {
        const t = await firstText(html, sel);
        if (t && /\d/.test(t)) return t;
    }
    return null;
}

// True when a page looks like WooCommerce, so the Store API is worth a try.
export const isWooPage = (html: string) =>
    /woocommerce|wp-content\/plugins\/woo/i.test(html);
