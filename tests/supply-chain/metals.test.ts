import { describe, expect, test } from "bun:test";
import { concentration } from "@/supply-chain/concentration";
import {
    MAGNET_GRADES,
    METAL_IDS,
    METAL_STAGES,
    PRICE_SERIES,
    gradeComposition,
    humanoidElementMass,
    priceAt,
    priceSpreads,
    reserveTable,
    stageEntry,
    yearsOfSupply,
} from "@/supply-chain/metals";

describe("priceAt", () => {
    test("returns the annual average for any month of its year", () => {
        const p = priceAt("ndpr-oxide", "2024-06");
        expect(p?.value.value).toBe(55);
        expect(p?.basis).toBe("annual-average");
        expect(p?.carried).toBe(false);
        expect(p?.value.sources).toEqual(["usgs-mcs-2026-ree"]);
    });

    test("prefers the last reading inside the month", () => {
        expect(priceAt("dy-metal-cn", "2026-09")?.value.value).toBe(233.55);
        expect(priceAt("dy-metal-cn", "2026-09")?.date).toBe("2026-09-30");
        expect(priceAt("nd-oxide", "2012-01")?.value.value).toBe(195);
        expect(priceAt("nd-oxide", "2011-12")?.basis).toBe("year-end");
    });

    test("carries the last point forward and says so", () => {
        const p = priceAt("dy-metal-cn", "2026-05");
        expect(p?.value.value).toBe(220.93);
        expect(p?.carried).toBe(true);
        expect(priceAt("ndpr-oxide", "2026-10")?.carried).toBe(true);
    });

    test("is null before the series, for unknown ids and bad months", () => {
        expect(priceAt("ndpr-oxide", "2020-12")).toBeNull();
        expect(priceAt("gold", "2024-01")).toBeNull();
        expect(priceAt("ndpr-oxide", "2024-13")).toBeNull();
        expect(priceAt("ndpr-oxide", "2024")).toBeNull();
    });

    test("converts cobalt from $/lb to $/kg", () => {
        expect(priceAt("co-metal", "2018-03")?.value.value).toBe(72.62);
    });
});

describe("metals dataset", () => {
    test("every price point is US$/kg with sources and an asOf matching its date", () => {
        for (const s of PRICE_SERIES)
            for (const p of s.points) {
                expect(p.value.unit).toBe("USD/kg");
                expect(p.value.sources.length).toBeGreaterThan(0);
                expect(p.date.startsWith(p.value.asOf.slice(0, 4))).toBe(true);
            }
    });

    test("China domestic is cheaper than export where both exist", () => {
        const spreads = priceSpreads();
        expect(spreads.map((s) => s.element)).toEqual(["nd", "pr", "tb"]);
        for (const s of spreads) expect(s.premium.value).toBeGreaterThan(0);
    });

    test("control concentrates down the chain for neodymium", () => {
        const tops = METAL_STAGES.map((st) => {
            const e = stageEntry("nd", st);
            return e.kind === "shares"
                ? (concentration(e.shares.value)?.top.share ?? 0)
                : 0;
        });
        expect(tops[0]).toBeLessThan(tops[3] ?? 0);
        // Every element x stage is either cited shares or a cited gap.
        for (const m of METAL_IDS)
            for (const st of METAL_STAGES) {
                const e = stageEntry(m, st);
                const sources = e.kind === "shares" ? e.shares.sources : e.sources;
                expect(sources.length).toBeGreaterThan(0);
            }
    });

    test("grade compositions add up and Dy rises with the grade", () => {
        let last = -1;
        for (const g of MAGNET_GRADES) {
            const c = gradeComposition(g.id);
            expect(
                c.ndpr.value + c.dy.value + c.boron.value + c.iron.value,
            ).toBeCloseTo(1, 6);
            expect(c.dy.value).toBeGreaterThan(last);
            last = c.dy.value;
        }
        const sh = humanoidElementMass("sh");
        expect(sh.dy.range?.[0]).toBeLessThan(sh.dy.value);
        expect(sh.nd.confidence).toBe("modeled");
    });

    test("reserves match USGS world totals and give years of supply", () => {
        const ree = reserveTable("ree");
        const sum = ree.rows.reduce((t, r) => t + r.production2025.value, 0);
        expect(Math.abs(sum - ree.world.production2025.value)).toBeLessThan(1000);
        const cn = ree.rows.find((r) => r.country === "CN");
        expect(cn && yearsOfSupply(cn)?.value).toBe(163);
        const co = reserveTable("co");
        expect(co.rows[0]?.country).toBe("CD");
        expect(co.rows.at(-1)?.country).toBe("other");
    });
});
