import { describe, expect, test } from "bun:test";
import { ACTUATORS } from "@/catalog";
import { reductionRatio, tradeoffApplications, tradeoffRows } from "@/catalog/tradeoff";

describe("compliance vs precision chart data", () => {
    test("reduction ratio keeps direct drive at 1 and takes the first n:1 of a range", () => {
        expect(reductionRatio("1:1")).toBe(1);
        expect(reductionRatio("9:1")).toBe(9);
        expect(reductionRatio("50:1-160:1")).toBe(50);
        expect(reductionRatio(null)).toBeNull();
        expect(reductionRatio("direct drive")).toBeNull();
    });

    test("every plotted row has a price and a ratio, and maps backdrivable to three states", () => {
        const rows = tradeoffRows(ACTUATORS);
        expect(rows.length).toBeGreaterThan(20);
        for (const r of rows) {
            expect(r.price).toBeGreaterThan(0);
            expect(r.ratio).toBeGreaterThanOrEqual(1);
            const a = ACTUATORS.find((x) => x.id === r.id);
            const want =
                a?.backdrivable == null ? "unknown" : a.backdrivable ? "yes" : "no";
            expect(r.backdrive).toBe(want);
        }
    });

    test("application filters only offer groups with enough points", () => {
        const rows = tradeoffRows(ACTUATORS);
        for (const g of tradeoffApplications(rows, 4)) {
            expect(g.count).toBeGreaterThanOrEqual(4);
            expect(rows.filter((r) => r.applications.includes(g.key))).toHaveLength(
                g.count,
            );
        }
    });
});
