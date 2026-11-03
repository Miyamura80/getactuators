import { describe, expect, test } from "bun:test";
import { ActuatorDetailSchema } from "@/api/schemas";
import { SdkBrandSchema, SdkListSchema } from "@/api/sdk";
import { SCORED_BRANDS, sdkLeaderboard } from "@/sdk";
import { SDK_EVIDENCE } from "@/sdk/evidence";
import { get, getMarkdown } from "./agent-helpers";
import { callTool } from "./mcp-helpers";

const EM_DASH = String.fromCharCode(0x2014);

describe("/sdk page and twin", () => {
    test("serves the SPA with a Dataset node, sitemap and llms.txt entries", async () => {
        const res = await get("/sdk");
        expect(res.status).toBe(200);
        const html = await res.text();
        expect(html).toContain("<title>Best actuator SDKs");
        const graphs = [
            ...html.matchAll(
                /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
            ),
        ]
            .map((m) => JSON.stringify(JSON.parse(m[1] ?? "{}")))
            .join("\n");
        expect(graphs).toContain('"@type":"Dataset"');
        expect(graphs).toContain("/api/v1/sdk");
        expect(graphs).toContain('"measurementTechnique"');
        expect(await (await get("/sitemap.xml")).text()).toContain("/sdk");
        expect(await (await get("/llms.txt")).text()).toContain("/sdk.md");
        expect(html).toContain('<a href="/sdk"');
    });

    test("markdown twin has the leaderboard, presets, method and evidence links", async () => {
        for (const res of [await get("/sdk.md"), await getMarkdown("/sdk")]) {
            expect(res.status).toBe(200);
            const md = await res.text();
            for (const h of [
                "## Leaderboard (balanced preset)",
                "## Reader presets",
                "## Method",
                "## Brands",
                "## Not scored",
                "## Sources",
            ])
                expect(md).toContain(h);
            const board = sdkLeaderboard();
            const rows = md.split("\n").filter((l) => /^\| \d+ \| \*\*/.test(l));
            expect(rows).toHaveLength(board.length);
            for (const s of board) expect(md).toContain(`(\`${s.brand.id}\`)`);
            expect(md).toContain("ROS 2 shop");
            const first = SDK_EVIDENCE[0];
            if (first) expect(md).toContain("https://");
            expect(md).not.toContain(EM_DASH);
        }
    });
});

describe("REST /api/v1/sdk", () => {
    test("lists every scored brand, re-ranks by preset", async () => {
        const all = SdkListSchema.parse(await (await get("/api/v1/sdk")).json());
        expect(all.total).toBe(SCORED_BRANDS.length);
        expect(all.results.map((r) => r.rank)).toEqual(
            all.results.map((_, i) => i + 1),
        );
        const overall = all.results.map((r) => r.overall);
        expect(overall).toEqual([...overall].sort((a, b) => b - a));
        expect(all.unscored.map((u) => u.id)).toContain("nabtesco");
        const ros = SdkListSchema.parse(
            await (await get("/api/v1/sdk?preset=ros2")).json(),
        );
        expect(ros.preset).toBe("ros2");
        expect(ros.weights.ros).toBe(0.35);
        expect((await get("/api/v1/sdk?preset=nope")).status).toBe(400);
    });

    test("one brand by brand id or actuator id, with checks and evidence", async () => {
        const odrive = SdkBrandSchema.parse(
            await (await get("/api/v1/sdk/odrive")).json(),
        );
        expect(odrive.id).toBe("odrive");
        expect(odrive.capabilities.ros2).toBe("official");
        expect(odrive.checks.every((c) => c.sources.length > 0)).toBe(true);
        expect(odrive.evidence.length).toBe(
            SDK_EVIDENCE.filter((e) => e.brand === "odrive").length,
        );
        const viaActuator = SdkBrandSchema.parse(
            await (await get("/api/v1/sdk/odrive-s1")).json(),
        );
        expect(viaActuator.id).toBe("odrive");
        expect((await get("/api/v1/sdk/nabtesco")).status).toBe(404);
        expect((await get("/api/v1/sdk/nope")).status).toBe(404);
    });

    test("actuator detail carries the brand's SDK score; reducers get null", async () => {
        const a = ActuatorDetailSchema.parse(
            await (await get("/api/v1/actuators/robstride-02")).json(),
        );
        expect(a.sdk?.brand_id).toBe("robstride");
        expect(a.sdk?.url).toContain("/sdk#brand=robstride");
        const r = ActuatorDetailSchema.parse(
            await (await get("/api/v1/actuators/nabtesco-rv-42n")).json(),
        );
        expect(r.sdk).toBeNull();
    });

    test("documented in OpenAPI", async () => {
        const spec = (await (await get("/openapi.json")).json()) as {
            paths: Record<string, Record<string, { tags: string[] }>>;
        };
        for (const p of ["/api/v1/sdk", "/api/v1/sdk/{brand}"])
            expect(spec.paths[p]?.get?.tags).toEqual(["actuators"]);
    });
});

describe("MCP get_sdk_score", () => {
    test("leaderboard with no arguments, one brand by actuator id", async () => {
        const list = (await callTool("get_sdk_score", {})).structuredContent as {
            leaderboard: unknown;
            brand: unknown;
        };
        expect(SdkListSchema.parse(list.leaderboard).total).toBe(SCORED_BRANDS.length);
        expect(list.brand).toBeNull();
        const one = (
            await callTool("get_sdk_score", { actuator_id: "dynamixel-xm430-w350-t" })
        ).structuredContent as { brand: unknown };
        expect(SdkBrandSchema.parse(one.brand).id).toBe("robotis");
    });

    test("get_actuator includes sdk", async () => {
        const out = (await callTool("get_actuator", { id: "mjbots-qdd100" }))
            .structuredContent as { sdk: { brand_id: string } | null };
        expect(out.sdk?.brand_id).toBe("mjbots");
    });
});
