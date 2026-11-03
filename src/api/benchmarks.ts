import { BENCHMARK_ORIGINS, runsFor } from "@/benchmarks";
import { benchmarkListOut, benchmarkListView } from "@/benchmarks/views";
import { ACTUATORS } from "@/catalog";
import { z } from "zod";
import { type ApiContext, json } from "./http";
import { parseQuery } from "./params";
import { ApiError } from "./problem";
import { schemaRegistry } from "./schemas";

// /api/v1/benchmarks: measured runs from /benchmarks over REST. Same wire
// shape as the MCP tool get_benchmarks.

schemaRegistry.add(benchmarkListOut, { id: "BenchmarkRunList" });
export const BenchmarkListSchema = benchmarkListOut;

export const BenchmarkListParams = z.object({
    actuator_id: z
        .string()
        .regex(/^[a-z0-9][a-z0-9-]*$/)
        .optional()
        .describe("Catalog actuator id, e.g. robstride-02."),
    origin: z
        .enum(BENCHMARK_ORIGINS)
        .optional()
        .describe("published, lab or community."),
});

export function listBenchmarksHandler({ url }: ApiContext): Response {
    const q = parseQuery(BenchmarkListParams, url);
    return json(
        benchmarkListView(ACTUATORS, { actuatorId: q.actuator_id, origin: q.origin }),
    );
}

export function actuatorBenchmarksHandler({ params }: ApiContext): Response {
    const id = params.id ?? "";
    if (!ACTUATORS.some((a) => a.id === id))
        throw new ApiError("not_found", {
            detail: `No actuator "${id}".`,
            hint: "List actuator ids with GET /api/v1/actuators.",
        });
    if (runsFor(id).length === 0)
        throw new ApiError("not_found", {
            detail: `No measured runs for "${id}" yet.`,
            hint: "List actuators with runs with GET /api/v1/benchmarks; submit one by pull request (see /benchmarks).",
        });
    return json(benchmarkListView(ACTUATORS, { actuatorId: id }));
}
