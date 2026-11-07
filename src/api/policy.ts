import {
    MEASURE_STATUSES,
    MEASURE_TYPES,
    findMeasures,
    getMeasure,
} from "@/supply-chain/policy";
import {
    measureListOut,
    measureListView,
    measureOut,
    measureView,
} from "@/supply-chain/policy/views";
import { STAGES } from "@/supply-chain/stages";
import { z } from "zod";
import { type ApiContext, json } from "./http";
import { parseQuery } from "./params";
import { ApiError } from "./problem";
import { schemaRegistry } from "./schemas";

// /api/v1/policy: the /policy dataset over REST. Same wire shape as the MCP
// tool list_policy_measures.

function named<T extends z.ZodType>(id: string, schema: T): T {
    schemaRegistry.add(schema, { id });
    return schema;
}

export const PolicyListSchema = named("PolicyMeasureList", measureListOut);
export const PolicyMeasureSchema = named("PolicyMeasure", measureOut);

export const PolicyListParams = z.object({
    jurisdiction: z
        .string()
        .regex(/^[A-Za-z]{2,5}$/)
        .optional()
        .describe("ISO 3166 alpha-2 code (CN, US, JP, KR, AU), EU, INTL, or OTHER."),
    type: z
        .enum(MEASURE_TYPES)
        .optional()
        .describe("export-control, tariff, subsidy or standard."),
    stage: z
        .enum(STAGES)
        .optional()
        .describe("Supply-chain stage the measure hits, e.g. magnet."),
    status: z
        .enum(MEASURE_STATUSES)
        .optional()
        .describe("draft, announced, in-force, suspended or expired."),
});

export function policyList({ url }: ApiContext) {
    return measureListView(findMeasures(parseQuery(PolicyListParams, url)));
}

export function policyMeasure({ params }: ApiContext) {
    const id = params.id ?? "";
    const m = getMeasure(id);
    if (!m)
        throw new ApiError("not_found", {
            detail: `No policy measure "${id}".`,
            hint: "List measure ids with GET /api/v1/policy.",
        });
    return measureView(m);
}

export const listPolicyHandler = (ctx: ApiContext): Response => json(policyList(ctx));
export const getPolicyHandler = (ctx: ApiContext): Response => json(policyMeasure(ctx));
