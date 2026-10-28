import { findSdkBrand, sdkBrandOut, sdkBrandView } from "@/sdk/views";
import { z } from "zod";
import { ToolInputError, defineTool } from "../tool";

// /sdk over MCP: one brand's SDK scorecard with the evidence behind each check.

const getSdkScore = defineTool({
    name: "get_sdk_score",
    title: "Get an actuator brand's SDK score",
    description:
        "How good a brand's SDK is, by brand id (e.g. robotis, mjbots, odrive) or by catalog actuator id: overall score per preset (balanced, ros2, python, embedded, rl-sim), seven dimension scores 0-10 (protocol openness, bindings, ROS 2 and sim, docs, firmware, support, reliability) and each check with the GitHub files, maker docs and forum posts behind it. A null score means nothing in that dimension could be checked; a zero means no public evidence was found.",
    input: z.object({
        brand: z.string().optional().describe("Brand id, e.g. robotis."),
        actuator_id: z
            .string()
            .optional()
            .describe("Catalog actuator id; its brand is used."),
    }),
    output: sdkBrandOut,
    run: ({ brand, actuator_id }) => {
        const key = brand ?? actuator_id;
        if (!key) throw new ToolInputError("Pass brand or actuator_id.");
        const b = findSdkBrand(key);
        if (!b)
            throw new ToolInputError(
                `No brand or actuator "${key}". Brand ids are listed by GET /api/v1/sdk.`,
            );
        return sdkBrandView(b);
    },
});

export const sdkTools = [getSdkScore];
