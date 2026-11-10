import { metaContent } from "./html";
import type { Extraction, Offer } from "./types";

// Shopify stores: /products/<handle>.js returns the product with every
// variant (price in cents, availability). The shop's currency is not in that
// JSON, so it is read from the product page (Shopify.currency or the
// og:price:currency meta).

export function shopifyJsUrl(pageUrl: string): string | null {
    const u = new URL(pageUrl);
    const m = /^(.*\/products\/[^/?#]+?)\/?$/.exec(u.pathname);
    if (!m) return null;
    return `${u.origin}${m[1]}.js`;
}

export function isShopifyPage(html: string): boolean {
    return /cdn\.shopify\.com|Shopify\.shop\s*=|window\.Shopify\b/.test(html);
}

export function shopifyCurrency(html: string): string | null {
    const active = /Shopify\.currency\s*=\s*\{[^}]*"active"\s*:\s*"([A-Z]{3})"/.exec(
        html,
    )?.[1];
    return active ?? metaContent(html, "og:price:currency")?.toUpperCase() ?? null;
}

interface ShopifyVariant {
    title?: string;
    public_title?: string | null;
    sku?: string | null;
    // Cents in /products/<handle>.js.
    price: number;
    available?: boolean;
}

interface ShopifyProduct {
    title?: string;
    variants?: ShopifyVariant[];
}

export function extractShopify(
    product: ShopifyProduct,
    currency: string | null,
): Extraction {
    const offers: Offer[] = (product.variants ?? [])
        .filter((v) => typeof v.price === "number" && v.price > 0)
        .map((v) => {
            const variant =
                v.public_title ?? (v.title === "Default Title" ? "" : v.title);
            return {
                price: v.price / 100,
                currency,
                title: [product.title, variant].filter(Boolean).join(" "),
                ...(v.sku ? { sku: v.sku } : {}),
                ...(typeof v.available === "boolean" ? { inStock: v.available } : {}),
            };
        });
    return { method: "shopify", offers };
}
