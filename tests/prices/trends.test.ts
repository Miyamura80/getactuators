import { describe, expect, test } from "bun:test";
import { summarize } from "@/prices/history";
import {
    type NmPoint,
    boxStats,
    distribution,
    lagCorrelation,
    learningCurve,
    ndprByMonth,
    priceIndex,
} from "@/prices/trends";
import type { PriceObservation } from "@/prices/types";

const obs = (
    actuatorId: string,
    date: string,
    priceUsd: number | null,
): PriceObservation => ({
    actuatorId,
    date,
    priceUsd,
    currency: "USD",
    originalPrice: priceUsd,
    fxRate: 1,
    url: "https://x.example/",
    method: "jsonld",
    ...(priceUsd === null ? { inStock: false } : {}),
});

const nm = (
    actuatorId: string,
    date: string,
    usdPerNm: number,
    over: Partial<NmPoint> = {},
): NmPoint => ({
    actuatorId,
    category: "qdd_proprioceptive",
    brand: "B",
    country: "China",
    date,
    usdPerNm,
    ...over,
});

describe("learning curve", () => {
    test("declines to fit under a year of data", () => {
        const f = learningCurve(
            [
                nm("a", "2026-01-01", 10),
                nm("b", "2026-03-01", 9),
                nm("c", "2026-05-01", 8),
                nm("d", "2026-07-01", 7),
            ],
            "time",
        );
        expect(f.status).toBe("insufficient");
    });

    test("recovers a 20% per year decline exactly", () => {
        const pts = [0, 1, 2, 3].map((k) =>
            nm(`a${k}`, `${2022 + k}-01-01`, 10 * 0.8 ** k),
        );
        const f = learningCurve(pts, "time");
        if (f.status !== "fit") throw new Error(f.reason);
        // Years are 365.25 days; leap years shift the fit a hair.
        expect(f.rate).toBeCloseTo(-0.2, 2);
        expect(f.r2).toBeCloseTo(1, 4);
        const m = learningCurve(pts, "models");
        expect(m.status).toBe("fit");
    });
});

describe("distribution", () => {
    test("quartiles and one value per actuator per year, cheapest first", () => {
        expect(boxStats([1, 2, 3, 4, 5])).toEqual({
            n: 5,
            min: 1,
            q1: 2,
            median: 3,
            q3: 4,
            max: 5,
        });
        const rows = distribution(
            [
                nm("a", "2026-01-01", 100, { country: "Japan" }),
                nm("a", "2026-06-01", 50, { country: "Japan" }),
                nm("b", "2026-02-01", 5),
                nm("c", "2025-02-01", 1),
            ],
            "country",
            "2026",
        );
        expect(rows.map((r) => [r.group, r.stats.n, r.stats.median])).toEqual([
            ["China", 1, 5],
            ["Japan", 1, 50],
        ]);
    });
});

describe("price index and correlation", () => {
    test("chain-weighted index ignores entries and exits", () => {
        const pts = [
            obs("a", "2026-01-05", 100),
            obs("b", "2026-01-05", 200),
            obs("a", "2026-02-05", 110),
            // c enters at a high price: does not move the index.
            obs("c", "2026-02-05", 5000),
            obs("b", "2026-03-05", null),
        ];
        const idx = priceIndex(pts);
        expect(idx.map((p) => p.month)).toEqual(["2026-01", "2026-02", "2026-03"]);
        expect(idx[0]?.index).toBe(100);
        // Feb link: sqrt(1.1 * 1.0).
        expect(idx[1]?.index).toBeCloseTo(100 * Math.sqrt(1.1), 6);
        // Out of stock is not a price: b carries its last price.
        expect(idx[2]?.index).toBeCloseTo(idx[1]?.index ?? 0, 6);
    });

    test("lagged correlation needs six paired months", () => {
        const months = Array.from({ length: 9 }, (_, i) => `2026-0${i + 1}`);
        const index = months.map((month, i) => ({
            month,
            index: 100 * 1.05 ** (i % 3),
            matched: 2,
        }));
        const metal = index.map((p) => p.index * 2);
        const corr = lagCorrelation(index, metal, 2);
        expect(corr[0]?.r).toBeCloseTo(1, 6);
        expect(corr[0]?.n).toBe(8);
        expect(lagCorrelation(index.slice(0, 4), metal.slice(0, 4))[0]?.r).toBeNull();
        expect(ndprByMonth(["2025-06"])[0]).toBeGreaterThan(0);
    });

    test("one-year change waits for a year of history", () => {
        const pts = [obs("a", "2025-01-10", 100), obs("a", "2026-03-01", 80)];
        expect(summarize("a", pts).yearChange).toBeCloseTo(-0.2, 6);
        expect(
            summarize("a", [obs("a", "2026-01-10", 100), obs("a", "2026-03-01", 80)])
                .yearChange,
        ).toBeNull();
        expect(
            summarize("a", [obs("a", "2026-01-10", 100), obs("a", "2026-03-01", null)])
                .outOfStock,
        ).toBe(true);
    });
});
