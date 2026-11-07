import { describe, expect, test } from "bun:test";
import { countryFlag } from "@/country-flag";
import { concentration, normalizeShares } from "@/supply-chain/concentration";
import { formatValue, sourcedText } from "@/supply-chain/format";
import { LAB_MINING_HHI, LAB_STAGE_SHARES } from "@/supply-chain/lab-fixtures";

describe("concentration", () => {
    test("single country holds everything", () => {
        expect(concentration({ CN: 1 })).toEqual({
            top: { country: "CN", share: 1 },
            hhi: 10000,
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

    test("the cited lab stages and the modeled HHI agree", () => {
        const tops = LAB_STAGE_SHARES.map(
            (r) => concentration(r.shares.value)?.top.country,
        );
        expect(tops).toEqual(["CN", "CN", "CN"]);
        // CN 69.2%, US 13.1%, AU 7.4%, MM 5.6%, TH 1.2% of 390,000 t.
        expect(concentration(LAB_STAGE_SHARES[0]?.shares.value ?? {})?.hhi).toBe(5053);
        expect(LAB_MINING_HHI.value).toBe(5053);
    });

    test("flags come from regional indicator symbols", () => {
        expect(countryFlag("CN")).toBe("\u{1F1E8}\u{1F1F3}");
        expect(countryFlag("jp")).toBe("\u{1F1EF}\u{1F1F5}");
        expect(countryFlag("other")).toBe("other");
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
        expect(formatValue(13000, "units")).toBe("13k");
        expect(formatValue(7e6, "units", [4.44e6, 1e7])).toBe("4.4-10M");
    });

    test("confidence marks in plain text", () => {
        const base = { value: 0.91, unit: "fraction", sources: ["s"], asOf: "2024" };
        expect(sourcedText({ ...base, confidence: "reported" })).toBe("91%");
        expect(sourcedText({ ...base, confidence: "estimated" })).toBe("~91%");
        expect(sourcedText({ ...base, confidence: "modeled" })).toBe("91% (model)");
    });
});
