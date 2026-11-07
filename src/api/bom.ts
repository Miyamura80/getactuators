import { BOM_SLUGS, type BomCase, getBomCase } from "@/supply-chain/bom";
import {
    bomCaseOut,
    bomCaseView,
    bomListOut,
    bomListView,
} from "@/supply-chain/bom/views";
import type { z } from "zod";
import { type ApiContext, json } from "./http";
import { ApiError } from "./problem";
import { schemaRegistry } from "./schemas";

// /api/v1/bom: the /bom teardowns over REST. Same wire shape as the MCP tools
// list_bom_cases and get_bom.

function named<T extends z.ZodType>(id: string, schema: T): T {
    schemaRegistry.add(schema, { id });
    return schema;
}

export const BomListSchema = named("BomList", bomListOut);
export const BomCaseSchema = named("BomCase", bomCaseOut);

export function bomResult(
    slug: string,
): { view: ReturnType<typeof bomCaseView> } | { error: string } {
    const c = getBomCase(slug);
    if (!c) return { error: missing(slug) };
    return { view: bomCaseView(c) };
}

const missing = (slug: string) =>
    `No BOM case "${slug}". Slugs: ${BOM_SLUGS.join(", ")}.`;

// The case a /api/v1/bom/{slug} request names; shared by the JSON handler and
// its markdown twin.
export function findBomCase({ params }: ApiContext): BomCase {
    const slug = params.slug ?? "";
    const c = getBomCase(slug);
    if (!c)
        throw new ApiError("not_found", {
            detail: missing(slug),
            hint: "List cases with GET /api/v1/bom.",
        });
    return c;
}

export function listBomHandler(_: ApiContext): Response {
    return json(bomListView());
}

export function getBomHandler(ctx: ApiContext): Response {
    return json(bomCaseView(findBomCase(ctx)));
}
