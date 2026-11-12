import {
    BENCHMARK_INDEPENDENCE,
    BENCHMARK_ORIGINS,
    benchmarkedIds,
    runsFor,
} from "@/benchmarks";
import { benchmarkListOut, benchmarkListView } from "@/benchmarks/views";
import { ACTUATORS } from "@/catalog";
import { z } from "zod";
import { actuatorIdSchema } from "../schemas";
import { ToolInputError, defineTool } from "../tool";

// Measured runs from /benchmarks as an MCP tool. Same wire shape as REST
// /api/v1/benchmarks.
const getBenchmarks = defineTool({
    name: "get_benchmarks",
    title: "Measured actuator benchmarks",
    description:
        "Measured performance, not datasheet claims: T-N curves at a stated bus voltage, thermal derating (time to the winding limit), measured peak and continuous output, efficiency, backlash, backdrive friction, repeatability and control figures, from published tests (papers, vendor test reports, blogs) and community runs submitted by pull request. Each run states its rig, how the numbers were taken (raw, tabulated, digitised from a plot or reported), uncertainty per metric, its source, its independence (vendor, vendor-affiliated or independent, with the evidence) and the measured over datasheet ratio. Only independent runs carry a verdict (below-datasheet, matches, beats; within-spec or over-limit for an upper-limit claim); vendor and vendor-affiliated pairs have verdict null. Pass actuator_id for one actuator; omit it to list every run.",
    input: z.object({
        actuator_id: actuatorIdSchema
            .optional()
            .describe(
                "Catalog actuator id, e.g. 'xiaomi-cybergear'. Omit for all runs.",
            ),
        origin: z
            .enum(BENCHMARK_ORIGINS)
            .optional()
            .describe("published, lab or community."),
        independence: z
            .enum(BENCHMARK_INDEPENDENCE)
            .optional()
            .describe("vendor, vendor-affiliated or independent."),
    }),
    output: benchmarkListOut,
    run: ({ actuator_id: actuatorId, origin, independence }) => {
        if (actuatorId && !ACTUATORS.some((a) => a.id === actuatorId))
            throw new ToolInputError(
                `No actuator "${actuatorId}". Find ids with search_actuators.`,
            );
        // Checked before the origin filter, which may leave an empty list.
        if (actuatorId && runsFor(actuatorId).length === 0)
            throw new ToolInputError(
                `No measured runs for "${actuatorId}" yet. Actuators with runs: ${benchmarkedIds().join(", ")}.`,
            );
        return benchmarkListView(ACTUATORS, { actuatorId, origin, independence });
    },
});

export const benchmarkTools = [getBenchmarks];
