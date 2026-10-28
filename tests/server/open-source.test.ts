import { describe, expect, test } from "bun:test";
import { OpenRobotListSchema } from "@/api/open-robots";
import { get, getMarkdown } from "./agent-helpers";
import { callTool } from "./mcp-helpers";

describe("/open-source page and twin", () => {
    test("serves the SPA with an ItemList of licensed CreativeWorks", async () => {
        const res = await get("/open-source");
        expect(res.status).toBe(200);
        const html = await res.text();
        expect(html).toContain("<title>Open-source robots");
        const graphs = [
            ...html.matchAll(
                /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
            ),
        ]
            .map((m) => JSON.stringify(JSON.parse(m[1] ?? "{}")))
            .join("\n");
        expect(graphs).toContain('"@type":"ItemList"');
        expect(graphs).toContain('"@type":"CreativeWork"');
        expect(graphs).toContain(
            '"license":["https://spdx.org/licenses/Apache-2.0.html"]',
        );
        expect(graphs).toContain('"name":"YOR"');
        // Live: sitemap, llms.txt and the footer.
        expect(await (await get("/sitemap.xml")).text()).toContain("/open-source");
        expect(await (await get("/llms.txt")).text()).toContain("/open-source.md");
        expect(html).toContain('<a href="/open-source">Open-source robots</a>');
    });

    test("markdown twin has the robots table, matrix, usage and family tree", async () => {
        for (const res of [
            await get("/open-source.md"),
            await getMarkdown("/open-source"),
        ]) {
            expect(res.status).toBe(200);
            const md = await res.text();
            for (const h of [
                "## Robots",
                "## Openness matrix",
                "## Actuators the open-source world builds on",
                "## Family tree",
                "## Checked and left out",
                "## Method",
            ])
                expect(md).toContain(h);
            expect(md).toContain(
                "| Robot | Type | DOF | Cost to build | Licences | Openness | Actuators used | Repo | Stars |",
            );
            expect(md).toContain(
                "[Manmaru YOR](https://actuatorlist.com/open-source?robot=manmaru-yor)",
            );
            expect(md).toContain("- YOR -> Manmaru YOR");
            expect(md).toContain("- SO-100 -> SO-101");
            expect(md).toContain(
                "[8 x DM-J4310-2EC](https://actuatorlist.com/actuators/damiao-dm-j4310-2ec)",
            );
            expect(md).toContain("https://actuatorlist.com/sdk");
            expect(md).not.toContain(String.fromCharCode(0x2014));
        }
    });
});

describe("REST /api/v1/open-robots", () => {
    test("lists every robot with openness, joints and usage", async () => {
        const body = OpenRobotListSchema.parse(
            await (await get("/api/v1/open-robots")).json(),
        );
        expect(body.total).toBeGreaterThanOrEqual(21);
        expect(
            body.data.filter((r) => r.meets_inclusion_rule).length,
        ).toBeGreaterThanOrEqual(20);
        const manmaru = body.data.find((r) => r.id === "manmaru-yor");
        expect(manmaru?.derived_from).toEqual(["yor"]);
        expect(manmaru?.licence).toEqual([]);
        expect(manmaru?.joints.map((j) => j.actuator_id)).toEqual([
            "damiao-dm-j4340p-2ec",
            "damiao-dm-j4310-2ec",
        ]);
        const so101 = body.data.find((r) => r.id === "so-101");
        expect(so101?.openness).toHaveLength(8);
        expect(so101?.github?.stars).toBeGreaterThan(0);
        expect(body.actuator_usage[0]?.actuator_id).toBe("feetech-sts3215");
    });

    test("filters by type and rejects unknown types", async () => {
        const body = OpenRobotListSchema.parse(
            await (await get("/api/v1/open-robots?type=legged")).json(),
        );
        expect(body.data.every((r) => r.type === "legged")).toBe(true);
        expect(body.data.map((r) => r.id)).toContain("solo-12");
        expect((await get("/api/v1/open-robots?type=drone")).status).toBe(400);
    });

    test("OpenAPI documents the path under the robots tag", async () => {
        const spec = (await (await get("/openapi.json")).json()) as {
            paths: Record<string, Record<string, { tags: string[] }>>;
        };
        expect(spec.paths["/api/v1/open-robots"]?.get?.tags).toEqual(["robots"]);
    });
});

describe("MCP list_open_robots", () => {
    test("returns the same records, filtered by type", async () => {
        const out = OpenRobotListSchema.parse(
            (await callTool("list_open_robots", { type: "humanoid" }))
                .structuredContent,
        );
        expect(out.data.map((r) => r.id)).toContain("berkeley-humanoid-lite");
        expect(out.data.every((r) => r.type === "humanoid")).toBe(true);
        const kbot = out.data.find((r) => r.id === "kbot");
        expect(kbot?.motor_count).toBe(20);
        expect((await callTool("list_open_robots", { type: "drone" })).isError).toBe(
            true,
        );
    });
});
