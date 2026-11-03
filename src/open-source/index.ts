import { BODIES } from "./fleet-bodies";
import { MANIPULATORS } from "./fleet-manipulators";
import stats from "./repo-stats.json";
import {
    OPENNESS_DIMENSIONS,
    type OpenRobot,
    type OpenRobotCost,
    type OpenRobotType,
    type OpennessDimension,
    type OpennessStatus,
    ROBOT_TYPES,
    type RepoStat,
} from "./types";

export * from "./types";
export { EXCLUDED_ROBOTS } from "./excluded";
export { OPEN_SOURCE_AS_OF } from "./sourced";
export { SOURCES, sourceOf } from "./sources";

export const OPEN_SOURCE_PATH = "/open-source";
// /sdk (#87) rates actuator SDKs by brand. Linked by URL only, so this page
// does not depend on that code.
export const SDK_PATH = "/sdk";

export const OPEN_ROBOTS: readonly OpenRobot[] = [...MANIPULATORS, ...BODIES];

export function getOpenRobot(id: string): OpenRobot | undefined {
    return OPEN_ROBOTS.find((r) => r.id === id);
}

export function openRobotsOfType(type?: OpenRobotType): OpenRobot[] {
    return OPEN_ROBOTS.filter((r) => !type || r.type === type);
}

export function isOpenRobotType(t: string): t is OpenRobotType {
    return (ROBOT_TYPES as readonly string[]).includes(t);
}

// A non-commercial term (CC BY-NC, an added ban on commercial use) keeps a
// licence from counting as fully open.
export function isNonCommercial(licence: string): boolean {
    return /(^|-)NC(-|$)|NonCommercial/i.test(licence);
}

export function opennessStatus(r: OpenRobot, d: OpennessDimension): OpennessStatus {
    if (d === "licence") {
        if (r.licence.length === 0) return "missing";
        return r.licence.some(isNonCommercial) ? "partial" : "full";
    }
    return r.openness[d]?.status ?? "missing";
}

export interface OpennessScore {
    // Share of the eight dimensions, full = 1 and partial = 0.5, 0 to 1.
    score: number;
    full: number;
    partial: number;
    missing: number;
}

export function opennessScore(r: OpenRobot): OpennessScore {
    const s = OPENNESS_DIMENSIONS.map((d) => opennessStatus(r, d));
    const full = s.filter((x) => x === "full").length;
    const partial = s.filter((x) => x === "partial").length;
    return {
        score: (full + partial / 2) / OPENNESS_DIMENSIONS.length,
        full,
        partial,
        missing: s.length - full - partial,
    };
}

// Inclusion rule: the mechanical design, or the full BOM plus build
// instructions, is public with a licence stated for those files. A licence
// that covers only the code does not count; such records need an
// inclusionNote saying why they are listed.
export function passesInclusion(r: OpenRobot): boolean {
    const { cad, bom, assembly } = r.openness;
    const design = Boolean(cad?.licence);
    const kit =
        bom?.status === "full" && Boolean(bom.licence) && assembly !== undefined;
    return design || kit;
}

const REPOS = stats.repos as Record<string, RepoStat>;
export const REPO_STATS_AS_OF: string = stats.asOf;

export function repoStat(r: OpenRobot): RepoStat | null {
    return r.repo ? (REPOS[r.repo] ?? null) : null;
}

export function repoUrl(r: OpenRobot): string | null {
    return r.repo ? `https://github.com/${r.repo}` : null;
}

export function totalActuators(r: OpenRobot): number {
    return r.joints.reduce((s, j) => s + j.count, 0);
}

export interface ActuatorUsage {
    key: string;
    name: string;
    brand: string;
    // Catalog id, or null for an unlisted actuator.
    actuatorId: string | null;
    joints: number;
    robots: string[];
}

// Joint count by actuator model across every open robot, most used first.
// Catalog actuators key by id; unlisted ones by brand and name.
export function actuatorUsage(
    robots: readonly OpenRobot[] = OPEN_ROBOTS,
): ActuatorUsage[] {
    const rows = new Map<string, ActuatorUsage>();
    for (const r of robots)
        for (const j of r.joints) {
            const key = j.actuatorId ?? `unlisted:${j.brand}:${j.name}`;
            const row = rows.get(key) ?? {
                key,
                name: j.name,
                brand: j.brand,
                actuatorId: j.actuatorId ?? null,
                joints: 0,
                robots: [],
            };
            row.joints += j.count;
            if (!row.robots.includes(r.id)) row.robots.push(r.id);
            rows.set(key, row);
        }
    return [...rows.values()].sort(
        (a, b) => b.joints - a.joints || a.name.localeCompare(b.name),
    );
}

export interface BrandUsage {
    brand: string;
    joints: number;
    robots: string[];
    // True when at least one of the brand's actuators is in the catalog.
    catalog: boolean;
}

export function brandUsage(robots: readonly OpenRobot[] = OPEN_ROBOTS): BrandUsage[] {
    const rows = new Map<string, BrandUsage>();
    for (const u of actuatorUsage(robots)) {
        const row = rows.get(u.brand) ?? {
            brand: u.brand,
            joints: 0,
            robots: [],
            catalog: false,
        };
        row.joints += u.joints;
        if (u.actuatorId) row.catalog = true;
        for (const id of u.robots) if (!row.robots.includes(id)) row.robots.push(id);
        rows.set(u.brand, row);
    }
    return [...rows.values()].sort((a, b) => b.joints - a.joints);
}

export interface FamilyNode {
    robot: OpenRobot;
    children: FamilyNode[];
}

// Lineage forest: roots are robots with no (listed) parent, and only roots
// with at least one derivative are lineages worth drawing.
export function familyTree(robots: readonly OpenRobot[] = OPEN_ROBOTS): FamilyNode[] {
    const ids = new Set(robots.map((r) => r.id));
    const node = (r: OpenRobot): FamilyNode => ({
        robot: r,
        children: robots.filter((c) => c.derivedFrom === r.id).map(node),
    });
    return robots
        .filter((r) => !r.derivedFrom || !ids.has(r.derivedFrom))
        .map(node)
        .filter((n) => n.children.length > 0);
}

export function lineageSize(n: FamilyNode): number {
    return 1 + n.children.reduce((s, c) => s + lineageSize(c), 0);
}

export function formatUsd(v: number): string {
    return `$${v.toLocaleString("en-US", { maximumFractionDigits: v < 1000 ? 2 : 0 })}`;
}

// "$8,000 to $9,000" for a range, "under $400" for an upper bound only.
export function formatCost(c: OpenRobotCost): string {
    if (!c.range) return formatUsd(c.value);
    const [low, high] = c.range;
    return low === null
        ? `under ${formatUsd(high)}`
        : `${formatUsd(low)} to ${formatUsd(high)}`;
}
