import { describe, expect, test } from "bun:test";
import { leaderOf, outOf, playersToReach, rankShares } from "@/supply-chain/dominance";
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

    test("players needed for 90%", () => {
        expect(playersToReach(market("magnet")).count).toBe(1);
        expect(playersToReach(market("separation")).count).toBe(1);
        expect(playersToReach(market("search")).count).toBe(1);
        const mining = playersToReach(market("mining"));
        expect(mining.players.map((p) => p.key)).toEqual(["CN", "US", "AU", "MM"]);
        expect(mining.reached).toBe(true);
        const phones = playersToReach(market("smartphones"));
        expect(phones.reached).toBe(false);
        expect(phones.players).toHaveLength(5);
        // 68.2% named; the rest are each at most 8.1%, so at least 3 more.
        expect(phones.count).toBe(8);
    });

    test("out of ten, rounded so counts add to ten", () => {
        expect(outOf(market("mining"))).toEqual([
            { key: "CN", count: 7, share: 270 / 390 },
            { key: "US", count: 1, share: 51 / 390 },
            { key: "AU", count: 1, share: 29 / 390 },
            { key: "MM", count: 1, share: 22 / 390 },
        ]);
        expect(outOf(market("magnet")).map((p) => [p.key, p.count])).toEqual([
            ["CN", 9],
            ["other", 1],
        ]);
        expect(rankShares({ A: 2, B: 2 }).named.map((n) => n.share)).toEqual([
            0.5, 0.5,
        ]);
    });
});
