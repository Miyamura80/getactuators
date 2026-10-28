import { TECHNOLOGY_IDS, getTechnology } from "@/patents/technologies";
import {
    patentLandscapeOut,
    patentLandscapeView,
    patentTechnologyListOut,
    patentTechnologyListView,
} from "@/patents/views";
import { z } from "zod";
import { type ApiContext, json } from "./http";
import { parseQuery } from "./params";
import { ApiError } from "./problem";
import { schemaRegistry } from "./schemas";

// /api/v1/patents: the /patents landscape over REST. Same wire shape as the
// MCP tool get_patent_landscape.

function named<T extends z.ZodType>(id: string, schema: T): T {
    schemaRegistry.add(schema, { id });
    return schema;
}

export const PatentTechnologyListSchema = named(
    "PatentTechnologyList",
    patentTechnologyListOut,
);
export const PatentLandscapeSchema = named("PatentLandscape", patentLandscapeOut);

export const PatentLandscapeParams = z.object({
    families: z.coerce
        .number()
        .int()
        .min(0)
        .max(200)
        .default(50)
        .describe("How many top families to return, 0 to 200 (default 50)."),
});

export function listPatentTechnologiesHandler(): Response {
    return json(patentTechnologyListView());
}

export function getPatentLandscapeHandler({ params, url }: ApiContext): Response {
    const id = params.technology ?? "";
    const technology = getTechnology(id);
    if (!technology)
        throw new ApiError("not_found", {
            detail: `No technology "${id}".`,
            hint: `Technology ids: ${TECHNOLOGY_IDS.join(", ")}.`,
        });
    const { families } = parseQuery(PatentLandscapeParams, url);
    return json(patentLandscapeView(technology, families));
}
