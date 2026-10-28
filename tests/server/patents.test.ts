import { describe, expect, test } from "bun:test";
import { PatentLandscapeSchema, PatentTechnologyListSchema } from "@/api/patents";
import { LANDSCAPE, isCollected } from "@/patents/landscape";
import { getTechnology } from "@/patents/technologies";
import { patentLandscapeView } from "@/patents/views";
import { patentsBody } from "@/server/agent/market/patents";
import { FIXTURE } from "../patents/fixture";
import { get, getMarkdown } from "./agent-helpers";
import { callTool } from "./mcp-helpers";

const collected = isCollected(LANDSCAPE);

describe("/patents page and twin", () => {
    test("serves the SPA with a Dataset node; indexed only with a snapshot", async () => {
        const res = await get("/patents");
        expect(res.status).toBe(200);
        const html = await res.text();
        expect(html).toContain("<title>Actuator patent landscape");
        expect(html).toContain('"@type":"Dataset"');
        const sitemap = await (await get("/sitemap.xml")).text();
        const llms = await (await get("/llms.txt")).text();
        if (collected) {
            expect(sitemap).toContain("/patents");
            expect(llms).toContain("/patents.md");
        } else {
            expect(html).toContain('<meta name="robots" content="noindex, follow">');
            expect(sitemap).not.toContain("/patents");
            expect(llms).not.toContain("/patents.md");
        }
    });

    test("markdown twin lists every technology's CPC scope", async () => {
        for (const res of [await get("/patents.md"), await getMarkdown("/patents")]) {
            expect(res.status).toBe(200);
            const md = await res.text();
            expect(md).toContain("## Strain-wave (harmonic) gears");
            expect(md).toContain("| `F16H49/001` | prefix | Wave gearings");
            expect(md).toContain("## NdFeB magnets");
            if (!collected) expect(md).toContain("has not been collected yet");
            expect(md).not.toContain(String.fromCharCode(0x2014));
        }
    });

    test("with data the twin has year x country and assignee tables", () => {
        const md = patentsBody(FIXTURE);
        expect(md).toContain("Snapshot collected 2026-10-01");
        expect(md).toContain("40 families since 2010.");
        expect(md).toContain("| 2021 | 20 | 0 | 5 | 0 | 25 |");
        expect(md).toContain("| 2025 (incomplete) |");
        expect(md).toMatch(
            /\| 1 \| \[Harmonic Drive Systems\]\(https:\/\/actuatorlist\.com\/api\/v1\/companies\/harmonic-drive-systems\) \| .* \| 30 \| 75% \| -100% \|/,
        );
        expect(md).toContain("Top five hold 100% of families.");
    });
});

describe("REST /api/v1/patents", () => {
    test("lists nine technologies with their codes", async () => {
        const body = PatentTechnologyListSchema.parse(
            await (await get("/api/v1/patents")).json(),
        );
        expect(body.data).toHaveLength(9);
        expect(body.status).toBe(collected ? "collected" : "not_collected");
        expect(body.data.find((t) => t.id === "strain-wave")?.cpc[0]?.code).toBe(
            "F16H49/001",
        );
    });

    test("one technology, and 404 for an unknown one", async () => {
        const res = await get("/api/v1/patents/ndfeb?families=5");
        expect(res.status).toBe(200);
        const body = PatentLandscapeSchema.parse(await res.json());
        expect(body.technology.id).toBe("ndfeb");
        expect(body.top_families.length).toBeLessThanOrEqual(5);
        if (!collected) expect(body.by_year_country).toEqual([]);
        const missing = await get("/api/v1/patents/warp-drive");
        expect(missing.status).toBe(404);
        expect(((await missing.json()) as { hint: string }).hint).toContain(
            "strain-wave",
        );
        expect((await get("/api/v1/patents/ndfeb?families=500")).status).toBe(400);
    });

    test("is in the OpenAPI document", async () => {
        const spec = (await (await get("/openapi.json")).json()) as {
            paths: Record<string, unknown>;
        };
        expect(Object.keys(spec.paths)).toContain("/api/v1/patents");
        expect(Object.keys(spec.paths)).toContain("/api/v1/patents/{technology}");
    });

    test("view over data links registry companies and Google Patents", () => {
        const t = getTechnology("strain-wave");
        if (!t) throw new Error("strain-wave missing");
        const v = PatentLandscapeSchema.parse(patentLandscapeView(t, 2, FIXTURE));
        expect(v.status).toBe("collected");
        expect(v.first_incomplete_year).toBe(2025);
        expect(v.top_assignees[0]).toMatchObject({
            company_id: "harmonic-drive-systems",
            families: 30,
            share: 0.75,
        });
        expect(v.top_families).toHaveLength(2);
        expect(v.top_families[0]?.url).toMatch(
            /^https:\/\/patents\.google\.com\/patent\//,
        );
    });
});

describe("MCP get_patent_landscape", () => {
    test("returns the scope and status", async () => {
        const out = PatentLandscapeSchema.parse(
            (await callTool("get_patent_landscape", { technology: "cycloidal" }))
                .structuredContent,
        );
        expect(out.technology.cpc.map((c) => c.code)).toEqual([
            "F16H1/32",
            "F16H2001/32",
        ]);
        expect(out.status).toBe(collected ? "collected" : "not_collected");
    });
});
