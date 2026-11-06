import { describe, expect, test } from "bun:test";
import { ACTUATORS, ROBOTS } from "@/catalog";
import {
    OPENNESS_DIMENSIONS,
    OPEN_ROBOTS,
    actuatorUsage,
    familyTree,
    getOpenRobot,
    isNonCommercial,
    opennessScore,
    opennessStatus,
    passesInclusion,
    repoStat,
} from "@/open-source";
import { openSourceLicenceErrors } from "@/open-source/licence";
import { SOURCES } from "@/open-source/sources";

describe("open robot registry", () => {
    test("lists 24 robots, including YOR and Manmaru AI's YOR build", () => {
        expect(OPEN_ROBOTS).toHaveLength(24);
        expect(getOpenRobot("yor")?.maintainers).toContain("NYU");
        const manmaru = getOpenRobot("manmaru-yor");
        expect(manmaru?.derivedFrom).toBe("yor");
        expect(manmaru?.joints.some((j) => j.actuatorId?.startsWith("damiao-"))).toBe(
            true,
        );
    });

    test("ids are unique and every robot passes the inclusion rule or says why not", () => {
        expect(new Set(OPEN_ROBOTS.map((r) => r.id)).size).toBe(OPEN_ROBOTS.length);
        for (const r of OPEN_ROBOTS)
            expect({
                id: r.id,
                ok: passesInclusion(r) || Boolean(r.inclusionNote?.trim()),
            }).toEqual({
                id: r.id,
                ok: true,
            });
    });

    test("joint actuators reference real catalog ids, and robotId real robots", () => {
        const actuators = new Set(ACTUATORS.map((a) => a.id));
        const robots = new Set(ROBOTS.map((r) => r.id));
        for (const r of OPEN_ROBOTS) {
            if (r.robotId)
                expect({ id: r.id, robot: robots.has(r.robotId) }).toEqual({
                    id: r.id,
                    robot: true,
                });
            for (const j of r.joints) {
                expect(j.count).toBeGreaterThan(0);
                if (j.actuatorId)
                    expect({
                        id: r.id,
                        actuator: j.actuatorId,
                        ok: actuators.has(j.actuatorId),
                    }).toMatchObject({ ok: true });
            }
        }
    });

    test("every robot, joint and figure cites a source, every id resolves and the licence audit is clean", () => {
        for (const r of OPEN_ROBOTS) {
            expect({ id: r.id, sources: r.sources.length > 0 }).toEqual({
                id: r.id,
                sources: true,
            });
            for (const j of r.joints)
                expect({
                    id: r.id,
                    role: j.role,
                    sources: j.sources.length > 0,
                }).toEqual({
                    id: r.id,
                    role: j.role,
                    sources: true,
                });
            for (const id of [...r.sources, ...r.joints.flatMap((j) => j.sources)])
                expect(Object.keys(SOURCES)).toContain(id);
        }
        expect(openSourceLicenceErrors()).toEqual([]);
    });

    test("the inclusion rule needs a licence on the qualifying files, not just the code", () => {
        const yor = getOpenRobot("yor");
        expect(yor && passesInclusion(yor)).toBe(false);
        expect(yor?.inclusionNote).toContain("code");
        const lekiwi = getOpenRobot("lekiwi");
        expect(lekiwi && passesInclusion(lekiwi)).toBe(true);
    });

    test("derivedFrom points at a listed robot, and lineages include YOR and SO-100", () => {
        for (const r of OPEN_ROBOTS)
            if (r.derivedFrom) expect(getOpenRobot(r.derivedFrom)).toBeDefined();
        const roots = familyTree().map((n) => n.robot.id);
        expect(roots).toContain("yor");
        expect(roots).toContain("so-100");
    });

    test("every robot with a repo has a committed stars and last-commit snapshot", () => {
        for (const r of OPEN_ROBOTS) {
            if (!r.repo) continue;
            const stat = repoStat(r);
            expect({ id: r.id, stat: stat !== null }).toEqual({ id: r.id, stat: true });
            expect({ id: r.id, stars: typeof stat?.stars }).toEqual({
                id: r.id,
                stars: "number",
            });
            const last = stat?.lastCommit;
            expect({
                id: r.id,
                lastCommit: last === null || /^\d{4}-\d{2}-\d{2}$/.test(last ?? ""),
            }).toEqual({ id: r.id, lastCommit: true });
        }
    });
});

function licenceOf(id: string) {
    const r = getOpenRobot(id);
    if (!r) throw new Error(`no open robot ${id}`);
    return opennessStatus(r, "licence");
}

describe("openness score", () => {
    test("is the share of the eight dimensions, partial counting half", () => {
        for (const r of OPEN_ROBOTS) {
            const statuses = OPENNESS_DIMENSIONS.map((d) => opennessStatus(r, d));
            const expected =
                (statuses.filter((s) => s === "full").length +
                    statuses.filter((s) => s === "partial").length / 2) /
                8;
            expect(opennessScore(r).score).toBeCloseTo(expected, 10);
        }
    });

    test("a non-commercial licence is partial, no licence is missing", () => {
        expect(isNonCommercial("CC-BY-NC-SA-4.0")).toBe(true);
        expect(isNonCommercial("LicenseRef-NonCommercial")).toBe(true);
        expect(isNonCommercial("CERN-OHL-S-2.0")).toBe(false);
        expect(licenceOf("toddlerbot")).toBe("partial");
        expect(licenceOf("manmaru-yor")).toBe("missing");
        expect(licenceOf("openarm")).toBe("full");
    });
});

describe("actuator usage", () => {
    test("sums joints per actuator and keys catalog actuators by id", () => {
        const usage = actuatorUsage();
        const total = OPEN_ROBOTS.reduce(
            (s, r) => s + r.joints.reduce((t, j) => t + j.count, 0),
            0,
        );
        expect(usage.reduce((s, u) => s + u.joints, 0)).toBe(total);
        const sts = usage.find((u) => u.key === "feetech-sts3215");
        expect(sts?.robots).toContain("lekiwi");
        const joints = usage.map((u) => u.joints);
        expect(joints).toEqual([...joints].sort((a, b) => b - a));
    });
});
