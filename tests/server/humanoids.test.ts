const EM_DASH = String.fromCharCode(0x2014);
import { describe, expect, test } from "bun:test";
import { HumanoidDetailSchema, HumanoidListSchema } from "@/api/humanoids";
import { HUMANOIDS } from "@/humanoids";
import { get, getMarkdown } from "./agent-helpers";
import { callTool } from "./mcp-helpers";

function jsonLd(html: string): { "@graph": Record<string, unknown>[] } {
    const m = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html);
    return JSON.parse(m?.[1] ?? "{}");
}

describe("/humanoids", () => {
    test("serves the SPA shell with an ItemList of Product JSON-LD", async () => {
        const res = await get("/humanoids");
        expect(res.status).toBe(200);
        const html = await res.text();
        expect(html).toContain("<title>Humanoid joint map | actuatorlist</title>");
        const list = jsonLd(html)["@graph"].find((n) => n["@type"] === "ItemList") as {
            numberOfItems: number;
            itemListElement: { item: { "@type": string; name: string } }[];
        };
        expect(list.numberOfItems).toBe(HUMANOIDS.length);
        expect(list.itemListElement.every((e) => e.item["@type"] === "Product")).toBe(
            true,
        );
    });

    test("the .md twin carries the fleet table, every robot's joint table and the method", async () => {
        for (const res of [
            await get("/humanoids.md"),
            await getMarkdown("/humanoids"),
        ]) {
            expect(res.headers.get("content-type")).toBe(
                "text/markdown; charset=utf-8",
            );
            const md = await res.text();
            expect(md).toContain("# What moves each joint");
            expect(md).toContain("## Fleet");
            expect(md).toContain(
                "| Robot | DOF | Actuators | Mix | Magnet kg | REE kg | Price |",
            );
            for (const h of HUMANOIDS)
                expect(md).toContain(`## ${h.name} (${h.brand})`);
            expect(md).toContain(
                "| Left knee | 1 | Rotary QDD | [RobStride 04](/actuators/robstride-04)",
            );
            expect(md).toContain("- **Country:** \u{1F1E8}\u{1F1F3} China");
            expect(md).toContain("### Actuator BOM");
            expect(md).toContain(
                "| RobStride 03 | 8 | $250 (reported) | $2,000 | 47% |",
            );
            expect(md).toContain("Not costed: Hand (hydraulic) x42");
            expect(md).toContain("## Magnet mass method");
            expect(md).not.toContain(EM_DASH);
        }
    });

    test("is linked from the footer", async () => {
        const html = await (await get("/robots")).text();
        expect(html).toContain('<a href="/humanoids">Humanoid joint map</a>');
    });
});

describe("REST /api/v1/humanoids", () => {
    test("lists every humanoid with totals", async () => {
        const res = await get("/api/v1/humanoids");
        expect(res.status).toBe(200);
        const body = HumanoidListSchema.parse(await res.json());
        expect(body.data.map((h) => h.id)).toEqual(HUMANOIDS.map((h) => h.id));
        const g1 = body.data.find((h) => h.id === "unitree-g1");
        expect(g1?.robot_id).toBe("unitree-g1");
        expect(g1?.actuators).toBe(23);
        expect(g1?.magnet_mass_kg.confidence).toBe("estimated");
        expect(g1?.magnet_mass_kg.low).toBeLessThan(g1?.magnet_mass_kg.high ?? 0);
    });

    test("returns one humanoid joint by joint, and 404s an unknown id", async () => {
        const body = HumanoidDetailSchema.parse(
            await (await get("/api/v1/humanoids/kscale-kbot")).json(),
        );
        const knee = body.joints.find((j) => j.canonical === "l-knee");
        expect(knee?.actuator_type).toBe("qdd");
        expect(knee?.actuator_id).toBe("robstride-04");
        expect(knee?.peak_torque_nm?.value).toBe(120);
        expect(knee?.sources[0]?.url).toBe(
            "https://docs.kscale.dev/robots/k-bot/mechanical/",
        );
        expect(body.bom.cost.total.value).toBeCloseTo(4235.86, 1);
        expect(body.bom.cost.slices[0]?.unit_value?.sources[0]).toBe(
            "https://actuatorlist.com/actuators/robstride-03",
        );
        expect(body.bom.mass.unit).toBe("kg");
        expect(body.bom.magnet.slices.length).toBeGreaterThan(0);
        expect(body.actuator_bom_usd).toBe(body.bom.cost.total.value);
        const optimus = HumanoidDetailSchema.parse(
            await (await get("/api/v1/humanoids/tesla-optimus")).json(),
        );
        expect(optimus.bom.cost.slices[0]?.unit_value?.sources).toEqual([
            "https://zhuanlan.zhihu.com/p/687045590",
            "https://xenospectrum.com/en/humanoid-robot-bom-actuator-cost/",
        ]);
        expect(optimus.bom.cost.excluded).toHaveLength(1);
        const missing = await get("/api/v1/humanoids/not-a-robot");
        expect(missing.status).toBe(404);
    });

    test("is in the OpenAPI document under robots", async () => {
        const spec = (await (await get("/openapi.json")).json()) as {
            paths: Record<string, { get?: { tags?: string[] } }>;
        };
        expect(spec.paths["/api/v1/humanoids"]?.get?.tags).toEqual(["robots"]);
        expect(spec.paths["/api/v1/humanoids/{id}"]?.get?.tags).toEqual(["robots"]);
    });
});

describe("MCP get_humanoid_joints", () => {
    test("returns a robot's joints, or the fleet when no id is given", async () => {
        const one = (
            await callTool("get_humanoid_joints", { robot_id: "tesla-optimus" })
        ).structuredContent as {
            humanoid: {
                joints: {
                    actuator_type: string;
                    type_confidence: string;
                    inferred_from: string | null;
                }[];
            };
        };
        const types = new Set(one.humanoid.joints.map((j) => j.actuator_type));
        expect(types.has("linear-roller-screw")).toBe(true);
        expect(
            one.humanoid.joints.every(
                (j) => j.type_confidence === "estimated" && j.inferred_from,
            ),
        ).toBe(true);
        const all = (await callTool("get_humanoid_joints", {})).structuredContent as {
            humanoids: unknown[];
        };
        expect(all.humanoids).toHaveLength(HUMANOIDS.length);
        const bad = await callTool("get_humanoid_joints", { robot_id: "nope" });
        expect(bad.isError).toBe(true);
    });
});
