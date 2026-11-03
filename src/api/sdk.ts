import { SDK_PRESETS, getSdkBrand, resolveSdkBrand } from "@/sdk";
import { sdkBrandOut, sdkBrandView, sdkListOut, sdkListView } from "@/sdk/views";
import { z } from "zod";
import { type ApiContext, json } from "./http";
import { parseQuery } from "./params";
import { ApiError } from "./problem";
import { schemaRegistry } from "./schemas";

// /api/v1/sdk: the /sdk scores over REST. Same wire shape as the MCP tool
// get_sdk_score.

function named<T extends z.ZodType>(id: string, schema: T): T {
    schemaRegistry.add(schema, { id });
    return schema;
}

export const SdkListSchema = named("SdkScoreList", sdkListOut);
export const SdkBrandSchema = named("SdkBrandScore", sdkBrandOut);

export const SdkListParams = z.object({
    preset: z
        .enum(SDK_PRESETS)
        .optional()
        .describe(
            "Weighting: balanced, ros2, python, embedded or rl (default balanced).",
        ),
});

export function listSdkHandler({ url }: ApiContext): Response {
    const { preset } = parseQuery(SdkListParams, url);
    return json(sdkListView(preset));
}

export function getSdkHandler({ params, url }: ApiContext): Response {
    const key = params.brand ?? "";
    const { preset } = parseQuery(SdkListParams, url);
    const s = resolveSdkBrand(key, preset);
    if (!s)
        throw new ApiError("not_found", {
            detail: getSdkBrand(key)
                ? `"${key}" makes reducers or bare motors: no SDK to score.`
                : `No SDK brand or actuator "${key}".`,
            hint: "List scored brands with GET /api/v1/sdk.",
        });
    return json(sdkBrandView(s));
}
