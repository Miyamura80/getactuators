import { describe, expect, test } from "bun:test";
import { ACTUATORS, ROBOTS } from "@/catalog";
import { robotsUsingActuator } from "@/catalog/query";
import { PROTOCOL, appHandler, callTool, rawPost, rpc } from "./mcp-helpers";

interface ToolInfo {
    name: string;
    title?: string;
    description?: string;
    inputSchema: {
        type: string;
        properties?: Record<string, unknown>;
        required?: string[];
    };
    outputSchema?: { type: string };
    annotations?: Record<string, unknown>;
    _meta?: { ui?: { resourceUri?: string } };
}

const EXPECTED_TOOLS = [
    "search_actuators",
    "get_actuator",
    "compare_actuators",
    "list_actuator_categories",
    "list_brands",
    "recommend_actuators",
    "list_robots",
    "get_robot",
    "find_robots_using_actuator",
    "humanoid_joint_requirements",
];

const usedActuator = ACTUATORS.find((a) => robotsUsingActuator(a.id).length > 0);

describe("MCP /mcp handshake", () => {
    test("initialize returns identity, instructions and protocol version", async () => {
        const res = await rawPost({
            jsonrpc: "2.0",
            id: 1,
            method: "initialize",
            params: {
                protocolVersion: PROTOCOL,
                capabilities: {},
                clientInfo: { name: "test", version: "1.0.0" },
            },
        });
        expect(res.status).toBe(200);
        expect(res.headers.get("content-type")).toContain("application/json");
        expect(res.headers.get("access-control-allow-origin")).toBe("*");
        expect(res.headers.get("mcp-session-id")).toBeNull();
        const body = (await res.json()) as { result: Record<string, unknown> };
        const info = body.result.serverInfo as Record<string, unknown>;
        expect(body.result.protocolVersion).toBe(PROTOCOL);
        expect(info.name).toBe("actuatorlist");
        expect(typeof info.version).toBe("string");
        const instructions = body.result.instructions as string;
        expect(instructions).toContain("N.m");
        expect(instructions).toContain("null");
        expect(body.result.capabilities).toHaveProperty("tools");
        expect(body.result.capabilities).toHaveProperty("resources");
    });

    test("GET and DELETE answer 405; OPTIONS is a CORS preflight", async () => {
        const handler = await appHandler();
        for (const method of ["GET", "DELETE"]) {
            const res = await handler(
                new Request("http://localhost/mcp", {
                    method,
                    headers: { accept: "text/event-stream" },
                }),
            );
            expect(res.status).toBe(405);
            expect(res.headers.get("allow")).toContain("POST");
        }
        const pre = await handler(
            new Request("http://localhost/mcp", { method: "OPTIONS" }),
        );
        expect(pre.status).toBe(204);
        expect(pre.headers.get("access-control-allow-methods")).toContain("POST");
        expect(pre.headers.get("access-control-expose-headers")).toContain(
            "MCP-Protocol-Version",
        );
    });

    test("tolerates clients that only accept application/json", async () => {
        const res = await rawPost(
            { jsonrpc: "2.0", id: 9, method: "tools/list" },
            { accept: "application/json" },
        );
        expect(res.status).toBe(200);
    });
});

describe("MCP tools/list", () => {
    test("lists every catalog tool with quality metadata", async () => {
        const res = await rpc("tools/list");
        const tools = (res.result?.tools ?? []) as ToolInfo[];
        expect(tools.map((t) => t.name).sort()).toEqual([...EXPECTED_TOOLS].sort());
        for (const t of tools) {
            expect(t.name).toMatch(/^[a-z]+(_[a-z]+)+$/);
            expect(t.description?.length ?? 0).toBeGreaterThanOrEqual(20);
            expect(t.title).toBeTruthy();
            expect(t.inputSchema.type).toBe("object");
            expect(t.outputSchema?.type).toBe("object");
            expect(t.annotations).toMatchObject({
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            });
        }
        const get = tools.find((t) => t.name === "get_actuator");
        expect(get?.inputSchema.required).toEqual(["id"]);
        const compare = tools.find((t) => t.name === "compare_actuators");
        expect(compare?._meta?.ui?.resourceUri).toMatch(/^ui:\/\//);
    });
});

describe("MCP tools/call", () => {
    test("search_actuators filters, sorts and pages", async () => {
        const r = await callTool("search_actuators", {
            use_case: "quadruped_leg",
            sort: "peak_torque_nm",
            limit: 3,
        });
        const out = r.structuredContent as {
            total: number;
            results: { peak_torque_nm: number | null; use_cases: string[] }[];
        };
        expect(out.total).toBeGreaterThan(3);
        expect(out.results).toHaveLength(3);
        for (const a of out.results) expect(a.use_cases).toContain("quadruped_leg");
        const torques = out.results.map((a) => a.peak_torque_nm ?? 0);
        expect([...torques].sort((a, b) => b - a)).toEqual(torques);
        expect(JSON.parse(r.content?.[0]?.text ?? "{}")).toEqual(out);
    });

    test("get_actuator returns full specs and robots using it", async () => {
        const id = usedActuator?.id ?? ACTUATORS[0]?.id ?? "";
        const r = await callTool("get_actuator", { id });
        const out = r.structuredContent as {
            actuator: { id: string; sources: string[]; page_url: string };
            robots_using: { id: string }[];
        };
        expect(out.actuator.id).toBe(id);
        expect(out.actuator.page_url).toContain(`/actuators/${id}`);
        expect(out.robots_using.map((r) => r.id)).toEqual(
            robotsUsingActuator(id).map((r) => r.id),
        );
    });

    test("every actuator validates against get_actuator's outputSchema", async () => {
        for (const a of ACTUATORS) {
            const r = await callTool("get_actuator", { id: a.id });
            expect(r.isError).toBeFalsy();
        }
    });

    test("compare_actuators picks a winner per metric", async () => {
        const ids = ACTUATORS.slice(0, 3).map((a) => a.id);
        const r = await callTool("compare_actuators", { ids: [...ids, "nope-x"] });
        const out = r.structuredContent as {
            actuators: { id: string }[];
            best: { metric: string; actuator_id: string | null }[];
            missing_ids: string[];
        };
        expect(out.actuators.map((a) => a.id)).toEqual(ids);
        expect(out.missing_ids).toEqual(["nope-x"]);
        const peak = out.best.find((b) => b.metric === "peak_torque_nm");
        const max = Math.max(
            ...ACTUATORS.slice(0, 3).map((a) => a.peak_torque_nm ?? -1),
        );
        expect(ACTUATORS.find((a) => a.id === peak?.actuator_id)?.peak_torque_nm).toBe(
            max,
        );
    });

    test("recommend_actuators respects hard constraints and is deterministic", async () => {
        const args = {
            use_case: "quadruped_leg",
            min_peak_torque_nm: 10,
            max_weight_g: 1500,
            priority: "torque_density",
        };
        const a = await callTool("recommend_actuators", args);
        const b = await callTool("recommend_actuators", args);
        expect(a.structuredContent).toEqual(b.structuredContent ?? {});
        const out = a.structuredContent as {
            recommendations: {
                rank: number;
                score: number;
                reasons: string[];
                actuator: { peak_torque_nm: number; weight_g: number };
            }[];
        };
        expect(out.recommendations.length).toBeGreaterThan(0);
        for (const r of out.recommendations) {
            expect(r.actuator.peak_torque_nm).toBeGreaterThanOrEqual(10);
            expect(r.actuator.weight_g).toBeLessThanOrEqual(1500);
            expect(r.reasons.length).toBeGreaterThan(0);
        }
        const scores = out.recommendations.map((r) => r.score);
        expect([...scores].sort((x, y) => y - x)).toEqual(scores);
    });

    test("taxonomy tools count the catalog", async () => {
        const cats = (await callTool("list_actuator_categories")).structuredContent as {
            categories: { count: number }[];
            use_cases: { tag: string }[];
        };
        expect(cats.categories.reduce((s, c) => s + c.count, 0)).toBe(ACTUATORS.length);
        expect(cats.use_cases.map((u) => u.tag)).toContain("robot_arm");
        const brands = (await callTool("list_brands")).structuredContent as {
            brands: { actuator_count: number }[];
        };
        expect(brands.brands.reduce((s, b) => s + b.actuator_count, 0)).toBe(
            ACTUATORS.length,
        );
    });

    test("robot tools resolve joints to motors", async () => {
        const list = (await callTool("list_robots")).structuredContent as {
            total: number;
            credit: { name: string };
        };
        expect(list.total).toBe(ROBOTS.length);
        expect(list.credit.name).toBeTruthy();
        const robot = ROBOTS[0];
        const r = (await callTool("get_robot", { id: robot?.id }))
            .structuredContent as {
            joints: { motor: { id: string } }[];
            total_motors: number;
        };
        expect(r.joints.length).toBeGreaterThan(0);
        expect(r.total_motors).toBeGreaterThan(0);
        const target = usedActuator ?? ACTUATORS[0];
        const f = (
            await callTool("find_robots_using_actuator", { actuator_id: target?.id })
        ).structuredContent as { robots: { id: string; joints: unknown[] }[] };
        expect(f.robots.map((x) => x.id)).toEqual(
            robotsUsingActuator(target?.id ?? "").map((x) => x.id),
        );
        for (const x of f.robots) expect(x.joints.length).toBeGreaterThan(0);
    });
});

describe("MCP error handling", () => {
    test("unknown tool is a JSON-RPC error", async () => {
        const res = await rpc("tools/call", { name: "no_such_tool", arguments: {} });
        expect(res.error?.code).toBe(-32602);
        expect(res.error?.message).toContain("no_such_tool");
    });

    test("bad arguments come back as an error result", async () => {
        const r = await callTool("compare_actuators", { ids: "not-an-array" });
        expect(r.isError).toBe(true);
        expect(r.content?.[0]?.text).toContain("ids");
    });

    test("unknown id is an actionable error result", async () => {
        const r = await callTool("get_actuator", { id: "robstride-nonexistent" });
        expect(r.isError).toBe(true);
        expect(r.content?.[0]?.text).toContain("search_actuators");
    });

    test("unknown method and malformed JSON are JSON-RPC errors", async () => {
        const res = await rpc("no/such_method");
        expect(res.error?.code).toBe(-32601);
        const handler = await appHandler();
        const bad = await handler(
            new Request("http://localhost/mcp", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    accept: "application/json",
                },
                body: "{not json",
            }),
        );
        expect(bad.status).toBe(400);
        const body = (await bad.json()) as { error: { code: number } };
        expect(body.error.code).toBe(-32700);
    });
});
