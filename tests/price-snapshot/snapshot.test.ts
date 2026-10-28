import { describe, expect, test } from "bun:test";
import { parseAmount, parseMoney } from "../../scripts/price-snapshot/currency";
import {
    extractJsonLd,
    extractSelector,
    extractShopify,
    extractWoo,
    pageCurrency,
} from "../../scripts/price-snapshot/extract";
import type { FetchText } from "../../scripts/price-snapshot/fetcher";
import { robotsAllows, robotsRules } from "../../scripts/price-snapshot/fetcher";
import { readProduct } from "../../scripts/price-snapshot/read";
import { latestPriced, reportMarkdown } from "../../scripts/price-snapshot/report";
import { seedPoints } from "../../scripts/price-snapshot/seed-catalog";
import { pickVariant } from "../../scripts/price-snapshot/variants";
import {
    backfillOne,
    monthly,
    parseCdx,
    reviewReason,
} from "../../scripts/price-snapshot/wayback";
import { mergePoints } from "../../src/prices/merge";
import type { PriceObservation, PricedActuator } from "../../src/prices/types";

// Fixtures are hand-made pages in each platform's format (Shopify .js,
// WooCommerce Store API, schema.org JSON-LD, plain markup); the products and
// prices in them are fictional.
const fixture = (name: string) =>
    Bun.file(`${import.meta.dir}/fixtures/${name}`).text();

const actuator = (over: Partial<PricedActuator> = {}): PricedActuator => ({
    id: "example-joint-48v",
    name: "Example Joint Module 48V 2EC",
    brand: "Example",
    category: "integrated_joint",
    country: "China",
    peak_torque_nm: 40,
    price_usd: 219,
    product_url: "https://shop.example.com/products/example-joint-module",
    ...over,
});

const fxFixed = async (c: string) => ({ USD: 1, EUR: 1.08, GBP: 1.27 })[c] ?? null;

function fakeFetch(routes: Record<string, [number, string]>): FetchText {
    return async (url) => {
        const hit = routes[url];
        return hit ? { status: hit[0], text: hit[1], contentType: "" } : null;
    };
}

describe("currency", () => {
    test("parses both decimal conventions and thousands separators", () => {
        expect(parseAmount("$1,299.00")).toBe(1299);
        expect(parseAmount("1.234,50 €")).toBe(1234.5);
        expect(parseAmount("129.2")).toBe(129.2);
        expect(parseAmount("¥12,800")).toBe(12800);
        expect(parseAmount("free")).toBeNull();
    });
    test("detects codes, flags shared symbols and prefers the page currency", () => {
        expect(parseMoney("€329")).toEqual({
            amount: 329,
            currency: "EUR",
            ambiguous: false,
        });
        expect(parseMoney("US$ 99")).toEqual({
            amount: 99,
            currency: "USD",
            ambiguous: false,
        });
        expect(parseMoney("$99")?.ambiguous).toBe(true);
        expect(parseMoney("$99", "CAD")).toEqual({
            amount: 99,
            currency: "CAD",
            ambiguous: false,
        });
    });
});

describe("extractors on saved pages", () => {
    test("Shopify .js: picks the variant matching the catalog name, cents to dollars", async () => {
        const body = JSON.parse(await fixture("shopify-product.js.json"));
        const html = await fixture("shopify-page.html");
        expect(pageCurrency(html)).toBe("USD");
        const r = extractShopify(
            body,
            "Example Joint Module 48V 2EC",
            pageCurrency(html),
        );
        expect(r).toMatchObject({
            method: "shopify",
            amount: 219,
            currency: "USD",
            inStock: true,
        });
        expect(r?.variant).toBe("48V / dual encoder 2EC");
        expect(r?.doubts).toEqual([]);
    });

    test("JSON-LD: walks @graph and ProductGroup variants, skips a broken block", async () => {
        const r = extractJsonLd(
            await fixture("jsonld-group.html"),
            "Example QDD Motor 9:1",
        );
        expect(r).toMatchObject({
            method: "jsonld",
            amount: 349,
            currency: "EUR",
            inStock: true,
        });
    });

    test("JSON-LD: out of stock is a flag", async () => {
        const r = extractJsonLd(
            await fixture("jsonld-out-of-stock.html"),
            "Example Servo",
        );
        expect(r).toMatchObject({ amount: 54.5, inStock: false });
    });

    test("WooCommerce Store API: minor units and currency code", async () => {
        const r = extractWoo(
            JSON.parse(await fixture("woo-store-api.json")),
            "Example Motor Controller",
        );
        expect(r).toMatchObject({
            method: "woocommerce",
            amount: 249,
            currency: "GBP",
            inStock: true,
        });
    });

    test("selector fallback reads a European-format price and says so", async () => {
        const r = await extractSelector(await fixture("selector-page.html"));
        expect(r).toMatchObject({
            method: "selector",
            amount: 1234.5,
            currency: "EUR",
        });
        expect(r?.doubts).toContain("read by CSS selector");
    });

    test("variant ties are flagged as ambiguous", () => {
        const pick = pickVariant(
            [{ title: "Black" }, { title: "White" }],
            "Example Motor",
        );
        expect(pick?.ambiguous).toBe(true);
    });
});

describe("readProduct", () => {
    const url = "https://shop.example.com/products/example-joint-module";
    test("Shopify store: one USD point with method, url and FX rate", async () => {
        const fetchText = fakeFetch({
            [url]: [200, await fixture("shopify-page.html")],
            [`${url}.js`]: [200, await fixture("shopify-product.js.json")],
        });
        const o = await readProduct(actuator(), "2026-10-28", fetchText, fxFixed);
        expect(o).toEqual({
            kind: "price",
            doubts: [],
            point: {
                actuatorId: "example-joint-48v",
                date: "2026-10-28",
                priceUsd: 219,
                currency: "USD",
                originalPrice: 219,
                fxRate: 1,
                url,
                method: "shopify",
                variant: "48V / dual encoder 2EC",
            },
        });
    });

    test("WooCommerce page goes to the Store API and converts GBP", async () => {
        const page =
            "https://controllers.example.co.uk/product/example-motor-controller/";
        const fetchText = fakeFetch({
            [page]: [200, await fixture("woo-page.html")],
            "https://controllers.example.co.uk/wp-json/wc/store/v1/products?slug=example-motor-controller":
                [200, await fixture("woo-store-api.json")],
        });
        const o = await readProduct(
            actuator({ name: "Example Motor Controller", product_url: page }),
            "2026-10-28",
            fetchText,
            fxFixed,
        );
        expect(o.kind === "price" && o.point).toMatchObject({
            priceUsd: 316.23,
            currency: "GBP",
            originalPrice: 249,
            fxRate: 1.27,
            method: "woocommerce",
        });
    });

    test("out of stock records no price", async () => {
        const page = "https://servos.example.com/example-servo.html";
        const fetchText = fakeFetch({
            [page]: [200, await fixture("jsonld-out-of-stock.html")],
        });
        const o = await readProduct(
            actuator({ product_url: page, name: "Example Servo" }),
            "2026-10-28",
            fetchText,
            fxFixed,
        );
        expect(o.kind === "price" && o.point).toMatchObject({
            priceUsd: null,
            originalPrice: null,
            inStock: false,
        });
    });

    test("failures carry a reason for the PR body", async () => {
        const gone = await readProduct(
            actuator(),
            "2026-10-28",
            fakeFetch({ [url]: [404, ""] }),
            fxFixed,
        );
        expect(gone).toMatchObject({
            kind: "failure",
            reason: "product page removed (HTTP 404)",
        });
        const blank = await readProduct(
            actuator(),
            "2026-10-28",
            fakeFetch({ [url]: [200, "<html></html>"] }),
            fxFixed,
        );
        expect(blank).toMatchObject({
            kind: "failure",
            reason: "no price found (page layout may have changed)",
        });
        const noFx = await readProduct(
            actuator({ product_url: "https://kits.example.com/kit" }),
            "2026-10-28",
            fakeFetch({
                "https://kits.example.com/kit": [
                    200,
                    await fixture("selector-page.html"),
                ],
            }),
            async () => null,
        );
        expect(noFx).toMatchObject({
            kind: "failure",
            reason: "no FX rate for EUR on 2026-10-28",
        });
    });
});

describe("robots.txt", () => {
    test("uses our group over *, with longest-match Allow", async () => {
        const rules = robotsRules(await fixture("robots.txt"));
        expect(robotsAllows(rules, "/private/x")).toBe(false);
        expect(robotsAllows(rules, "/private/ok")).toBe(true);
        expect(robotsAllows(rules, "/cart")).toBe(true);
        const star = robotsRules("User-agent: *\nDisallow: /cart\nAllow: /products/");
        expect(robotsAllows(star, "/cart/add")).toBe(false);
        expect(robotsAllows(star, "/products/x")).toBe(true);
    });
});

describe("Wayback back-fill", () => {
    test("CDX rows: 200s only, one per month", async () => {
        const snaps = parseCdx(await fixture("cdx.json"));
        expect(snaps).toHaveLength(3);
        expect(monthly(snaps).map((s) => s.timestamp)).toEqual([
            "20240105101500",
            "20240302120000",
        ]);
    });

    test("reads archived pages into wayback points and queues doubtful ones", async () => {
        const orig = "https://shop.example.com/products/example-joint-module";
        const html = await fixture("jsonld-group.html");
        const fetchText = fakeFetch({
            [`https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(orig)}&output=json&fl=timestamp,original,statuscode&filter=statuscode:200&from=2022`]:
                [200, await fixture("cdx.json")],
            [`https://web.archive.org/web/20240105101500id_/${orig}`]: [200, html],
            [`https://web.archive.org/web/20240302120000id_/${orig}`]: [404, ""],
        });
        const a = actuator({ name: "Example QDD Motor", price_usd: 100 });
        const { outcomes, review } = await backfillOne(
            a,
            [orig],
            "2022",
            fetchText,
            fxFixed,
        );
        const point = outcomes.find((o) => o.kind === "price");
        expect(point?.kind === "price" && point.point).toMatchObject({
            date: "2024-01-05",
            method: "wayback",
            extractor: "jsonld",
            currency: "EUR",
            fxRate: 1.08,
            url: `https://web.archive.org/web/20240105101500/${orig}`,
        });
        expect(outcomes.filter((o) => o.kind === "failure")).toHaveLength(1);
        // Two variants tie on the name: needs a person.
        expect(review[0]?.reason).toContain("variant ambiguous");
        expect(reviewReason([], 400, 100)).toBe("4.00x today's catalog price");
        expect(reviewReason([], 120, 100)).toBeNull();
    });
});

describe("history file and report", () => {
    const p = (
        date: string,
        priceUsd: number | null,
        method: PriceObservation["method"] = "jsonld",
    ): PriceObservation => ({
        actuatorId: "a",
        date,
        priceUsd,
        currency: "USD",
        originalPrice: priceUsd,
        fxRate: 1,
        url: "https://x.example/a",
        method,
    });

    test("merge replaces a same-day re-run and keeps order", () => {
        const file = {
            schema: 1 as const,
            updated: "2026-10-01",
            points: [p("2026-10-01", 10)],
            review: [],
        };
        const next = mergePoints(
            file,
            [p("2026-10-08", 11), p("2026-10-01", 12)],
            [],
            "2026-10-08",
        );
        expect(next.points.map((x) => [x.date, x.priceUsd])).toEqual([
            ["2026-10-01", 12],
            ["2026-10-08", 11],
        ]);
        expect(next.updated).toBe("2026-10-08");
    });

    test("PR body lists changes, failures and out of stock", () => {
        const body = reportMarkdown(
            "Price snapshot 2026-10-08",
            [
                { kind: "price", point: p("2026-10-08", 11), doubts: [] },
                {
                    kind: "price",
                    point: {
                        ...p("2026-10-08", null),
                        actuatorId: "b",
                        inStock: false,
                    },
                    doubts: [],
                },
                {
                    kind: "failure",
                    actuatorId: "c",
                    url: "https://x.example/c",
                    reason: "product page removed (HTTP 404)",
                },
            ],
            latestPriced([p("2026-10-01", 10)]),
            [],
        );
        expect(body).toContain("| a | $10.00 | $11.00 | +10.0% | jsonld |");
        expect(body).toContain(
            "| c | product page removed (HTTP 404) | https://x.example/c |",
        );
        expect(body).toContain("- b: https://x.example/a");
    });

    test("catalog seed records first prices and changes only, for current ids", () => {
        const row = (price: number | null) => ({
            id: "a",
            price_usd: price,
            product_url: "https://x.example/a",
        });
        const pts = seedPoints(
            [
                {
                    sha: "aaaaaaa1",
                    date: "2026-09-17",
                    rows: [row(10), { id: "gone", price_usd: 5, product_url: "u" }],
                },
                { sha: "bbbbbbb2", date: "2026-09-20", rows: [row(10)] },
                { sha: "ccccccc3", date: "2026-10-01", rows: [row(12)] },
            ],
            new Set(["a"]),
        );
        expect(pts.map((x) => [x.date, x.priceUsd, x.method, x.note])).toEqual([
            ["2026-09-17", 10, "manual", "catalog commit aaaaaaa"],
            ["2026-10-01", 12, "manual", "catalog commit ccccccc"],
        ]);
    });
});
