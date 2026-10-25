import { describe, expect, test } from "bun:test";
import {
    REE_ELEMENTS,
    REE_METAL_PRICE,
    SOURCES,
    getHumanoid,
    humanoidTotals,
    metalValue,
    reeByDesign,
    spanTotal,
} from "@/humanoids";

const optimus = () => {
    const h = getHumanoid("tesla-optimus");
    if (!h) throw new Error("missing Optimus");
    return h;
};

describe("rare earth by actuator design", () => {
    test("rows add up to the robot's rare-earth totals", () => {
        const h = optimus();
        const rows = reeByDesign(h);
        const t = humanoidTotals(h).reeKg;
        for (const el of REE_ELEMENTS) {
            const lo = rows.reduce((n, r) => n + r.grams[el].lo, 0);
            const hi = rows.reduce((n, r) => n + r.grams[el].hi, 0);
            expect(lo / 1000).toBeCloseTo(t[el].range?.[0] ?? 0, 2);
            expect(hi / 1000).toBeCloseTo(t[el].range?.[1] ?? 0, 2);
        }
        expect(rows[0]?.label).toBe("Harmonic 180 N·m");
        expect(rows.map((r) => r.count).reduce((a, b) => a + b, 0)).toBe(42);
    });

    test("metal value is grams x US$/kg, low with low and high with high", () => {
        const g = {
            nd: { lo: 100, mid: 200, hi: 300 },
            pr: { lo: 0, mid: 0, hi: 0 },
            dy: { lo: 10, mid: 10, hi: 10 },
            tb: { lo: 0, mid: 1, hi: 2 },
        };
        const v = metalValue(g);
        const nd = REE_METAL_PRICE.nd;
        expect(v.nd.mid).toBeCloseTo((200 * nd.value) / 1000, 6);
        expect(v.nd.lo).toBeCloseTo((100 * (nd.range?.[0] ?? 0)) / 1000, 6);
        expect(v.nd.hi).toBeCloseTo((300 * (nd.range?.[1] ?? 0)) / 1000, 6);
        expect(v.tb.hi).toBeCloseTo(
            (2 * (REE_METAL_PRICE.tb.range?.[1] ?? 0)) / 1000,
            6,
        );
        expect(spanTotal(v, "lo")).toBeLessThanOrEqual(spanTotal(v, "hi"));
    });

    test("every metal price is cited, dated and in US$/kg", () => {
        for (const el of REE_ELEMENTS) {
            const p = REE_METAL_PRICE[el];
            expect(p.unit).toBe("USD/kg");
            expect(p.asOf).toBe("September 2026");
            expect(p.sources.length).toBeGreaterThan(0);
            for (const id of p.sources) expect(id in SOURCES).toBe(true);
            expect(p.range?.[0]).toBeLessThanOrEqual(p.range?.[1] ?? 0);
        }
    });
});
