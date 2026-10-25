import { describe, expect, test } from "bun:test";
import {
    EVS_PER_YEAR,
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
});
