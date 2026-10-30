import { describe, expect, test } from "bun:test";
import { EVS_PER_YEAR, HUMANOIDS_PER_YEAR } from "@/supply-chain/perspective";

describe("perspective references", () => {
    test("20 kt of magnets is millions of humanoids or EVs, as a model", () => {
        expect(HUMANOIDS_PER_YEAR.range?.map(Math.round)).toEqual([
            4_444_444, 10_000_000,
        ]);
        expect(Math.round(EVS_PER_YEAR.value)).toBe(13_333_333);
        expect(HUMANOIDS_PER_YEAR.confidence).toBe("modeled");
    });
});
