import { describe, expect, test } from "bun:test";
import { leaderOf, rankShares } from "@/supply-chain/dominance";
import { DOMINANCE_MARKETS } from "@/supply-chain/perspective";

const market = (id: string) => {
    const m = DOMINANCE_MARKETS.find((x) => x.id === id);
    if (!m) throw new Error(id);
    return m.shares.value;
};

describe("dominance readings", () => {
    test("leaders of each market", () => {
        expect(leaderOf(market("magnet"))).toEqual({ key: "CN", share: 0.94 });
        expect(leaderOf(market("mining"))?.share).toBeCloseTo(270 / 390, 6);
        expect(leaderOf(market("search"))?.key).toBe("Google");
        expect(leaderOf(market("smartphones"))).toEqual({ key: "Apple", share: 0.197 });
        expect(leaderOf({})).toBeNull();
    });

    test("shares are normalised by their total", () => {
        expect(rankShares({ A: 2, B: 2 }).named.map((n) => n.share)).toEqual([
            0.5, 0.5,
        ]);
    });
});
