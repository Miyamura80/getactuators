import { z } from "zod";
import { absoluteUrl } from "../server/site";
import {
    LAG_MONTHS,
    LANDSCAPE,
    type LandscapeSnapshot,
    PATENTS_PATH,
    firstIncompleteYear,
    googlePatentsUrl,
    isCollected,
    leaderboard,
    technologySnapshot,
} from "./landscape";
import { TECHNOLOGIES, TECHNOLOGY_IDS, type Technology } from "./technologies";

// Wire shapes of the /patents dataset for REST and MCP: snake_case, nulls
// for unknowns. Server side only (zod).

export const METHODOLOGY = `Patent families with an earliest priority date since 2010 in Google Patents Public Datasets on BigQuery, scoped by CPC codes (plus title and abstract keyword filters for generic codes). One family counts once however many countries it was filed in. Priority year is the earliest priority in the family; applicant country is the country of the first harmonised assignee on the family's earliest publication. Assignee names are folded into organisations with an alias table and linked to the supply-chain company registry where possible. The last ${LAG_MONTHS} months of priority dates are incomplete because applications publish about ${LAG_MONTHS} months after filing.`;

const cpcOut = z.object({
    code: z.string().describe("CPC symbol, e.g. F16H49/001."),
    match: z
        .enum(["prefix", "exact"])
        .describe("`prefix` also takes every symbol that extends the code."),
    title: z.string(),
    rationale: z.string(),
    keywords: z
        .array(z.string())
        .nullable()
        .describe("Title or abstract terms a family must match for this code."),
});

const technologyOut = z.object({
    id: z.enum(TECHNOLOGY_IDS),
    label: z.string(),
    description: z.string(),
    cpc: z.array(cpcOut),
    families: z
        .number()
        .nullable()
        .describe("Patent families since 2010; null before the first snapshot."),
});

const statusOut = z
    .enum(["collected", "not_collected"])
    .describe("`not_collected` until the first BigQuery snapshot is committed.");

export const patentTechnologyListOut = z.object({
    status: statusOut,
    collected_at: z.string().nullable(),
    methodology: z.string(),
    data: z.array(technologyOut),
});

const assigneeOut = z.object({
    rank: z.number(),
    name: z.string(),
    country: z.string().describe("ISO 3166 alpha-2 of the applicant, or empty."),
    company_id: z
        .string()
        .nullable()
        .describe("Supply-chain registry id; GET /api/v1/companies/{id}."),
    families: z.number(),
    share: z.number().describe("Fraction of the technology's families."),
    cagr_3y: z
        .number()
        .nullable()
        .describe(
            "Compound annual growth over the three years to the last complete year.",
        ),
});

export const patentLandscapeOut = z.object({
    status: statusOut,
    collected_at: z.string().nullable(),
    methodology: z.string(),
    technology: technologyOut,
    first_incomplete_year: z
        .number()
        .nullable()
        .describe("Priority years from this one on are still filling in."),
    by_year_country: z
        .array(
            z.object({ year: z.number(), country: z.string(), families: z.number() }),
        )
        .describe("Families per priority year and applicant country."),
    top_assignees: z.array(assigneeOut),
    top5_share: z.number().nullable(),
    cagr_window: z.tuple([z.number(), z.number()]).nullable(),
    top_families: z.array(
        z.object({
            family_id: z.string(),
            publication: z.string(),
            title: z.string(),
            assignee: z.string(),
            country: z.string(),
            priority_date: z.string(),
            url: z.string(),
        }),
    ),
    cross_checks: z.array(
        z.object({
            year: z.number(),
            source: z.enum(["lens", "patentsview"]),
            bigquery: z.number(),
            other: z.number(),
            url: z.string(),
            note: z.string().nullable(),
        }),
    ),
    page: z.string(),
});

function technologyView(
    t: Technology,
    s: LandscapeSnapshot,
): z.input<typeof technologyOut> {
    return {
        id: t.id,
        label: t.label,
        description: t.description,
        cpc: t.cpc.map((c) => ({
            code: c.code,
            match: c.match,
            title: c.title,
            rationale: c.rationale,
            keywords: c.keywords ? [...c.keywords] : null,
        })),
        families: technologySnapshot(t.id, s)?.families ?? null,
    };
}

export function patentTechnologyListView(
    s: LandscapeSnapshot = LANDSCAPE,
): z.input<typeof patentTechnologyListOut> {
    return {
        status: isCollected(s) ? "collected" : "not_collected",
        collected_at: s.collectedAt,
        methodology: METHODOLOGY,
        data: TECHNOLOGIES.map((t) => technologyView(t, s)),
    };
}

export function patentLandscapeView(
    t: Technology,
    familyLimit = 50,
    s: LandscapeSnapshot = LANDSCAPE,
): z.input<typeof patentLandscapeOut> {
    const snap = technologySnapshot(t.id, s);
    const board = leaderboard(t.id, s);
    return {
        status: isCollected(s) ? "collected" : "not_collected",
        collected_at: s.collectedAt,
        methodology: METHODOLOGY,
        technology: technologyView(t, s),
        first_incomplete_year: firstIncompleteYear(s),
        by_year_country: snap?.byYearCountry ?? [],
        top_assignees:
            board?.rows.map((r) => ({
                rank: r.rank,
                name: r.name,
                country: r.country,
                company_id: r.companyId ?? null,
                families: r.families,
                share: r.share,
                cagr_3y: r.cagr,
            })) ?? [],
        top5_share: board?.top5Share ?? null,
        cagr_window: board?.window ?? null,
        top_families: (snap?.topFamilies ?? []).slice(0, familyLimit).map((f) => ({
            family_id: f.familyId,
            publication: f.publication,
            title: f.title,
            assignee: f.assignee,
            country: f.country,
            priority_date: f.priorityDate,
            url: googlePatentsUrl(f.publication),
        })),
        cross_checks: s.crossChecks
            .filter((c) => c.technology === t.id)
            .map((c) => ({
                year: c.year,
                source: c.source,
                bigquery: c.bigquery,
                other: c.other,
                url: c.url,
                note: c.note ?? null,
            })),
        page: absoluteUrl(`${PATENTS_PATH}?tech=${t.id}`),
    };
}
