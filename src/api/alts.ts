import { ALT_FAMILIES, ALT_TECHS, getAltTech } from "@/supply-chain/alts";
import {
    altTechListOut,
    altTechListView,
    altTechOut,
    altTechView,
} from "@/supply-chain/alts/views";
import { z } from "zod";
import { type ApiContext, json } from "./http";
import { parseQuery } from "./params";
import { ApiError } from "./problem";
import { schemaRegistry } from "./schemas";

// /api/v1/alts: the /alts technologies over REST. Same wire shape as the MCP
// tools list_alt_technologies and get_alt_technology.

function named<T extends z.ZodType>(id: string, schema: T): T {
    schemaRegistry.add(schema, { id });
    return schema;
}

export const AltTechListSchema = named("AltTechList", altTechListOut);
export const AltTechSchema = named("AltTech", altTechOut);

export const AltListParams = z.object({
    family: z
        .enum(ALT_FAMILIES)
        .optional()
        .describe("ree-free-motor, artificial-muscle, hydraulic or transmission."),
});

export const ALT_TECH_IDS = ALT_TECHS.map((t) => t.id);

export function altResult(
    id: string,
): { view: ReturnType<typeof altTechView> } | { error: string } {
    const t = getAltTech(id);
    if (!t) return { error: `No technology "${id}". Ids: ${ALT_TECH_IDS.join(", ")}.` };
    return { view: altTechView(t) };
}

export function altList({ url }: ApiContext) {
    return altTechListView(parseQuery(AltListParams, url).family);
}

export function altTech({ params }: ApiContext) {
    const r = altResult(params.id ?? "");
    if ("error" in r)
        throw new ApiError("not_found", {
            detail: r.error,
            hint: "List technologies with GET /api/v1/alts.",
        });
    return r.view;
}

export const listAltsHandler = (ctx: ApiContext): Response => json(altList(ctx));
export const getAltHandler = (ctx: ApiContext): Response => json(altTech(ctx));
