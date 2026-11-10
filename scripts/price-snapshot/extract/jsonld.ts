import { parseAmount } from "../currency";
import { jsonLdBlocks } from "./html";
import type { Extraction, Offer } from "./types";

// schema.org Product / Offer structured data. Handles a bare Product, an
// array, an @graph, ProductGroup.hasVariant, offers as one Offer, an array
// or an AggregateOffer (lowPrice), and priceSpecification.

type Node = Record<string, unknown>;

const isObj = (v: unknown): v is Node =>
    typeof v === "object" && v !== null && !Array.isArray(v);
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : v == null ? [] : [v]);

function types(n: Node): string[] {
    return list(n["@type"]).map((t) =>
        String(t).replace(/^https?:\/\/schema\.org\//, ""),
    );
}

// Every node in a JSON-LD value, depth first.
function walk(v: unknown, out: Node[] = []): Node[] {
    if (Array.isArray(v)) for (const x of v) walk(x, out);
    else if (isObj(v)) {
        out.push(v);
        for (const x of Object.values(v)) if (typeof x === "object") walk(x, out);
    }
    return out;
}

function inStock(availability: unknown): boolean | undefined {
    if (typeof availability !== "string") return undefined;
    if (/OutOfStock|SoldOut|Discontinued/i.test(availability)) return false;
    if (/InStock|PreOrder|LimitedAvailability|OnlineOnly/i.test(availability))
        return true;
    return undefined;
}

function num(v: unknown): number | null {
    if (typeof v === "number") return v > 0 ? v : null;
    if (typeof v === "string") return parseAmount(v);
    return null;
}

function offerOf(o: Node, product: Node): Offer | null {
    const spec = list(o.priceSpecification).find(isObj);
    const price = num(o.price) ?? num(spec?.price) ?? num(o.lowPrice);
    if (price === null) return null;
    const currency = (o.priceCurrency ?? spec?.priceCurrency ?? null) as string | null;
    const title = [product.name, o.name].filter((x) => typeof x === "string").join(" ");
    const sku = (o.sku ?? product.sku) as string | undefined;
    return {
        price,
        currency: currency ? String(currency).toUpperCase() : null,
        ...(title ? { title } : {}),
        ...(sku ? { sku: String(sku) } : {}),
        ...(inStock(o.availability) === undefined
            ? {}
            : { inStock: inStock(o.availability) }),
    };
}

export function extractJsonLd(html: string): Extraction {
    const nodes = jsonLdBlocks(html).flatMap((b) => walk(b));
    const products = nodes.filter((n) =>
        types(n).some((t) => t === "Product" || t === "ProductGroup"),
    );
    const offers: Offer[] = [];
    for (const p of products)
        for (const o of list(p.offers).filter(isObj)) {
            const nested = list(o.offers).filter(isObj);
            for (const x of nested.length ? nested : [o]) {
                const offer = offerOf(x, p);
                if (offer) offers.push(offer);
            }
        }
    return { method: "jsonld", offers };
}
