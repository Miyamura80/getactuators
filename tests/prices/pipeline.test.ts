import { describe, expect, test } from "bun:test";
import { fxFromUsdRates } from "../../scripts/price-snapshot/currency";
import { readPage } from "../../scripts/price-snapshot/extract";
import {
    PoliteFetcher,
    RobotsDenied,
    USER_AGENT,
} from "../../scripts/price-snapshot/fetch";
import { lastPrices, mergePoints } from "../../scripts/price-snapshot/history-file";
import { toOutcome } from "../../scripts/price-snapshot/record";
import { renderReport } from "../../scripts/price-snapshot/report";
import { parseArgs, runSnapshot } from "../../scripts/price-snapshot/snapshot";
import { OVERRIDES, type Target, targets } from "../../scripts/price-snapshot/targets";
import {
    archivedUrl,
    captureDate,
    cdxUrl,
    monthly,
    parseCdx,
    rawArchivedUrl,
    referenceAt,
    runBackfill,
} from "../../scripts/price-snapshot/wayback";
import { ACTUATORS } from "../../src/catalog";
import { pricesLicenceErrors } from "../../src/prices/licence";
import type { PriceRecord } from "../../src/prices/types";

const fixture = (name: string) => Bun.file(`tests/fixtures/prices/${name}`).text();

// A fetcher over a URL -> body map, recording what was asked. A Response
// value is returned as is (for redirects).
function fakeFetcher(pages: Record<string, string | number | (() => Response)>) {
    const seen: { url: string; ua: string | null }[] = [];
    const fetcher = new PoliteFetcher({
        delayMs: 0,
        sleep: async () => {},
        fetchImpl: async (url, init) => {
            seen.push({ url, ua: new Headers(init?.headers).get("user-agent") });
            const body = pages[url];
            if (body === undefined) return new Response("not found", { status: 404 });
            if (typeof body === "number") return new Response("", { status: body });
            if (typeof body === "function") return body();
            return new Response(body, { status: 200 });
        },
    });
    return { fetcher, seen };
}

const target = (over: Partial<Target> = {}): Target => ({
    actuatorId: "unitree-go-m8010-6",
    name: "Unitree GO-M8010-6",
    url: "https://shop.example.com/products/go1-motor",
    catalogUsd: 120,
    override: {},
    ...over,
});

const FX = fxFromUsdRates({ EUR: 0.8, GBP: 0.75, CNY: 7.2 });

describe("readPage", () => {
    test("Shopify: product JSON first, polite UA, robots.txt checked", async () => {
        const { fetcher, seen } = fakeFetcher({
            "https://shop.example.com/robots.txt": "User-agent: *\nDisallow: /cart\n",
            "https://shop.example.com/products/go1-motor":
                await fixture("shopify-product.html"),
            "https://shop.example.com/products/go1-motor.js": await fixture(
                "shopify-product.js.json",
            ),
        });
        const read = await readPage(
            fetcher,
            "https://shop.example.com/products/go1-motor",
        );
        expect(read.extraction?.method).toBe("shopify");
        expect(read.pageCurrency).toBe("USD");
        expect(seen[0]?.url).toBe("https://shop.example.com/robots.txt");
        expect(seen.every((s) => s.ua === USER_AGENT)).toBe(true);
        expect(USER_AGENT).toContain("github.com/miyamura80/getactuators");
    });

    test("WooCommerce: Store API price", async () => {
        const { fetcher } = fakeFetcher({
            "https://shop.example.co.uk/robots.txt": "",
            "https://shop.example.co.uk/product/vesc6-mk6/": await fixture(
                "woocommerce-product.html",
            ),
            "https://shop.example.co.uk/wp-json/wc/store/v1/products?slug=vesc6-mk6":
                await fixture("woocommerce-store.json"),
        });
        const read = await readPage(
            fetcher,
            "https://shop.example.co.uk/product/vesc6-mk6/",
        );
        expect(read.extraction?.method).toBe("woocommerce");
        expect(read.extraction?.offers[0]?.currency).toBe("GBP");
    });

    test("a removed product and a robots.txt block are reported, not skipped", async () => {
        const { fetcher } = fakeFetcher({
            "https://a.example.com/robots.txt": "User-agent: *\nDisallow: /private/\n",
        });
        const gone = await readPage(fetcher, "https://a.example.com/products/x");
        expect(gone.error).toBe("product removed (HTTP 404)");
        await expect(
            readPage(fetcher, "https://a.example.com/private/x"),
        ).rejects.toBeInstanceOf(RobotsDenied);
    });

    test("a 5xx robots.txt disallows the whole host", async () => {
        const { fetcher } = fakeFetcher({ "https://b.example.com/robots.txt": 503 });
        await expect(
            readPage(fetcher, "https://b.example.com/p"),
        ).rejects.toBeInstanceOf(RobotsDenied);
    });
});

describe("toOutcome", () => {
    const extraction = (price: number, currency: string | null, inStock?: boolean) => ({
        method: "jsonld" as const,
        offers: [
            {
                price,
                currency,
                title: "GO-M8010-6",
                ...(inStock === undefined ? {} : { inStock }),
            },
        ],
    });
    const base = {
        target: target(),
        pageCurrency: null,
        fx: FX,
        date: "2026-11-09",
        url: "https://shop.example.com/products/go1-motor",
        referenceUsd: 120,
    };

    test("converts to USD and stores the rate", () => {
        const out = toOutcome({ ...base, extraction: extraction(100, "EUR") });
        expect(out.kind).toBe("point");
        if (out.kind !== "point") return;
        expect(out.record).toEqual({
            actuatorId: "unitree-go-m8010-6",
            date: "2026-11-09",
            priceUsd: 125,
            currency: "EUR",
            originalPrice: 100,
            fxRate: 1.25,
            url: "https://shop.example.com/products/go1-motor",
            method: "jsonld",
        });
        expect(pricesLicenceErrors("2026-11-10", [out.record])).toEqual([]);
    });

    test("out of stock is a flag on the point", () => {
        const out = toOutcome({ ...base, extraction: extraction(120, "USD", false) });
        expect(out.kind === "point" && out.record.outOfStock).toBe(true);
    });

    test("a big move is held for review; no currency or no price is a failure", () => {
        expect(toOutcome({ ...base, extraction: extraction(400, "USD") }).kind).toBe(
            "review",
        );
        expect(toOutcome({ ...base, extraction: extraction(100, null) })).toEqual({
            kind: "failure",
            reason: "no currency on the page",
        });
        expect(
            toOutcome({
                ...base,
                extraction: null,
                error: "product removed (HTTP 404)",
            }),
        ).toEqual({
            kind: "failure",
            reason: "product removed (HTTP 404)",
        });
    });

    test("Wayback points keep the wayback method", () => {
        const out = toOutcome({
            ...base,
            extraction: extraction(120, "USD"),
            method: "wayback",
        });
        expect(out.kind === "point" && out.record.method).toBe("wayback");
    });
});

describe("history file and report", () => {
    const rec = (
        date: string,
        priceUsd: number,
        extra: Partial<PriceRecord> = {},
    ): PriceRecord => ({
        actuatorId: "robstride-04",
        date,
        priceUsd,
        currency: "USD",
        originalPrice: priceUsd,
        fxRate: 1,
        url: "https://shop.example.com/p",
        method: "jsonld",
        ...extra,
    });

    test("merges one point per actuator, day and method, sorted", () => {
        const file = mergePoints({ points: [rec("2026-11-02", 250)] }, [
            rec("2026-11-09", 255),
            rec("2026-11-02", 251),
        ]);
        expect(file.points.map((p) => [p.date, p.priceUsd])).toEqual([
            ["2026-11-02", 251],
            ["2026-11-09", 255],
        ]);
        expect(
            lastPrices({
                points: [...file.points, rec("2026-11-10", 1, { outOfStock: true })],
            }).get("robstride-04"),
        ).toBe(255);
    });

    test("the PR body lists added points, review items, failures and skips", () => {
        const md = renderReport({
            title: "Weekly price snapshot",
            date: "2026-11-09",
            added: [
                rec("2026-11-09", 255),
                rec("2026-11-09", 99, { outOfStock: true, actuatorId: "x" }),
            ],
            review: [
                {
                    record: rec("2026-11-09", 900),
                    reason: "price moved from $255 to $900",
                },
            ],
            failures: [
                {
                    actuatorId: "y",
                    url: "https://y.example.com",
                    reason: "product removed (HTTP 404)",
                },
            ],
            skipped: [{ actuatorId: "z", reason: "quote only" }],
        });
        expect(md).toContain(
            "2 points added (1 flagged out of stock), 1 held for review, 1 failure, 1 skipped.",
        );
        expect(md).toContain("### Needs review (not added)");
        expect(md).toContain("product removed (HTTP 404)");
        expect(md).toContain("| z | quote only |");
    });

    test("the audit rejects bad records", () => {
        const errors = pricesLicenceErrors("2026-11-10", [
            rec("2026-11-09", 100, { actuatorId: "nope" }),
            rec("2027-01-01", 100),
            rec("2026-11-09", 100, {
                currency: "EUR",
                fxRate: 1.1,
                originalPrice: 100,
            }),
            rec("2026-11-08", 100, { method: "guess" as PriceRecord["method"] }),
        ]);
        expect(errors.some((e) => e.includes("no catalog actuator"))).toBe(true);
        expect(errors.some((e) => e.includes("dated after"))).toBe(true);
        expect(errors.some((e) => e.includes("not originalPrice x fxRate"))).toBe(true);
        expect(errors.some((e) => e.includes('unknown method "guess"'))).toBe(true);
    });

    test("CLI args and targets", () => {
        expect(parseArgs(["--only=a,b", "--limit=3", "--dry-run"])).toEqual({
            only: ["a", "b"],
            limit: 3,
            dryRun: true,
            report: "price-snapshot-report.md",
        });
        const all = targets();
        expect(all.length).toBeGreaterThan(50);
        expect(all.every((t) => t.url.startsWith("http"))).toBe(true);
        expect(targets(["robstride-04"]).map((t) => t.actuatorId)).toEqual([
            "robstride-04",
        ]);
    });
});

describe("Wayback back-fill", () => {
    test("CDX query collapses to one capture per month", () => {
        const u = new URL(
            cdxUrl("https://www.robotis.us/dynamixel-xm430-w350-t/", "2018"),
        );
        expect(u.host).toBe("web.archive.org");
        expect(u.searchParams.get("url")).toBe(
            "www.robotis.us/dynamixel-xm430-w350-t/",
        );
        expect(u.searchParams.get("collapse")).toBe("timestamp:6");
        expect(u.searchParams.get("from")).toBe("2018");
    });

    test("parses CDX rows and keeps the first capture of each month", () => {
        const rows = parseCdx([
            ["timestamp", "original", "statuscode"],
            ["20240224040938", "https://www.robotis.us/x/", "200"],
            ["20240203000000", "https://www.robotis.us/x/", "200"],
            ["20240301120000", "http://robotis.us/x", "200"],
        ]);
        const m = monthly(rows);
        expect(m.map((r) => r.timestamp)).toEqual(["20240203000000", "20240301120000"]);
        expect(captureDate("20240203000000")).toBe("2024-02-03");
        expect(archivedUrl(m[0]!)).toBe(
            "https://web.archive.org/web/20240203000000/https://www.robotis.us/x/",
        );
        expect(rawArchivedUrl(m[0]!)).toContain("20240203000000id_/");
        expect(parseCdx([])).toEqual([]);
    });
});

describe("review fixes", () => {
    const SHOP = "https://shop.example.com/products/go1-motor";

    test("a redirect is followed hop by hop, each hop checked against robots.txt", async () => {
        const { fetcher, seen } = fakeFetcher({
            "https://a.example.com/robots.txt": "",
            "https://a.example.com/p": () =>
                new Response("", {
                    status: 301,
                    headers: { location: "https://b.example.com/private/p" },
                }),
            "https://b.example.com/robots.txt": "User-agent: *\nDisallow: /private/\n",
        });
        await expect(fetcher.get("https://a.example.com/p")).rejects.toBeInstanceOf(
            RobotsDenied,
        );
        expect(seen.map((s) => s.url)).toEqual([
            "https://a.example.com/robots.txt",
            "https://a.example.com/p",
            "https://b.example.com/robots.txt",
        ]);
    });

    test("a failing shop JSON call falls back on the page HTML", async () => {
        const { fetcher } = fakeFetcher({
            "https://shop.example.com/robots.txt": "User-agent: *\nDisallow: /*.js$\n",
            [SHOP]: await fixture("shopify-product.html"),
        });
        const read = await readPage(fetcher, SHOP);
        expect(read.extraction?.method).not.toBe("shopify");
        expect(read.extraction?.offers.length).toBeGreaterThan(0);
    });

    test("WooCommerce variations that fail to load hold the point for review", async () => {
        const base = "https://shop.example.co.uk";
        const store = JSON.parse(await fixture("woocommerce-store.json"));
        store[0].variations = [{ id: 1 }, { id: 2 }];
        const { fetcher } = fakeFetcher({
            [`${base}/robots.txt`]: "",
            [`${base}/product/vesc6-mk6/`]: await fixture("woocommerce-product.html"),
            [`${base}/wp-json/wc/store/v1/products?slug=vesc6-mk6`]:
                JSON.stringify(store),
            [`${base}/wp-json/wc/store/v1/products/1`]: JSON.stringify(store[0]),
        });
        const read = await readPage(fetcher, `${base}/product/vesc6-mk6/`);
        expect(read.extraction?.incomplete).toBe("read 1 of 2 variations");
        const out = toOutcome({
            target: target(),
            ...read,
            fx: FX,
            date: "2026-11-09",
            url: `${base}/product/vesc6-mk6/`,
            referenceUsd: null,
        });
        expect(out.kind).toBe("review");
    });

    test("one offer without a currency fails the page", () => {
        const out = toOutcome({
            target: target(),
            extraction: {
                method: "jsonld",
                offers: [
                    { price: 100, currency: "USD", title: "a" },
                    { price: 90, currency: null, title: "b" },
                ],
            },
            pageCurrency: null,
            fx: FX,
            date: "2026-11-09",
            url: SHOP,
            referenceUsd: 100,
        });
        expect(out).toEqual({ kind: "failure", reason: "no currency on the page" });
    });

    test("lastPrices breaks a same-day tie by method, not by name", () => {
        const r = (method: PriceRecord["method"], priceUsd: number): PriceRecord => ({
            actuatorId: "a",
            date: "2026-11-09",
            priceUsd,
            currency: "USD",
            originalPrice: priceUsd,
            fxRate: 1,
            url: SHOP,
            method,
        });
        const file = mergePoints({ points: [] }, [
            r("shopify", 100),
            r("selector", 80),
        ]);
        expect(lastPrices(file).get("a")).toBe(100);
    });

    test("bad --limit and unknown --only ids are errors", () => {
        expect(() => parseArgs(["--limit=abc"])).toThrow("--limit");
        expect(parseArgs(["--only="]).only).toBeUndefined();
        expect(() => targets(["no-such-actuator"])).toThrow("no-such-actuator");
    });

    test("every override names a catalog actuator", () => {
        const ids = new Set(ACTUATORS.map((a) => a.id));
        expect(Object.keys(OVERRIDES).filter((id) => !ids.has(id))).toEqual([]);
    });

    test("runSnapshot reports skips and failures without writing (dry run)", async () => {
        const { fetcher } = fakeFetcher({
            "https://www.seeedstudio.com/robots.txt": "",
        });
        OVERRIDES["unitree-go-m8010-6"] = { skip: "quote only" };
        try {
            const report = await runSnapshot(
                {
                    only: ["robstride-04", "unitree-go-m8010-6"],
                    dryRun: true,
                    report: "unused.md",
                },
                fetcher,
                FX,
            );
            expect(report.skipped).toEqual([
                { actuatorId: "unitree-go-m8010-6", reason: "quote only" },
            ]);
            expect(report.failures.map((f) => [f.actuatorId, f.reason])).toEqual([
                ["robstride-04", "product removed (HTTP 404)"],
            ]);
            expect(report.added).toEqual([]);
        } finally {
            Reflect.deleteProperty(OVERRIDES, "unitree-go-m8010-6");
        }
    });

    test("back-fill: a failed CDX call is a failure with its status", async () => {
        const { fetcher } = fakeFetcher({ "https://web.archive.org/robots.txt": "" });
        const report = await runBackfill(["--only=robstride-04", "--dry-run"], fetcher);
        expect(report.failures[0]?.reason).toContain("HTTP 404");
    });

    test("the audit rejects impossible days and a missing url without throwing", () => {
        const bad = {
            actuatorId: "robstride-04",
            date: "2026-02-31",
            priceUsd: 1,
            currency: "USD",
            originalPrice: 1,
            fxRate: 1,
            method: "manual",
        } as unknown as PriceRecord;
        const errors = pricesLicenceErrors("2026-11-10", [bad]);
        expect(errors.some((e) => e.includes("date must be YYYY-MM-DD"))).toBe(true);
        expect(errors.some((e) => e.includes("url must be http(s)"))).toBe(true);
    });

    test("back-fill reference is the known price nearest the capture", () => {
        const t = targets(["robstride-04"])[0] as Target;
        const old: PriceRecord = {
            actuatorId: t.actuatorId,
            date: "2019-01-05",
            priceUsd: 900,
            currency: "USD",
            originalPrice: 900,
            fxRate: 1,
            url: "https://web.archive.org/web/20190105/x",
            method: "wayback",
        };
        expect(referenceAt(t, "2019-02-01", [old])).toBe(900);
    });
});
