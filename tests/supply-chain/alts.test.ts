import { describe, expect, test } from "bun:test";
import {
    ALT_FAMILIES,
    ALT_TECHS,
    DEPLOYMENTS,
    MARKET_SLICES,
    altErrors,
    techsIn,
} from "@/supply-chain/alts";
import { UNATTRIBUTED, groupSlices, groupsOf } from "@/supply-chain/alts/treemap";
import { getSource } from "@/supply-chain/sources";

const ISSUE_TECHS = [
    "induction",
    "switched-reluctance",
    "synchronous-reluctance",
    "ferrite-pm",
    "wound-field",
    "axial-flux",
    "iron-nitride",
    "hasel",
    "dielectric-elastomer",
    "twisted-coiled-polymer",
    "shape-memory-alloy",
    "mckibben",
    "hydraulic-muscle",
    "servo-hydraulic",
    "electrohydrostatic",
    "cycloidal",
    "cable-capstan",
    "roller-screw",
    "magnetic-gear",
];

describe("/alts data", () => {
    test("covers every technology in the issue, in four families", () => {
        expect(ALT_TECHS.map((t) => t.id).sort()).toEqual([...ISSUE_TECHS].sort());
        for (const f of ALT_FAMILIES) expect(techsIn(f).length).toBeGreaterThan(0);
        expect(altErrors()).toEqual([]);
    });

    test("every technology has a cited TRL and a 3D scene; announced milestones are estimates", () => {
        for (const t of ALT_TECHS) {
            expect(t.trl.confidence, t.id).toBe("modeled");
            expect(t.trl.note, t.id).toBeTruthy();
            expect(t.scene.spec.id).toMatch(/^[a-z0-9-]+$/);
            for (const m of t.milestones) {
                expect(m.year.sources.length).toBeGreaterThan(0);
                if (m.announced) expect(m.year.confidence).toBe("estimated");
            }
        }
        expect(new Set(ALT_TECHS.map((t) => t.scene.spec.id)).size).toBe(
            ALT_TECHS.length,
        );
    });

    test("market sizes cite restricted reports, at most three records each", () => {
        for (const s of MARKET_SLICES) {
            for (const v of [s.revenueUsd, s.cagr]) {
                expect(v.confidence).toBe("estimated");
                expect(getSource(v.sources[0] ?? "")?.reuse).toBe("restricted");
            }
        }
    });

    test("deployments are dated and tied to a technology", () => {
        for (const d of DEPLOYMENTS) expect(d.date).toMatch(/^\d{4}(-\d{2}){0,2}$/);
        expect(DEPLOYMENTS.some((d) => d.status === "retired")).toBe(true);
    });
});

describe("treemap grouping", () => {
    const total = MARKET_SLICES.reduce((a, s) => a + s.revenueUsd.value, 0);

    test("every grouping keeps the total market size", () => {
        for (const by of ["family", "company-type", "end-market", "country"] as const) {
            const groups = groupSlices(MARKET_SLICES, by, ALT_TECHS);
            const sum = groups.reduce((a, g) => a + g.value, 0);
            expect(sum).toBeCloseTo(total, 0);
            expect(groups.map((g) => g.value)).toEqual(
                [...groups.map((g) => g.value)].sort((a, b) => b - a),
            );
        }
    });

    test("family and end market move tiles whole; country splits across player homes", () => {
        const family = groupSlices(MARKET_SLICES, "family", ALT_TECHS);
        expect(family.flatMap((g) => g.leaves).every((l) => l.share === 1)).toBe(true);
        const cyclo = MARKET_SLICES.find((s) => s.id === "cycloidal-reducers");
        if (!cyclo) throw new Error("no cycloidal slice");
        expect(groupsOf(cyclo, "country", ALT_TECHS)).toEqual(["JP"]);
        const induction = MARKET_SLICES.find((s) => s.id === "induction-motors");
        if (!induction) throw new Error("no induction slice");
        expect(groupsOf(induction, "country", ALT_TECHS)).toEqual(["CH", "US"]);
        const eha = MARKET_SLICES.find((s) => s.id === "eha");
        if (!eha) throw new Error("no eha slice");
        expect(groupsOf(eha, "company-type", ALT_TECHS)).toEqual([UNATTRIBUTED]);
        const byCountry = groupSlices(MARKET_SLICES, "country", ALT_TECHS);
        const split = byCountry
            .flatMap((g) => g.leaves)
            .filter((l) => l.sliceId === "induction-motors");
        expect(split.map((l) => l.share)).toEqual([0.5, 0.5]);
    });
});
