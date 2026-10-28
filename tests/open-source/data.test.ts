import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getActuator, getRobot } from "@/catalog";
import {
    OPENNESS_DIMENSIONS,
    OPEN_ROBOTS,
    REPO_STATS,
    actuatorUsage,
    brandUsage,
    getOpenRobot,
    jointMotor,
    lineage,
    opennessScore,
    robotsUsing,
} from "@/open-source";

const SPDX = new Set([
    "Apache-2.0",
    "MIT",
    "BSD-3-Clause",
    "GPL-2.0-only",
    "GPL-3.0-only",
    "CERN-OHL-S-2.0",
    "CC-BY-SA-4.0",
    "CC-BY-NC-SA-4.0",
]);
const ROOT = join(import.meta.dir, "../..");
const isUrl = (s: string) => /^https?:\/\/\S+$/.test(s);
function robot(id: string) {
    const r = getOpenRobot(id);
    if (!r) throw new Error(`No open robot ${id}`);
    return r;
}

describe("open-source robot records", () => {
    test("at least 20 pass the inclusion rule, YOR and Manmaru YOR included", () => {
        expect(
            OPEN_ROBOTS.filter((r) => r.meetsInclusionRule).length,
        ).toBeGreaterThanOrEqual(20);
        expect(getOpenRobot("yor")).toBeDefined();
        expect(getOpenRobot("manmaru-yor")?.derivedFrom).toEqual(["yor"]);
        expect(new Set(OPEN_ROBOTS.map((r) => r.id)).size).toBe(OPEN_ROBOTS.length);
    });

    test("a robot that misses the rule says why", () => {
        for (const r of OPEN_ROBOTS.filter((x) => !x.meetsInclusionRule))
            expect(r.inclusionNote?.length ?? 0).toBeGreaterThan(20);
    });

    test("every link and source is an absolute URL", () => {
        const urls = OPEN_ROBOTS.flatMap((r) => [
            ...r.sources,
            ...Object.values(r.openness).map((link) => link.url),
            ...r.joints.flatMap((j) => j.sources),
            ...(r.bomCost?.sources ?? []),
        ]);
        expect(urls.filter((u) => !isUrl(u))).toEqual([]);
        for (const r of OPEN_ROBOTS) expect(r.sources.length).toBeGreaterThan(0);
        for (const j of OPEN_ROBOTS.flatMap((r) => r.joints))
            expect(j.sources.length).toBeGreaterThan(0);
    });

    test("licences are SPDX ids and a licence cell exists when one is stated", () => {
        for (const r of OPEN_ROBOTS) {
            for (const id of r.licence) expect(SPDX.has(id)).toBe(true);
            if (r.licence.length) expect(r.openness.licence).toBeDefined();
        }
    });

    test("joint actuators resolve to catalog ids with the catalog brand", () => {
        for (const r of OPEN_ROBOTS) {
            for (const j of r.joints) {
                if (!j.actuatorId) continue;
                const a = getActuator(j.actuatorId);
                expect(a, `${r.id}: ${j.actuatorId}`).toBeDefined();
                expect(j.brand).toBe(a?.brand ?? "");
                expect(jointMotor(j).listed).toBe(true);
            }
        }
    });

    test("catalog robot links, parents, photos and repo stats exist", () => {
        const broken = OPEN_ROBOTS.flatMap((r) => [
            ...(r.catalogRobotId && !getRobot(r.catalogRobotId)
                ? [r.catalogRobotId]
                : []),
            ...(r.derivedFrom ?? []).filter((p) => !getOpenRobot(p)),
            ...(r.image && !existsSync(join(ROOT, "frontend/public", r.image.url))
                ? [r.image.url]
                : []),
            ...(r.repo && !REPO_STATS.repos[r.repo] ? [r.repo] : []),
        ]);
        expect(broken).toEqual([]);
        for (const s of Object.values(REPO_STATS.repos))
            expect(s.lastCommit).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
});

describe("derived views", () => {
    test("openness score counts full as 1 and partial as half", () => {
        const s = opennessScore(robot("so-101"));
        expect(s.full + s.partial + s.missing).toBe(OPENNESS_DIMENSIONS.length);
        expect(s.score).toBeCloseTo((s.full + s.partial / 2) / 8);
        expect(opennessScore(robot("manmaru-yor")).score).toBeLessThan(s.score);
    });

    test("usage sums joint counts and skips motors nobody named", () => {
        const usage = actuatorUsage();
        const sts = usage.find((u) => u.actuatorId === "feetech-sts3215");
        // LeKiwi 9 + XLeRobot 17 + Open Duck Mini 14.
        expect(sts?.joints).toBe(40);
        expect(sts?.robots).toEqual(["lekiwi", "xlerobot", "open-duck-mini"]);
        expect(usage.some((u) => u.brand === "Not stated")).toBe(false);
        expect(brandUsage()[0]?.brand).toBe("Robotis (Dynamixel)");
        expect(robotsUsing("brand:RobStride").map((r) => r.id)).toEqual(["kbot"]);
        expect(robotsUsing("damiao-dm-j4310-2ec").map((r) => r.id)).toEqual([
            "manmaru-yor",
            "openarm",
        ]);
    });

    test("family tree is acyclic with generations by depth", () => {
        const { nodes, edges } = lineage();
        const depth = new Map(nodes.map((n) => [n.id, n.depth]));
        for (const e of edges)
            expect(depth.get(e.to) ?? 0).toBeGreaterThan(depth.get(e.from) ?? 99);
        expect(depth.get("xlerobot")).toBe(3);
        expect(edges).toContainEqual({ from: "solo-8", to: "solo-12" });
    });
});
