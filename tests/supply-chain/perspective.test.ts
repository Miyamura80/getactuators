import { describe, expect, test } from "bun:test";
import {
    EVS_PER_YEAR,
    HHI_COMPARISONS,
    HIGHLY_CONCENTRATED_HHI,
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

    test("HHI yardsticks sit on the 0 to 10,000 scale against the 1,800 line", () => {
        expect(HIGHLY_CONCENTRATED_HHI.value).toBe(1800);
        for (const p of HHI_COMPARISONS) {
            expect(p.value.value).toBeGreaterThan(HIGHLY_CONCENTRATED_HHI.value);
            expect(p.value.value).toBeLessThanOrEqual(10000);
        }
        expect(HHI_COMPARISONS.find((p) => p.id === "mining")?.value.value).toBe(5053);
    });
});
