import { describe, expect, test } from "bun:test";
import {
    FAMILIES,
    LANDSCAPE,
    PATENT_YEARS,
    TECHNOLOGY_IDS,
    cagr,
    familiesPerYear,
    googlePatentsUrl,
    leaderboard,
    searchFamilies,
    seriesByCountry,
    top5Share,
} from "@/patents";
import {
    type PublicationRow,
    TOP_FAMILIES,
    buildLandscape,
    cleanTitle,
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
            pub({ publication_number: "EP-1-B1", family_id: "1", cpc_codes: [] }),
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
        // Family 1 has two offices, so it ranks first.
        expect(families.families.map((f) => f.id)).toEqual(["1", "2", "3"]);
        expect(families.perTechnology).toBe(TOP_FAMILIES);
    });
});

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
