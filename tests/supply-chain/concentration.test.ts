import { describe, expect, test } from "bun:test";
import { concentration, levelFor, normalizeShares } from "@/supply-chain/concentration";
import { formatValue, sourcedText } from "@/supply-chain/format";
import { LAB_STAGE_SHARES, LAB_SYNTHETIC_SHARES } from "@/supply-chain/lab-fixtures";

describe("concentration thresholds", () => {
    test("top share at 70% is monopolized regardless of HHI", () => {
        expect(levelFor(0.7, 4900)).toBe("monopolized");
        expect(levelFor(0.6999, 4899)).toBe("concentrated");
    });

    test("HHI bands", () => {
        expect(levelFor(0.4, 2500)).toBe("concentrated");
        expect(levelFor(0.4, 2499)).toBe("moderate");
        expect(levelFor(0.3, 1500)).toBe("moderate");
        expect(levelFor(0.3, 1499)).toBe("distributed");
    });

    test("single country is a full monopoly", () => {
        expect(concentration({ CN: 1 })).toEqual({
            top: { country: "CN", share: 1 },
            hhi: 10000,
            level: "monopolized",
        });
    });

    test("empty, zero and invalid shares return null", () => {
        expect(concentration({})).toBeNull();
        expect(concentration({ other: 1 })).toBeNull();
        expect(concentration({ CN: 0, US: -3, JP: Number.NaN })).toBeNull();
    });

    test("raw amounts are normalised by their total", () => {
        const c = concentration({ CN: 270000, US: 51000, other: 69000 });
        expect(c?.top.country).toBe("CN");
        expect(c?.top.share).toBeCloseTo(270 / 390, 6);
    });

    test("fractions short of 1 leave the rest unattributed", () => {
        const n = normalizeShares({ JP: 0.5, KR: 0.2 });
        expect(n.countries.map((c) => c.country)).toEqual(["JP", "KR"]);
        expect(n.other).toBeCloseTo(0.3, 9);
        expect(concentration({ JP: 0.5, KR: 0.2 })?.hhi).toBe(2900);
    });

    test("the cited lab stages read as the issue expects", () => {
        const levels = LAB_STAGE_SHARES.map(
            (r) => concentration(r.shares.value)?.level,
        );
        expect(levels).toEqual(["concentrated", "monopolized", "monopolized"]);
        expect(LAB_SYNTHETIC_SHARES.map((r) => concentration(r.shares)?.level)).toEqual(
            ["moderate", "distributed"],
        );
    });
});

describe("value formatting", () => {
    test("units and ranges", () => {
        expect(formatValue(224.4e6, "USD")).toBe("$224.4M");
        expect(formatValue(5.9e9, "USD", [5.8e9, 6.0e9])).toBe("$5.8-6B");
        expect(formatValue(12000, "t", [12000, 18000])).toBe("12-18 kt");
        expect(formatValue(20000, "t/yr")).toBe("20 kt/yr");
        expect(formatValue(0.94, "fraction")).toBe("94%");
        expect(formatValue(5050, "HHI")).toBe("5,050");
    });

    test("confidence marks in plain text", () => {
        const base = { value: 0.91, unit: "fraction", sources: ["s"], asOf: "2024" };
        expect(sourcedText({ ...base, confidence: "reported" })).toBe("91%");
        expect(sourcedText({ ...base, confidence: "estimated" })).toBe("~91%");
        expect(sourcedText({ ...base, confidence: "modeled" })).toBe("91% (model)");
    });
});
