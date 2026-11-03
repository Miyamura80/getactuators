import { describe, expect, test } from "bun:test";
import { CountryListSchema, CountrySchema } from "@/api/countries";
import {
    countryCompanies,
    countryLinks,
    countrySites,
} from "@/supply-chain/country-pages";
import { get, getMarkdown } from "./agent-helpers";
import { callTool } from "./mcp-helpers";

const ldNodes = (html: string) =>
    [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
        .map((m) => JSON.stringify(JSON.parse(m[1] ?? "{}")))
        .join("\n");

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
    });

    test("countries without a dataset past the gate are not routed", async () => {
        for (const path of ["/china", "/korea", "/us"])
            expect((await get(path)).status).toBe(404);
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
            const siteRows = md.split("\n## Sites")[1]?.split("\n## Links")[0] ?? "";
            expect(
                siteRows
                    .split("\n")
                    .filter(
                        (l) =>
                            l.startsWith("| ") &&
                            !l.startsWith("| Site") &&
                            !l.startsWith("| ---"),
                    ),
            ).toHaveLength(countrySites("JP").length);
            expect(md).toContain("/policy#measure=jp-espa-hds-reducers-2023");
            expect(md).toContain("**Nagano precision belt**");
            // Revenue is a converted estimate, with its footnote.
            expect(md).toMatch(/~\$5\.53-5\.92B\[\^\d+\]/);
            expect(md).toMatch(/\[\^\d+\]: FANUC, "Production: factories in Japan"/);
            expect(md).not.toContain(String.fromCharCode(0x2014));
        }
    });
});

describe("REST /api/v1/countries", () => {
    test("lists live countries with coverage", async () => {
        const res = await get("/api/v1/countries");
        expect(res.status).toBe(200);
        const body = CountryListSchema.parse(await res.json());
        expect(body.results.map((r) => r.code)).toEqual(["JP"]);
        expect(body.results[0]?.coverage.companies).toBeGreaterThanOrEqual(40);
    });

    test("returns one country by code or slug, with the full filtered registry", async () => {
        for (const key of ["JP", "jp", "japan"]) {
            const res = await get(`/api/v1/countries/${key}`);
            expect(res.status).toBe(200);
            const body = CountrySchema.parse(await res.json());
            expect(body.code).toBe("JP");
            expect(body.companies).toHaveLength(countryCompanies("JP").length);
            expect(body.sites).toHaveLength(countrySites("JP").length);
            expect(body.links).toHaveLength(countryLinks("JP").length);
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
        const res = await get("/api/v1/countries/CN");
        expect(res.status).toBe(404);
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
