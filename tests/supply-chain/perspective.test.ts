import { describe, expect, test } from "bun:test";
import {
    EFFECTIVE_COMPETITORS,
    EVS_PER_YEAR,
    HIGHLY_CONCENTRATED_EQUIVALENT,
    HUMANOIDS_PER_YEAR,
    REVENUE_LADDER,
} from "@/supply-chain/perspective";

describe("perspective references", () => {
    test("revenue ladder is ascending and mixes headlines with references", () => {
        const values = REVENUE_LADDER.map((p) => p.value.value);
        expect([...values].sort((a, b) => a - b)).toEqual(values);
        expect(REVENUE_LADDER.filter((p) => p.headline).length).toBe(2);
        expect(REVENUE_LADDER.filter((p) => !p.headline).length).toBeGreaterThanOrEqual(
            2,
        );
    });

    test("20 kt of magnets is millions of humanoids or EVs, as a model", () => {
        expect(HUMANOIDS_PER_YEAR.range?.map(Math.round)).toEqual([
            4_444_444, 10_000_000,
        ]);
        expect(Math.round(EVS_PER_YEAR.value)).toBe(13_333_333);
        expect(HUMANOIDS_PER_YEAR.confidence).toBe("modeled");
    });

    test("markets read as equal-sized competitors, 10,000 / HHI", () => {
        expect(HIGHLY_CONCENTRATED_EQUIVALENT.value).toBeCloseTo(5.56, 2);
        const byId = Object.fromEntries(
            EFFECTIVE_COMPETITORS.map((m) => [m.id, m.value.value]),
        );
        expect(byId.mining).toBeCloseTo(10000 / 5053, 6);
        expect(byId.magnets).toBeLessThan(1.2);
        expect(byId.smartphones).toBeGreaterThan(HIGHLY_CONCENTRATED_EQUIVALENT.value);
        for (const m of EFFECTIVE_COMPETITORS) {
            expect(m.value.confidence).toBe("modeled");
            expect(m.value.note).toContain("10,000 / HHI");
        }
    });
});
