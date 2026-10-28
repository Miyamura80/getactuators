import { getCompany, sitesOf } from "../supply-chain/registry";
import committed from "./data/landscape.json";
import { TECHNOLOGIES, type Technology, getTechnology } from "./technologies";

// The committed /patents snapshot and everything derived from it. The
// snapshot holds aggregates only (family counts per technology, priority
// year and applicant country, the top assignees and the top families);
// scripts/patents/fetch.ts writes it from BigQuery. Until the first run it
// is empty and every view says so instead of showing numbers.

export const PATENTS_PATH = "/patents";
export const SINCE_YEAR = 2010;
// Publications appear about 18 months after the priority date, so the most
// recent priority years are still filling in.
export const LAG_MONTHS = 18;
export const LEADERBOARD_SIZE = 15;

export interface YearCountryCount {
    year: number;
    // ISO 3166 alpha-2 of the first assignee, "" when the data has none.
    country: string;
    families: number;
}

export interface AssigneeCount {
    key: string;
    name: string;
    country: string;
    companyId?: string;
    families: number;
    byYear: { year: number; families: number }[];
}

export interface FamilyRecord {
    familyId: string;
    publication: string;
    title: string;
    assignee: string;
    country: string;
    // YYYY-MM-DD, earliest priority in the family
    priorityDate: string;
}

export interface TechnologySnapshot {
    id: string;
    families: number;
    byYearCountry: YearCountryCount[];
    topAssignees: AssigneeCount[];
    topFamilies: FamilyRecord[];
}

export interface CrossCheck {
    technology: string;
    year: number;
    source: "lens" | "patentsview";
    bigquery: number;
    other: number;
    url: string;
    note?: string;
}

export interface LandscapeSnapshot {
    version: 1;
    // ISO date the query ran; null until the first run.
    collectedAt: string | null;
    dataset: string;
    sinceYear: number;
    technologies: TechnologySnapshot[];
    crossChecks: CrossCheck[];
}

export const LANDSCAPE = committed as LandscapeSnapshot;

export function isCollected(s: LandscapeSnapshot = LANDSCAPE): boolean {
    return s.collectedAt !== null && s.technologies.length > 0;
}

export function technologySnapshot(
    id: string,
    s: LandscapeSnapshot = LANDSCAPE,
): TechnologySnapshot | undefined {
    return s.technologies.find((t) => t.id === id);
}

// First priority year that is still incomplete: the year that contains the
// date LAG_MONTHS before collection. Null before the first run.
export function firstIncompleteYear(s: LandscapeSnapshot = LANDSCAPE): number | null {
    if (!s.collectedAt) return null;
    const d = new Date(`${s.collectedAt}T00:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() - LAG_MONTHS);
    return d.getUTCFullYear();
}

export function lastYear(s: LandscapeSnapshot = LANDSCAPE): number | null {
    return s.collectedAt ? Number(s.collectedAt.slice(0, 4)) : null;
}

export function years(s: LandscapeSnapshot = LANDSCAPE): number[] {
    const last = lastYear(s);
    if (last === null) return [];
    return Array.from({ length: last - s.sinceYear + 1 }, (_, i) => s.sinceYear + i);
}

// Families per year for one technology, split by applicant country (the top
// `countries` by total, the rest as "other").
export interface StreamSeries {
    key: string;
    values: number[];
}

function topKeys(totals: Map<string, number>, n: number): string[] {
    return [...totals.entries()]
        .filter(([k]) => k !== "")
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, n)
        .map(([k]) => k);
}

export function streamByCountry(
    techIds: readonly string[],
    s: LandscapeSnapshot = LANDSCAPE,
    countries = 6,
): StreamSeries[] {
    const ys = years(s);
    const rows = techIds.flatMap(
        (id) => technologySnapshot(id, s)?.byYearCountry ?? [],
    );
    const totals = new Map<string, number>();
    for (const r of rows)
        totals.set(r.country, (totals.get(r.country) ?? 0) + r.families);
    const keep = topKeys(totals, countries);
    const series = [...keep, "other"].map((key) => ({
        key,
        values: ys.map(() => 0),
    }));
    for (const r of rows) {
        const i = ys.indexOf(r.year);
        if (i < 0) continue;
        const target = series.find((x) => x.key === r.country) ?? series.at(-1);
        if (target) target.values[i] = (target.values[i] ?? 0) + r.families;
    }
    return series.filter((x) => x.values.some((v) => v > 0));
}

export function streamByTechnology(s: LandscapeSnapshot = LANDSCAPE): StreamSeries[] {
    const ys = years(s);
    return TECHNOLOGIES.flatMap((t) => {
        const snap = technologySnapshot(t.id, s);
        if (!snap) return [];
        const values = ys.map((y) =>
            snap.byYearCountry
                .filter((r) => r.year === y)
                .reduce((sum, r) => sum + r.families, 0),
        );
        return values.some((v) => v > 0) ? [{ key: t.id, values }] : [];
    });
}

// Compound annual growth over the three years to the last complete year.
export function cagr3(
    byYear: readonly { year: number; families: number }[],
    s: LandscapeSnapshot = LANDSCAPE,
): number | null {
    const first = firstIncompleteYear(s);
    if (first === null) return null;
    const end = first - 1;
    const at = (y: number) => byYear.find((r) => r.year === y)?.families ?? 0;
    const a = at(end - 3);
    const b = at(end);
    if (a <= 0) return null;
    return (b / a) ** (1 / 3) - 1;
}

export interface LeaderboardRow extends AssigneeCount {
    rank: number;
    share: number;
    cagr: number | null;
}

export interface Leaderboard {
    technology: Technology;
    families: number;
    rows: LeaderboardRow[];
    // Share of all families held by the top five assignees.
    top5Share: number | null;
    // CAGR window, e.g. [2020, 2023]
    window: [number, number] | null;
}

export function leaderboard(
    id: string,
    s: LandscapeSnapshot = LANDSCAPE,
    size = LEADERBOARD_SIZE,
): Leaderboard | null {
    const technology = getTechnology(id);
    const snap = technologySnapshot(id, s);
    if (!technology || !snap) return null;
    const rows = [...snap.topAssignees]
        .sort((a, b) => b.families - a.families || a.name.localeCompare(b.name))
        .slice(0, size)
        .map((a, i) => ({
            ...a,
            rank: i + 1,
            share: snap.families > 0 ? a.families / snap.families : 0,
            cagr: cagr3(a.byYear, s),
        }));
    const first = firstIncompleteYear(s);
    return {
        technology,
        families: snap.families,
        rows,
        top5Share:
            snap.families > 0
                ? rows.slice(0, 5).reduce((sum, r) => sum + r.families, 0) /
                  snap.families
                : null,
        window: first === null ? null : [first - 4, first - 1],
    };
}

// Approximate geographic centres for placing assignees without a registry
// headquarters. Precision is "country": the bubble marks the country, not
// the office.
export const COUNTRY_CENTRE: Record<string, [number, number]> = {
    AT: [47.6, 14.1],
    AU: [-25.7, 134.5],
    BE: [50.6, 4.6],
    CA: [56.1, -106.3],
    CH: [46.8, 8.2],
    CN: [35.9, 104.2],
    DE: [51.2, 10.4],
    DK: [56.0, 9.5],
    ES: [40.4, -3.7],
    FI: [64.0, 26.0],
    FR: [46.6, 2.4],
    GB: [54.0, -2.0],
    IL: [31.0, 34.9],
    IN: [22.0, 79.0],
    IT: [42.8, 12.6],
    JP: [36.2, 138.3],
    KR: [36.4, 127.9],
    NL: [52.2, 5.5],
    NO: [61.0, 9.0],
    RU: [56.0, 38.0],
    SE: [62.0, 15.0],
    SG: [1.35, 103.8],
    TW: [23.7, 121.0],
    US: [39.8, -98.6],
};

export interface MapPoint {
    key: string;
    name: string;
    country: string;
    companyId?: string;
    families: number;
    lat: number;
    lon: number;
    precision: "city" | "country";
}

// Where to draw an assignee: its registry headquarters when linked, else the
// centre of its country, else nowhere.
export function placeAssignee(a: AssigneeCount): MapPoint | null {
    const hq = a.companyId
        ? sitesOf(a.companyId).find((site) => site.kind === "hq")
        : undefined;
    const base = {
        key: a.key,
        name: a.companyId ? (getCompany(a.companyId)?.name ?? a.name) : a.name,
        country: a.country,
        families: a.families,
        ...(a.companyId ? { companyId: a.companyId } : {}),
    };
    if (hq) return { ...base, lat: hq.lat, lon: hq.lon, precision: "city" };
    const c = COUNTRY_CENTRE[a.country];
    return c ? { ...base, lat: c[0], lon: c[1], precision: "country" } : null;
}

// The top assignees of the given technologies merged by key.
export function assigneeMap(
    techIds: readonly string[],
    s: LandscapeSnapshot = LANDSCAPE,
    limit = 25,
): MapPoint[] {
    const merged = new Map<string, AssigneeCount>();
    for (const id of techIds)
        for (const a of technologySnapshot(id, s)?.topAssignees ?? []) {
            const cur = merged.get(a.key);
            merged.set(
                a.key,
                cur ? { ...cur, families: cur.families + a.families } : a,
            );
        }
    return [...merged.values()]
        .sort((a, b) => b.families - a.families || a.name.localeCompare(b.name))
        .slice(0, limit)
        .flatMap((a) => placeAssignee(a) ?? []);
}

export function googlePatentsUrl(publication: string): string {
    return `https://patents.google.com/patent/${encodeURIComponent(publication)}/en`;
}

export function searchFamilies(
    families: readonly FamilyRecord[],
    query: string,
): FamilyRecord[] {
    const q = query.trim().toLowerCase();
    if (!q) return [...families];
    return families.filter((f) =>
        [f.title, f.assignee, f.publication, f.country].some((v) =>
            v.toLowerCase().includes(q),
        ),
    );
}
