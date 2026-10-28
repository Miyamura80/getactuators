import { presetById } from "@/sdk";
import {
    PRESET_IDS,
    findSdkBrand,
    sdkBrandOut,
    sdkBrandView,
    sdkListOut,
    sdkListView,
} from "@/sdk/views";
import { z } from "zod";
import { type ApiContext, json } from "./http";
import { parseQuery } from "./params";
import { ApiError } from "./problem";
import { schemaRegistry } from "./schemas";

// /api/v1/sdk: the /sdk leaderboard and per-brand scorecards. Same wire
// shape as the MCP tool get_sdk_score.

function named<T extends z.ZodType>(id: string, schema: T): T {
    schemaRegistry.add(schema, { id });
    return schema;
}

export const SdkListSchema = named("SdkLeaderboard", sdkListOut);
export const SdkBrandSchema = named("SdkBrand", sdkBrandOut);

export const SdkListParams = z.object({
    preset: z
        .enum(PRESET_IDS)
        .optional()
        .describe("Weighting: balanced (default), ros2, python, embedded or rl-sim."),
});

export function listSdkHandler({ url }: ApiContext): Response {
    const { preset } = parseQuery(SdkListParams, url);
    return json(sdkListView(presetById(preset)));
}

export function getSdkBrandHandler({ params }: ApiContext): Response {
    const key = params.brand ?? "";
    const b = findSdkBrand(key);
    if (!b)
        throw new ApiError("not_found", {
            detail: `No brand or actuator "${key}".`,
            hint: "List brand ids with GET /api/v1/sdk; an actuator id also works.",
        });
    return json(sdkBrandView(b));
}
