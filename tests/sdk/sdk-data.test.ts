import { describe, expect, test } from "bun:test";
import { resolveBrand } from "@/brands";
import { ACTUATORS } from "@/catalog";
import {
    CHECKS,
    DIMENSION_IDS,
    PRESETS,
    SDK_EVIDENCE,
    SDK_SCORES,
    evidenceById,
    overall,
    sdkForActuator,
} from "@/sdk";
import { sdkCatalog } from "@/sdk/catalog";
import { scoreSnapshot } from "@/sdk/score";
import type { EvidenceFile } from "@/sdk/types";

describe("committed /sdk snapshot", () => {
    test("scores follow from the committed evidence and rubric", () => {
        expect(scoreSnapshot(SDK_EVIDENCE, sdkCatalog())).toEqual(SDK_SCORES);
    });

    test("every catalog brand is covered", () => {
        const brands = new Set(
            ACTUATORS.map((a) => resolveBrand(a.brand)?.id ?? a.brand),
        );
        expect(new Set(SDK_SCORES.brands.map((b) => b.brand))).toEqual(brands);
    });

    test("every check cites evidence that exists; every pass cites some", () => {
        const checks = SDK_SCORES.brands.flatMap((b) =>
            DIMENSION_IDS.flatMap((d) => b.dimensions[d].checks),
        );
        for (const id of checks.flatMap((c) => c.evidence))
            expect(evidenceById(id)).toBeDefined();
        const earned = checks.filter((c) => c.points > 0);
        expect(earned.every((c) => c.evidence.length > 0)).toBe(true);
    });

    test("evidence items link out, quotes are short, no usernames are stored", () => {
        const ids = new Set<string>();
        for (const e of SDK_EVIDENCE.evidence) {
            expect(ids.has(e.id)).toBe(false);
            ids.add(e.id);
            expect(e.url).toMatch(/^https:\/\//);
            if (e.quote !== undefined) expect(e.quote.length).toBeLessThanOrEqual(300);
            expect(Object.keys(e)).not.toContain("author");
            expect(Object.keys(e)).not.toContain("user");
        }
    });

    test("an unscored check stays out of the dimension score", () => {
        const file: EvidenceFile = {
            ...SDK_EVIDENCE,
            collectors: SDK_EVIDENCE.collectors.map((c) => ({
                ...c,
                status: "blocked",
            })),
        };
        const robotis = scoreSnapshot(file, sdkCatalog()).brands.find(
            (b) => b.brand === "robotis",
        );
        // Evidence still counts where it was found; no check turns into a zero.
        expect(robotis?.dimensions.ros_sim.score).toBeGreaterThan(5);
        expect(robotis?.dimensions.reliability.score).toBeNull();
    });

    test("presets weigh every dimension and the overall drops unscored ones", () => {
        for (const p of PRESETS)
            for (const d of DIMENSION_IDS) expect(p.weights[d]).toBeGreaterThan(0);
        const b = SDK_SCORES.brands.find((x) => x.brand === "mjbots");
        if (!b) throw new Error("mjbots missing");
        const o = overall(b);
        expect(o.coverage).toBeLessThan(1);
        expect(o.score).toBeGreaterThan(0);
        expect(CHECKS.every((c) => c.max > 0)).toBe(true);
    });

    test("SDK badge: commandable actuators only", () => {
        expect(sdkForActuator("mjbots-moteus-c1", true)?.brand).toBe("mjbots");
        expect(sdkForActuator("nabtesco-rv-42n", false)).toBeNull();
    });
});
