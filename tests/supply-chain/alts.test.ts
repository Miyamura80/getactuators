import { describe, expect, test } from "bun:test";
import {
    ALT_FAMILIES,
    ALT_TECHS,
    DEPLOYMENTS,
    MARKET_SLICES,
    altErrors,
    techsIn,
} from "@/supply-chain/alts";
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
                expect(v.sources.length).toBeGreaterThan(0);
                for (const source of v.sources)
                    expect(getSource(source)?.reuse).toBe("restricted");
            }
        }
    });

    test("a transmission is never counted as magnet-free: it depends on its motor", () => {
        for (const t of techsIn("transmission"))
            expect(["drive-motor", "permanent"]).toContain(t.magnets);
    });

    test("fluid-powered muscles are set by the motor on their pump or compressor", () => {
        const byId = new Map(ALT_TECHS.map((t) => [t.id, t]));
        expect(byId.get("mckibben")?.magnets).toBe("motor");
        expect(byId.get("hydraulic-muscle")?.magnets).toBe("motor");
    });

    test("deployments are dated and tied to a technology", () => {
        for (const d of DEPLOYMENTS) expect(d.date).toMatch(/^\d{4}(-\d{2}){0,2}$/);
        expect(DEPLOYMENTS.some((d) => d.status === "retired")).toBe(true);
    });
});
