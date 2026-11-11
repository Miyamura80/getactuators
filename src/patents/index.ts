import familiesFile from "../../data/patents/families.json";
import landscapeFile from "../../data/patents/landscape.json";
import { PATENTS_PATH } from "./path";
import {
    TECHNOLOGIES,
    type TechnologyId,
    getTechnology,
    isTechnologyId,
} from "./technologies";
import type {
    AssigneeRow,
    FamiliesFile,
    FamilyRow,
    LandscapeFile,
    TechLandscape,
} from "./types";

// /patents: patent families since 2010 for actuator, gear, screw, magnet and
// motor technologies, from data/patents (scripts/patents/build-landscape.ts).
// Relative imports only: the browser bundle reuses this module.

export * from "./technologies";
export * from "./types";
export { PATENT_SOURCES } from "./sources";

export { PATENTS_PATH };
export const PATENTS_API_PATH = "/api/v1/patents";

export const LANDSCAPE = landscapeFile as unknown as LandscapeFile;
export const FAMILIES = (familiesFile as unknown as FamiliesFile).families;

export const PATENTS_AS_OF = LANDSCAPE.asOf;
export const PATENT_YEARS = LANDSCAPE.years;

// A technology id, or every matched family once.
export type LandscapeScope = TechnologyId | "all";

export const isLandscapeScope = (v: string): v is LandscapeScope =>
    v === "all" || isTechnologyId(v);

export function scopeLabel(scope: LandscapeScope): string {
    return scope === "all"
        ? "All technologies"
        : (getTechnology(scope)?.label ?? scope);
}

export function landscapeOf(scope: LandscapeScope): TechLandscape {
    return scope === "all" ? LANDSCAPE.all : LANDSCAPE.technologies[scope];
}

export const patentsApiPath = (scope: LandscapeScope): string =>
    `${PATENTS_API_PATH}/${encodeURIComponent(scope)}`;

export const patentsPageUrl = (scope: LandscapeScope): string =>
    scope === "all"
        ? PATENTS_PATH
        : `${PATENTS_PATH}?technology=${encodeURIComponent(scope)}`;

// Google Patents drops the hyphens: US-9876543-B2 lives at /patent/US9876543B2.
export const googlePatentsUrl = (publication: string): string =>
    `https://patents.google.com/patent/${publication.replace(/-/g, "")}`;

const sum = (xs: readonly number[]) => xs.reduce((s, v) => s + v, 0);

export const UNKNOWN_COUNTRY = "XX";

// Families per priority year in one scope.
export function familiesPerYear(scope: LandscapeScope): number[] {
    const counts = Object.values(landscapeOf(scope).counts);
    return PATENT_YEARS.map((_, i) => sum(counts.map((c) => c[i] ?? 0)));
}

export interface Series {
    key: string;
    label: string;
    values: number[];
}

// Applicant countries as stacked series: the `top` largest, then "Other".
export function seriesByCountry(scope: LandscapeScope, top = 6): Series[] {
    const entries = Object.entries(landscapeOf(scope).counts).filter(
        ([c]) => c !== UNKNOWN_COUNTRY,
    );
    const head = entries
        .slice(0, top)
        .map(([key, values]) => ({ key, label: key, values }));
    const rest = [
        ...entries.slice(top),
        ...Object.entries(landscapeOf(scope).counts).filter(
            ([c]) => c === UNKNOWN_COUNTRY,
        ),
    ];
    const other = PATENT_YEARS.map((_, i) => sum(rest.map(([, v]) => v[i] ?? 0)));
    return sum(other) > 0
        ? [...head, { key: "other", label: "Other", values: other }]
        : head;
}

// One series per technology. A family in two technologies counts in both.
export function seriesByTechnology(): Series[] {
    return TECHNOLOGIES.map((t) => ({
        key: t.id,
        label: t.short,
        values: familiesPerYear(t.id),
    }));
}

// Families per applicant country over every year.
export function countryTotals(scope: LandscapeScope): Record<string, number> {
    return Object.fromEntries(
        Object.entries(landscapeOf(scope).counts)
            .filter(([c]) => c !== UNKNOWN_COUNTRY)
            .map(([c, v]) => [c, sum(v)]),
    );
}

// Years of the growth window: three years ending at the last complete year.
export const CAGR_YEARS = 3;
export const CAGR_END = LANDSCAPE.completeThrough;
export const CAGR_START = CAGR_END - CAGR_YEARS;

const yearIndex = (y: number) => PATENT_YEARS.indexOf(y);

// Compound annual growth of priority-year families from CAGR_START to
// CAGR_END; null when the start year has none.
export function cagr(values: readonly number[]): number | null {
    const a = values[yearIndex(CAGR_START)] ?? 0;
    const b = values[yearIndex(CAGR_END)] ?? 0;
    if (a <= 0) return null;
    return (b / a) ** (1 / CAGR_YEARS) - 1;
}

export interface LeaderRow extends AssigneeRow {
    rank: number;
    share: number;
    cagr: number | null;
}

export const LEADERBOARD_SIZE = 15;

export function leaderboard(scope: LandscapeScope): LeaderRow[] {
    const l = landscapeOf(scope);
    return l.top.slice(0, LEADERBOARD_SIZE).map((a, i) => ({
        ...a,
        rank: i + 1,
        share: l.families ? a.families / l.families : 0,
        cagr: cagr(a.years),
    }));
}

// Share of the scope's families held by its five largest first assignees.
export function top5Share(scope: LandscapeScope): number {
    const l = landscapeOf(scope);
    return l.families ? sum(l.top.slice(0, 5).map((a) => a.families)) / l.families : 0;
}

export function familiesFor(scope: LandscapeScope): FamilyRow[] {
    return scope === "all" ? FAMILIES : FAMILIES.filter((f) => f.techs.includes(scope));
}

// Case-insensitive match on title, assignee, publication number or country.
export function searchFamilies(scope: LandscapeScope, query: string): FamilyRow[] {
    const q = query.trim().toLowerCase();
    const rows = familiesFor(scope);
    if (!q) return rows;
    return rows.filter((f) =>
        [f.title, f.assignee, f.pub, f.country].some((v) =>
            v.toLowerCase().includes(q),
        ),
    );
}

export const METHODOLOGY = {
    scope: "Patent families with a priority date from 1 January 2010, from Google Patents Public Datasets on BigQuery. Each technology is a reviewed set of CPC codes, some with a title keyword filter; families matching none are dropped, and a family can belong to several technologies.",
    family: "Publications are grouped by DOCDB family_id and each family counts once. Its priority date is the earliest priority date of any publication in the family.",
    country:
        "Applicant country is the country of the first assignee on the family's earliest publication that lists one, taken from any publication in the family that gives it; failing that, the office of the earliest national (not EP or WO) publication; failing that, unknown.",
    assignee:
        "Assignees are Google's harmonised names, cleaned of case and legal-form suffixes (CO LTD, INC, GMBH, KK) and grouped under a parent by the alias table in src/patents/assignees.ts. Only the first assignee counts, so shares add up to at most 100%.",
    lag: `Applications publish about 18 months after priority, so families with a priority date from ${LANDSCAPE.incompleteFrom} are still arriving and the last bars undercount.`,
    growth: `3-year CAGR compares families with priority years ${CAGR_START} and ${CAGR_END}, the last year with every month published.`,
    ranking:
        "The family list keeps the 200 largest families per technology by number of publishing offices (countries, EP, WO), then by number of publications.",
    crossCheck:
        "Not yet cross-checked against Lens.org: the build environment had no route to it. A count comparison per technology is still to do.",
} as const;
