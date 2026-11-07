import { BOM_SLUGS, getBomCase } from "@/supply-chain/bom";
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
    if (!c) return { error: `No BOM case "${slug}". Slugs: ${BOM_SLUGS.join(", ")}.` };
    return { view: bomCaseView(c) };
}

export function listBomHandler(_: ApiContext): Response {
    return json(bomListView());
}

export function getBomHandler({ params }: ApiContext): Response {
    const r = bomResult(params.slug ?? "");
    if ("error" in r)
        throw new ApiError("not_found", {
            detail: r.error,
            hint: "List cases with GET /api/v1/bom.",
        });
    return json(r.view);
}
