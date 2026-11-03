import { SDK_PRESETS, noSdkScoreReason, resolveSdkBrand } from "@/sdk";
import { sdkBrandOut, sdkBrandView, sdkListOut, sdkListView } from "@/sdk/views";
import { z } from "zod";
import { ToolInputError, defineTool } from "../tool";

// MCP surface of /sdk: the leaderboard, or one brand's SDK score by brand id
// or catalog actuator id. Same wire shape as GET /api/v1/sdk.

const getSdkScore = defineTool({
    name: "get_sdk_score",
    title: "Get actuator SDK score",
    description:
        "How good an actuator brand's developer software is, scored 0 to 100 on protocol openness, bindings (Python, C++, Rust), ROS 2 and sim models, docs, firmware and tooling, support and comms reliability. Scores blend cited objective checks with classified developer posts from Reddit, Hacker News and GitHub, each linked. Pass brand (e.g. odrive, robotis, cubemars) or actuator_id (e.g. robstride-02) for one brand with all evidence; pass neither for the ranked leaderboard. preset re-weights for a ROS 2 shop, Python hobbyist, embedded or RL / sim-first reader.",
    input: z.object({
        brand: z
            .string()
            .min(1)
            .max(60)
            .optional()
            .describe("SDK brand id, e.g. odrive. Not with actuator_id."),
        actuator_id: z
            .string()
            .min(1)
            .max(120)
            .optional()
            .describe("Catalog actuator id; scored by its brand. Not with brand."),
        preset: z
            .enum(SDK_PRESETS)
            .optional()
            .describe("Weighting preset (default balanced)."),
    }),
    output: z.object({
        leaderboard: sdkListOut.nullable(),
        brand: sdkBrandOut.nullable(),
    }),
    run: ({ brand, actuator_id, preset }) => {
        if (brand !== undefined && actuator_id !== undefined)
            throw new ToolInputError("Pass brand or actuator_id, not both.");
        const key = brand ?? actuator_id;
        if (key === undefined) return { leaderboard: sdkListView(preset), brand: null };
        const s = resolveSdkBrand(key, preset);
        if (!s)
            throw new ToolInputError(
                noSdkScoreReason(key) === "unscored"
                    ? `No SDK score for '${key}': a reducer or bare motor has no software of its own.`
                    : `No SDK brand or catalog actuator '${key}'. Call get_sdk_score with no arguments to list brand ids.`,
            );
        return { leaderboard: null, brand: sdkBrandView(s) };
    },
});

export const sdkTools = [getSdkScore];
