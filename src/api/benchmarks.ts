import {
    INDEPENDENCE,
    ORIGINS,
    actuatorBenchmarksOut,
    actuatorBenchmarksView,
    benchmarkListOut,
    benchmarkListView,
} from "@/benchmarks/views";
import { z } from "zod";
import { type ApiContext, json } from "./http";
import { parseQuery } from "./params";
import { ApiError } from "./problem";
import { schemaRegistry } from "./schemas";

// /api/v1/benchmarks: measured actuator runs over REST. Same wire shapes as
// the MCP tool get_benchmarks.

function named<T extends z.ZodType>(id: string, schema: T): T {
    schemaRegistry.add(schema, { id });
    return schema;
}

export const BenchmarkListSchema = named("BenchmarkList", benchmarkListOut);
export const ActuatorBenchmarksSchema = named(
    "ActuatorBenchmarks",
    actuatorBenchmarksOut,
);

export const BenchmarkListParams = z.object({
    actuator: z.string().min(1).optional().describe("Only runs of this actuator id."),
    origin: z
        .enum(ORIGINS)
        .optional()
        .describe("Only published, lab or community runs."),
    independence: z
        .enum(INDEPENDENCE)
        .optional()
        .describe("Only vendor, vendor-affiliated or independent runs."),
});

export function listBenchmarksHandler({ url }: ApiContext): Response {
    return json(benchmarkListView(parseQuery(BenchmarkListParams, url)));
}

export function getActuatorBenchmarksHandler({ params }: ApiContext): Response {
    const id = params.id ?? "";
    const view = actuatorBenchmarksView(id);
    if (!view)
        throw new ApiError("not_found", {
            detail: `No actuator "${id}".`,
            hint: "Use a catalog id from GET /api/v1/actuators; GET /api/v1/benchmarks lists every run.",
        });
    return json(view);
}
