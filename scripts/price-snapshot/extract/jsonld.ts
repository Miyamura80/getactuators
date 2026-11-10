import { parseAmount } from "../currency";
import { jsonLdBlocks } from "./html";
import type { Extraction, Offer } from "./types";

// schema.org Product / Offer structured data. Handles a bare Product, an
// array, an @graph, a WebPage mainEntity, ProductGroup.hasVariant, offers as
// one Offer, an array or an AggregateOffer (lowPrice), and
// priceSpecification. Only the page's own products count: products nested in
// another product (isRelatedTo, isSimilarTo, accessories) or in an ItemList
// (related and recently viewed carousels) are not read.

type Node = Record<string, unknown>;

const isObj = (v: unknown): v is Node =>
    typeof v === "object" && v !== null && !Array.isArray(v);
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : v == null ? [] : [v]);

function types(n: Node): string[] {
    return list(n["@type"]).map((t) =>
        String(t).replace(/^https?:\/\/schema\.org\//, ""),
    );
}

const isProduct = (n: Node) =>
    types(n).some((t) => t === "Product" || t === "ProductGroup");

// A product and its hasVariant children.
function withVariants(p: Node): Node[] {
    return [
        p,
        ...list(p.hasVariant).filter((x): x is Node => isObj(x) && isProduct(x)),
    ];
}

// The page's products, depth first: found anywhere outside another product
// or an ItemList.
function walk(v: unknown): Node[] {
    if (Array.isArray(v)) return v.flatMap(walk);
    if (!isObj(v)) return [];
    if (isProduct(v)) return withVariants(v);
    if (types(v).includes("ItemList")) return [];
    return Object.values(v).flatMap(walk);
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

// One offer; an offer nested in an AggregateOffer falls back on the
// aggregate's currency, name, sku and availability.
function offerOf(o: Node, product: Node, parent: Node = {}): Offer | null {
    const spec = list(o.priceSpecification).find(isObj);
    const price = num(o.price) ?? num(spec?.price) ?? num(o.lowPrice);
    if (price === null) return null;
    const currency = (o.priceCurrency ??
        spec?.priceCurrency ??
        parent.priceCurrency ??
        null) as string | null;
    const title = [product.name, o.name ?? parent.name]
        .filter((x) => typeof x === "string")
        .join(" ");
    const sku = (o.sku ?? parent.sku ?? product.sku) as string | undefined;
    const stock = inStock(o.availability ?? parent.availability);
    return {
        price,
        currency: currency ? String(currency).toUpperCase() : null,
        ...(title ? { title } : {}),
        ...(sku ? { sku: String(sku) } : {}),
        ...(stock === undefined ? {} : { inStock: stock }),
    };
}

// Offers of one product: each Offer, or each offer inside an AggregateOffer.
function productOffers(p: Node): Offer[] {
    return list(p.offers)
        .filter(isObj)
        .flatMap((o) => {
            const nested = list(o.offers).filter(isObj);
            const found = nested.length
                ? nested.map((x) => offerOf(x, p, o))
                : [offerOf(o, p)];
            return found.filter((x): x is Offer => x !== null);
        });
}

export function extractJsonLd(html: string): Extraction {
    const products = jsonLdBlocks(html).flatMap(walk);
    return { method: "jsonld", offers: products.flatMap(productOffers) };
}
