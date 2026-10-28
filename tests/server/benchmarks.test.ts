import { describe, expect, test } from "bun:test";
import { ActuatorBenchmarksSchema, BenchmarkListSchema } from "@/api/benchmarks";
import { BENCHMARK_RUNS } from "@/benchmarks";
import { get, getMarkdown } from "./agent-helpers";
import { callTool } from "./mcp-helpers";

describe("/benchmarks page and twin", () => {
    test("serves the SPA with a Dataset node and is listed everywhere", async () => {
        const res = await get("/benchmarks");
        expect(res.status).toBe(200);
        const html = await res.text();
        expect(html).toContain("<title>Actuator benchmarks");
        expect(html).toContain('"@type":"Dataset"');
        expect(html).toContain("/api/v1/benchmarks");
        expect(html).toContain('<a href="/benchmarks"');
        expect(await (await get("/sitemap.xml")).text()).toContain("/benchmarks");
        expect(await (await get("/llms.txt")).text()).toContain("/benchmarks.md");
    });

    test("markdown twin has every view with origin and source per run", async () => {
        for (const res of [
            await get("/benchmarks.md"),
            await getMarkdown("/benchmarks"),
        ]) {
            expect(res.status).toBe(200);
            const md = await res.text();
            for (const h of [
                "## Datasheet vs measured",
                "## Torque-speed",
                "## Thermal derating",
                "## Measured leaderboard",
                "## All runs",
                "## Submit a run",
            ])
                expect(md).toContain(h);
            expect(md).toMatch(
                /\| Backlash \| max 30 arcmin \| 51\.9 arcmin \| \+73% \| Vendor-affiliated \| Affiliated test \|/,
            );
            expect(md).toMatch(
                /\| Peak torque \| 16 Nm \| 16 Nm \| \+0% \| Vendor \| Maker-reported \|/,
            );
            expect(md).toMatch(
                /\| Backlash \| 11\.4 arcmin \| 9 arcmin \| -21% \| Independent \| Beats \|/,
            );
            for (const run of BENCHMARK_RUNS)
                expect(md).toContain(run.independenceNote.slice(0, 30));
            expect(md).toContain("| 1 | [qdd100 beta 3 (mjbots)]");
            expect(md).toContain("| continuous |");
            for (const run of BENCHMARK_RUNS)
                if (run.source) expect(md).toContain(run.source.url);
            expect(md).not.toContain(String.fromCharCode(0x2014));
        }
    });

    test("actuator twins carry a Measured section only when runs exist", async () => {
        const md = await (await get("/actuators/feetech-sts3250.md")).text();
        expect(md).toContain("## Measured");
        expect(md).toContain("| Published |");
        const none = await (await get("/actuators/robstride-02.md")).text();
        expect(none).not.toContain("## Measured");
    });
});

describe("REST /api/v1/benchmarks", () => {
    test("lists runs and filters by actuator and origin", async () => {
        const all = BenchmarkListSchema.parse(
            await (await get("/api/v1/benchmarks")).json(),
        );
        expect(all.total).toBe(BENCHMARK_RUNS.length);
        const sts = BenchmarkListSchema.parse(
            await (await get("/api/v1/benchmarks?actuator=feetech-sts3250")).json(),
        );
        expect(sts.runs.map((r) => r.runId).sort()).toEqual([
            "hardwarex-2026-test-stand",
            "robonine-evaluation",
        ]);
        const independent = BenchmarkListSchema.parse(
            await (await get("/api/v1/benchmarks?independence=independent")).json(),
        );
        expect(independent.runs.map((r) => r.runId).sort()).toEqual([
            "hackaday-spider-bot-stall",
            "staccatoe-2024-backlash",
        ]);
        expect((await get("/api/v1/benchmarks?independence=maybe")).status).toBe(400);
        const community = BenchmarkListSchema.parse(
            await (await get("/api/v1/benchmarks?origin=community")).json(),
        );
        expect(community.total).toBe(
            BENCHMARK_RUNS.filter((r) => r.origin === "community").length,
        );
        expect((await get("/api/v1/benchmarks?origin=vendor")).status).toBe(400);
    });

    test("one actuator: runs, datasheet vs measured and continuous density", async () => {
        const qdd = ActuatorBenchmarksSchema.parse(
            await (await get("/api/v1/benchmarks/mjbots-qdd100")).json(),
        );
        expect(qdd.runs).toHaveLength(1);
        expect(qdd.measured_continuous_torque_density_nm_per_kg).toBeCloseTo(6.51, 2);
        // A vendor run is maker-reported: no verdict.
        expect(
            qdd.datasheet_vs_measured.map((d) => [
                d.metric,
                d.independence,
                d.verdict,
                d.status,
            ]),
        ).toEqual([
            ["peakTorqueNm", "vendor", null, "Maker-reported"],
            ["continuousTorqueNm", "vendor", null, "Maker-reported"],
        ]);
        const ak = ActuatorBenchmarksSchema.parse(
            await (await get("/api/v1/benchmarks/cubemars-ak80-9")).json(),
        );
        expect(ak.datasheet_vs_measured[0]?.verdict).toBe("beats");
        const sts = ActuatorBenchmarksSchema.parse(
            await (await get("/api/v1/benchmarks/feetech-sts3215")).json(),
        );
        for (const d of sts.datasheet_vs_measured) {
            expect(d.claim_bound).toBe("max");
            expect(d.verdict).toBeNull();
            expect(d.status).toBe("Affiliated test");
        }
        const empty = ActuatorBenchmarksSchema.parse(
            await (await get("/api/v1/benchmarks/robstride-02")).json(),
        );
        expect(empty.runs).toEqual([]);
        expect((await get("/api/v1/benchmarks/not-a-motor")).status).toBe(404);
    });

    test("OpenAPI documents both paths under the actuators tag", async () => {
        const spec = (await (await get("/openapi.json")).json()) as {
            paths: Record<string, Record<string, { tags: string[] }>>;
        };
        for (const p of ["/api/v1/benchmarks", "/api/v1/benchmarks/{id}"])
            expect(spec.paths[p]?.get?.tags).toEqual(["actuators"]);
    });
});

describe("MCP get_benchmarks", () => {
    test("returns one actuator or every run", async () => {
        const one = (
            await callTool("get_benchmarks", { actuator_id: "xiaomi-cybergear" })
        ).structuredContent as {
            actuator: { runs: { thermal?: unknown[] }[] } | null;
        };
        expect(one.actuator?.runs[0]?.thermal).toHaveLength(9);
        const sts = (
            await callTool("get_benchmarks", { actuator_id: "feetech-sts3250" })
        ).structuredContent as {
            actuator: {
                runs: { independence: string }[];
                datasheet_vs_measured: {
                    verdict: string | null;
                    independence: string;
                }[];
            } | null;
        };
        expect(
            sts.actuator?.runs.every((r) => r.independence === "vendor-affiliated"),
        ).toBe(true);
        // Backlash from both runs plus the Robonine stall peak, none judged.
        expect(sts.actuator?.datasheet_vs_measured.map((d) => d.verdict)).toEqual([
            null,
            null,
            null,
        ]);
        const all = (await callTool("get_benchmarks", {})).structuredContent as {
            all: { total: number } | null;
        };
        expect(all.all?.total).toBe(BENCHMARK_RUNS.length);
        expect(
            (await callTool("get_benchmarks", { actuator_id: "nope" })).isError,
        ).toBe(true);
    });
});

test("the frontend build stage copies the shared benchmark module", async () => {
    const dockerfile = await Bun.file("Dockerfile").text();
    expect(dockerfile).toContain("COPY src/benchmarks ./src/benchmarks");
});
