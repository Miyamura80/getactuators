import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

test("production browser build copies the transitive engineering registry", () => {
    const dockerfile = readFileSync(
        new URL("../../Dockerfile", import.meta.url),
        "utf8",
    );
    const buildStage = dockerfile.split("FROM oven/bun:1 AS runtime")[0];
    expect(buildStage).toContain("src/catalog/engineering-evidence.ts");
});
import approved from "./engineering-approved.json";

test("source locators distinguish family driver tables and STEP HEADER identity", async () => {
    const { engineeringEvidenceFor } = await import("@/catalog/engineering-evidence");
    expect(
        engineeringEvidenceFor("cubemars-ak80-9")?.topics.precision.sources[0]?.locator,
    ).toContain("family driver inner-loop encoder specification");
    expect(
        engineeringEvidenceFor("myactuator-rmd-x8-pro-v2")?.topics.modeling.summary,
    ).toContain("HEADER identifies");
});

test("researched evidence is revision scoped without converting unknowns to validation", async () => {
    const { engineeringEvidenceFor } = await import("@/catalog/engineering-evidence");
    expect(engineeringEvidenceFor("other")).toBeUndefined();
    expect(engineeringEvidenceFor("constructor")).toBeUndefined();
    expect(engineeringEvidenceFor("toString")).toBeUndefined();
    for (const [id, frozen] of Object.entries(approved)) {
        expect(JSON.stringify(engineeringEvidenceFor(id))).toBe(
            JSON.stringify(frozen.evidence),
        );
    }
    const ak = engineeringEvidenceFor("cubemars-ak80-9");
    expect(ak?.revision).toBe(
        "AK80-9 V3.0 KV100; installed hardware/firmware unconfirmed",
    );
    expect(ak?.topics.precision.summary).toBe(
        "Manual p4 specifies 16-bit sensing, up to 21-bit with custom firmware; p8 still lists unqualified 21-bit.",
    );
    expect(ak?.topics.efficiency.scope).toContain("Electrical-input boundary");
    expect(ak?.topics.modeling.scope).toContain("Dephy FASTER");
    const cg = engineeringEvidenceFor("xiaomi-cybergear");
    expect(cg?.topics.efficiency.status).toBe("unknown");
    expect(cg?.topics.thermal.summary).toContain("11 N·m/45 s, 10/60, 9/90, 7/320");
    expect(cg?.warnings.join(" ")).toContain("expired TLS");
    expect(cg?.topics.modeling.status).toBe("research");
    const my = engineeringEvidenceFor("myactuator-rmd-x8-pro-v2");
    expect(my?.topics.efficiency.summary).toBe(
        "Current X8-25 curve prints 80.8% at 7.19 N·m, 242.0 rpm, 47.99 V and 4.676 A (224.36 W input, 181.30 W output).",
    );
    expect(my?.topics.efficiency.scope).toContain("legacy catalog unit");
    expect(my?.topics.thermal.scope).toContain("not the legacy 13 N·m rating");
    expect(my?.topics.precision.summary).toContain("16-bit");
    for (const evidence of [ak, cg, my]) {
        expect(Object.keys(evidence?.topics ?? {})).toEqual([
            "efficiency",
            "thermal",
            "precision",
            "modeling",
        ]);
        for (const item of Object.values(evidence?.topics ?? {})) {
            expect(item.sources.length).toBeGreaterThan(0);
            for (const source of item.sources) {
                expect(source.url).toStartWith("https://");
                expect(source.locator.length).toBeGreaterThan(10);
            }
        }
    }
});
