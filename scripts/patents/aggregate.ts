import {
    type NormalizedAssignee,
    normalizeAssignee,
} from "../../src/patents/assignees";
import type {
    AssigneeCount,
    CrossCheck,
    FamilyRecord,
    LandscapeSnapshot,
    TechnologySnapshot,
} from "../../src/patents/landscape";
import { SINCE_YEAR } from "../../src/patents/landscape";
import { TECHNOLOGIES } from "../../src/patents/technologies";
import { DATASET } from "./sql";

// Turns the family rows the landscape query returns into the committed
// snapshot: counts per technology x priority year x applicant country, the
// top assignees (after normalisation) with their yearly counts, and the top
// families. "Top families" are the most recent ones, newest priority first,
// since the public table carries no citation or value score worth ranking by.

export interface FamilyRow {
    family_id: string;
    priority_date: number | string;
    publication: string;
    title: string | null;
    assignee: string | null;
    country: string | null;
    technologies: string;
}

export const TOP_ASSIGNEES = 50;
export const TOP_FAMILIES = 200;

function isoDate(yyyymmdd: number | string): string {
    const s = String(yyyymmdd);
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

function countAssignee(
    assignees: Map<string, AssigneeCount>,
    who: NormalizedAssignee,
    country: string,
    year: number,
): void {
    const cur: AssigneeCount = assignees.get(who.key) ?? {
        key: who.key,
        name: who.name,
        country,
        ...(who.companyId ? { companyId: who.companyId } : {}),
        families: 0,
        byYear: [],
    };
    cur.families += 1;
    const y = cur.byYear.find((b) => b.year === year);
    if (y) y.families += 1;
    else cur.byYear.push({ year, families: 1 });
    assignees.set(who.key, cur);
}

function technology(id: string, rows: readonly FamilyRow[]): TechnologySnapshot {
    const byYearCountry = new Map<string, number>();
    const assignees = new Map<string, AssigneeCount>();
    const families: FamilyRecord[] = [];
    for (const r of rows) {
        const year = Number(String(r.priority_date).slice(0, 4));
        const country = (r.country ?? "").toUpperCase();
        const k = `${year}|${country}`;
        byYearCountry.set(k, (byYearCountry.get(k) ?? 0) + 1);
        const who = r.assignee ? normalizeAssignee(r.assignee) : null;
        if (who) countAssignee(assignees, who, country, year);
        families.push({
            familyId: r.family_id,
            publication: r.publication,
            title: r.title ?? "",
            assignee: who?.name ?? "",
            country,
            priorityDate: isoDate(r.priority_date),
        });
    }
    return {
        id,
        families: rows.length,
        byYearCountry: [...byYearCountry.entries()]
            .map(([k, n]) => {
                const [year, country] = k.split("|");
                return { year: Number(year), country: country ?? "", families: n };
            })
            .sort((a, b) => a.year - b.year || a.country.localeCompare(b.country)),
        topAssignees: [...assignees.values()]
            .sort((a, b) => b.families - a.families || a.key.localeCompare(b.key))
            .slice(0, TOP_ASSIGNEES)
            .map((a) => ({
                ...a,
                byYear: [...a.byYear].sort((x, y) => x.year - y.year),
            })),
        topFamilies: families
            .sort(
                (a, b) =>
                    b.priorityDate.localeCompare(a.priorityDate) ||
                    a.familyId.localeCompare(b.familyId),
            )
            .slice(0, TOP_FAMILIES),
    };
}

export function aggregate(
    rows: readonly FamilyRow[],
    collectedAt: string,
    crossChecks: CrossCheck[] = [],
): LandscapeSnapshot {
    const seen = new Set<string>();
    const unique = rows.filter((r) => {
        if (seen.has(r.family_id)) return false;
        seen.add(r.family_id);
        return true;
    });
    return {
        version: 1,
        collectedAt,
        dataset: DATASET,
        sinceYear: SINCE_YEAR,
        technologies: TECHNOLOGIES.map((t) =>
            technology(
                t.id,
                unique.filter((r) => r.technologies.split(",").includes(t.id)),
            ),
        ),
        crossChecks,
    };
}
