import { describe, expect, test } from "bun:test";
import { ActuatorDetailSchema } from "@/api/schemas";
import { SdkBrandSchema, SdkListSchema } from "@/api/sdk";
import { SCORED_BRANDS, sdkLeaderboard } from "@/sdk";
import { SDK_EVIDENCE, evidenceFor } from "@/sdk/evidence";
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
            // Each brand section links its five newest evidence posts.
            for (const s of board)
                for (const e of evidenceFor(s.brand.id).slice(0, 5))
                    expect(md).toContain(e.url);
            expect(md).toContain("one-off seed");
            expect(md).not.toContain(EM_DASH);
        }
    });
});

describe("REST /api/v1/sdk", () => {
    test("lists every scored brand, re-ranks by preset", async () => {
        const all = SdkListSchema.parse(await (await get("/api/v1/sdk")).json());
        expect(all.total).toBe(SCORED_BRANDS.length);
        expect(all.results.map((r) => r.id).sort()).toEqual(
            SCORED_BRANDS.map((b) => b.id).sort(),
        );
        expect(all.method.agreement.every((a) => Number.isInteger(a.gold_items))).toBe(
            true,
        );
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
        const expected = sdkLeaderboard("ros2");
        expect(ros.results.map((r) => [r.id, r.overall])).toEqual(
            expected.map((s) => [s.brand.id, s.score.overall]),
        );
        expect(ros.results.map((r) => r.id)).not.toEqual(all.results.map((r) => r.id));
        expect((await get("/api/v1/sdk?preset=nope")).status).toBe(400);
    });

    test("one brand by brand id or actuator id, with checks and evidence", async () => {
        const odrive = SdkBrandSchema.parse(
            await (await get("/api/v1/sdk/odrive")).json(),
        );
        expect(odrive.id).toBe("odrive");
        expect(odrive.capabilities.ros2).toBe("official");
        expect(odrive.capabilities.open_firmware).toBe("official");
        expect(odrive.capabilities.documented_protocol).toBe("official");
        expect(odrive.checks.every((c) => c.sources.length > 0)).toBe(true);
        expect(odrive.evidence.length).toBe(
            SDK_EVIDENCE.filter((e) => e.brand === "odrive").length,
        );
        const viaActuator = SdkBrandSchema.parse(
            await (await get("/api/v1/sdk/odrive-s1")).json(),
        );
        expect(viaActuator.id).toBe("odrive");
        expect((await get("/api/v1/sdk/nabtesco")).status).toBe(404);
        const bare = await get("/api/v1/sdk/maxon-ec-frameless-90-flat-260w");
        expect(bare.status).toBe(404);
        expect(await bare.text()).toContain("No SDK score for");
        const nope = await get("/api/v1/sdk/nope");
        expect(nope.status).toBe(404);
        expect(await nope.text()).toContain("No SDK brand or catalog actuator");
    });

    test("markdown twins of both endpoints", async () => {
        for (const res of [
            await get("/api/v1/sdk.md"),
            await getMarkdown("/api/v1/sdk"),
        ]) {
            expect(res.status).toBe(200);
            const md = await res.text();
            expect(md).toStartWith("# Actuator SDK scores (balanced preset)");
            for (const b of SCORED_BRANDS) expect(md).toContain(`\`${b.id}\``);
            expect(md).toContain("/api/v1/sdk");
        }
        const one = await (await get("/api/v1/sdk/odrive.md")).text();
        expect(one).toStartWith("# ODrive");
        expect(one).toContain("## Checks");
        // Every evidence item, each with its forum.
        const odriveEvidence = SDK_EVIDENCE.filter((e) => e.brand === "odrive");
        for (const e of odriveEvidence) expect(one).toContain(e.url);
        expect(one).toContain(`Evidence (${odriveEvidence.length}, newest first)`);
        expect(one).toMatch(/\d{4}-\d{2}-\d{2}, (Reddit|Hacker News|GitHub issues) /);
        // Brand links keep the preset.
        const ros = await (await get("/api/v1/sdk.md?preset=ros2")).text();
        expect(ros).toContain("/api/v1/sdk/odrive.md?preset=ros2)");
        expect((await get("/api/v1/sdk/nope.md")).status).toBe(404);
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

    test("rejects both selectors together and empty strings", async () => {
        for (const args of [
            { brand: "odrive", actuator_id: "robstride-02" },
            { brand: "" },
            { actuator_id: "" },
        ]) {
            const res = await callTool("get_sdk_score", args);
            expect(res.isError, JSON.stringify(args)).toBe(true);
        }
    });

    test("get_actuator includes sdk", async () => {
        const out = (await callTool("get_actuator", { id: "mjbots-qdd100" }))
            .structuredContent as { sdk: { brand_id: string } | null };
        expect(out.sdk?.brand_id).toBe("mjbots");
    });
});
