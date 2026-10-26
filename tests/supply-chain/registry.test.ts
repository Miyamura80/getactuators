import { describe, expect, test } from "bun:test";
import { auditRegistry, uncitedNumbers } from "@/supply-chain/audit";
import { COMPANIES, SEGMENTS } from "@/supply-chain/companies";
import { SUPPLY_LINKS } from "@/supply-chain/links";
import { SEGMENT_MARKETS } from "@/supply-chain/market-share";
import {
    companiesIn,
    findCompanies,
    findSites,
    getCompany,
    linksOf,
    sitesOf,
} from "@/supply-chain/registry";
import { asOfSchema, companySchema } from "@/supply-chain/schemas";
import { SITES } from "@/supply-chain/sites";
import { isSourced } from "@/supply-chain/sourced";
import { SOURCES } from "@/supply-chain/sources";

describe("supply-chain registry", () => {
    const report = auditRegistry();

    test("passes the audit with no errors or warnings", () => {
        expect(report.errors).toEqual([]);
        expect(report.warnings).toEqual([]);
    });

    test("seed covers four segments and the four atlas countries", () => {
        expect(new Set(COMPANIES.map((c) => c.segment))).toEqual(new Set(SEGMENTS));
        const countries = new Set(COMPANIES.map((c) => c.hqCountry));
        for (const c of ["JP", "CN", "KR", "US"])
            expect(countries.has(c as never)).toBe(true);
        expect(COMPANIES.length).toBeGreaterThanOrEqual(15);
        expect(SITES.length).toBeGreaterThanOrEqual(25);
        expect(SUPPLY_LINKS.length).toBeGreaterThanOrEqual(9);
        expect(SOURCES.length).toBeGreaterThanOrEqual(20);
    });

    test("every company has at least one site", () => {
        for (const c of COMPANIES)
            expect(sitesOf(c.id).length, c.id).toBeGreaterThan(0);
    });

    test("estimates carry a method note or a range", () => {
        for (const c of COMPANIES)
            for (const v of [c.revenue, c.grossMargin])
                if (v && v.confidence !== "reported")
                    expect(Boolean(v.note || v.range), c.id).toBe(true);
    });
});

describe("market share", () => {
    test("every segment has a cited market with at least one share", () => {
        expect(SEGMENT_MARKETS.map((m) => m.segment).sort()).toEqual(
            [...SEGMENTS].sort(),
        );
        for (const m of SEGMENT_MARKETS) {
            expect(Object.keys(m.shares).length, m.segment).toBeGreaterThan(0);
            for (const s of Object.values(m.shares)) {
                expect(s.unit).toBe("fraction");
                expect(s.value).toBeGreaterThan(0);
                expect(s.value).toBeLessThanOrEqual(1);
            }
        }
    });
});

describe("audit catches bad data", () => {
    test("bare numbers outside a Sourced value are uncited", () => {
        const misses = uncitedNumbers("x", [
            { id: "a", revenue: 12, lat: 1, lon: 2 },
            {
                id: "b",
                revenue: {
                    value: 3,
                    sources: ["s"],
                    asOf: "2025",
                    confidence: "reported",
                },
            },
        ]);
        expect(misses).toEqual(["x[0].revenue: 12"]);
    });
});

describe("accessors", () => {
    test("companiesIn filters by headquarters country", () => {
        const kr = companiesIn("KR").map((c) => c.id);
        expect(kr).toContain("hyundai-mobis");
        expect(kr.every((id) => getCompany(id)?.hqCountry === "KR")).toBe(true);
    });

    test("sitesOf and linksOf resolve both directions", () => {
        expect(sitesOf("jl-mag").map((s) => s.id)).toContain("jlmag-baotou");
        const jl = linksOf("jl-mag");
        expect(jl.buys.map((l) => l.from).sort()).toEqual([
            "china-northern-rare-earth",
            "china-rare-earth-group",
        ]);
        expect(linksOf("nabtesco").supplies.map((l) => l.to)).toContain("fanuc");
    });

    test("findCompanies and findSites combine filters", () => {
        expect(
            findCompanies({ country: "jp", stage: "gearing" }).map((c) => c.id),
        ).toEqual(["harmonic-drive-systems", "nabtesco", "nidec"]);
        expect(
            findSites({ company: "nabtesco" })
                .map((s) => s.country)
                .sort(),
        ).toEqual(["CN", "JP"]);
        expect(findSites({ kind: "mine" }).map((s) => s.id)).toEqual([
            "mp-mountain-pass",
        ]);
    });
});

describe("schemas reject impossible values", () => {
    test("asOf must be a real calendar date", () => {
        const ok = (s: string) => asOfSchema.safeParse(s).success;
        expect(["2025", "2025-12", "2024-02-29"].map(ok)).toEqual([true, true, true]);
        expect(["2025-13", "2025-02-30", "2025-00"].map(ok)).toEqual([
            false,
            false,
            false,
        ]);
    });

    test("a gross margin range stays within 0..1", () => {
        const base = COMPANIES[0];
        if (!base) throw new Error("no companies");
        const margin = (range: [number, number]) => ({
            ...base,
            grossMargin: {
                value: 0.3,
                range,
                sources: ["x"],
                asOf: "2025",
                confidence: "estimated" as const,
            },
        });
        expect(companySchema.safeParse(margin([0.2, 0.4])).success).toBe(true);
        expect(companySchema.safeParse(margin([0.2, 1.4])).success).toBe(false);
    });

    test("isSourced needs typed sources and a known confidence", () => {
        const s = { value: 1, sources: ["x"], confidence: "reported", asOf: "2025" };
        expect(isSourced(s)).toBe(true);
        expect(isSourced({ ...s, sources: "x" })).toBe(false);
        expect(isSourced({ ...s, confidence: "guess" })).toBe(false);
    });

    test("an ended link is historical, not active", () => {
        expect(linksOf("mp-materials").supplies[0]?.ended).toBe("2025-04");
    });
});
