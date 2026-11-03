import { describe, expect, test } from "bun:test";
import { OpenRobotListSchema, OpenRobotSchema } from "@/api/open-robots";
import { OPEN_ROBOTS } from "@/open-source";
import { get, getMarkdown } from "./agent-helpers";
import { callTool } from "./mcp-helpers";

function jsonLd(html: string): { "@graph": Record<string, unknown>[] } {
    const m = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html);
    return JSON.parse(m?.[1] ?? "{}");
}

describe("/open-source", () => {
    test("serves the SPA shell with an ItemList of Product / CreativeWork carrying licences", async () => {
        const res = await get("/open-source");
        expect(res.status).toBe(200);
        const html = await res.text();
        expect(html).toContain("<title>Open-source robots | actuatorlist</title>");
        const list = jsonLd(html)["@graph"].find((n) => n["@type"] === "ItemList") as {
            numberOfItems: number;
            itemListElement: {
                item: { "@type": string[]; name: string; license?: string[] };
            }[];
        };
        expect(list.numberOfItems).toBe(OPEN_ROBOTS.length);
        for (const e of list.itemListElement)
            expect(e.item["@type"]).toEqual(["Product", "CreativeWork"]);
        const yor = list.itemListElement.find((e) => e.item.name === "YOR");
        expect(yor?.item.license).toEqual(["https://spdx.org/licenses/MIT.html"]);
        const manmaru = list.itemListElement.find((e) => e.item.name === "Manmaru YOR");
        expect(manmaru).toBeDefined();
        expect(manmaru?.item.license).toBeUndefined();
    });

    test("the .md twin carries the robots table, matrix, usage, family tree and exclusions", async () => {
        for (const res of [
            await get("/open-source.md"),
            await getMarkdown("/open-source"),
        ]) {
            expect(res.headers.get("content-type")).toBe(
                "text/markdown; charset=utf-8",
            );
            const md = await res.text();
            expect(md).toContain("# Open-source robots");
            expect(md).toContain(
                "| Robot | Type | DOF | Cost | Licence | Openness | Actuators | Repository |",
            );
            for (const h of [
                "## Openness matrix",
                "## Actuator usage",
                "## Family tree",
                "## Checked but not listed",
            ])
                expect(md).toContain(h);
            for (const r of OPEN_ROBOTS) expect(md).toContain(`### ${r.name}`);
            expect(md).toContain("Manmaru YOR");
            expect(md).toContain("(/actuators/feetech-sts3215)");
        }
    });

    test("is listed in llms.txt and linked from the footer", async () => {
        expect(await (await get("/llms.txt")).text()).toContain("/open-source.md");
        expect(await (await get("/")).text()).toContain(
            '<a href="/open-source">Open-source robots</a>',
        );
    });
});

describe("REST /api/v1/open-robots", () => {
    test("lists every robot, filters by type and rejects unknown types", async () => {
        const all = OpenRobotListSchema.parse(
            await (await get("/api/v1/open-robots")).json(),
        );
        expect(all.data.map((r) => r.id)).toEqual(OPEN_ROBOTS.map((r) => r.id));
        const arms = OpenRobotListSchema.parse(
            await (await get("/api/v1/open-robots?type=arm")).json(),
        );
        expect(arms.data.length).toBeGreaterThan(0);
        expect(arms.data.every((r) => r.type === "arm")).toBe(true);
        expect((await get("/api/v1/open-robots?type=boat")).status).toBe(400);
    });

    test("returns one robot with its openness row and 404s unknown ids", async () => {
        const yor = OpenRobotSchema.parse(
            await (await get("/api/v1/open-robots/manmaru-yor")).json(),
        );
        expect(yor.derived_from).toBe("yor");
        expect(yor.openness.bom.status).toBe("full");
        expect(
            yor.joints.find((j) => j.actuator_id === "damiao-dm-j4310-2ec")?.count,
        ).toBe(8);
        expect((await get("/api/v1/open-robots/nope")).status).toBe(404);
    });

    test("joins several licences into one SPDX expression and keeps cost ranges", async () => {
        const one = async (id: string) =>
            OpenRobotSchema.parse(
                await (await get(`/api/v1/open-robots/${id}`)).json(),
            );
        const openarm = await one("openarm");
        expect(openarm.openness.licence.licence).toBe("CERN-OHL-S-2.0 AND Apache-2.0");
        const poppy = await one("poppy-humanoid");
        expect(poppy.cost_range_usd).toEqual({ low: 8000, high: 9000 });
        const duck = await one("open-duck-mini");
        expect(duck.cost_range_usd).toEqual({ low: null, high: 400 });
        expect((await one("yor")).cost_range_usd).toBeNull();
    });

    test("both endpoints have markdown twins", async () => {
        for (const res of [
            await get("/api/v1/open-robots.md?type=legged"),
            await getMarkdown("/api/v1/open-robots?type=legged"),
        ]) {
            expect(res.status).toBe(200);
            const md = await res.text();
            expect(md).toStartWith("# Open-source robots: type=legged");
            expect(md).toContain("Solo-12");
            expect(md).not.toContain("OpenArm");
        }
        const one = await get("/api/v1/open-robots/openarm.md");
        expect(one.status).toBe(200);
        const md = await one.text();
        expect(md).toStartWith("# OpenArm");
        expect(md).toContain("DM-J8009P-2EC");
        expect((await get("/api/v1/open-robots/nope.md")).status).toBe(404);
        expect((await get("/api/v1/open-robots.md?type=boat")).status).toBe(400);
    });

    test("is in the OpenAPI document", async () => {
        const doc = (await (await get("/openapi.json")).json()) as {
            paths: Record<string, unknown>;
        };
        expect(Object.keys(doc.paths)).toContain("/api/v1/open-robots");
        expect(Object.keys(doc.paths)).toContain("/api/v1/open-robots/{id}");
    });
});

describe("MCP list_open_robots", () => {
    test("returns robots, optionally by type", async () => {
        const all = OpenRobotListSchema.parse(
            (await callTool("list_open_robots", {})).structuredContent,
        );
        expect(all.data.map((r) => r.id)).toContain("yor");
        const legged = OpenRobotListSchema.parse(
            (await callTool("list_open_robots", { type: "legged" })).structuredContent,
        );
        expect(legged.data.length).toBeGreaterThan(0);
        expect(legged.data.every((r) => r.type === "legged")).toBe(true);
    });
});
