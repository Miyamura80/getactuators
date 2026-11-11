import {
    CAGR_END,
    CAGR_START,
    COMPLETE_THROUGH,
    FIRST_YEAR,
    LAG_MONTHS,
    LANDSCAPE,
    type LandscapeScope,
    METHODOLOGY,
    PATENTS_AS_OF,
    PATENT_LIMIT,
    PATENT_SOURCES,
    PATENT_YEARS,
    TECHNOLOGY_IDS,
    TECHNOLOGY_LIST,
    TOP_FAMILIES,
    TOP_VALUE,
    UNKNOWN_COUNTRY,
    areaCells,
    countryTotals,
    familiesFor,
    familiesPerYear,
    getTechnology,
    googlePatentsUrl,
    intlShares,
    isLandscapeScope,
    landscapeOf,
    leaderboard,
    patentsApiPath,
    patentsPageUrl,
    scopeLabel,
    seriesByCountry,
    top5Share,
    valueRows,
} from "@/patents";
import { absoluteUrl } from "@/server/site";
import { concentration } from "@/supply-chain/concentration";
import { SOURCE_REUSE } from "@/supply-chain/reuse";
import { z } from "zod";
import { type ApiContext, json } from "./http";
import { parseQuery } from "./params";
import { ApiError } from "./problem";
import { schemaRegistry } from "./schemas";

// /api/v1/patents/{technology}: one technology's patent landscape (or
// "all"). Same wire shape as the MCP tool get_patent_landscape.

export const PATENT_SCOPES = ["all", ...TECHNOLOGY_IDS] as const;

const round = (v: number, d = 4) => Math.round(v * 10 ** d) / 10 ** d;

const familyOut = z.object({
    family_id: z.string(),
    publication_number: z.string().describe("Representative publication."),
    title: z.string(),
    assignee: z.string().describe("First assignee, normalised."),
    company_id: z.string().nullable().describe("Supply-chain company id, when listed."),
    country: z
        .string()
        .describe(`Applicant country (ISO alpha-2, ${UNKNOWN_COUNTRY} unknown).`),
    priority_date: z.string(),
    jurisdictions: z.number().int().describe("Distinct publishing offices."),
    technologies: z.array(z.string()),
    url: z.string().describe("Google Patents page."),
});

const landscapeOut = z.object({
    technology: z.string(),
    label: z.string(),
    scope: z.string(),
    as_of: z.string().describe("Date of the BigQuery extract."),
    years: z.array(z.number().int()),
    complete_through: z.number().int().describe("Last priority year fully published."),
    incomplete_from: z
        .string()
        .describe(
            `Priority dates from here on are still being published (${LAG_MONTHS}-month lag).`,
        ),
    cpc_codes: z.array(
        z.object({
            code: z.string(),
            rationale: z.string(),
            filtered: z
                .boolean()
                .describe("Counts only when the keyword filter passes."),
        }),
    ),
    title_filter: z.array(z.string()).describe("Case-insensitive regular expressions."),
    co_codes: z
        .array(z.string())
        .describe("CPC prefixes that pass the filter on their own."),
    title_exclude: z.array(z.string()),
    families: z.number().int(),
    assignees: z.number().int().describe("Distinct normalised first assignees."),
    top5_share: z
        .number()
        .describe("Share of families held by the five largest assignees."),
    country_concentration: z
        .object({ top_country: z.string(), share: z.number(), hhi: z.number() })
        .nullable(),
    per_year: z.array(
        z.object({
            year: z.number().int(),
            families: z.number().int(),
            granted: z
                .number()
                .int()
                .describe("Families with a grant (kind B or C, not utility models)."),
            intl: z
                .number()
                .int()
                .describe("Families published by 2+ offices other than WO."),
            triadic: z.number().int().describe("Families published by US, EP and JP."),
            incomplete: z.boolean(),
        }),
    ),
    value: z
        .object({
            years: z
                .array(z.number().int())
                .describe("First and last priority year counted (complete years)."),
            cn_families: z.number().int().describe("Applicant country CN."),
            cn_intl_share: z
                .number()
                .describe("Share of CN families filed in 2+ offices."),
            rest_families: z.number().int().describe("Every other applicant country."),
            rest_intl_share: z
                .number()
                .describe("Share of non-CN families filed in 2+ offices."),
            assignees: z.array(
                z.object({
                    name: z.string(),
                    company_id: z.string().nullable(),
                    country: z.string(),
                    families: z.number().int(),
                    intl_share: z.number().describe("Share filed in 2+ offices."),
                    granted: z.number().int(),
                    triadic: z.number().int(),
                }),
            ),
        })
        .describe(
            `Value vs volume: the ${TOP_VALUE} largest first assignees by families in the complete years, with how much they protect abroad.`,
        ),
    application_areas: z
        .array(
            z.object({
                id: z.string(),
                label: z.string(),
                cpc: z
                    .string()
                    .describe("Regular expression matched against CPC codes."),
                families: z.number().int(),
                share: z.number(),
                share_early: z.number(),
                share_late: z.number(),
            }),
        )
        .describe(
            "Application areas by CPC co-classification (complete years), a proxy for use; share_early and share_late compare the area_windows.",
        ),
    area_windows: z.object({
        early: z.array(z.number().int()),
        late: z.array(z.number().int()),
    }),
    by_country: z.array(
        z.object({
            country: z.string().describe("ISO alpha-2, or other."),
            families: z.number().int(),
            per_year: z.array(z.number().int()),
        }),
    ),
    top_assignees: z.array(
        z.object({
            rank: z.number().int(),
            name: z.string(),
            company_id: z.string().nullable(),
            country: z
                .string()
                .describe("HQ for listed companies, else main applicant country."),
            families: z.number().int(),
            share: z.number(),
            cagr_3y: z
                .number()
                .nullable()
                .describe(`Growth from priority year ${CAGR_START} to ${CAGR_END}.`),
            per_year: z.array(z.number().int()),
        }),
    ),
    top_families: z.array(familyOut),
    methodology: z.record(z.string(), z.string()),
    sources: z.array(
        z.object({
            id: z.string(),
            title: z.string(),
            url: z.string(),
            reuse: z.enum(SOURCE_REUSE),
        }),
    ),
    url: z.string(),
    api_url: z.string(),
});

export const PatentLandscapeSchema = landscapeOut;
schemaRegistry.add(PatentLandscapeSchema, { id: "PatentLandscape" });

export type PatentLandscapeView = z.infer<typeof landscapeOut>;

// Top families to return: the same bounds for REST (coerced from the query)
// and MCP (a JSON number).
export const patentLimit = (n: z.ZodNumber) =>
    n
        .int()
        .min(0)
        .max(TOP_FAMILIES)
        .describe(
            `Top families to return, 0 to ${TOP_FAMILIES} (default ${PATENT_LIMIT}).`,
        );

export const PatentParams = z.object({
    limit: patentLimit(z.coerce.number()).default(PATENT_LIMIT),
});

export function patentLandscapeView(
    scope: LandscapeScope,
    limit = PATENT_LIMIT,
): PatentLandscapeView {
    const tech = scope === "all" ? undefined : getTechnology(scope);
    const l = landscapeOf(scope);
    const c = concentration(countryTotals(scope));
    const incompleteYear = Number(LANDSCAPE.incompleteFrom.slice(0, 4));
    const perYear = familiesPerYear(scope);
    const granted = familiesPerYear(scope, "granted");
    const intl = familiesPerYear(scope, "intl");
    const triadic = familiesPerYear(scope, "triadic");
    const v = l.value;
    const shares = intlShares(scope);
    return {
        technology: scope,
        label: scopeLabel(scope),
        scope:
            tech?.scope ??
            `Every family in at least one of the ${TECHNOLOGY_LIST.length} technologies, counted once.`,
        as_of: PATENTS_AS_OF,
        years: PATENT_YEARS,
        complete_through: COMPLETE_THROUGH,
        incomplete_from: LANDSCAPE.incompleteFrom,
        cpc_codes: (tech?.codes ?? []).map((r) => ({
            code: r.code,
            rationale: r.why,
            filtered: Boolean(r.filtered),
        })),
        title_filter: tech?.filter?.title ?? [],
        co_codes: tech?.filter?.coCodes ?? [],
        title_exclude: tech?.exclude ?? [],
        families: l.families,
        assignees: l.assignees,
        top5_share: round(top5Share(scope)),
        country_concentration: c
            ? { top_country: c.top.country, share: round(c.top.share), hhi: c.hhi }
            : null,
        per_year: PATENT_YEARS.map((year, i) => ({
            year,
            families: perYear[i] ?? 0,
            granted: granted[i] ?? 0,
            intl: intl[i] ?? 0,
            triadic: triadic[i] ?? 0,
            incomplete: year >= incompleteYear,
        })),
        value: {
            years: [FIRST_YEAR, COMPLETE_THROUGH],
            cn_families: v.cn.families,
            cn_intl_share: round(shares.cn),
            rest_families: v.rest.families,
            rest_intl_share: round(shares.rest),
            assignees: valueRows(scope).map((a) => ({
                name: a.name,
                company_id: a.company ?? null,
                country: a.country,
                families: a.families,
                intl_share: round(a.families ? a.intl / a.families : 0),
                granted: a.granted,
                triadic: a.triadic,
            })),
        },
        application_areas: areaCells(scope).map((c) => ({
            id: c.area,
            label: c.label,
            cpc: c.cpc,
            families: c.families,
            share: round(c.share),
            share_early: round(c.early),
            share_late: round(c.late),
        })),
        area_windows: {
            early: LANDSCAPE.areaWindows.early,
            late: LANDSCAPE.areaWindows.late,
        },
        by_country: seriesByCountry(scope, 10).map((s) => ({
            country: s.key,
            families: s.values.reduce((a, b) => a + b, 0),
            per_year: s.values,
        })),
        top_assignees: leaderboard(scope).map((a) => ({
            rank: a.rank,
            name: a.name,
            company_id: a.company ?? null,
            country: a.country,
            families: a.families,
            share: round(a.share),
            cagr_3y: a.cagr === null ? null : round(a.cagr),
            per_year: a.years,
        })),
        top_families: familiesFor(scope)
            .slice(0, limit)
            .map((f) => ({
                family_id: f.id,
                publication_number: f.pub,
                title: f.title,
                assignee: f.assignee,
                company_id: f.company ?? null,
                country: f.country,
                priority_date: f.priority,
                jurisdictions: f.jurisdictions,
                technologies: f.techs,
                url: googlePatentsUrl(f.pub),
            })),
        methodology: { ...METHODOLOGY },
        sources: Object.entries(PATENT_SOURCES).map(([id, s]) => ({ id, ...s })),
        url: absoluteUrl(patentsPageUrl(scope)),
        api_url: absoluteUrl(patentsApiPath(scope)),
    };
}

export function patentLandscapeResult(
    technology: string,
    limit?: number,
): { view: PatentLandscapeView } | { error: string } {
    if (!isLandscapeScope(technology))
        return {
            error: `No patent technology "${technology}". Use one of: ${PATENT_SCOPES.join(", ")}.`,
        };
    return { view: patentLandscapeView(technology, limit) };
}

export function patentLandscape({ params, url }: ApiContext): PatentLandscapeView {
    const { limit } = parseQuery(PatentParams, url);
    const r = patentLandscapeResult(params.technology ?? "", limit);
    if ("error" in r)
        throw new ApiError("not_found", {
            detail: r.error,
            hint: `Technology ids: ${PATENT_SCOPES.join(", ")}.`,
        });
    return r.view;
}

export const patentLandscapeHandler = (ctx: ApiContext): Response =>
    json(patentLandscape(ctx));
