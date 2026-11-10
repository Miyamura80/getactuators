import { describe, expect, test } from "bun:test";
import {
    detectCurrency,
    fxFromUsdRates,
    parseAmount,
    toUsd,
} from "../../scripts/price-snapshot/currency";
import { extractFromHtml } from "../../scripts/price-snapshot/extract";
import { extractJsonLd } from "../../scripts/price-snapshot/extract/jsonld";
import { extractSelector } from "../../scripts/price-snapshot/extract/selector";
import {
    extractShopify,
    isShopifyPage,
    shopifyCurrency,
    shopifyJsUrl,
} from "../../scripts/price-snapshot/extract/shopify";
import {
    extractWooCommerce,
    isWooCommercePage,
    wooStoreUrl,
} from "../../scripts/price-snapshot/extract/woocommerce";
import { parseRobots } from "../../scripts/price-snapshot/robots";
import { pickOffer } from "../../scripts/price-snapshot/variant";

// Fixtures in tests/fixtures/prices are trimmed product pages written to the
// markup each platform emits (Shopify themes, WooCommerce, schema.org
// JSON-LD, microdata). Their prices are placeholders, not observed prices.

const fixture = (name: string) => Bun.file(`tests/fixtures/prices/${name}`).text();
const fixtureJson = async (name: string) =>
    JSON.parse(await fixture(name)) as Parameters<typeof extractShopify>[0];

describe("currency", () => {
    test("parses amounts with either decimal mark and thousands separators", () => {
        expect(parseAmount("$1,299.00")).toBe(1299);
        expect(parseAmount("€1.299,00")).toBe(1299);
        expect(parseAmount("US$ 229.90")).toBe(229.9);
        expect(parseAmount("1 280 ₽")).toBe(1280);
        expect(parseAmount("12,5")).toBe(12.5);
        expect(parseAmount("1,299")).toBe(1299);
        expect(parseAmount("free")).toBeNull();
    });

    test("detects currencies from symbols and codes", () => {
        expect(detectCurrency("$12")).toBe("USD");
        expect(detectCurrency("US$12")).toBe("USD");
        expect(detectCurrency("CA$12")).toBe("CAD");
        expect(detectCurrency("£12")).toBe("GBP");
        expect(detectCurrency("¥ 1.234,56")).toBe("CNY");
        expect(detectCurrency("12 EUR")).toBe("EUR");
        expect(detectCurrency("12")).toBeNull();
    });

    test("converts with the stored rate and keeps USD at 1", () => {
        const fx = fxFromUsdRates({ EUR: 0.8, CNY: 7.25 });
        expect(toUsd(100, "EUR", fx)).toEqual({ priceUsd: 125, fxRate: 1.25 });
        expect(toUsd(50, "USD", fx)).toEqual({ priceUsd: 50, fxRate: 1 });
        expect(toUsd(725, "CNY", fx)?.priceUsd).toBe(100);
        expect(toUsd(1, "XYZ", fx)).toBeNull();
    });
});

describe("Shopify", () => {
    test("reads every variant from /products/<handle>.js with the page currency", async () => {
        const html = await fixture("shopify-product.html");
        expect(isShopifyPage(html)).toBe(true);
        expect(shopifyCurrency(html)).toBe("USD");
        expect(shopifyJsUrl("https://shop.example.com/products/go1-motor")).toBe(
            "https://shop.example.com/products/go1-motor.js",
        );
        expect(shopifyJsUrl("https://shop.example.com/collections/all")).toBeNull();
        const e = extractShopify(await fixtureJson("shopify-product.js.json"), "USD");
        expect(e.method).toBe("shopify");
        expect(e.offers).toEqual([
            {
                price: 123.45,
                currency: "USD",
                title: "GO-M8010-6 Motor",
                sku: "GO-M8010-6",
                inStock: true,
            },
        ]);
    });

    test("keeps variant titles and availability", async () => {
        const e = extractShopify(await fixtureJson("shopify-variants.js.json"), "USD");
        expect(e.offers.map((o) => [o.title, o.price, o.inStock])).toEqual([
            ["AK80-9 KV100 Without driver board", 100, true],
            ["AK80-9 KV100 With driver board", 150, false],
        ]);
    });
});

describe("WooCommerce", () => {
    test("reads the Store API price in minor units and its currency", async () => {
        const html = await fixture("woocommerce-product.html");
        expect(isWooCommercePage(html)).toBe(true);
        expect(isWooCommercePage(await fixture("shopify-product.html"))).toBe(false);
        expect(wooStoreUrl("https://shop.example.co.uk/product/vesc6-mk6/")).toBe(
            "https://shop.example.co.uk/wp-json/wc/store/v1/products?slug=vesc6-mk6",
        );
        const e = extractWooCommerce(
            JSON.parse(await fixture("woocommerce-store.json")),
        );
        expect(e.offers).toEqual([
            {
                price: 99.99,
                currency: "GBP",
                title: "VESC 6 MkVI",
                sku: "VESC6-MK6",
                inStock: true,
            },
        ]);
    });
});

describe("JSON-LD", () => {
    test("reads ProductGroup variants, skips malformed blocks and flags out of stock", async () => {
        const e = extractJsonLd(await fixture("jsonld-product-group.html"));
        expect(e.method).toBe("jsonld");
        expect(e.offers.map((o) => [o.price, o.currency, o.sku, o.inStock])).toEqual([
            [111, "EUR", "CG-1", true],
            [222, "EUR", "CG-2", false],
        ]);
    });

    test("reads an AggregateOffer inside @graph", async () => {
        const e = extractJsonLd(await fixture("jsonld-graph.html"));
        expect(e.offers).toEqual([
            {
                price: 333,
                currency: "USD",
                title: "RobStride 04 Actuator",
                sku: "114993100",
            },
        ]);
    });

    test("finds nothing on a page without structured data", async () => {
        expect(extractJsonLd(await fixture("selector-plain.html")).offers).toEqual([]);
    });
});

describe("selector fallback", () => {
    test("reads microdata price and currency", async () => {
        const e = extractSelector(await fixture("selector-microdata.html"));
        expect(e.offers).toEqual([{ price: 55.5, currency: "USD" }]);
    });

    test("reads a theme price element and the availability meta", async () => {
        const e = extractSelector(await fixture("selector-plain.html"));
        expect(e.offers).toEqual([{ price: 1234.56, currency: "CNY", inStock: false }]);
    });

    test("a per-vendor selector wins", async () => {
        const html = await fixture("woocommerce-product.html");
        const e = extractSelector(html, ".product .price");
        expect(e.offers).toEqual([{ price: 99.99, currency: "GBP" }]);
    });

    test("Open Graph price metas", async () => {
        const e = extractSelector(await fixture("shopify-product.html"));
        expect(e.offers).toEqual([{ price: 123.45, currency: "USD" }]);
    });

    test("extractFromHtml prefers JSON-LD", async () => {
        expect(extractFromHtml(await fixture("jsonld-graph.html"))?.method).toBe(
            "jsonld",
        );
        expect(extractFromHtml(await fixture("selector-microdata.html"))?.method).toBe(
            "selector",
        );
        expect(extractFromHtml("<html><body>No price here</body></html>")).toBeNull();
    });
});

describe("robots.txt", () => {
    const txt = `
# comment
User-agent: *
Disallow: /checkout
Disallow: /*.json$
Allow: /products/
Crawl-delay: 2

User-agent: badbot
Disallow: /
`;
    test("applies the * group, longest match and wildcards", () => {
        const r = parseRobots(txt, "actuatorlist-price-bot/1.0");
        expect(r.allowed("/products/go1-motor")).toBe(true);
        expect(r.allowed("/checkout/step")).toBe(false);
        expect(r.allowed("/files/feed.json")).toBe(false);
        // The longer Allow beats the wildcard Disallow (RFC 9309).
        expect(r.allowed("/products/go1-motor.json")).toBe(true);
        expect(r.crawlDelayMs).toBe(2000);
    });

    test("a group for our token overrides *", () => {
        const r = parseRobots(
            `${txt}\nUser-agent: actuatorlist-price-bot\nDisallow: /products/\n`,
            "actuatorlist-price-bot/1.0",
        );
        expect(r.allowed("/products/go1-motor")).toBe(false);
        expect(r.allowed("/checkout")).toBe(true);
    });

    test("an empty file allows everything", () => {
        expect(parseRobots("", "x").allowed("/anything")).toBe(true);
    });
});

describe("variant matching", () => {
    const offers = [
        {
            price: 100,
            currency: "USD",
            title: "AK80-9 KV100 Without driver board",
            priceUsd: 100,
        },
        {
            price: 150,
            currency: "USD",
            title: "AK80-9 KV100 With driver board",
            priceUsd: 150,
        },
    ];
    test("an explicit hint picks the variant", () => {
        const p = pickOffer(offers, {
            name: "CubeMars AK80-9",
            referenceUsd: null,
            variant: "with driver",
        });
        expect(p?.offer.priceUsd).toBe(150);
        expect(p?.ambiguous).toBe(false);
    });

    test("otherwise the closest to the reference price, flagged as ambiguous", () => {
        const p = pickOffer(offers, { name: "CubeMars AK80-9", referenceUsd: 145 });
        expect(p?.offer.priceUsd).toBe(150);
        expect(p?.ambiguous).toBe(true);
    });

    test("name tokens beat price", () => {
        const p = pickOffer(
            [
                { price: 90, currency: "USD", title: "GIM6010-36", priceUsd: 90 },
                { price: 200, currency: "USD", title: "GIM6010-8", priceUsd: 200 },
            ],
            { name: "Steadywin GIM6010-8", referenceUsd: 90 },
        );
        expect(p?.offer.title).toBe("GIM6010-8");
        expect(p?.ambiguous).toBe(false);
    });
});
