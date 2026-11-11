import {
    APPLICATION_AREA_IDS,
    type ApplicationAreaId,
    classifyAreas,
} from "../../src/patents/application-areas";
import {
    type NormalisedAssignee,
    normaliseAssignee,
} from "../../src/patents/assignees";
import {
    EARLY_WINDOW,
    FIRST_YEAR,
    LAG_MONTHS,
    MOMENTUM_SPAN,
    TOP_ASSIGNEES,
    TOP_FAMILIES,
    TOP_VALUE,
} from "../../src/patents/constants";
import {
    TECHNOLOGY_IDS,
    type TechnologyId,
    classifyFamily,
} from "../../src/patents/technologies";
import {
    type AssigneeRow,
    type FamiliesFile,
    type FamilyRow,
    type LandscapeFile,
    type QualityFilter,
    type TechAreas,
    type TechLandscape,
    type TechValue,
    UNKNOWN_COUNTRY,
    type ValueRow,
    byCountryTotal,
} from "../../src/patents/types";
import { COMPANIES } from "../../src/supply-chain/companies";

// Pure steps of the /patents pipeline: publication rows to families, families
// to the committed aggregates. build-landscape.ts does the I/O.

export interface PublicationRow {
    publication_number: string;
    family_id: string;
    country_code: string;
    kind_code?: string;
    priority_date: string | number | null;
    filing_date?: string | number | null;
    publication_date: string | number | null;
    assignees?: { name: string; country_code?: string | null }[] | null;
    title_en?: string | null;
    cpc_codes?: string[] | null;
}

export interface Family {
    id: string;
    priority: string;
    pub: string;
    title: string;
    // First assignee, normalised; null when no publication lists one.
    assignee: NormalisedAssignee | null;
    country: string;
    jurisdictions: number;
    publications: number;
    techs: TechnologyId[];
    // Distinct publishing offices (countries, EP, WO).
    offices: string[];
    // Some publication is a grant (see isGrant).
    granted: boolean;
    areas: ApplicationAreaId[];
}

// Sizes and windows (FIRST_YEAR, TOP_ASSIGNEES, EARLY_WINDOW...) live in
// src/patents/constants.ts, shared with the readers.
const TITLE_MAX = 160;

// Regional and international offices: not an applicant country.
const REGIONAL = new Set(["EP", "WO", "EA", "AP", "OA", "GC"]);
// Preferred offices for the representative publication (English full text
// and a stable Google Patents page), then the earliest publication.
const PREFERRED = ["US", "EP", "WO", "GB", "AU", "CA"];

const day = (v: string | number | null | undefined): string => {
    const s = v == null ? "" : String(v);
    return /^\d{8}$/.test(s) && s !== "00000000"
        ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
        : "";
};

const ENTITIES: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
};

// Titles arrive with stray HTML entities and the odd dash the site's prose
// check rejects; one line, entities decoded, em dashes as hyphens.
export function cleanTitle(raw: string): string {
    return raw
        .replace(/&(amp|lt|gt|quot|#39);/g, (m) => ENTITIES[m] ?? m)
        .replace(/\u2014/g, "-")
        .replace(/\s+/g, " ")
        .trim();
}

// A grant: kind code B or C (B1, B2, C, C1...). Utility models (kind U, and
// Y for older Chinese ones) never count, whatever the office.
export const isGrant = (kind: string | undefined): boolean => /^[BC]/.test(kind ?? "");

// Filed in two or more offices, not counting the PCT (WO) publication: the
// applicant paid for protection outside one market.
export const isInternational = (offices: readonly string[]): boolean =>
    offices.filter((o) => o !== "WO").length >= 2;

// Published by the US, European and Japanese offices.
export const isTriadic = (offices: readonly string[]): boolean =>
    ["US", "EP", "JP"].every((o) => offices.includes(o));

export const QUALITY: Record<QualityFilter, (f: Family) => boolean> = {
    granted: (f) => f.granted,
    intl: (f) => isInternational(f.offices),
    triadic: (f) => isTriadic(f.offices),
};

const byPublication = (a: PublicationRow, b: PublicationRow) =>
    (day(a.publication_date) || "9999").localeCompare(
        day(b.publication_date) || "9999",
    ) || a.publication_number.localeCompare(b.publication_number);

// One family from its publications (any order). Priority date: the earliest
// in the family. First assignee: the first listed on the earliest
// publication that lists any. Applicant country: that assignee's country on
// any publication in the family, else the office of the earliest national
// (non-EP, non-WO) publication, else UNKNOWN_COUNTRY.
export function toFamily(rows: readonly PublicationRow[]): Family | null {
    const sorted = [...rows].sort(byPublication);
    const first = sorted[0];
    if (!first) return null;
    const priority = sorted
        .map((r) => day(r.priority_date))
        .filter(Boolean)
        .sort()[0];
    if (!priority) return null;
    const cpc = [...new Set(sorted.flatMap((r) => r.cpc_codes ?? []))];
    const titles = sorted.flatMap((r) => (r.title_en ? [r.title_en.trim()] : []));
    const techs = classifyFamily(cpc, titles);
    const withAssignee = sorted.find((r) => (r.assignees ?? []).length > 0);
    const assigneeRaw = withAssignee?.assignees?.[0]?.name?.trim() ?? "";
    const assigneeCountry = sorted
        .flatMap((r) => r.assignees ?? [])
        .find((a) => a.name?.trim() === assigneeRaw && a.country_code)?.country_code;
    const national = sorted.find((r) => !REGIONAL.has(r.country_code))?.country_code;
    const country = (assigneeCountry || national || UNKNOWN_COUNTRY).toUpperCase();
    const titled = sorted.filter((r) => r.title_en);
    const rep =
        PREFERRED.map((c) => titled.find((r) => r.country_code === c)).find(Boolean) ??
        titled[0] ??
        first;
    const title = cleanTitle(rep.title_en ?? titles[0] ?? "");
    const offices = [...new Set(sorted.map((r) => r.country_code))].sort();
    return {
        id: first.family_id,
        priority,
        pub: rep.publication_number,
        title: title.length > TITLE_MAX ? `${title.slice(0, TITLE_MAX - 1)}…` : title,
        assignee: assigneeRaw ? normaliseAssignee(assigneeRaw) : null,
        country,
        jurisdictions: offices.length,
        publications: sorted.length,
        techs,
        offices,
        granted: sorted.some((r) => isGrant(r.kind_code)),
        areas: classifyAreas(cpc),
    };
}

// Families from publication rows, grouped by family_id. Families before
// FIRST_YEAR (a later member with an older priority) are dropped.
export function toFamilies(rows: Iterable<PublicationRow>): {
    families: Family[];
    publications: number;
    total: number;
} {
    const groups = new Map<string, PublicationRow[]>();
    let publications = 0;
    for (const r of rows) {
        publications++;
        const g = groups.get(r.family_id);
        if (g) g.push(r);
        else groups.set(r.family_id, [r]);
    }
    const families: Family[] = [];
    for (const g of groups.values()) {
        const f = toFamily(g);
        if (f && Number(f.priority.slice(0, 4)) >= FIRST_YEAR) families.push(f);
    }
    return { families, publications, total: groups.size };
}

// asOf minus LAG_MONTHS, and the last calendar year wholly before it.
export function publicationLag(asOf: string): {
    incompleteFrom: string;
    completeThrough: number;
} {
    const d = new Date(`${asOf}T00:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() - LAG_MONTHS);
    const incompleteFrom = d.toISOString().slice(0, 10);
    return { incompleteFrom, completeThrough: d.getUTCFullYear() - 1 };
}

interface Windows {
    completeThrough: number;
    // Application-area shift windows.
    early: [number, number];
    late: [number, number];
}

const yearOf = (f: Family) => Number(f.priority.slice(0, 4));
const within = (y: number, [a, b]: [number, number]) => y >= a && y <= b;

// A registry company sits at its headquarters; anyone else at the applicant
// country most of its families give.
function hqCountry(
    company: string | undefined,
    countries: Map<string, number>,
): string {
    return (
        COMPANIES.find((c) => c.id === company)?.hqCountry ??
        [...countries.entries()]
            .filter(([c]) => c !== UNKNOWN_COUNTRY)
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ??
        UNKNOWN_COUNTRY
    );
}

const tally = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);

interface AssigneeGroup {
    assignee: NormalisedAssignee;
    families: Family[];
}

// Families per normalised first assignee (families without one left out),
// largest first, ties by name.
function groupByAssignee(families: readonly Family[]): AssigneeGroup[] {
    const by = new Map<string, AssigneeGroup>();
    for (const f of families) {
        if (!f.assignee) continue;
        const g = by.get(f.assignee.key) ?? { assignee: f.assignee, families: [] };
        g.families.push(f);
        by.set(f.assignee.key, g);
    }
    return [...by.values()].sort(
        (x, y) =>
            y.families.length - x.families.length ||
            x.assignee.name.localeCompare(y.assignee.name),
    );
}

// Who a group is, and where: registry HQ, else its main applicant country.
function assigneeOf({ assignee: a, families }: AssigneeGroup) {
    const countries = new Map<string, number>();
    for (const f of families) tally(countries, f.country);
    return {
        key: a.key,
        name: a.name,
        ...(a.company ? { company: a.company } : {}),
        country: hqCountry(a.company, countries),
    };
}

function countsBy(
    families: readonly Family[],
    years: readonly number[],
): Record<string, number[]> {
    const counts: Record<string, number[]> = {};
    for (const f of families) {
        const i = years.indexOf(yearOf(f));
        if (i < 0) continue;
        const row = counts[f.country] ?? years.map(() => 0);
        row[i] = (row[i] ?? 0) + 1;
        counts[f.country] = row;
    }
    return counts;
}

// Value view: families in the complete years, per first assignee and for
// Chinese against other applicants, with how many were filed abroad.
function valueView(families: readonly Family[], w: Windows): TechValue {
    const done = families.filter((f) => yearOf(f) <= w.completeThrough);
    const intl = (fs: readonly Family[]) => fs.filter(QUALITY.intl).length;
    const cn = done.filter((f) => f.country === "CN");
    const rest = done.filter((f) => f.country !== "CN");
    const assignees: ValueRow[] = groupByAssignee(done)
        .slice(0, TOP_VALUE)
        .map((g) => ({
            ...assigneeOf(g),
            families: g.families.length,
            intl: intl(g.families),
            granted: g.families.filter(QUALITY.granted).length,
            triadic: g.families.filter(QUALITY.triadic).length,
        }));
    return {
        cn: { families: cn.length, intl: intl(cn) },
        rest: { families: rest.length, intl: intl(rest) },
        assignees,
    };
}

function areasOf(families: readonly Family[], w: Windows): TechAreas {
    const done = families.filter((f) => yearOf(f) <= w.completeThrough);
    const early = done.filter((f) => within(yearOf(f), w.early));
    const late = done.filter((f) => within(yearOf(f), w.late));
    const n = (fs: readonly Family[], id: ApplicationAreaId) =>
        fs.filter((f) => f.areas.includes(id)).length;
    return {
        families: done.length,
        early: early.length,
        late: late.length,
        counts: Object.fromEntries(
            APPLICATION_AREA_IDS.map((id) => [
                id,
                [n(done, id), n(early, id), n(late, id)],
            ]),
        ) as TechAreas["counts"],
    };
}

const byTotal = (counts: Record<string, number[]>) =>
    Object.fromEntries(Object.entries(counts).sort(byCountryTotal));

function aggregate(
    families: readonly Family[],
    years: readonly number[],
    w: Windows,
): TechLandscape {
    const groups = groupByAssignee(families.filter((f) => years.includes(yearOf(f))));
    const top: AssigneeRow[] = groups.slice(0, TOP_ASSIGNEES).map((g) => ({
        ...assigneeOf(g),
        families: g.families.length,
        years: years.map((y) => g.families.filter((f) => yearOf(f) === y).length),
    }));
    const quality = Object.fromEntries(
        (Object.keys(QUALITY) as QualityFilter[]).map((q) => [
            q,
            byTotal(countsBy(families.filter(QUALITY[q]), years)),
        ]),
    ) as TechLandscape["quality"];
    return {
        families: families.length,
        assignees: groups.length,
        counts: byTotal(countsBy(families, years)),
        quality,
        top,
        value: valueView(families, w),
        areas: areasOf(families, w),
    };
}

export function buildLandscape(
    input: { families: Family[]; publications: number; total: number },
    asOf: string,
): { landscape: LandscapeFile; families: FamiliesFile } {
    const matched = input.families.filter((f) => f.techs.length > 0);
    const lastYear = Number(asOf.slice(0, 4));
    const years = Array.from(
        { length: lastYear - FIRST_YEAR + 1 },
        (_, i) => FIRST_YEAR + i,
    );
    const lag = publicationLag(asOf);
    // The area shift's late window doubles as the momentum late window;
    // momentum's early window is the MOMENTUM_SPAN years before it.
    const w: Windows = {
        completeThrough: lag.completeThrough,
        early: EARLY_WINDOW,
        late: [lag.completeThrough - MOMENTUM_SPAN + 1, lag.completeThrough],
    };
    const momentumEarly: [number, number] = [w.late[0] - MOMENTUM_SPAN, w.late[0] - 1];
    const technologies = Object.fromEntries(
        TECHNOLOGY_IDS.map((id) => [
            id,
            aggregate(
                matched.filter((f) => f.techs.includes(id)),
                years,
                w,
            ),
        ]),
    ) as Record<TechnologyId, TechLandscape>;
    const rank = (a: Family, b: Family) =>
        b.jurisdictions - a.jurisdictions ||
        b.publications - a.publications ||
        a.priority.localeCompare(b.priority) ||
        a.id.localeCompare(b.id);
    const kept = new Map<string, Family>();
    for (const id of TECHNOLOGY_IDS) {
        for (const f of matched
            .filter((x) => x.techs.includes(id))
            .sort(rank)
            .slice(0, TOP_FAMILIES))
            kept.set(f.id, f);
    }
    const rows: FamilyRow[] = [...kept.values()].sort(rank).map((f) => ({
        id: f.id,
        pub: f.pub,
        title: f.title,
        assignee: f.assignee?.name ?? "",
        ...(f.assignee?.company ? { company: f.assignee.company } : {}),
        country: f.country,
        priority: f.priority,
        jurisdictions: f.jurisdictions,
        techs: f.techs,
    }));
    return {
        landscape: {
            asOf,
            years,
            ...lag,
            extract: {
                publications: input.publications,
                families: input.total,
                matched: matched.length,
            },
            areaWindows: { early: w.early, late: w.late },
            momentumWindows: { early: momentumEarly, late: w.late },
            technologies,
            all: aggregate(matched, years, w),
        },
        families: { asOf, perTechnology: TOP_FAMILIES, families: rows },
    };
}
