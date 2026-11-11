import { describe, expect, test } from "bun:test";
import { PatentLandscapeSchema } from "@/api/patents";
import { LANDSCAPE, TECHNOLOGIES } from "@/patents";
import { get as getShared } from "./agent-helpers";
import { callTool } from "./mcp-helpers";

// A client key of its own keeps these requests out of the shared API
// rate-limit window the rest of the server suite runs in.
const KEY = { "x-forwarded-for": "patents-test" };
const get = (path: string) => getShared(path, KEY);
const getMarkdown = (path: string) =>
    getShared(path, { ...KEY, accept: "text/markdown" });

function jsonLd(html: string): { "@graph": Record<string, unknown>[] } {
    const m = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html);
    return JSON.parse(m?.[1] ?? "{}");
}

describe("/patents", () => {
    test("serves the SPA shell with a Dataset carrying the methodology", async () => {
        const res = await get("/patents");
        expect(res.status).toBe(200);
        const html = await res.text();
        expect(html).toContain("<title>Actuator patents | actuatorlist</title>");
        const ds = jsonLd(html)["@graph"].find((n) => n["@type"] === "Dataset") as {
            license: string;
            temporalCoverage: string;
            measurementTechnique: string;
            distribution: unknown[];
        };
        expect(ds.license).toContain("creativecommons.org/licenses/by/4.0");
        expect(ds.temporalCoverage).toBe("2010/2026");
        expect(ds.measurementTechnique).toContain("family_id");
        expect(ds.measurementTechnique).toContain("first assignee");
        expect(ds.distribution).toHaveLength(TECHNOLOGIES.length);
        expect((await get("/patents?technology=ndfeb")).status).toBe(200);
    });

    test("the .md twin has per-technology year x country and assignee tables", async () => {
        for (const res of [await get("/patents.md"), await getMarkdown("/patents")]) {
            expect(res.headers.get("content-type")).toBe(
                "text/markdown; charset=utf-8",
            );
            const md = await res.text();
            expect(md).toContain('title: "Actuator patents"');
            for (const t of TECHNOLOGIES) expect(md).toContain(`## ${t.label}`);
            expect(md).toMatch(/\| Priority year \| CN \| JP \|/);
            expect(md).toContain("| # | Assignee | Country | Families | Share | CAGR");
            expect(md).toContain(`${LANDSCAPE.completeThrough + 1} (incomplete)`);
            expect(md).toContain("Lens.org");
            expect(md).toContain("### Quality filters");
            expect(md).toContain("| 2+ offices |");
            expect(md).toContain("### Value vs volume");
            expect(md).toMatch(/\d+% of non-Chinese and \d+% of Chinese families/);
            expect(md).toContain("### Where it ends up");
            expect(md).toContain("| Technology | Vehicles & EVs |");
            expect(md).toContain("patents.google.com/patent/");
            expect(md).not.toContain(String.fromCharCode(0x2014));
        }
    });

    test("is in llms.txt, the sitemap and the footer", async () => {
        expect(await (await get("/llms.txt")).text()).toContain("/patents.md");
        expect(await (await get("/sitemap.xml")).text()).toContain("/patents</loc>");
        expect(await (await get("/")).text()).toContain(
            '<a href="/patents">Actuator patents</a>',
        );
    });
});

describe("REST /api/v1/patents/{technology}", () => {
    test("returns one technology's landscape in the documented shape", async () => {
        const res = await get("/api/v1/patents/strain-wave");
        expect(res.status).toBe(200);
        const body = PatentLandscapeSchema.parse(await res.json());
        expect(body.technology).toBe("strain-wave");
        expect(body.families).toBe(LANDSCAPE.technologies["strain-wave"].families);
        expect(body.cpc_codes.map((c) => c.code)).toContain("F16H49/001");
        expect(body.per_year.reduce((s, y) => s + y.families, 0)).toBe(body.families);
        expect(body.per_year.at(-1)?.incomplete).toBe(true);
        expect(body.top_assignees).toHaveLength(15);
        expect(
            body.top_assignees.some((a) => a.company_id === "harmonic-drive-systems"),
        ).toBe(true);
        expect(body.top_families).toHaveLength(50);
        for (const y of body.per_year) {
            expect(y.granted).toBeLessThanOrEqual(y.families);
            expect(y.triadic).toBeLessThanOrEqual(y.intl);
        }
        expect(body.value.assignees.length).toBeLessThanOrEqual(40);
        expect(body.value.cn_intl_share).toBeLessThan(body.value.rest_intl_share);
        expect(body.value.years).toEqual([2010, LANDSCAPE.completeThrough]);
        expect(body.application_areas.map((a) => a.id)).toContain("robots");
        expect(body.area_windows.early).toEqual([2010, 2017]);
        expect(body.top_families[0]?.url).toMatch(
            /^https:\/\/patents\.google\.com\/patent\/[A-Z]{2}\d/,
        );
        expect(
            body.sources.find((s) => s.id === "google-patents-public-data")?.reuse,
        ).toBe("open");
    });

    test("takes all and a family limit, 404s an unknown technology, 400s a bad limit", async () => {
        const all = PatentLandscapeSchema.parse(
            await (await get("/api/v1/patents/all?limit=5")).json(),
        );
        expect(all.families).toBe(LANDSCAPE.all.families);
        expect(all.top_families).toHaveLength(5);
        expect((await get("/api/v1/patents/warp-drive")).status).toBe(404);
        expect((await get("/api/v1/patents/ndfeb?limit=500")).status).toBe(400);
    });

    test("has a markdown twin and an OpenAPI entry", async () => {
        const md = await (await get("/api/v1/patents/ndfeb.md")).text();
        expect(md).toContain("# Patent landscape: NdFeB magnets");
        expect(md).toContain("`H01F41/0293`");
        expect(md).toContain("| Year | Families | Granted | 2+ offices | US+EP+JP |");
        expect(md).toContain("| Area | Families | Share | Early | Late |");
        const spec = (await (await get("/openapi.json")).json()) as {
            paths: Record<string, unknown>;
        };
        expect(Object.keys(spec.paths)).toContain("/api/v1/patents/{technology}");
        const schema = JSON.stringify(spec);
        expect(schema).toContain("application_areas");
        expect(schema).toContain("rest_intl_share");
    });
});

describe("MCP get_patent_landscape", () => {
    test("returns the same view as REST", async () => {
        const r = await callTool("get_patent_landscape", {
            technology: "eha",
            limit: 3,
        });
        const view = PatentLandscapeSchema.parse(r.structuredContent);
        expect(view.technology).toBe("eha");
        expect(view.top_families).toHaveLength(3);
        expect(view.value.assignees.length).toBeGreaterThan(0);
        expect(view.application_areas).toHaveLength(9);
        const rest = PatentLandscapeSchema.parse(
            await (await get("/api/v1/patents/eha?limit=3")).json(),
        );
        expect(view).toEqual(rest);
    });
});
