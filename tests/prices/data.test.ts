import { describe, expect, test } from "bun:test";
import { ACTUATORS } from "@/catalog";
import {
    PRICE_POINTS,
    type PricePoint,
    actuatorsWithHistory,
    classTrends,
    groupStats,
    historyFor,
    lagCorrelations,
    metalsOverlay,
    pearson,
    priceIndex,
    quantile,
    withinFit,
    yearChange,
    yearFraction,
} from "@/prices";
import { pricesLicenceErrors } from "@/prices/licence";
import { CATALOG_PRICE_DATE, getTrendChart } from "@/trends";

const point = (
    actuatorId: string,
    date: string,
    priceUsd: number,
    torqueNm = 10,
): PricePoint => ({
    actuatorId,
    date,
    priceUsd,
    currency: "USD",
    originalPrice: priceUsd,
    fxRate: 1,
    url: "https://example.com",
    method: "manual",
    sources: [],
    torqueNm,
    usdPerNm: priceUsd / torqueNm,
});

describe("merged history", () => {
    test("every /trends price point is a history point with its sources", () => {
        const chart = getTrendChart("actuator-prices");
        const past = chart?.series.flatMap((s) =>
            s.points
                .filter((p) => !p.sources[0]?.startsWith("catalog:"))
                .map((p) => [s.actuatorId, p]),
        );
        expect(past?.length).toBeGreaterThan(5);
        for (const [id, p] of past ?? []) {
            const match = historyFor(id as string).find(
                (h) => h.date === (p as { date: string }).date,
            );
            expect(match?.sources).toEqual((p as { sources: string[] }).sources);
            expect(match?.method).toBe(
                (p as { sources: string[] }).sources.some((s) => s.startsWith("wb-"))
                    ? "wayback"
                    : "manual",
            );
        }
    });

    test("every priced catalog actuator ends on its catalog price", () => {
        for (const a of ACTUATORS.filter((x) => x.price_usd != null)) {
            const last = historyFor(a.id).at(-1);
            expect(last?.date).toBe(CATALOG_PRICE_DATE);
            expect(last?.priceUsd).toBe(a.price_usd as number);
            expect(last?.sources).toEqual([`catalog:${a.id}`]);
        }
        expect(actuatorsWithHistory().length).toBe(
            ACTUATORS.filter((a) => a.price_usd != null).length,
        );
    });

    test("every point records method, url and FX rate", () => {
        for (const p of PRICE_POINTS) {
            expect(p.url.length).toBeGreaterThan(0);
            expect(p.fxRate).toBeGreaterThan(0);
            expect(p.method).toBeTruthy();
        }
    });

    test("the committed history passes the audit", () => {
        expect(pricesLicenceErrors()).toEqual([]);
    });

    test("1-year change carries the last earlier price forward", () => {
        const yc = yearChange("dynamixel-xm430-w350-t");
        expect(yc?.from.date).toBe("2024-02");
        expect(yc?.change).toBeCloseTo(290 / 269.9 - 1, 6);
        expect(yearChange("cubemars-ak10-9")).toBeNull();
    });

    test("fractional years", () => {
        expect(yearFraction("2024")).toBe(2024.5);
        expect(yearFraction("2024-01")).toBeCloseTo(2024 + 0.5 / 12, 6);
        expect(yearFraction("2024-07-01")).toBeGreaterThan(2024.5);
    });
});

describe("learning curve", () => {
    test("an exact 10% yearly fall fits with R² 1", () => {
        const pts = [0, 1, 2, 3].flatMap((k) => [
            {
                point: point("a", `${2020 + k}`, 100 * 0.9 ** k),
                year: 2020.5 + k,
                usdPerNm: 10 * 0.9 ** k,
            },
            {
                point: point("b", `${2021 + k}`, 50 * 0.9 ** k),
                year: 2021.5 + k,
                usdPerNm: 5 * 0.9 ** k,
            },
        ]);
        const fit = withinFit(pts);
        expect(fit?.annualChange).toBeCloseTo(-0.1, 6);
        expect(fit?.r2).toBeCloseTo(1, 6);
        expect(fit?.actuators).toBe(2);
        // A cheaper newer model does not read as a price fall: each actuator
        // is only compared with itself.
        const flat = withinFit([
            { point: point("a", "2020", 100), year: 2020.5, usdPerNm: 10 },
            { point: point("a", "2024", 100), year: 2024.5, usdPerNm: 10 },
            { point: point("b", "2024", 10), year: 2024.5, usdPerNm: 1 },
            { point: point("c", "2025", 10), year: 2025.5, usdPerNm: 1 },
            { point: point("c", "2026", 10), year: 2026.5, usdPerNm: 1 },
        ]);
        expect(flat?.annualChange).toBeCloseTo(0, 9);
    });

    test("too few points give no fit", () => {
        expect(
            withinFit([{ point: point("a", "2020", 1), year: 2020.5, usdPerNm: 1 }]),
        ).toBeNull();
    });

    test("classes on the page have points and a fit where the data allows", () => {
        const trends = classTrends();
        expect(trends.length).toBeGreaterThan(2);
        expect(trends.some((t) => t.fit !== null)).toBe(true);
        for (const t of trends) if (t.fit) expect(t.fit.r2).toBeLessThanOrEqual(1);
    });
});

describe("distribution", () => {
    test("quantiles interpolate", () => {
        expect(quantile([1, 2, 3, 4], 0.5)).toBe(2.5);
        expect(quantile([5], 0.25)).toBe(5);
    });

    test("groups by country with one value per actuator", () => {
        const year = Number(CATALOG_PRICE_DATE.slice(0, 4));
        const groups = groupStats("country", year);
        const total = groups.reduce((s, g) => s + g.n, 0);
        expect(total).toBe(
            ACTUATORS.filter((a) => a.price_usd != null && a.peak_torque_nm).length,
        );
        const sorted = groups.map((g) => g.median);
        expect(sorted).toEqual([...sorted].sort((a, b) => a - b));
        for (const g of groups)
            expect(
                g.min <= g.q1 && g.q1 <= g.median && g.median <= g.q3 && g.q3 <= g.max,
            ).toBe(true);
    });
});

describe("price index vs NdPr", () => {
    test("chains the mean yearly change across actuators", () => {
        const idx = priceIndex([
            point("a", "2020", 100),
            point("a", "2022", 81),
            point("b", "2021", 50),
            point("b", "2022", 45),
        ]);
        expect(idx.map((i) => i.year)).toEqual([2020, 2021, 2022]);
        expect(idx[0]?.value).toBe(100);
        expect(idx[1]?.value).toBeCloseTo(90, 0);
        // 2021 to 2022: a falls 10%, b falls 10%.
        expect(idx[2]?.value).toBeCloseTo(81, 0);
        expect(idx[2]?.actuators).toBe(2);
    });

    test("lagged correlation uses yearly changes and skips carried metal years", () => {
        const index = [100, 110, 99, 120, 130].map((value, i) => ({
            year: 2020 + i,
            value,
            actuators: 1,
        }));
        const metal = [50, 55, 49.5, 60, 60].map((usdPerKg, i) => ({
            year: 2020 + i,
            usdPerKg,
            carried: i === 4,
            date: String(2020 + i),
            sources: [],
        }));
        const [lag0] = lagCorrelations(index, metal);
        expect(lag0?.n).toBe(3);
        expect(lag0?.r).toBeCloseTo(1, 6);
        expect(pearson([1, 2], [1, 2])).toBeNull();
    });

    test("the live overlay reads NdPr oxide from /metals", () => {
        const o = metalsOverlay();
        expect(o.index.length).toBeGreaterThan(3);
        expect(o.metal.length).toBeGreaterThan(3);
        expect(o.lags.map((l) => l.lag)).toEqual([0, 1, 2]);
    });
});
