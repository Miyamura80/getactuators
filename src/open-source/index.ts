// Open-source robots on /open-source: what is published for each, what
// actuators sit in its joints and what it derives from. Shared by the page,
// its markdown twin, the REST API and the MCP tool. Relative imports only:
// the browser bundle reuses this module.

import { getActuator } from "../catalog";
import repoStatsRaw from "./repo-stats.json";
import { ARM_ROBOTS } from "./robots-arms";
import { HUMANOID_ROBOTS } from "./robots-humanoids";
import { LEGGED_ROBOTS } from "./robots-legged";
import { MOBILE_ROBOTS } from "./robots-mobile";
import {
    OPENNESS_DIMENSIONS,
    type OpenJoint,
    type OpenRobot,
    type OpenRobotType,
    type OpennessDimension,
    type RepoStat,
    type RepoStats,
} from "./types";

export * from "./types";
export { OPEN_ROBOTS_AS_OF } from "./build";
export { EXCLUDED_CANDIDATES, type ExcludedCandidate } from "./excluded";

export const OPEN_SOURCE_PATH = "/open-source";

export const OPEN_ROBOTS: readonly OpenRobot[] = [
    ...MOBILE_ROBOTS,
    ...ARM_ROBOTS,
    ...HUMANOID_ROBOTS,
    ...LEGGED_ROBOTS,
];

export const REPO_STATS: RepoStats = repoStatsRaw;

export function getOpenRobot(id: string): OpenRobot | undefined {
    return OPEN_ROBOTS.find((r) => r.id === id);
}

export function openRobotsOfType(type?: OpenRobotType): OpenRobot[] {
    return OPEN_ROBOTS.filter((r) => !type || r.type === type);
}

export function repoStat(r: OpenRobot): RepoStat | undefined {
    return r.repo ? REPO_STATS.repos[r.repo] : undefined;
}

export function repoUrl(r: OpenRobot): string | null {
    return r.repo ? `https://github.com/${r.repo}` : null;
}

export type OpennessState = "full" | "partial" | "missing";

export function opennessState(r: OpenRobot, d: OpennessDimension): OpennessState {
    return r.openness[d]?.status ?? "missing";
}

export interface OpennessScore {
    // 0 to 1: full counts 1, partial counts half, over all eight dimensions.
    score: number;
    full: number;
    partial: number;
    missing: number;
}

export function opennessScore(r: OpenRobot): OpennessScore {
    const states = OPENNESS_DIMENSIONS.map((d) => opennessState(r, d));
    const full = states.filter((s) => s === "full").length;
    const partial = states.filter((s) => s === "partial").length;
    return {
        score: (full + partial / 2) / OPENNESS_DIMENSIONS.length,
        full,
        partial,
        missing: OPENNESS_DIMENSIONS.length - full - partial,
    };
}

// Cost to build in US dollars, or null when unknown or quoted in another
// currency (shown as text, never converted).
export function bomCostUsd(r: OpenRobot): number | null {
    return r.bomCost && r.bomCost.unit === "USD" ? r.bomCost.value : null;
}

// Usage key: the catalog id, or "unlisted:<motor>" for motors not in it.
export function jointKey(j: OpenJoint): string {
    return j.actuatorId ?? `unlisted:${j.motor}`;
}

// Catalog name and brand for a joint, falling back to the record.
export function jointMotor(j: OpenJoint): {
    name: string;
    brand: string;
    listed: boolean;
} {
    const a = j.actuatorId ? getActuator(j.actuatorId) : undefined;
    return a
        ? { name: a.name, brand: a.brand, listed: true }
        : { name: j.motor, brand: j.brand, listed: false };
}

export function motorCount(r: OpenRobot): number {
    return r.joints.reduce((s, j) => s + (j.count ?? 0), 0);
}

export interface ActuatorUsage {
    key: string;
    actuatorId: string | null;
    name: string;
    brand: string;
    joints: number;
    robots: string[];
}

// Brand recorded when a project does not name the motor.
export const UNKNOWN_BRAND = "Not stated";

// Joints per actuator model across the open-source robots, most used first.
// Joints whose motor is not named are left out.
export function actuatorUsage(
    robots: readonly OpenRobot[] = OPEN_ROBOTS,
): ActuatorUsage[] {
    const by = new Map<string, ActuatorUsage>();
    for (const r of robots) {
        for (const j of r.joints) {
            if (j.brand === UNKNOWN_BRAND) continue;
            const key = jointKey(j);
            const m = jointMotor(j);
            const row = by.get(key) ?? {
                key,
                actuatorId: j.actuatorId ?? null,
                name: m.name,
                brand: m.brand,
                joints: 0,
                robots: [],
            };
            row.joints += j.count ?? 0;
            if (!row.robots.includes(r.id)) row.robots.push(r.id);
            by.set(key, row);
        }
    }
    return [...by.values()].sort(
        (a, b) =>
            b.joints - a.joints ||
            b.robots.length - a.robots.length ||
            a.name.localeCompare(b.name),
    );
}

export interface BrandUsage {
    key: string;
    brand: string;
    joints: number;
    robots: string[];
}

export function brandUsage(robots: readonly OpenRobot[] = OPEN_ROBOTS): BrandUsage[] {
    const by = new Map<string, BrandUsage>();
    for (const u of actuatorUsage(robots)) {
        const row = by.get(u.brand) ?? {
            key: `brand:${u.brand}`,
            brand: u.brand,
            joints: 0,
            robots: [],
        };
        row.joints += u.joints;
        for (const id of u.robots) if (!row.robots.includes(id)) row.robots.push(id);
        by.set(u.brand, row);
    }
    return [...by.values()].sort(
        (a, b) => b.joints - a.joints || a.brand.localeCompare(b.brand),
    );
}

// Robots whose joints use a usage key (actuator) or "brand:<name>".
export function robotsUsing(
    key: string,
    robots: readonly OpenRobot[] = OPEN_ROBOTS,
): OpenRobot[] {
    const brand = key.startsWith("brand:") ? key.slice("brand:".length) : null;
    return robots.filter((r) =>
        r.joints.some((j) =>
            brand ? jointMotor(j).brand === brand : jointKey(j) === key,
        ),
    );
}

export interface LineageNode {
    id: string;
    // Longest chain of ancestors above this robot (0 for an original design).
    depth: number;
}

export interface Lineage {
    nodes: LineageNode[];
    edges: { from: string; to: string }[];
}

// Family tree: every robot that derives from another, and their ancestors.
export function lineage(robots: readonly OpenRobot[] = OPEN_ROBOTS): Lineage {
    const ids = new Set(robots.map((r) => r.id));
    const edges = robots.flatMap((r) =>
        (r.derivedFrom ?? [])
            .filter((p) => ids.has(p))
            .map((p) => ({ from: p, to: r.id })),
    );
    const linked = new Set(edges.flatMap((e) => [e.from, e.to]));
    const depth = new Map<string, number>();
    const depthOf = (id: string): number => {
        const known = depth.get(id);
        if (known !== undefined) return known;
        const parents = edges.filter((e) => e.to === id).map((e) => e.from);
        const d = parents.length ? Math.max(...parents.map(depthOf)) + 1 : 0;
        depth.set(id, d);
        return d;
    };
    const nodes = robots
        .filter((r) => linked.has(r.id))
        .map((r) => ({ id: r.id, depth: depthOf(r.id) }));
    return { nodes, edges };
}

// Short label for a licence id in chips and tables.
export function licenceLabel(spdx: string): string {
    return spdx
        .replace(/-only$/, "")
        .replace(/-4\.0$/, " 4.0")
        .replace(/-2\.0$/, " 2.0");
}
