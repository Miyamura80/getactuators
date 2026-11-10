import type { Extraction, Offer } from "./types";

// WooCommerce stores: the public Store API returns a product by slug with
// its price in minor units and its currency. A variable product lists
// variation ids; the caller fetches each one (same endpoint, by id) and
// passes them in too.

export function isWooCommercePage(html: string): boolean {
    return /woocommerce/i.test(html) && /wp-content|wp-json/.test(html);
}

// /product/<slug>/ -> /wp-json/wc/store/v1/products?slug=<slug>
export function wooStoreUrl(pageUrl: string): string | null {
    const u = new URL(pageUrl);
    const slug = /\/product\/([^/?#]+)\/?$/.exec(u.pathname)?.[1];
    return slug
        ? `${u.origin}/wp-json/wc/store/v1/products?slug=${encodeURIComponent(slug)}`
        : null;
}

export const wooVariationUrl = (pageUrl: string, id: number): string =>
    `${new URL(pageUrl).origin}/wp-json/wc/store/v1/products/${id}`;

export interface WooProduct {
    id: number;
    name: string;
    sku?: string;
    prices: { price: string; currency_code: string; currency_minor_unit: number };
    is_in_stock?: boolean;
    variations?: { id: number; attributes?: { name: string; value: string }[] }[];
}

export function extractWooCommerce(products: WooProduct[]): Extraction {
    const offers: Offer[] = products.flatMap((p) => {
        const minor = Number(p.prices?.price);
        if (!Number.isFinite(minor) || minor <= 0) return [];
        return [
            {
                price: minor / 10 ** (p.prices.currency_minor_unit ?? 2),
                currency: p.prices.currency_code?.toUpperCase() ?? null,
                title: p.name,
                ...(p.sku ? { sku: p.sku } : {}),
                ...(typeof p.is_in_stock === "boolean"
                    ? { inStock: p.is_in_stock }
                    : {}),
            },
        ];
    });
    return { method: "woocommerce", offers };
}
