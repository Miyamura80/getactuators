import { describe, expect, test } from "bun:test";
import {
    FAMILIES,
    LANDSCAPE,
    PATENT_YEARS,
    TECHNOLOGY_IDS,
    areaCells,
    areaShift,
    cagr,
    familiesPerYear,
    filterSummary,
    googlePatentsUrl,
    intlShares,
    leaderboard,
    searchFamilies,
    seriesByCountry,
    top5Share,
    valueRows,
} from "@/patents";
import {
    type PublicationRow,
    TOP_FAMILIES,
    TOP_VALUE,
    buildLandscape,
    cleanTitle,
    isGrant,
    isInternational,
    isTriadic,
    publicationLag,
    toFamilies,
    toFamily,
} from "../../scripts/patents/landscape";

const pub = (
    p: Partial<PublicationRow> & { publication_number: string },
): PublicationRow => ({
    family_id: "1",
    country_code: p.publication_number.slice(0, 2),
    priority_date: 20150101,
    publication_date: 20160101,
    assignees: [],
    title_en: null,
    cpc_codes: [],
    ...p,
});

describe("families from publications", () => {
    test("one family per family_id, earliest priority, first assignee and its country", () => {
        const f = toFamily([
            pub({
                publication_number: "WO-2016000001-A1",
                priority_date: 20150301,
                publication_date: 20160105,
                assignees: [{ name: "SEIKO EPSON CORP", country_code: "" }],
                title_en: "Robot joint with a strain wave gear",
                cpc_codes: ["F16H49/001"],
            }),
            pub({
                publication_number: "JP-2016000002-A",
                priority_date: 20150201,
                publication_date: 20160301,
                assignees: [{ name: "SEIKO EPSON CORP", country_code: "JP" }],
                cpc_codes: ["B25J9/1025"],
            }),
            pub({
                publication_number: "US-9999999-B2",
                priority_date: 20150201,
                publication_date: 20180101,
                title_en: "Robot",
            }),
        ]);
        expect(f?.priority).toBe("2015-02-01");
        expect(f?.assigneeRaw).toBe("SEIKO EPSON CORP");
        // Country from the same assignee on another publication.
        expect(f?.country).toBe("JP");
        // US preferred as the representative publication; its own title.
        expect(f?.pub).toBe("US-9999999-B2");
        expect(f?.title).toBe("Robot");
        expect(f?.jurisdictions).toBe(3);
        // CPC codes from every publication in the family.
        expect(f?.techs).toEqual(["robot-joints", "strain-wave"]);
    });

    test("country falls back to the earliest national office, then XX", () => {
        const national = toFamily([
            pub({
                publication_number: "EP-1-A1",
                publication_date: 20160101,
                assignees: [{ name: "A" }],
            }),
            pub({ publication_number: "CN-2-A", publication_date: 20160201 }),
        ]);
        expect(national?.country).toBe("CN");
        const none = toFamily([pub({ publication_number: "WO-1-A1" })]);
        expect(none?.country).toBe("XX");
        expect(none?.assigneeRaw).toBe("");
    });

    test("drops families without a priority date and keeps 2010 onward", () => {
        const { families, publications, total } = toFamilies([
            pub({ publication_number: "US-1-A", family_id: "a", priority_date: null }),
            pub({
                publication_number: "US-2-A",
                family_id: "b",
                priority_date: 20091231,
            }),
            pub({
                publication_number: "US-3-A",
                family_id: "c",
                priority_date: 20100101,
            }),
        ]);
        expect(publications).toBe(3);
        expect(total).toBe(3);
        expect(families.map((f) => f.id)).toEqual(["c"]);
    });

    test("offices, grants and application areas ride on the family", () => {
        const f = toFamily([
            pub({
                publication_number: "CN-1-U",
                kind_code: "U",
                cpc_codes: ["B60K7/00"],
            }),
            pub({ publication_number: "WO-2-A1", kind_code: "A1" }),
            pub({
                publication_number: "US-3-A1",
                kind_code: "A1",
                cpc_codes: ["A61H3/00"],
            }),
        ]);
        expect(f?.offices).toEqual(["CN", "US", "WO"]);
        // A utility model is not a grant.
        expect(f?.granted).toBe(false);
        expect(f?.areas).toEqual(["vehicles", "medical"]);
        expect(isGrant("B2")).toBe(true);
        expect(isGrant("C")).toBe(true);
        expect(isGrant("U1")).toBe(false);
        expect(isGrant("Y")).toBe(false);
        expect(isGrant(undefined)).toBe(false);
        // WO does not count as an office; EP does.
        expect(isInternational(["CN", "WO"])).toBe(false);
        expect(isInternational(["CN", "EP"])).toBe(true);
        expect(isTriadic(["EP", "JP", "US", "WO"])).toBe(true);
        expect(isTriadic(["EP", "US"])).toBe(false);
    });

    test("titles lose entities and em dashes", () => {
        expect(
            cleanTitle(`Gear  &amp; drive ${String.fromCharCode(0x2014)} plough&#39;s`),
        ).toBe("Gear & drive - plough's");
    });

    test("publication lag marks the last 18 months incomplete", () => {
        expect(publicationLag("2026-11-11")).toEqual({
            incompleteFrom: "2025-05-11",
            completeThrough: 2024,
        });
    });

    test("aggregates counts, assignees and the ranked family list", () => {
        const rows = [1, 2, 3].map((i) =>
            pub({
                publication_number: `US-${i}-B2`,
                kind_code: "B2",
                family_id: String(i),
                assignees: [
                    {
                        name: i < 3 ? "NIDEC SHIMPO CORP" : "OVALO GMBH",
                        country_code: i < 3 ? "JP" : "DE",
                    },
                ],
                cpc_codes: ["F16H49/001"],
                title_en: `Wave gear ${i}`,
            }),
        );
        rows.push(
            pub({
                publication_number: "EP-1-B1",
                kind_code: "B1",
                family_id: "1",
                cpc_codes: [],
            }),
        );
        const { landscape, families } = buildLandscape(toFamilies(rows), "2026-11-11");
        const sw = landscape.technologies["strain-wave"];
        expect(sw.families).toBe(3);
        expect(sw.counts.JP?.[2015 - 2010]).toBe(2);
        expect(sw.top[0]).toMatchObject({
            key: "nidec",
            company: "nidec",
            families: 2,
            country: "JP",
        });
        expect(landscape.technologies.ndfeb.families).toBe(0);
        expect(landscape.all.families).toBe(3);
        // Family 1 (US + EP grants) is granted and filed in two offices.
        expect(sw.quality.granted.JP?.[2015 - 2010]).toBe(2);
        expect(sw.quality.granted.DE?.[2015 - 2010]).toBe(1);
        expect(sw.quality.intl.JP?.[2015 - 2010]).toBe(1);
        expect(sw.quality.triadic).toEqual({});
        expect(sw.value.assignees[0]).toMatchObject({
            key: "nidec",
            families: 2,
            intl: 1,
            granted: 2,
        });
        expect(sw.value.rest).toEqual({ families: 3, intl: 1 });
        expect(sw.value.assignees[0]?.triadic).toBe(0);
        expect(sw.value.cn).toEqual({ families: 0, intl: 0 });
        expect(landscape.areaWindows).toEqual({
            early: [2010, 2017],
            late: [2020, 2024],
        });
        expect(sw.areas).toMatchObject({ families: 3, early: 3, late: 0 });
        // Family 1 has two offices, so it ranks first.
        expect(families.families.map((f) => f.id)).toEqual(["1", "2", "3"]);
        expect(families.perTechnology).toBe(TOP_FAMILIES);
    });
});

// One scope's quality, value and area aggregates against its counts.
function checkScope(scope: "all" | (typeof TECHNOLOGY_IDS)[number]) {
    const end = PATENT_YEARS.indexOf(LANDSCAPE.completeThrough) + 1;
    const all = familiesPerYear(scope);
    const g = familiesPerYear(scope, "granted");
    const i = familiesPerYear(scope, "intl");
    const t = familiesPerYear(scope, "triadic");
    for (const [k, n] of all.entries()) {
        expect(g[k] ?? 0, scope).toBeLessThanOrEqual(n);
        expect(t[k] ?? 0, scope).toBeLessThanOrEqual(i[k] ?? 0);
    }
    const complete = all.slice(0, end).reduce((a, b) => a + b, 0);
    const l = scope === "all" ? LANDSCAPE.all : LANDSCAPE.technologies[scope];
    expect(l.value.cn.families + l.value.rest.families, scope).toBe(complete);
    expect(l.areas.families, scope).toBe(complete);
    expect(filterSummary(scope, "all").of, scope).toBe(complete);
    const rows = valueRows(scope);
    expect(rows.length, scope).toBeLessThanOrEqual(TOP_VALUE);
    for (const r of rows) {
        expect(r.intl, r.name).toBeLessThanOrEqual(r.families);
        expect(r.granted, r.name).toBeLessThanOrEqual(r.families);
    }
    for (const c of areaCells(scope)) expect(c.families).toBeLessThanOrEqual(complete);
}

describe("committed landscape", () => {
    test("is internally consistent", () => {
        expect(PATENT_YEARS[0]).toBe(2010);
        expect(LANDSCAPE.extract.matched).toBe(LANDSCAPE.all.families);
        for (const id of TECHNOLOGY_IDS) {
            const t = LANDSCAPE.technologies[id];
            expect(t.families, id).toBeGreaterThan(100);
            const counted = familiesPerYear(id).reduce((a, b) => a + b, 0);
            expect(counted, id).toBe(t.families);
            expect(t.top.length, id).toBe(15);
            expect(t.top.every((a) => a.years.length === PATENT_YEARS.length)).toBe(
                true,
            );
            const listed = FAMILIES.filter((f) => f.techs.includes(id)).length;
            expect(listed, id).toBeGreaterThanOrEqual(
                Math.min(TOP_FAMILIES, t.families),
            );
            expect(top5Share(id)).toBeGreaterThan(0);
            expect(top5Share(id)).toBeLessThan(1);
        }
    });

    test("quality, value and area aggregates agree with the counts", () => {
        for (const scope of ["all", ...TECHNOLOGY_IDS] as const) checkScope(scope);
        // The headline gap the value view is built on.
        const s = intlShares("all");
        expect(s.cn).toBeLessThan(s.rest);
        expect(
            areaShift({
                area: "vehicles",
                label: "",
                families: 1,
                share: 0.1,
                early: 0.1,
                late: 0.115,
            }),
        ).toBe("up");
        expect(
            areaShift({
                area: "vehicles",
                label: "",
                families: 1,
                share: 0.1,
                early: 0.1,
                late: 0.095,
            }),
        ).toBeNull();
    });

    test("stays small and never carries the raw extract", async () => {
        const size = (p: string) => Bun.file(p).size;
        expect(size("data/patents/landscape.json")).toBeLessThan(150_000);
        expect(size("data/patents/families.json")).toBeLessThan(600_000);
        expect(FAMILIES.length).toBeLessThanOrEqual(
            TOP_FAMILIES * TECHNOLOGY_IDS.length,
        );
        const files = [...new Bun.Glob("data/patents/*").scanSync(".")].sort();
        expect(files).toEqual([
            "data/patents/families.json",
            "data/patents/landscape.json",
        ]);
    });

    test("views: series, leaderboard, CAGR, search and links", () => {
        const series = seriesByCountry("ndfeb", 3);
        expect(series).toHaveLength(4);
        expect(series.at(-1)?.key).toBe("other");
        const total = series.reduce(
            (s, x) => s + x.values.reduce((a, b) => a + b, 0),
            0,
        );
        expect(total).toBe(LANDSCAPE.technologies.ndfeb.families);
        expect(leaderboard("strain-wave")[0]?.rank).toBe(1);
        expect(cagr(PATENT_YEARS.map(() => 10))).toBe(0);
        expect(cagr(PATENT_YEARS.map(() => 0))).toBeNull();
        expect(searchFamilies("all", "strain wave").length).toBeGreaterThan(0);
        expect(searchFamilies("all", "").length).toBe(FAMILIES.length);
        expect(googlePatentsUrl("US-9876543-B2")).toBe(
            "https://patents.google.com/patent/US9876543B2",
        );
    });
});
