import { expect, test } from "bun:test";
import { ACTUATORS } from "@/catalog";
import { COMPARE_SPECS, revisionNote } from "@/catalog/compare";
import { evidenceFor, fieldCaveat } from "@/catalog/evidence";

test("comparison topic cells stay concise and source qualified rather than replaying full research panels", () => {
    for (const a of ACTUATORS.filter((row) =>
        ["cubemars-ak80-9", "xiaomi-cybergear", "myactuator-rmd-x8-pro-v2"].includes(
            row.id,
        ),
    )) {
        for (const spec of COMPARE_SPECS.slice(-4)) {
            const cell = spec.display(a);
            expect(cell.length).toBeLessThan(240);
            expect(cell).not.toContain("https://");
            expect(cell).toContain("Source:");
        }
    }
});

test("MYACT density uses peak torque rather than the conflicting rated torque", () => {
    const a = ACTUATORS.find((row) => row.id === "myactuator-rmd-x8-pro-v2");
    if (!a) throw new Error("Missing MYACT record");
    const note = fieldCaveat(a, "torque_density_nm_per_kg");
    expect(note).toContain("peak torque / mass");
    expect(note).toContain("Current peak and mass agree");
    expect(note).toContain("rated-torque conflict does not change this density");
    expect(evidenceFor(a).caveats.join(" ")).not.toContain(
        "density inherits torque uncertainty",
    );
});

test("MYACT revision conflicts qualify retained fields and comparison unknowns remain honest", () => {
    const a = ACTUATORS.find((row) => row.id === "myactuator-rmd-x8-pro-v2");
    if (!a) throw new Error("Missing MYACT record");
    expect(evidenceFor(a).label).toBe("Revision conflict: unresolved");
    for (const field of [
        "rated_torque_nm",
        "max_speed_rpm",
        "voltage_v",
        "encoder",
        "ip_rating",
    ]) {
        expect(fieldCaveat(a, field)).toContain("Revision conflict");
    }
    for (const label of [
        "Rated torque (catalog)",
        "Maximum speed (catalog)",
        "Voltage",
        "Encoder (resolution is not accuracy)",
    ]) {
        expect(COMPARE_SPECS.find((s) => s.label === label)?.display(a)).toContain(
            "Revision conflict",
        );
    }
    expect(
        COMPARE_SPECS.find((s) => s.label === "Complete actuator efficiency")?.display(
            a,
        ),
    ).toContain("Unknown");
    expect(
        COMPARE_SPECS.find((s) => s.label === "Complete actuator efficiency")?.display(
            a,
        ),
    ).toContain("manufacturer curve");
    expect(
        COMPARE_SPECS.find((s) => s.label === "Cooling / thermal duty")?.display(a),
    ).toContain("24 °C");
    expect(
        COMPARE_SPECS.find((s) => s.label === "Loaded repeatability")?.display(a),
    ).toStartWith("Unknown");
    expect(
        COMPARE_SPECS.find((s) => s.label === "Calibrated simulation model")?.display(
            a,
        ),
    ).toStartWith("Unknown");
});
test("dedicated comparison qualifies retained mass and encoder beside their values", () => {
    const a = ACTUATORS.find((a) => a.id === "cubemars-ak80-9");
    if (!a) throw new Error("Missing AK80-9 record");
    expect(revisionNote(a)).toContain("Revision conflict");
    const family = ACTUATORS.find((row) => row.id === "leaderdrive-lcs");
    if (!family) throw new Error("Missing LCS family record");
    expect(revisionNote(family)).toContain("Family-level");
    expect(revisionNote(family)).toContain("not an integrated motor");
    for (const label of ["Mass", "Encoder (resolution is not accuracy)"]) {
        expect(COMPARE_SPECS.find((s) => s.label === label)?.display(a)).toContain(
            "Revision conflict",
        );
    }
});
