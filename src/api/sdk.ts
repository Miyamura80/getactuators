import { SDK_PRESETS, noSdkScoreReason, resolveSdkBrand } from "@/sdk";
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

// Data behind each endpoint, shared with its markdown twin (api-md.ts).
export function sdkList({ url }: ApiContext) {
    const { preset } = parseQuery(SdkListParams, url);
    return sdkListView(preset);
}

export function sdkBrand({ params, url }: ApiContext) {
    const key = params.brand ?? "";
    const { preset } = parseQuery(SdkListParams, url);
    const s = resolveSdkBrand(key, preset);
    if (!s)
        throw new ApiError("not_found", {
            detail:
                noSdkScoreReason(key) === "unscored"
                    ? `No SDK score for "${key}": a reducer or bare motor has no software of its own.`
                    : `No SDK brand or catalog actuator "${key}".`,
            hint: "List scored brands with GET /api/v1/sdk.",
        });
    return sdkBrandView(s);
}

export const listSdkHandler = (ctx: ApiContext): Response => json(sdkList(ctx));
export const getSdkHandler = (ctx: ApiContext): Response => json(sdkBrand(ctx));
