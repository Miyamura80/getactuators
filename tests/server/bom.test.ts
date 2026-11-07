import { describe, expect, test } from "bun:test";
import { BomCaseSchema, BomListSchema } from "@/api/bom";
import { SITE_URL } from "@/server/site";
import { BOM_CASES, flatten } from "@/supply-chain/bom";
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

describe("/bom pages and twins", () => {
    test("the index serves the SPA with a Dataset per case and is linked site-wide", async () => {
        const res = await get("/bom");
        expect(res.status).toBe(200);
        const html = await res.text();
        expect(html).toContain("<title>Actuator bills of materials");
        const sets = jsonLd(html).filter((n) => n["@type"] === "Dataset");
        expect(sets).toHaveLength(BOM_CASES.length);
        expect(await (await get("/sitemap.xml")).text()).toContain("/bom/unitree-qdd");
        expect(await (await get("/llms.txt")).text()).toContain("/bom.md");
        expect(html).toContain('<a href="/bom"');
    });

    test("a case page links its Dataset to the catalog Product", async () => {
        const html = await (await get("/bom/unitree-qdd")).text();
        const nodes = jsonLd(html);
        const dataset = nodes.find((n) => n["@type"] === "Dataset") as {
            about?: { "@id": string };
            distribution: { contentUrl: string }[];
        };
        expect(dataset.distribution.map((d) => d.contentUrl)).toContain(
            `${SITE_URL}/api/v1/bom/unitree-qdd`,
        );
        expect(dataset.about?.["@id"]).toBe(
            `${SITE_URL}/actuators/unitree-go-m8010-6#product`,
        );
        expect(nodes.some((n) => n["@type"] === "Product")).toBe(true);
        expect((await get("/bom/no-such-case")).status).toBe(404);
    });

    const HEADINGS = [
        "## Bill of materials",
        "## Raw materials",
        "## Margin capture",
        "## Method",
        "## Sources",
    ];
    const checkTwin = (md: string, ids: string[]) => {
        for (const h of HEADINGS) expect(md).toMatch(new RegExp(`^${h}$`, "m"));
        for (const id of ids) expect(md).toContain(`(\`${id}\`)`);
        expect(md).not.toContain(String.fromCharCode(0x2014));
    };

    test("case twins carry the BOM, materials, margin and source sections", async () => {
        for (const c of BOM_CASES) {
            const ids = flatten(c.root)
                .filter((p) => p.node.kind !== "material")
                .map((p) => p.node.id);
            for (const res of [
                await get(`/bom/${c.slug}.md`),
                await getMarkdown(`/bom/${c.slug}`),
            ]) {
                expect(res.status).toBe(200);
                checkTwin(await res.text(), ids);
            }
        }
        const index = await (await get("/bom.md")).text();
        for (const c of BOM_CASES) expect(index).toContain(`(\`${c.slug}\`)`);
    });
});

describe("REST /api/v1/bom", () => {
    test("lists the cases and returns one tree with metrics", async () => {
        const list = BomListSchema.parse(await (await get("/api/v1/bom")).json());
        expect(list.cases.map((c) => c.slug)).toEqual(BOM_CASES.map((c) => c.slug));
        const one = BomCaseSchema.parse(
            await (await get("/api/v1/bom/optimus-linear")).json(),
        );
        expect(one.nodes[0]?.parent_id).toBeNull();
        const screw = one.nodes.find((n) => n.id === "roller-screw");
        expect(screw?.unit_cost?.confidence).toBe("modeled");
        expect(screw?.idiot_index).toBeGreaterThan(100);
        expect(
            one.nodes.find((n) => n.id === "rotor-magnet")?.process_step_ids,
        ).toContain("sintering");
        expect(
            one.margin_capture.tiers.find((t) => t.company_id === "sanhua")
                ?.representative,
        ).toBe(false);
        const missing = await get("/api/v1/bom/steam-engine");
        expect(missing.status).toBe(404);
        expect(await missing.text()).toContain("unitree-qdd");
    });
});

describe("MCP BOM tools", () => {
    test("list_bom_cases and get_bom", async () => {
        const list = BomListSchema.parse(
            (await callTool("list_bom_cases", {})).structuredContent,
        );
        expect(list.cases).toHaveLength(3);
        const one = BomCaseSchema.parse(
            (await callTool("get_bom", { slug: "unitree-qdd" })).structuredContent,
        );
        expect(one.actuator_id).toBe("unitree-go-m8010-6");
        expect(one.margin_capture.tiers[0]?.company_id).toBe("unitree");
    });
});
