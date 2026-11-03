import { describe, expect, test } from "bun:test";
import { SEGMENTS } from "@/supply-chain/companies";
import { insideCountry } from "@/supply-chain/countries";
import {
    COUNTRY_OF,
    COUNTRY_SLUGS,
    COVERAGE_TARGET,
    LIVE_COUNTRY_PAGES,
    LIVE_COUNTRY_PATHS,
    clusterSites,
    countryCompanies,
    countryLinks,
    countrySites,
    coverage,
    getCountryPage,
    passesGate,
    worldShares,
} from "@/supply-chain/country-pages";
import { linkKind } from "@/supply-chain/links";
import { getCompany } from "@/supply-chain/registry";

describe("coverage gate", () => {
    test("Japan passes; the other planned countries wait for their data", () => {
        expect(LIVE_COUNTRY_PATHS).toEqual(["/japan"]);
        const jp = coverage("JP");
        expect(jp.companies).toBeGreaterThanOrEqual(COVERAGE_TARGET.companies);
        expect(jp.sites).toBeGreaterThanOrEqual(COVERAGE_TARGET.sites);
        expect(jp.links).toBeGreaterThanOrEqual(COVERAGE_TARGET.links);
        expect(passesGate(coverage("CN"))).toBe(false);
        expect(COUNTRY_SLUGS.map((s) => COUNTRY_OF[s])).toEqual([
            "JP",
            "CN",
            "KR",
            "US",
        ]);
    });

    test("the gate needs every count, including enough supply links", () => {
        const at = { companies: 40, sites: 80, links: 30, supplyLinks: 15 };
        expect(passesGate(at)).toBe(true);
        expect(passesGate({ ...at, links: 29 })).toBe(false);
        expect(passesGate({ ...at, supplyLinks: 14 })).toBe(false);
        expect(passesGate({ ...at, sites: 79 })).toBe(false);
        expect(passesGate({ ...at, companies: 39 })).toBe(false);
    });

    test("Japan's links are tagged by kind and supply alone clears the floor", () => {
        const kinds = countryLinks("JP").map(linkKind);
        const count = (k: string) => kinds.filter((x) => x === k).length;
        expect({
            supply: count("supply"),
            investment: count("investment"),
            partnership: count("partnership"),
        }).toEqual({
            supply: 19,
            investment: 5,
            partnership: 6,
        });
        expect(coverage("JP").supplyLinks).toBeGreaterThanOrEqual(
            COVERAGE_TARGET.supplyLinks,
        );
    });

    test("pages resolve by slug or code, any case", () => {
        expect(getCountryPage("japan")?.code).toBe("JP");
        expect(getCountryPage("jp")?.path).toBe("/japan");
        expect(getCountryPage("china")).toBeUndefined();
    });
});

describe("country filter", () => {
    test("a foreign-owned plant appears on its host country's data", () => {
        // Nabtesco (JP) runs a plant in Changzhou; Harmonic Drive LLC is in the US.
        expect(countrySites("CN").some((s) => s.id === "nabtesco-changzhou")).toBe(
            true,
        );
        expect(countryCompanies("CN").some((c) => c.id === "nabtesco")).toBe(true);
        expect(
            countryCompanies("US").some((c) => c.id === "harmonic-drive-systems"),
        ).toBe(true);
        // And a foreign company without a Japanese site stays off /japan.
        expect(countryCompanies("JP").some((c) => c.id === "lynas")).toBe(false);
    });

    test("Japan spans all four segments", () => {
        const companies = countryCompanies("JP");
        for (const s of SEGMENTS)
            expect(
                companies.filter((c) => c.segment === s).length,
            ).toBeGreaterThanOrEqual(5);
    });

    test("links touch the country and include some that leave it", () => {
        const ids = new Set(countryCompanies("JP").map((c) => c.id));
        const links = countryLinks("JP");
        for (const l of links) expect(ids.has(l.from) || ids.has(l.to)).toBe(true);
        const abroad = links.filter(
            (l) =>
                getCompany(l.from)?.hqCountry !== "JP" ||
                getCompany(l.to)?.hqCountry !== "JP",
        );
        expect(abroad.length).toBeGreaterThanOrEqual(5);
    });

    test("every Japanese site has a precision and a source", () => {
        for (const s of countrySites("JP")) {
            expect(["site", "city", "region"]).toContain(s.precision);
            expect(s.sources.length).toBeGreaterThan(0);
        }
    });
});

describe("page content", () => {
    for (const page of LIVE_COUNTRY_PAGES) {
        test(`${page.slug}: clusters sit inside the country and hold sites`, () => {
            const sites = countrySites(page.code);
            for (const c of page.clusters) {
                const [minLat, minLon, maxLat, maxLon] = c.bbox;
                expect(insideCountry(page.code, minLat, minLon)).toBe(true);
                expect(insideCountry(page.code, maxLat, maxLon)).toBe(true);
                expect(clusterSites(c, sites).length).toBeGreaterThanOrEqual(2);
            }
        });

        test(`${page.slug}: each stage has a cited share or a cited gap`, () => {
            for (const s of page.stages) {
                expect(Boolean(s.share) !== Boolean(s.gap)).toBe(true);
                expect(
                    (s.share?.sources ?? s.gap?.sources ?? []).length,
                ).toBeGreaterThan(0);
                if (s.share) expect(s.share.value).toBeLessThanOrEqual(1);
            }
        });
    }

    test("world shares come from the /metals stage data, only where it exists", () => {
        expect(worldShares("magnet")?.sources).toEqual(["iea-rare-earths-2025"]);
        expect(worldShares("robot")).toBeNull();
    });
});
