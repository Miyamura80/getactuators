// WebMCP registration is feature-detected and the tools answer from the bundle.
// happy-dom first: webmcp.ts reaches for document/navigator.
import "./happydom";
import { afterEach, describe, expect, test } from "bun:test";
import { ACTUATORS } from "../src/lib/data";
import {
    buildTools,
    compareActuators,
    listRobots,
    registerWebMcp,
    searchActuators,
} from "../src/lib/webmcp";

describe("webmcp tool logic", () => {
    test("search respects limit and numeric bounds", () => {
        const out = searchActuators({ min_peak_torque_nm: 50, limit: 5 });
        expect(out.results.length).toBeLessThanOrEqual(5);
        for (const r of out.results) expect(r.peak_torque_nm ?? 0).toBeGreaterThanOrEqual(50);
    });

    test("search sorts by the requested spec", () => {
        const out = searchActuators({ sort_by: "peak_torque_nm", sort_dir: "desc", limit: 20 });
        const vals = out.results.map((r) => r.peak_torque_nm ?? -1);
        expect(vals).toEqual([...vals].sort((a, b) => b - a));
    });

    test("compare reports unknown ids instead of failing", () => {
        const id = ACTUATORS[0].id;
        const out = compareActuators([id, "nope"]);
        expect(out.actuators.map((a) => a.id)).toEqual([id]);
        expect(out.missing).toEqual(["nope"]);
    });

    test("list_robots returns joint loadouts", () => {
        const robots = listRobots();
        expect(robots.length).toBeGreaterThan(0);
        expect(robots[0].url).toContain("/robots#");
    });

    test("tools have unique names and object schemas", () => {
        const tools = buildTools();
        expect(new Set(tools.map((t) => t.name)).size).toBe(tools.length);
        for (const t of tools) expect(t.inputSchema.type).toBe("object");
    });

    test("get_actuator flags an unknown id as an error", async () => {
        const tool = buildTools().find((t) => t.name === "get_actuator");
        const res = await tool?.execute({ id: "does-not-exist" });
        expect(res?.isError).toBe(true);
    });
});

describe("registerWebMcp", () => {
    afterEach(() => {
        delete (document as unknown as { modelContext?: unknown }).modelContext;
    });

    test("no-op without the API", () => {
        expect(registerWebMcp()).toBe(false);
    });

    test("registers every tool on document.modelContext", () => {
        const names: string[] = [];
        (document as unknown as { modelContext: unknown }).modelContext = {
            registerTool: (t: { name: string }) => names.push(t.name),
        };
        expect(registerWebMcp()).toBe(true);
        expect(names).toContain("search_actuators");
        expect(names).toContain("open_actuator_page");
        // Idempotent: a second call does not register duplicates.
        expect(registerWebMcp()).toBe(false);
        expect(names.length).toBe(buildTools().length);
    });
});
