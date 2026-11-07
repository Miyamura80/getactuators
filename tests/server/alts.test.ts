import { describe, expect, test } from "bun:test";
import { AltTechListSchema, AltTechSchema } from "@/api/alts";
import { SITE_URL } from "@/server/site";
import { ALT_TECHS, DEPLOYMENTS, MARKET_SLICES } from "@/supply-chain/alts";
import { get, getMarkdown } from "./agent-helpers";
import { callTool } from "./mcp-helpers";

function jsonLd(html: string): Record<string, unknown>[] {
    return [
        ...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g),
    ].flatMap((m) => {
        const doc = JSON.parse(m[1] ?? "{}") as {
            "@graph"?: Record<string, unknown>[];
        };
        return doc["@graph"] ?? [doc as Record<string, unknown>];
    });
}

describe("/alts page and twin", () => {
    test("serves the SPA with Dataset JSON-LD and is linked site-wide", async () => {
        const res = await get("/alts");
        expect(res.status).toBe(200);
        const html = await res.text();
        expect(html).toContain("<title>Alternatives to rare-earth actuators");
        const dataset = jsonLd(html).find((n) => n["@type"] === "Dataset") as {
            distribution: { contentUrl: string }[];
        };
        expect(dataset.distribution.map((d) => d.contentUrl)).toContain(
            `${SITE_URL}/api/v1/alts`,
        );
        expect(await (await get("/sitemap.xml")).text()).toContain("/alts");
        expect(await (await get("/llms.txt")).text()).toContain("/alts.md");
        expect(html).toContain('<a href="/alts"');
    });

    test("markdown twin has the technology, market and deployment tables", async () => {
        for (const res of [await get("/alts.md"), await getMarkdown("/alts")]) {
            expect(res.status).toBe(200);
            const md = await res.text();
            for (const h of [
                "## Technologies",
                "## Markets",
                "## Methodology",
                "## Deployments",
                "## Sources",
            ])
                expect(md).toMatch(new RegExp(`^${h}$`, "m"));
            for (const t of ALT_TECHS) expect(md).toContain(`(\`${t.id}\`)`);
            for (const s of MARKET_SLICES) expect(md).toContain(s.label);
            expect(md.match(/^- \d{4}/gm)).toHaveLength(DEPLOYMENTS.length);
            expect(md).toContain("(announced)");
            expect(md).toContain("(retired)");
            expect(md).not.toContain(String.fromCharCode(0x2014));
        }
    });
});

describe("REST /api/v1/alts", () => {
    test("lists every technology and filters by family", async () => {
        const all = AltTechListSchema.parse(await (await get("/api/v1/alts")).json());
        expect(all.results.map((t) => t.id)).toEqual(ALT_TECHS.map((t) => t.id));
        const muscles = AltTechListSchema.parse(
            await (await get("/api/v1/alts?family=artificial-muscle")).json(),
        );
        expect(muscles.results.every((t) => t.family === "artificial-muscle")).toBe(
            true,
        );
        expect(muscles.count).toBe(6);
        expect((await get("/api/v1/alts?family=steam")).status).toBe(400);
    });

    test("one technology carries TRL, milestones, markets and deployments with sources", async () => {
        const t = AltTechSchema.parse(
            await (await get("/api/v1/alts/iron-nitride")).json(),
        );
        expect(t.trl.confidence).toBe("modeled");
        expect(t.trl.sources.length).toBeGreaterThan(0);
        expect(t.milestones.find((m) => m.announced)?.year.value).toBe(2027);
        expect(t.ree_intensity_kg_per_kw?.value).toBe(0);
        expect(t.players.map((p) => p.company_id)).toEqual(["niron-magnetics"]);
        expect(t.deployments[0]?.status).toBe("pilot");
        const srm = AltTechSchema.parse(
            await (await get("/api/v1/alts/switched-reluctance")).json(),
        );
        expect(srm.markets[0]?.revenue_usd.sources[0]?.publisher).toContain(
            "Market Glass",
        );
        const missing = await get("/api/v1/alts/steam-engine");
        expect(missing.status).toBe(404);
        expect(await missing.text()).toContain("hasel");
    });
});

describe("MCP alt technology tools", () => {
    test("list_alt_technologies filters, get_alt_technology returns one", async () => {
        const list = AltTechListSchema.parse(
            (await callTool("list_alt_technologies", { family: "transmission" }))
                .structuredContent,
        );
        expect(list.results.map((t) => t.id)).toEqual([
            "cycloidal",
            "cable-capstan",
            "roller-screw",
            "magnetic-gear",
        ]);
        const one = AltTechSchema.parse(
            (await callTool("get_alt_technology", { id: "hasel" })).structuredContent,
        );
        expect(one.specific_power_w_per_kg?.value).toBe(600);
        expect(one.scene_id).toBe("hasel-loop");
    });
});
