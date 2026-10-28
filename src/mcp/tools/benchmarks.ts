import {
    actuatorBenchmarksOut,
    actuatorBenchmarksView,
    benchmarkListOut,
    benchmarkListView,
} from "@/benchmarks/views";
import { ACTUATORS } from "@/catalog";
import { z } from "zod";
import { ToolInputError, defineTool } from "../tool";

// The /benchmarks dataset as an MCP tool: measured runs vs the datasheet.
const getBenchmarks = defineTool({
    name: "get_benchmarks",
    title: "Measured actuator benchmarks",
    description:
        "Measured performance of a catalog actuator next to its datasheet: dyno speed curves, thermal holds (time to the thermal limit, or continuous), backlash, stiffness, friction, ripple, bandwidth, latency and repeatability, from published tests (papers, vendor test reports, reviewer tests) and community dyno runs. Each run has an origin badge (published, lab, community), an independence label (vendor, vendor-affiliated, independent) with its evidence, rig, uncertainty and source URL. The datasheet_vs_measured rows give a verdict (below-datasheet, matches, beats; within-spec or over-limit for upper-limit claims) only for independent runs; vendor and vendor-affiliated rows have verdict null. Omit actuator_id to list every run.",
    input: z.object({
        actuator_id: z
            .string()
            .min(1)
            .max(120)
            .optional()
            .describe(
                "Catalog actuator id, e.g. 'mjbots-qdd100'. Omit to list all runs.",
            ),
    }),
    output: z.object({
        actuator: actuatorBenchmarksOut.nullable(),
        all: benchmarkListOut.nullable(),
    }),
    run: ({ actuator_id }) => {
        if (!actuator_id) return { actuator: null, all: benchmarkListView({}) };
        const view = actuatorBenchmarksView(actuator_id);
        if (!view) {
            const near = ACTUATORS.filter((a) =>
                a.id.includes(actuator_id.toLowerCase()),
            )
                .slice(0, 5)
                .map((a) => a.id);
            throw new ToolInputError(
                `No actuator "${actuator_id}".${near.length ? ` Did you mean: ${near.join(", ")}?` : " Find ids with search_actuators."}`,
            );
        }
        return { actuator: view, all: null };
    },
});

export const benchmarkTools = [getBenchmarks];
