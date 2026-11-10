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
    gateOf,
    getCountryPage,
    passesGate,
    worldShares,
} from "@/supply-chain/country-pages";
import { linkKind } from "@/supply-chain/links";
import { getCompany } from "@/supply-chain/registry";

describe("coverage gate", () => {
    test("Japan, China, Korea and the US pass", () => {
        expect(LIVE_COUNTRY_PATHS).toEqual(["/japan", "/china", "/korea", "/us"]);
        // Korea clears its own lower gate (tested below).
        for (const code of ["JP", "CN", "US"] as const) {
            const c = coverage(code);
            expect(c.companies).toBeGreaterThanOrEqual(COVERAGE_TARGET.companies);
            expect(c.sites).toBeGreaterThanOrEqual(COVERAGE_TARGET.sites);
            expect(c.links).toBeGreaterThanOrEqual(COVERAGE_TARGET.links);
            expect(c.supplyLinks).toBeGreaterThanOrEqual(COVERAGE_TARGET.supplyLinks);
        }
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
            // JAKA's cobots to Toyota (from /china) and one /us link are among these.
            supply: 22,
            // THK's stake in Samick THK (from /korea) is one of these.
            investment: 9,
            partnership: 8,
        });
        expect(coverage("JP").supplyLinks).toBeGreaterThanOrEqual(
            COVERAGE_TARGET.supplyLinks,
        );
    });

    test("Korea clears the lower gate its issue sets (#81: 30 / 50 / 20)", () => {
        const page = getCountryPage("korea");
        expect(page?.code).toBe("KR");
        const gate = page ? gateOf(page) : COVERAGE_TARGET;
        expect(gate).toEqual({ companies: 30, sites: 50, links: 20, supplyLinks: 10 });
        const kr = coverage("KR");
        expect(passesGate(kr, gate)).toBe(true);
        expect(kr.companies).toBeGreaterThanOrEqual(30);
        expect(kr.sites).toBeGreaterThanOrEqual(50);
        expect(kr.links).toBeGreaterThanOrEqual(20);
        // Headroom: losing a few supply links must not take the page offline.
        expect(kr.supplyLinks).toBeGreaterThanOrEqual(gate.supplyLinks + 3);
        // Japan has no gate of its own and keeps the shared target.
        const jp = getCountryPage("japan");
        expect(jp ? gateOf(jp) : null).toEqual(COVERAGE_TARGET);
    });

    test("China clears the higher gate its issue sets (#80: 150 sites, 60 links)", () => {
        const page = getCountryPage("china");
        expect(page?.code).toBe("CN");
        const gate = page ? gateOf(page) : COVERAGE_TARGET;
        expect(gate).toEqual({ companies: 40, sites: 150, links: 60, supplyLinks: 15 });
        // Never below the shared target on any count.
        expect(gate.companies).toBeGreaterThanOrEqual(COVERAGE_TARGET.companies);
        expect(gate.sites).toBeGreaterThanOrEqual(COVERAGE_TARGET.sites);
        expect(gate.links).toBeGreaterThanOrEqual(COVERAGE_TARGET.links);
        expect(gate.supplyLinks).toBeGreaterThanOrEqual(COVERAGE_TARGET.supplyLinks);
        const cn = coverage("CN");
        expect(passesGate(cn, gate)).toBe(true);
        expect(passesGate({ ...cn, sites: 149 }, gate)).toBe(false);
        expect(passesGate({ ...cn, links: 59 }, gate)).toBe(false);
    });

    test("pages resolve by slug or code, any case", () => {
        expect(getCountryPage("japan")?.code).toBe("JP");
        expect(getCountryPage("jp")?.path).toBe("/japan");
        expect(getCountryPage("JAPAN")?.code).toBe("JP");
        expect(getCountryPage("Japan")?.code).toBe("JP");
        expect(getCountryPage("JP")?.path).toBe("/japan");
        expect(getCountryPage("jP")?.path).toBe("/japan");
        expect(getCountryPage("china")?.code).toBe("CN");
        expect(getCountryPage("cn")?.path).toBe("/china");
        expect(getCountryPage("kr")?.path).toBe("/korea");
    });
});

describe("company financials", () => {
    test("computed gross margins are modeled and say how; revenue and margin share a year", () => {
        for (const c of countryCompanies("JP")) {
            if (!c.grossMargin) continue;
            expect(c.grossMargin.confidence).toBe("modeled");
            expect(c.grossMargin.note).toMatch(/^Computed as gross profit/);
            if (c.revenue) expect(c.revenue.asOf).toBe(c.grossMargin.asOf);
        }
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

    test("Korea spans all four segments, with links abroad that resolve", () => {
        const companies = countryCompanies("KR");
        for (const s of SEGMENTS)
            expect(
                companies.filter((c) => c.segment === s).length,
            ).toBeGreaterThanOrEqual(5);
        const ids = new Set(companies.map((c) => c.id));
        const links = countryLinks("KR");
        for (const l of links) {
            expect(ids.has(l.from) || ids.has(l.to)).toBe(true);
            expect(getCompany(l.from)).toBeDefined();
            expect(getCompany(l.to)).toBeDefined();
        }
        const abroad = links.filter(
            (l) =>
                getCompany(l.from)?.hqCountry !== "KR" ||
                getCompany(l.to)?.hqCountry !== "KR",
        );
        expect(abroad.length).toBeGreaterThanOrEqual(10);
        // A Korean-owned plant abroad stays off the Korea map.
        expect(countrySites("KR").some((s) => s.id === "korea-zinc-clarksville")).toBe(
            false,
        );
        expect(countrySites("US").some((s) => s.id === "korea-zinc-clarksville")).toBe(
            true,
        );
        // A foreign maker with a Korean plant is on it.
        expect(companies.some((c) => c.id === "schaeffler")).toBe(true);
        for (const s of countrySites("KR")) {
            expect(["site", "city", "region"]).toContain(s.precision);
            expect(s.sources.length).toBeGreaterThan(0);
        }
    });

    test("China spans all four segments and its links reach abroad", () => {
        const companies = countryCompanies("CN");
        for (const s of SEGMENTS)
            expect(
                companies.filter((c) => c.segment === s).length,
            ).toBeGreaterThanOrEqual(5);
        const ids = companies.map((c) => c.id);
        expect(new Set(ids).size).toBe(ids.length);
        const abroad = countryLinks("CN").filter(
            (l) =>
                getCompany(l.from)?.hqCountry !== "CN" ||
                getCompany(l.to)?.hqCountry !== "CN",
        );
        expect(abroad.length).toBeGreaterThanOrEqual(5);
        // Foreign-owned plants in China put their owners on the map.
        for (const id of ["fanuc", "kuka", "proterial"]) expect(ids).toContain(id);
    });

    test("China grows toward the #80 target with the robot and joint makers it lacked", () => {
        const cn = coverage("CN");
        expect(cn.companies).toBeGreaterThanOrEqual(84);
        expect(cn.sites).toBeGreaterThanOrEqual(142);
        expect(cn.links).toBeGreaterThanOrEqual(58);
        expect(cn.supplyLinks).toBeGreaterThanOrEqual(36);
        const ids = countryCompanies("CN").map((c) => c.id);
        for (const id of [
            "kepler",
            "booster",
            "agilex",
            "cubemars",
            "damiao",
            "jaka",
            "aubo",
        ])
            expect(ids).toContain(id);
        // Foreign plants in China put ABB, Schaeffler and Neo on the map too.
        for (const id of ["abb", "schaeffler", "neo-performance"])
            expect(ids).toContain(id);
        // The third batch adds the factories behind UBTech, AgiBot and Galbot.
        const siteIds = countrySites("CN").map((s) => s.id);
        for (const id of ["ubtech-liuzhou", "agibot-chengdu", "catl-ningde-hx"])
            expect(siteIds).toContain(id);
    });

    test("every Chinese site has a precision, a source and a point inside China", () => {
        for (const s of countrySites("CN")) {
            expect(["site", "city", "region"]).toContain(s.precision);
            expect(s.sources.length).toBeGreaterThan(0);
            expect(insideCountry("CN", s.lat, s.lon)).toBe(true);
        }
    });

    test("the US meets the issue's stricter gate across all four segments", () => {
        // #82 asks for 60 companies, 100 sites and 40 links, above the default.
        const c = coverage("US");
        expect(c.companies).toBeGreaterThanOrEqual(60);
        expect(c.sites).toBeGreaterThanOrEqual(100);
        expect(c.links).toBeGreaterThanOrEqual(40);
        expect(c.supplyLinks).toBeGreaterThanOrEqual(COVERAGE_TARGET.supplyLinks);
        const companies = countryCompanies("US");
        for (const s of SEGMENTS)
            expect(
                companies.filter((co) => co.segment === s).length,
            ).toBeGreaterThanOrEqual(8);
        const ids = companies.map((co) => co.id);
        expect(new Set(ids).size).toBe(ids.length);
        // Foreign-owned plants in the US put their owners on the map.
        for (const id of ["vac", "schaeffler", "skf", "lynas", "fanuc"])
            expect(ids).toContain(id);
        const abroad = countryLinks("US").filter(
            (l) =>
                getCompany(l.from)?.hqCountry !== "US" ||
                getCompany(l.to)?.hqCountry !== "US",
        );
        expect(abroad.length).toBeGreaterThanOrEqual(10);
    });

    test("every US site has a precision, a source, a status and a point inside the US", () => {
        for (const s of countrySites("US")) {
            expect(["site", "city", "region"]).toContain(s.precision);
            expect(s.sources.length).toBeGreaterThan(0);
            expect(s.status).toBeDefined();
            expect(insideCountry("US", s.lat, s.lon)).toBe(true);
        }
        // Plants still being built are not shown as running.
        const status = (id: string) =>
            countrySites("US").find((s) => s.id === id)?.status;
        expect(status("mp-northlake")).toBe("construction");
        expect(status("vulcan-benson")).toBe("announced");
        expect(status("lynas-seadrift")).toBe("announced");
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
                if (s.share) {
                    expect(s.share.unit).toBe("fraction");
                    expect(s.share.value).toBeGreaterThanOrEqual(0);
                    expect(s.share.value).toBeLessThanOrEqual(1);
                }
            }
        });
    }

    test("world shares come from the /metals stage data, only where it exists", () => {
        expect(worldShares("magnet")?.sources).toEqual(["iea-rare-earths-2025"]);
        expect(worldShares("robot")).toBeNull();
    });
});
