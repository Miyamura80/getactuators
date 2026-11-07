import { describe, expect, test } from "bun:test";
import { CountryListSchema, CountrySchema } from "@/api/countries";
import {
    COVERAGE_TARGET,
    countryCompanies,
    countryLinks,
    countrySites,
    coverage,
} from "@/supply-chain/country-pages";
import { get, getMarkdown } from "./agent-helpers";
import { callTool } from "./mcp-helpers";

const ldNodes = (html: string) =>
    [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
        .map((m) => JSON.stringify(JSON.parse(m[1] ?? "{}")))
        .join("\n");

// Data rows of the twin's Sites table (header and rule excluded).
const siteRows = (md: string) =>
    (md.split("\n## Sites")[1]?.split("\n## Links")[0] ?? "")
        .split("\n")
        .filter(
            (l) =>
                l.startsWith("| ") && !l.startsWith("| Site") && !l.startsWith("| ---"),
        );

describe("/japan page and twin", () => {
    test("serves the SPA with Place and ItemList JSON-LD and is linked site-wide", async () => {
        const res = await get("/japan");
        expect(res.status).toBe(200);
        const html = await res.text();
        expect(html).toContain("<title>Japan: actuator supply chain");
        const ld = ldNodes(html);
        expect(ld).toContain('"@type":"Country"');
        expect(ld).toContain('"@type":"ItemList"');
        expect(ld).toContain('"@type":"Organization"');
        expect(ld).toContain('"@type":"GeoCoordinates"');
        expect(ld).toContain('"name":"Harmonic Drive Systems"');
        expect(await (await get("/sitemap.xml")).text()).toContain("/japan");
        const llms = await (await get("/llms.txt")).text();
        expect(llms).toContain("/japan.md");
        expect(llms).toContain('get_country("JP")');
        expect(html).toContain('<a href="/japan"');
        // Stage shares, policies and the data tables sit in a section outside
        // #root, so React mounting into #root leaves them in place.
        let total = 0;
        let insideRoot = 0;
        new HTMLRewriter()
            .on("section#catalog-content", { element: () => void total++ })
            .on("#root section#catalog-content", { element: () => void insideRoot++ })
            .transform(html);
        expect(total).toBe(1);
        expect(insideRoot).toBe(0);
        const persistent = html.split('id="catalog-content"')[1] ?? "";
        expect(persistent).toContain("Share of each stage");
        expect(persistent).toContain("jp-espa-hds-reducers-2023");
    });

    test("every planned country passes the gate and is routed", async () => {
        for (const path of ["/japan", "/china", "/korea", "/us"])
            expect((await get(path)).status).toBe(200);
        expect((await get("/germany")).status).toBe(404);
    });

    test("markdown twin: overview, policies, clusters, companies, sites, links, sources", async () => {
        for (const res of [await get("/japan.md"), await getMarkdown("/japan")]) {
            expect(res.status).toBe(200);
            const md = await res.text();
            for (const h of [
                "## Share of each stage",
                "## Policies",
                "## Clusters",
                "## Companies",
                "## Sites",
                "## Links",
                "## Sources",
            ])
                expect(md).toContain(h);
            for (const c of countryCompanies("JP")) expect(md).toContain(`\`${c.id}\``);
            expect(siteRows(md)).toHaveLength(countrySites("JP").length);
            expect(md).toContain("/policy#measure=jp-espa-hds-reducers-2023");
            expect(md).toContain("**Nagano precision belt**");
            // Revenue is a converted estimate, with its footnote.
            expect(md).toMatch(/~\$5\.53-5\.92B\[\^\d+\]/);
            expect(md).toMatch(/\[\^\d+\]: FANUC, "Production: factories in Japan"/);
            expect(md).not.toContain(String.fromCharCode(0x2014));
        }
    });
});

describe("/korea page and twin", () => {
    test("is routed, in nav, sitemap and llms.txt, with Korean companies in JSON-LD", async () => {
        const res = await get("/korea");
        expect(res.status).toBe(200);
        const html = await res.text();
        expect(html).toContain("<title>South Korea: actuator supply chain");
        const ld = ldNodes(html);
        expect(ld).toContain('"@type":"Country"');
        expect(ld).toContain('"name":"Rainbow Robotics"');
        expect(html).toContain('<a href="/korea"');
        expect(await (await get("/sitemap.xml")).text()).toContain("/korea");
        const llms = await (await get("/llms.txt")).text();
        expect(llms).toContain("/korea.md");
        expect(llms).toContain('get_country("KR")');
    });

    test("markdown twin lists every company and site, with policies and clusters", async () => {
        const md = await (await get("/korea.md")).text();
        for (const h of [
            "## Share of each stage",
            "## Policies",
            "## Clusters",
            "## Sites",
            "## Links",
        ])
            expect(md).toContain(h);
        for (const c of countryCompanies("KR")) expect(md).toContain(`\`${c.id}\``);
        expect(siteRows(md)).toHaveLength(countrySites("KR").length);
        expect(md).toContain("/policy#measure=kr-k-humanoid-2025");
        expect(md).toContain("**Changwon machinery cluster**");
        expect(md).not.toContain(String.fromCharCode(0x2014));
    });

    test("REST and MCP return Korea with its coverage and links abroad", async () => {
        const body = CountrySchema.parse(
            await (await get("/api/v1/countries/korea")).json(),
        );
        expect(body.code).toBe("KR");
        // Korea's own gate (issue #81): 30 companies, 50 sites, 20 links, 10 supply.
        const { supplyLinks, ...counts } = coverage("KR");
        expect(body.coverage).toEqual({ ...counts, supply_links: supplyLinks });
        expect(body.coverage.companies).toBeGreaterThanOrEqual(30);
        expect(body.coverage.sites).toBeGreaterThanOrEqual(50);
        expect(body.coverage.links).toBeGreaterThanOrEqual(20);
        expect(body.coverage.supply_links).toBeGreaterThanOrEqual(10);
        expect((await get("/api/v1/countries/korea.md")).status).toBe(200);
        expect(body.sites.map((s) => s.id)).toEqual(
            countrySites("KR").map((s) => s.id),
        );
        expect(
            body.links.some((l) => l.from === "arafura" && l.to === "hyundai-motor"),
        ).toBe(true);
        const out = CountrySchema.parse(
            (await callTool("get_country", { code: "KR" })).structuredContent,
        );
        expect(out.name).toBe("South Korea");
        expect(out.companies.length).toBeGreaterThanOrEqual(30);
    });
});

describe("/china page and twin", () => {
    test("is routed, linked site-wide, in the sitemap and in llms.txt", async () => {
        const res = await get("/china");
        expect(res.status).toBe(200);
        const html = await res.text();
        expect(html).toContain("<title>China: actuator supply chain");
        expect(ldNodes(html)).toContain('"name":"JL MAG Rare-Earth"');
        expect(html).toContain('<a href="/china"');
        expect(await (await get("/sitemap.xml")).text()).toContain("/china");
        const llms = await (await get("/llms.txt")).text();
        expect(llms).toContain("/china.md");
        expect(llms).toContain('get_country("CN")');
    });

    test("markdown twin lists every company and site, with sources", async () => {
        const md = await (await get("/china.md")).text();
        for (const h of [
            "## Share of each stage",
            "## Policies",
            "## Clusters",
            "## Companies",
            "## Sites",
            "## Links",
            "## Sources",
        ])
            expect(md).toContain(h);
        for (const c of countryCompanies("CN")) expect(md).toContain(`\`${c.id}\``);
        expect(siteRows(md)).toHaveLength(countrySites("CN").length);
        expect(md).toContain("**Baotou rare earth hub**");
        expect(md).not.toContain(String.fromCharCode(0x2014));
    });

    test("REST and MCP return China's filtered registry", async () => {
        const res = await get("/api/v1/countries/china");
        expect(res.status).toBe(200);
        const body = CountrySchema.parse(await res.json());
        expect(body.code).toBe("CN");
        expect(body.sites.map((s) => s.id)).toEqual(
            countrySites("CN").map((s) => s.id),
        );
        expect(body.links.length).toBe(countryLinks("CN").length);
        const baotou = body.clusters.find((c) => c.id === "baotou-ree");
        expect(baotou?.site_ids).toContain("baotou-steel-bayan-obo");
        const out = CountrySchema.parse(
            (await callTool("get_country", { code: "CN" })).structuredContent,
        );
        expect(out.name).toBe("China");
        expect(
            out.links.some(
                (l) =>
                    l.from === "baotou-steel" && l.to === "china-northern-rare-earth",
            ),
        ).toBe(true);
    });
});

describe("/us page and twin", () => {
    test("is routed, linked site-wide, in the sitemap and in llms.txt", async () => {
        const res = await get("/us");
        expect(res.status).toBe(200);
        const html = await res.text();
        expect(html).toContain("<title>United States: actuator supply chain");
        expect(ldNodes(html)).toContain('"name":"MP Materials"');
        expect(html).toContain('<a href="/us"');
        expect(await (await get("/sitemap.xml")).text()).toContain("/us<");
        const llms = await (await get("/llms.txt")).text();
        expect(llms).toContain("/us.md");
        expect(llms).toContain('get_country("US")');
    });

    test("markdown twin lists every company and site, with sources", async () => {
        const md = await (await get("/us.md")).text();
        for (const h of [
            "## Share of each stage",
            "## Policies",
            "## Clusters",
            "## Companies",
            "## Sites",
            "## Links",
            "## Sources",
        ])
            expect(md).toContain(h);
        for (const c of countryCompanies("US")) expect(md).toContain(`\`${c.id}\``);
        expect(siteRows(md)).toHaveLength(countrySites("US").length);
        expect(md).toContain("**Texas magnets and humanoids**");
        expect(md).toContain("/policy#measure=");
        expect(md).not.toContain(String.fromCharCode(0x2014));
    });

    test("REST and MCP return the US filtered registry", async () => {
        const res = await get("/api/v1/countries/us");
        expect(res.status).toBe(200);
        const body = CountrySchema.parse(await res.json());
        expect(body.code).toBe("US");
        expect(body.sites.map((s) => s.id)).toEqual(
            countrySites("US").map((s) => s.id),
        );
        expect(body.links.length).toBe(countryLinks("US").length);
        expect(body.policies.length).toBeGreaterThan(5);
        const texas = body.clusters.find((c) => c.id === "texas-corridor");
        expect(texas?.site_ids).toContain("mp-northlake");
        const out = CountrySchema.parse(
            (await callTool("get_country", { code: "US" })).structuredContent,
        );
        expect(out.name).toBe("United States");
        expect(
            out.links.some(
                (l) => l.from === "mp-materials" && l.to === "general-motors",
            ),
        ).toBe(true);
    });
});

describe("REST /api/v1/countries", () => {
    test("lists live countries with coverage", async () => {
        const res = await get("/api/v1/countries");
        expect(res.status).toBe(200);
        const body = CountryListSchema.parse(await res.json());
        expect(body.results.map((r) => r.code)).toEqual(["JP", "CN", "KR", "US"]);
        const cov = body.results[0]?.coverage;
        expect(cov?.companies).toBeGreaterThanOrEqual(COVERAGE_TARGET.companies);
        expect(cov?.sites).toBeGreaterThanOrEqual(COVERAGE_TARGET.sites);
        expect(cov?.links).toBeGreaterThanOrEqual(COVERAGE_TARGET.links);
        expect(cov?.supply_links).toBeGreaterThanOrEqual(COVERAGE_TARGET.supplyLinks);
    });

    test("returns one country by code or slug, with the full filtered registry", async () => {
        for (const key of ["JP", "jp", "japan"]) {
            const res = await get(`/api/v1/countries/${key}`);
            expect(res.status).toBe(200);
            const body = CountrySchema.parse(await res.json());
            expect(body.code).toBe("JP");
            expect(body.companies.map((c) => c.id)).toEqual(
                countryCompanies("JP").map((c) => c.id),
            );
            expect(body.sites.map((s) => s.id)).toEqual(
                countrySites("JP").map((s) => s.id),
            );
            expect(body.links.map((l) => [l.from, l.to, l.what])).toEqual(
                countryLinks("JP").map((l) => [l.from, l.to, l.what]),
            );
            const magnets = body.stage_shares.find((s) => s.stage === "magnet");
            expect(magnets?.share?.confidence).toBe("estimated");
            expect(magnets?.world_leader?.country).toBe("CN");
            const nagano = body.clusters.find((c) => c.id === "nagano-precision");
            expect(nagano?.site_ids).toContain("hds-hotaka");
            expect(
                body.policies.some((p) => p.id === "jp-espa-yaskawa-servo-2023"),
            ).toBe(true);
        }
    });

    test("404s for a country that is not live, and is in the OpenAPI document", async () => {
        const res = await get("/api/v1/countries/DE");
        expect(res.status).toBe(404);
        expect((await get("/api/v1/countries/DE.md")).status).toBe(404);
        expect(res.headers.get("content-type")).toContain("application/problem+json");
        const openapi = await (await get("/openapi.json")).json();
        expect(Object.keys(openapi.paths)).toContain("/api/v1/countries/{code}");
    });
});

describe("MCP get_country", () => {
    test("returns the same shape as REST and rejects unknown countries", async () => {
        const out = CountrySchema.parse(
            (await callTool("get_country", { code: "JP" })).structuredContent,
        );
        expect(out.name).toBe("Japan");
        expect(out.links.some((l) => l.from === "lynas" && l.to === "jare")).toBe(true);
        expect((await callTool("get_country", { code: "ZZ" })).isError).toBe(true);
    });
});
