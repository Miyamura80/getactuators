const EM_DASH = String.fromCharCode(0x2014);
import { describe, expect, test } from "bun:test";
import { ACTUATORS, ROBOTS } from "@/catalog";
import {
    CENTRAL,
    HUMANOIDS,
    type HumanoidJoint,
    SIDED,
    SOURCES,
    getHumanoid,
    humanoidTotals,
} from "@/humanoids";

const CANONICAL = new Set<string>([
    ...CENTRAL,
    ...SIDED.flatMap((j) => [`l-${j}`, `r-${j}`]),
]);

function checkJoint(robotId: string, j: HumanoidJoint) {
    const where = `${robotId} ${j.canonical}`;
    expect({ where, ok: CANONICAL.has(j.canonical) }).toEqual({ where, ok: true });
    expect({ where, n: j.sources.length > 0 }).toEqual({ where, n: true });
    const unknown = j.sources.filter((id) => !(id in SOURCES));
    expect({ where, unknown }).toEqual({ where, unknown: [] });
    if (j.typeConfidence === "estimated")
        expect(j.inferredFrom?.length ?? 0).toBeGreaterThan(10);
    if (j.actuatorType === "other") expect(j.typeConfidence).toBe("estimated");
    expect(j.count).toBeGreaterThan(0);
    expect(j.magnetMassG.confidence).toBe("estimated");
}

describe("humanoid joint dataset", () => {
    test("covers 15 to 25 humanoids with unique ids", () => {
        expect(HUMANOIDS.length).toBeGreaterThanOrEqual(15);
        expect(HUMANOIDS.length).toBeLessThanOrEqual(25);
        expect(new Set(HUMANOIDS.map((h) => h.id)).size).toBe(HUMANOIDS.length);
    });

    test("every joint is canonical, sourced, and says what an estimate rests on", () => {
        for (const h of HUMANOIDS) {
            expect(h.joints.length).toBeGreaterThan(0);
            for (const j of h.joints) checkJoint(h.id, j);
        }
    });

    test("left and right sides mirror", () => {
        for (const h of HUMANOIDS) {
            const left = h.joints
                .filter((j) => j.canonical.startsWith("l-"))
                .map((j) => j.canonical.slice(2))
                .sort();
            const right = h.joints
                .filter((j) => j.canonical.startsWith("r-"))
                .map((j) => j.canonical.slice(2))
                .sort();
            expect({ id: h.id, side: left }).toEqual({ id: h.id, side: right });
        }
    });

    test("catalog and robots.json links resolve", () => {
        const actuatorIds = new Set(ACTUATORS.map((a) => a.id));
        const robotIds = new Set(ROBOTS.map((r) => r.id));
        for (const h of HUMANOIDS) {
            if (h.robotId) expect(robotIds.has(h.robotId)).toBe(true);
            for (const j of h.joints)
                if (j.actuatorId) expect(actuatorIds.has(j.actuatorId)).toBe(true);
        }
    });

    test("robots.json loadouts keep their motor counts", () => {
        for (const id of ["unitree-g1", "booster-t1", "booster-k1", "menlo-asimov-1"]) {
            const r = ROBOTS.find((x) => x.id === id);
            const h = getHumanoid(id);
            if (!r || !h) throw new Error(`missing ${id}`);
            const motors = r.joints.reduce((n, j) => n + j.count, 0);
            expect({ id, n: humanoidTotals(h).actuators }).toEqual({ id, n: motors });
        }
    });

    test("URDF-sourced torques match the published effort limits", () => {
        const knee = (id: string) =>
            getHumanoid(id)?.joints.find((j) => j.canonical === "l-knee")?.peakTorqueNm
                ?.value;
        expect(knee("unitree-g1")).toBe(139);
        expect(knee("booster-t1")).toBe(130.5);
        expect(knee("fourier-gr2")).toBe(366);
        expect(knee("kscale-kbot")).toBe(120);
    });

    test("no em dashes in any text", () => {
        expect(JSON.stringify(HUMANOIDS)).not.toContain(EM_DASH);
        expect(JSON.stringify(SOURCES)).not.toContain(EM_DASH);
    });
});
