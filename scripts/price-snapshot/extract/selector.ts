import { parsePrice } from "../currency";
import { attrs, metaContent, texts } from "./html";
import type { Extraction, Offer } from "./types";

// Last resort: the page's price element. Tries a per-vendor selector when the
// target has one, then Open Graph product metas, microdata, then common
// theme classes. Returns the offers of the first rule that finds a price.

const COMMON = [
    ".product .price ins .amount",
    ".product .price .amount",
    ".product-price",
    ".product__price",
    "[data-product-price]",
    ".price ins",
    ".price",
];

function availability(html: string): boolean | undefined {
    const meta =
        metaContent(html, "product:availability") ??
        metaContent(html, "og:availability");
    if (meta) return !/out|sold|discontinued|unavailable|\boos\b/i.test(meta);
    return undefined;
}

function fromText(
    values: string[],
    fallbackCurrency: string | null,
    lang: string,
): Offer[] {
    return values.flatMap((t) => {
        const p = parsePrice(t, lang);
        if (!p) return [];
        const currency = p.currency ?? fallbackCurrency;
        return [
            {
                price: p.amount,
                currency,
                ...(!currency && p.hint ? { currencyHint: p.hint } : {}),
            },
        ];
    });
}

export function extractSelector(html: string, selector?: string): Extraction {
    const stock = availability(html);
    const withStock = (offers: Offer[]): Extraction => ({
        method: "selector",
        offers: offers.map((o) => (stock === undefined ? o : { ...o, inStock: stock })),
    });
    const lang = attrs(html, "html", "lang")[0] ?? "";
    const metaCurrency =
        (
            metaContent(html, "product:price:currency") ??
            metaContent(html, "og:price:currency") ??
            attrs(html, '[itemprop="priceCurrency"]', "content")[0]
        )
            ?.trim()
            .toUpperCase() || null;
    if (selector) {
        const found = fromText(texts(html, selector), metaCurrency, lang);
        if (found.length) return withStock(found);
    }
    const metaAmount =
        metaContent(html, "product:price:amount") ??
        metaContent(html, "og:price:amount");
    if (metaAmount) {
        const found = fromText([metaAmount], metaCurrency, lang);
        if (found.length) return withStock(found);
    }
    const micro = [
        ...attrs(html, '[itemprop="price"]', "content"),
        ...texts(html, '[itemprop="price"]:not([content])'),
    ];
    const microOffers = fromText(micro, metaCurrency, lang);
    if (microOffers.length) return withStock(microOffers);
    for (const sel of COMMON) {
        const found = fromText(texts(html, sel), metaCurrency, lang);
        if (found.length) return withStock(found.slice(0, 1));
    }
    return { method: "selector", offers: [] };
}
