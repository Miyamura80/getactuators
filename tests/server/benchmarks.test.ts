import { describe, expect, test } from "bun:test";
import { BenchmarkListSchema } from "@/api/benchmarks";
import { BENCHMARK_RUNS, benchmarkedIds } from "@/benchmarks";
import { ACTUATORS } from "@/catalog";
import { actuatorBody } from "@/server/agent/catalog-md";
import { get, getMarkdown } from "./agent-helpers";
import { callTool } from "./mcp-helpers";

const EM_DASH = String.fromCharCode(0x2014);

describe("/benchmarks page and twin", () => {
    test("serves the SPA with a Dataset node and is linked site-wide", async () => {
        const res = await get("/benchmarks");
        expect(res.status).toBe(200);
        const html = await res.text();
        expect(html).toContain("<title>Measured actuator benchmarks");
        const graphs = [
            ...html.matchAll(
                /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
            ),
        ]
            .map((m) => JSON.stringify(JSON.parse(m[1] ?? "{}")))
            .join("\n");
        expect(graphs).toContain('"@type":"Dataset"');
        expect(graphs).toContain("/api/v1/benchmarks");
        expect(html).toContain('<a href="/benchmarks"');
        expect(await (await get("/sitemap.xml")).text()).toContain("/benchmarks");
        expect(await (await get("/llms.txt")).text()).toContain("/benchmarks.md");
    });

    test("markdown twin has the delta table, leaderboard, curves, thermal and every run", async () => {
        for (const res of [
            await get("/benchmarks.md"),
            await getMarkdown("/benchmarks"),
        ]) {
            expect(res.status).toBe(200);
            const md = await res.text();
            for (const h of [
                "## Datasheet vs measured",
                "## Measured leaderboard",
                "## Torque-speed curves",
                "## Thermal derating",
                "## All runs",
                "## Submit a run",
            ])
                expect(md).toContain(h);
            for (const r of BENCHMARK_RUNS)
                expect(md).toContain(`\`${r.actuatorId}/${r.runId}\``);
            // The biggest shortfall leads the delta table.
            const delta = md.slice(md.indexOf("## Datasheet vs measured"));
            const firstRow = delta.split("\n").find((l) => l.startsWith("| ["));
            expect(firstRow).toContain("GIM6010-8");
            expect(firstRow).toContain("-73%");
            expect(md).toContain("Published (vendor)");
            expect(md).not.toContain(EM_DASH);
        }
    });

    test("actuator pages carry a Measured section only when runs exist", () => {
        const cg = ACTUATORS.find((a) => a.id === "xiaomi-cybergear");
        const none = ACTUATORS.find((a) => !benchmarkedIds().includes(a.id));
        if (!cg || !none) throw new Error("fixture actuators missing");
        const body = actuatorBody(cg);
        expect(body).toContain("## Measured");
        expect(body).toContain("xiaomi-manual-2023");
        expect(body).toContain("continuous 6 N·m");
        expect(body.indexOf("## Measured")).toBeLessThan(
            body.indexOf("## Engineering evidence"),
        );
        expect(actuatorBody(none)).not.toContain("## Measured");
    });
});

describe("REST /api/v1/benchmarks", () => {
    test("lists every run, filters by actuator and origin", async () => {
        const all = BenchmarkListSchema.parse(
            await (await get("/api/v1/benchmarks")).json(),
        );
        expect(all.total).toBe(BENCHMARK_RUNS.length);
        expect(all.actuators).toBeGreaterThanOrEqual(15);
        expect(all.protocol_url).toContain("docs/benchmarks/protocol.md");
        for (const r of all.results.filter((x) => x.origin === "published")) {
            expect(r.source?.url).toStartWith("https://");
            expect(r.source_kind).not.toBeNull();
        }
        const rs = BenchmarkListSchema.parse(
            await (await get("/api/v1/benchmarks?actuator_id=robstride-02")).json(),
        );
        expect(rs.results).toHaveLength(1);
        const run = rs.results[0];
        expect(run?.continuous_torque_nm).toBe(9);
        expect(run?.vs_datasheet.peak_torque?.ratio).toBe(1);
        expect(run?.thermal.at(-1)?.t_to_limit_s).toBeNull();
        expect(run?.url).toBe(
            "https://actuatorlist.com/benchmarks#run=robstride-02/robstride-manual-2026-07",
        );
        const community = BenchmarkListSchema.parse(
            await (await get("/api/v1/benchmarks?origin=community")).json(),
        );
        expect(community.results.every((r) => r.origin === "community")).toBe(true);
    });

    test("per-actuator runs, 404s and bad filters", async () => {
        const res = await get("/api/v1/actuators/xiaomi-cybergear/benchmarks");
        expect(res.status).toBe(200);
        const cg = BenchmarkListSchema.parse(await res.json());
        expect(cg.results[0]?.torque_speed.length).toBeGreaterThanOrEqual(5);
        expect(cg.results[0]?.data_method).toBe("digitised");
        expect((await get("/api/v1/actuators/nope/benchmarks")).status).toBe(404);
        expect((await get("/api/v1/actuators/nabtesco-rv-42n/benchmarks")).status).toBe(
            404,
        );
        expect((await get("/api/v1/benchmarks?origin=rumour")).status).toBe(400);
        const spec = (await (await get("/openapi.json")).json()) as {
            paths: Record<string, Record<string, { tags: string[] }>>;
        };
        for (const p of ["/api/v1/benchmarks", "/api/v1/actuators/{id}/benchmarks"])
            expect(spec.paths[p]?.get?.tags).toEqual(["actuators"]);
    });
});

describe("MCP get_benchmarks", () => {
    test("returns one actuator's runs and rejects unknown ids", async () => {
        const out = BenchmarkListSchema.parse(
            (await callTool("get_benchmarks", { actuatorId: "mjbots-qdd100" }))
                .structuredContent,
        );
        expect(out.results.map((r) => r.run_id).sort()).toEqual([
            "mjbots-beta3-spec",
            "mjbots-blog-2020-03",
            "mjbots-blog-2020-08",
        ]);
        expect(out.results.filter((r) => r.other_revision)).toHaveLength(2);
        const bad = await callTool("get_benchmarks", { actuatorId: "nope" });
        expect(bad.isError).toBe(true);
        const all = BenchmarkListSchema.parse(
            (await callTool("get_benchmarks")).structuredContent,
        );
        expect(all.total).toBe(BENCHMARK_RUNS.length);
    });
});
