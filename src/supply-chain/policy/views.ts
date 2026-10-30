import { z } from "zod";
import { COMPANIES } from "../companies";
import { STAGES } from "../stages";
import { refs, sourceRefOut, sourced, sourcedOut } from "../views";
import {
    MEASURE_SCOPES,
    MEASURE_STATUSES,
    MEASURE_TYPES,
    MEASURE_TYPE_LABEL,
    POLICY_AS_OF,
    POLICY_LANES,
    POLICY_PATH,
    type PolicyMeasure,
    laneOf,
} from "./index";

// Wire shape of /policy for REST and MCP: snake_case, nulls for unknowns,
// sources inline. Server side only (zod).

const statusChangeOut = z.object({
    date: z.string().describe("YYYY, YYYY-MM or YYYY-MM-DD."),
    status: z.enum(MEASURE_STATUSES),
    note: z.string().nullable(),
    sources: z.array(sourceRefOut),
});

const companyRefOut = z.object({
    name: z.string(),
    company_id: z
        .string()
        .nullable()
        .describe(
            "Supply-chain registry id when the company is in it (GET /api/v1/companies/{id}).",
        ),
});

export const measureOut = z.object({
    id: z.string(),
    url: z.string().describe("Deep link to the measure on /policy."),
    jurisdiction: z
        .string()
        .describe("ISO 3166 alpha-2 country code, EU or INTL (standards bodies)."),
    lane: z
        .enum(POLICY_LANES)
        .describe("Swimlane on /policy; OTHER for countries without their own."),
    type: z.enum(MEASURE_TYPES),
    type_label: z.string(),
    title: z.string(),
    summary: z.string().describe("What the measure does, at most 60 words."),
    issuer: z.string(),
    announced: z.string().nullable(),
    effective: z.string().nullable(),
    expires: z.string().nullable(),
    status: z.enum(MEASURE_STATUSES),
    status_history: z
        .array(statusChangeOut)
        .describe("Oldest first, each change with its own source."),
    stages: z.array(z.enum(STAGES)).describe("Supply-chain stages the measure hits."),
    scope: z.enum(MEASURE_SCOPES).describe("product, sector or economy."),
    hs_codes: z.array(z.string()),
    elements: z.array(z.string()),
    companies_affected: z.array(companyRefOut),
    amount_usd: sourcedOut
        .nullable()
        .describe("Award or loan size for subsidies, in US$."),
    metals_event_id: z
        .string()
        .nullable()
        .describe(
            "Event pinned on the /metals price chart (/metals?event={id}#prices).",
        ),
    sources: z.array(sourceRefOut),
});

export const measureListOut = z.object({
    as_of: z.string(),
    total: z.number(),
    results: z.array(measureOut),
});

const companyByName = new Map(COMPANIES.map((c) => [c.name, c.id]));

export function measureUrl(m: PolicyMeasure): string {
    return `${POLICY_PATH}#measure=${m.id}`;
}

export function measureView(m: PolicyMeasure): z.input<typeof measureOut> {
    return {
        id: m.id,
        url: measureUrl(m),
        jurisdiction: m.jurisdiction,
        lane: laneOf(m),
        type: m.type,
        type_label: MEASURE_TYPE_LABEL[m.type],
        title: m.title,
        summary: m.summary,
        issuer: m.issuer,
        announced: m.announced ?? null,
        effective: m.effective ?? null,
        expires: m.expires ?? null,
        status: m.status,
        status_history: m.statusHistory.map((c) => ({
            date: c.date,
            status: c.status,
            note: c.note ?? null,
            sources: refs(c.sources),
        })),
        stages: m.stages,
        scope: m.scope,
        hs_codes: m.hsCodes ?? [],
        elements: m.elements ?? [],
        companies_affected: (m.companiesAffected ?? []).map((name) => ({
            name,
            company_id: companyByName.get(name) ?? null,
        })),
        amount_usd: sourced(m.amountUsd),
        metals_event_id: m.metals?.eventId ?? null,
        sources: refs(m.sources),
    };
}

export function measureListView(
    measures: readonly PolicyMeasure[],
): z.input<typeof measureListOut> {
    return {
        as_of: POLICY_AS_OF,
        total: measures.length,
        results: measures.map(measureView),
    };
}
