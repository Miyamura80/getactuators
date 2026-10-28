import { describe, expect, test } from "bun:test";
import { SdkBrandSchema, SdkListSchema } from "@/api/sdk";
import { get, getMarkdown } from "./agent-helpers";
import { callTool } from "./mcp-helpers";

describe("/sdk page and twin", () => {
    test("serves the SPA with a Dataset node, in the sitemap and llms.txt", async () => {
        const res = await get("/sdk");
        expect(res.status).toBe(200);
        const html = await res.text();
        expect(html).toContain("<title>Best actuator SDKs");
        expect(html).toContain('"@type":"Dataset"');
        expect(html).toContain("/api/v1/sdk");
        expect(await (await get("/sitemap.xml")).text()).toContain("/sdk");
        expect(await (await get("/llms.txt")).text()).toContain("/sdk.md");
        expect(html).toContain('<a href="/sdk"');
    });

    test("markdown twin: leaderboard, heatmap, capabilities, evidence, method", async () => {
        for (const res of [await get("/sdk.md"), await getMarkdown("/sdk")]) {
            expect(res.status).toBe(200);
            const md = await res.text();
            for (const h of [
                "## Leaderboard",
                "## Scores by dimension",
                "## Capability matrix",
                "## Evidence by brand",
                "### Robotis",
                "## Not scored",
                "## Method",
            ])
                expect(md).toContain(h);
            expect(md).toContain("| Rank | Brand | Balanced | ROS 2 shop |");
            expect(md).toContain("https://github.com/mjbots/moteus");
            expect(md).toContain("Forum classifier: **not-run**");
            expect(md).not.toContain(String.fromCharCode(0x2014));
        }
    });
});

describe("REST /api/v1/sdk", () => {
    test("leaderboard per preset with every scored brand", async () => {
        const body = SdkListSchema.parse(await (await get("/api/v1/sdk")).json());
        expect(body.preset).toBe("balanced");
        expect(body.leaderboard.length).toBeGreaterThanOrEqual(15);
        expect(body.leaderboard.map((r) => r.rank)).toEqual(
            body.leaderboard.map((_, i) => i + 1),
        );
        const scores = body.leaderboard.map((r) => r.overall ?? -1);
        expect([...scores].sort((a, b) => b - a)).toEqual(scores);
        expect(body.not_scored.map((b) => b.brand)).toContain("nabtesco");
        const ros = SdkListSchema.parse(
            await (await get("/api/v1/sdk?preset=ros2")).json(),
        );
        expect(ros.preset).toBe("ros2");
        expect((await get("/api/v1/sdk?preset=nope")).status).toBe(400);
    });

    test("one brand: checks with linked evidence; actuator ids resolve", async () => {
        const b = SdkBrandSchema.parse(await (await get("/api/v1/sdk/mjbots")).json());
        expect(b.applicable).toBe(true);
        const fw = b.dimensions.find((d) => d.id === "firmware");
        const open = fw?.checks.find((c) => c.id === "open-firmware");
        expect(open?.status).toBe("pass");
        expect(open?.evidence[0]?.url).toStartWith("https://github.com/mjbots/moteus");
        const byActuator = SdkBrandSchema.parse(
            await (await get("/api/v1/sdk/mjbots-qdd100")).json(),
        );
        expect(byActuator.brand).toBe("mjbots");
        expect((await get("/api/v1/sdk/nobody")).status).toBe(404);
    });

    test("OpenAPI documents both paths", async () => {
        const spec = (await (await get("/openapi.json")).json()) as {
            paths: Record<string, Record<string, { tags: string[] }>>;
        };
        expect(spec.paths["/api/v1/sdk"]?.get?.tags).toEqual(["actuators"]);
        expect(spec.paths["/api/v1/sdk/{brand}"]?.get).toBeDefined();
    });
});

describe("MCP", () => {
    test("get_sdk_score by brand or actuator id", async () => {
        const out = SdkBrandSchema.parse(
            (await callTool("get_sdk_score", { brand: "robotis" })).structuredContent,
        );
        expect(out.name).toBe("Robotis");
        expect(out.capabilities.ros2).toBe("official");
        const viaActuator = SdkBrandSchema.parse(
            (await callTool("get_sdk_score", { actuator_id: "odrive-s1" }))
                .structuredContent,
        );
        expect(viaActuator.brand).toBe("odrive");
        const bad = await callTool("get_sdk_score", {});
        expect(bad.isError).toBe(true);
    });

    test("get_actuator carries the brand's sdk score, null for a gearbox", async () => {
        const servo = (await callTool("get_actuator", { id: "dynamixel-xm430-w350-t" }))
            .structuredContent as { sdk: { brand: string; rank: number } | null };
        expect(servo.sdk?.brand).toBe("robotis");
        const gearbox = (await callTool("get_actuator", { id: "nabtesco-rv-42n" }))
            .structuredContent as { sdk: unknown };
        expect(gearbox.sdk).toBeNull();
    });
});
