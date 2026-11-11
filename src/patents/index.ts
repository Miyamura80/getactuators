import familiesFile from "../../data/patents/families.json";
import landscapeFile from "../../data/patents/landscape.json";
import type { Shares } from "../supply-chain/concentration";
import { APPLICATION_AREAS, type ApplicationAreaId } from "./application-areas";
import {
    CAGR_YEARS,
    FIRST_YEAR,
    LAG_MONTHS,
    TOP_ASSIGNEES,
    TOP_FAMILIES,
} from "./constants";
import { yearSpan } from "./format";
import { PATENTS_PATH } from "./path";
import {
    TECHNOLOGY_LIST,
    type TechnologyId,
    getTechnology,
    isTechnologyId,
} from "./technologies";
import {
    type AssigneeRow,
    type FamiliesFile,
    type FamilyRow,
    type LandscapeFile,
    type QualityFilter,
    type TechLandscape,
    UNKNOWN_COUNTRY,
    type ValueRow,
    byCountryTotal,
} from "./types";

// /patents: patent families since 2010 for actuator, gear, screw, magnet and
// motor technologies, from data/patents (scripts/patents/build-landscape.ts).
// Relative imports only: the browser bundle reuses this module.

export * from "./application-areas";
export * from "./constants";
export * from "./format";
export * from "./technologies";
export * from "./types";
export { PATENT_SOURCES } from "./sources";

export { PATENTS_PATH };
export const PATENTS_API_PATH = "/api/v1/patents";

export const LANDSCAPE = landscapeFile as unknown as LandscapeFile;
export const FAMILIES = (familiesFile as unknown as FamiliesFile).families;

export const PATENTS_AS_OF = LANDSCAPE.asOf;
export const PATENT_YEARS = LANDSCAPE.years;

// Last fully published priority year. Later years are still publishing.
export const COMPLETE_THROUGH = LANDSCAPE.completeThrough;

// A technology id, or every matched family once.
export type LandscapeScope = TechnologyId | "all";

export const isLandscapeScope = (v: string): v is LandscapeScope =>
    v === "all" || isTechnologyId(v);

export function scopeLabel(scope: LandscapeScope): string {
    return scope === "all" ? "All technologies" : getTechnology(scope).label;
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

// The stream's quality filters: every family, or only those that cleared a
// costlier bar. Definitions in METHODOLOGY.quality.
export type StreamFilter = "all" | QualityFilter;

export const STREAM_FILTERS: { id: StreamFilter; label: string; long: string }[] = [
    { id: "all", label: "All", long: "all families" },
    { id: "granted", label: "Granted", long: "granted families" },
    { id: "intl", label: "2+ offices", long: "families filed in 2+ offices" },
    {
        id: "triadic",
        label: "US+EP+JP",
        long: "families filed at the US, EP and JP offices",
    },
];

export const isStreamFilter = (v: string): v is StreamFilter =>
    STREAM_FILTERS.some((f) => f.id === v);

// Families per applicant country per year, under a quality filter.
export function countsOf(
    scope: LandscapeScope,
    filter: StreamFilter = "all",
): Record<string, number[]> {
    const l = landscapeOf(scope);
    return filter === "all" ? l.counts : l.quality[filter];
}

// Families per priority year in one scope.
export function familiesPerYear(
    scope: LandscapeScope,
    filter: StreamFilter = "all",
): number[] {
    const counts = Object.values(countsOf(scope, filter));
    return PATENT_YEARS.map((_, i) => sum(counts.map((c) => c[i] ?? 0)));
}

const completeIndex = () => PATENT_YEARS.indexOf(COMPLETE_THROUGH);

// Families in the complete years that pass the filter, against all of them,
// and China's share of the ones that pass.
export function filterSummary(
    scope: LandscapeScope,
    filter: StreamFilter,
): { families: number; of: number; share: number; china: number } {
    const end = completeIndex() + 1;
    const total = (c: Record<string, number[]>) =>
        sum(Object.values(c).map((v) => sum(v.slice(0, end))));
    const kept = countsOf(scope, filter);
    const families = total(kept);
    const of = total(countsOf(scope));
    const cn = sum((kept.CN ?? []).slice(0, end));
    return {
        families,
        of,
        share: of ? families / of : 0,
        china: families ? cn / families : 0,
    };
}

export interface Series {
    key: string;
    label: string;
    values: number[];
}

// Applicant countries as stacked series: the `top` largest, then "Other".
// The bands are the unfiltered scope's largest countries whatever the
// filter, so a country keeps its band (and colour) as the filter changes.
export function seriesByCountry(
    scope: LandscapeScope,
    top = 6,
    filter: StreamFilter = "all",
): Series[] {
    const all = countsOf(scope);
    const kept = countsOf(scope, filter);
    const zeros = PATENT_YEARS.map(() => 0);
    const keys = Object.entries(all)
        .sort(byCountryTotal)
        .map(([c]) => c)
        .filter((c) => c !== UNKNOWN_COUNTRY);
    const head = keys
        .slice(0, top)
        .map((key) => ({ key, label: key, values: kept[key] ?? zeros }));
    const headKeys = new Set(head.map((s) => s.key));
    const rest = Object.entries(kept).filter(([c]) => !headKeys.has(c));
    const other = PATENT_YEARS.map((_, i) => sum(rest.map(([, v]) => v[i] ?? 0)));
    const otherInAll = keys.length > top || Boolean(all[UNKNOWN_COUNTRY]);
    return otherInAll
        ? [...head, { key: "other", label: "Other", values: other }]
        : head;
}

// One series per technology. A family in two technologies counts in both.
export function seriesByTechnology(filter: StreamFilter = "all"): Series[] {
    return TECHNOLOGY_LIST.map((t) => ({
        key: t.id,
        label: t.short,
        values: familiesPerYear(t.id, filter),
    }));
}

// Value vs volume: the scope's largest assignees in the complete years.
export function valueRows(scope: LandscapeScope): ValueRow[] {
    return landscapeOf(scope).value.assignees;
}

// Share of Chinese and of all other applicants' families (complete years)
// filed in 2+ offices.
export function intlShares(scope: LandscapeScope): { cn: number; rest: number } {
    const v = landscapeOf(scope).value;
    return {
        cn: v.cn.families ? v.cn.intl / v.cn.families : 0,
        rest: v.rest.families ? v.rest.intl / v.rest.families : 0,
    };
}

export interface AreaCell {
    area: ApplicationAreaId;
    label: string;
    // The area's CPC pattern (APPLICATION_AREAS).
    cpc: string;
    // Families in the area, complete years.
    families: number;
    // Of the scope's families: whole span, early window, late window.
    share: number;
    early: number;
    late: number;
}

// Application areas of one scope's families, in APPLICATION_AREAS order.
export function areaCells(scope: LandscapeScope): AreaCell[] {
    const a = landscapeOf(scope).areas;
    return APPLICATION_AREAS.map((x) => {
        const [n, e, l] = a.counts[x.id];
        return {
            area: x.id,
            label: x.label,
            cpc: x.cpc,
            families: n,
            share: a.families ? n / a.families : 0,
            early: a.early ? e / a.early : 0,
            late: a.late ? l / a.late : 0,
        };
    });
}

// A shift of at least this much (share points) between the windows earns an
// arrow on the grid.
export const AREA_SHIFT_MIN = 0.01;

export function areaShift(c: Pick<AreaCell, "early" | "late">): "up" | "down" | null {
    const d = c.late - c.early;
    return Math.abs(d) < AREA_SHIFT_MIN ? null : d > 0 ? "up" : "down";
}

// Families per applicant country over every year, unknown left out.
export function countryTotals(scope: LandscapeScope): Shares {
    // Applicant countries are ISO alpha-2 codes once UNKNOWN_COUNTRY is out.
    return Object.fromEntries(
        Object.entries(landscapeOf(scope).counts)
            .filter(([c]) => c !== UNKNOWN_COUNTRY)
            .map(([c, v]) => [c, sum(v)]),
    ) as Shares;
}

// The growth window: CAGR_YEARS years ending at the last complete year.
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

export function leaderboard(scope: LandscapeScope): LeaderRow[] {
    const l = landscapeOf(scope);
    return l.top.slice(0, TOP_ASSIGNEES).map((a, i) => ({
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

// Momentum: each technology's families per priority year, with every
// applicant or only those outside China, and the change from the early to
// the late window (the last two runs of MOMENTUM_SPAN complete years).
export type Applicants = "all" | "ex-cn";
// The windows are written by the pipeline (MOMENTUM_SPAN years each).
export const MOMENTUM_LATE: readonly [number, number] = LANDSCAPE.momentumWindows.late;
export const MOMENTUM_EARLY: readonly [number, number] =
    LANDSCAPE.momentumWindows.early;

export interface MomentumRow {
    id: TechnologyId;
    label: string;
    values: number[];
    early: number;
    late: number;
    // late / early - 1; null when the early window has none.
    change: number | null;
}

const windowSum = (values: readonly number[], [from, to]: readonly [number, number]) =>
    sum(
        values.filter(
            (_, i) => (PATENT_YEARS[i] ?? 0) >= from && (PATENT_YEARS[i] ?? 0) <= to,
        ),
    );

// Largest change first; technologies with no early families last.
export function momentum(applicants: Applicants = "all"): MomentumRow[] {
    return TECHNOLOGY_LIST.map((t) => {
        const counts = Object.entries(landscapeOf(t.id).counts).filter(
            ([c]) => applicants === "all" || c !== "CN",
        );
        const values = PATENT_YEARS.map((_, i) =>
            sum(counts.map(([, v]) => v[i] ?? 0)),
        );
        const early = windowSum(values, MOMENTUM_EARLY);
        const late = windowSum(values, MOMENTUM_LATE);
        return {
            id: t.id,
            label: t.short,
            values,
            early,
            late,
            change: early ? late / early - 1 : null,
        };
    }).sort(
        (a, b) =>
            (b.change ?? Number.NEGATIVE_INFINITY) -
            (a.change ?? Number.NEGATIVE_INFINITY),
    );
}

export const METHODOLOGY = {
    scope: `Patent families with a priority date from 1 January ${FIRST_YEAR}, from Google Patents Public Datasets on BigQuery. Each technology is a reviewed set of CPC codes, some with a title keyword filter; families matching none are dropped, and a family can belong to several technologies.`,
    family: "Publications are grouped by DOCDB family_id and each family counts once. Its priority date is the earliest priority date of any publication in the family.",
    country:
        "Applicant country is the country of the first assignee on the family's earliest publication that lists one, taken from any publication in the family that gives it; failing that, the office of the earliest national (not EP or WO) publication; failing that, unknown.",
    assignee:
        "Assignees are Google's harmonised names, cleaned of case and legal-form suffixes (CO LTD, INC, GMBH, KK) and grouped under a parent by the alias table in src/patents/assignees.ts. Only the first assignee counts, so shares add up to at most 100%.",
    lag: `Applications publish about ${LAG_MONTHS} months after priority, so families with a priority date from ${LANDSCAPE.incompleteFrom} are still arriving and the last bars undercount.`,
    growth: `${CAGR_YEARS}-year CAGR compares families with priority years ${CAGR_START} and ${CAGR_END}, the last year with every month published.`,
    ranking: `The family list keeps the ${TOP_FAMILIES} largest families per technology by number of publishing offices (countries, EP, WO), then by number of publications.`,
    quality:
        "Quality filters: granted means some publication in the family is a grant (kind code B or C; utility models, kind U, never count). 2+ offices means the family was published by at least two offices other than WO (EP counts as one office), so the applicant paid for protection outside one market. US+EP+JP means published by all three of the US, European and Japanese offices (triadic).",
    value: `Value vs volume counts families with priority years ${FIRST_YEAR} to ${COMPLETE_THROUGH}. Chinese means applicant country CN; everyone else, including unknown, is non-Chinese.`,
    areas: `Application areas come from CPC co-classification: a family is in an area when any of its codes matches the area's list in src/patents/application-areas.ts. It is a proxy for where a technology is used until citation data is added. The shift compares the share of families in ${yearSpan(LANDSCAPE.areaWindows.early)} with ${yearSpan(LANDSCAPE.areaWindows.late)}.`,
    momentum: `Momentum compares families with priority years ${yearSpan(MOMENTUM_EARLY)} against ${yearSpan(MOMENTUM_LATE)}. Indexed sets each technology's yearly average over ${yearSpan(MOMENTUM_EARLY)} to 100. Outside China drops families whose applicant country is CN.`,
    crossCheck:
        "Not yet cross-checked against Lens.org: the build environment had no route to it. A count comparison per technology is still to do.",
} as const;
