import { SEGMENTS } from "@/supply-chain/companies";
import { findCompanies, findSites, getCompany } from "@/supply-chain/registry";
import { SITE_KINDS } from "@/supply-chain/sites";
import { STAGES } from "@/supply-chain/stages";
import {
    companyDetailOut,
    companyDetailView,
    companyOut,
    companyView,
    siteOut,
    siteView,
} from "@/supply-chain/views";
import { z } from "zod";
import { type ApiContext, json } from "./http";
import { paginate } from "./pagination";
import { parseQuery } from "./params";
import { ApiError } from "./problem";
import { schemaRegistry } from "./schemas";

// /api/v1/companies and /api/v1/sites: the supply-chain registry over REST.
// Same records and wire shapes as the MCP tools (src/supply-chain/views.ts).

function named<T extends z.ZodType>(id: string, schema: T): T {
    schemaRegistry.add(schema, { id });
    return schema;
}

const pagination = z.object({
    next_cursor: z.string().nullable(),
    has_more: z.boolean(),
    total: z.number(),
});

const Company = named("SupplyChainCompany", companyOut);
const Site = named("SupplyChainSite", siteOut);
export const CompanyListSchema = named(
    "SupplyChainCompanyList",
    z.object({ data: z.array(Company), pagination }),
);
export const CompanyDetailSchema = named("SupplyChainCompanyDetail", companyDetailOut);
export const SiteListSchema = named(
    "SupplyChainSiteList",
    z.object({ data: z.array(Site), pagination }),
);

const page = {
    limit: z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .default(25)
        .describe("Page size, 1 to 100 (default 25)."),
    cursor: z.string().min(1).optional().describe("Opaque `pagination.next_cursor`."),
};
const country = z
    .string()
    .length(2)
    .optional()
    .describe("ISO 3166 alpha-2 country code, e.g. `JP`.");
const stage = z.enum(STAGES).optional().describe("Supply-chain stage, e.g. `magnet`.");

export const CompanyListParams = z.object({
    country,
    stage,
    segment: z.enum(SEGMENTS).optional().describe("Industry segment."),
    ...page,
});

export const SiteListParams = z.object({
    country,
    stage,
    company: z.string().optional().describe("Company id."),
    kind: z.enum(SITE_KINDS).optional().describe("Site kind."),
    ...page,
});

export function listCompaniesHandler({ url }: ApiContext): Response {
    const { limit, cursor, ...filters } = parseQuery(CompanyListParams, url);
    const p = paginate(findCompanies(filters), limit, cursor, filters);
    return json({ ...p, data: p.data.map(companyView) });
}

export function getCompanyHandler({ params }: ApiContext): Response {
    const id = params.id ?? "";
    const c = getCompany(id);
    if (!c)
        throw new ApiError("not_found", {
            detail: `No company with id "${id}".`,
            hint: "Ids are slugs; list valid ones with GET /api/v1/companies.",
        });
    return json(companyDetailView(c));
}

export function listSitesHandler({ url }: ApiContext): Response {
    const { limit, cursor, ...filters } = parseQuery(SiteListParams, url);
    const p = paginate(findSites(filters), limit, cursor, filters);
    return json({ ...p, data: p.data.map(siteView) });
}
