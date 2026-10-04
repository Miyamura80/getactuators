import { expect, test } from "bun:test";
import { ACTUATORS } from "@/catalog";
import { COMPARE_SPECS, revisionNote } from "@/catalog/compare";
import { evidenceFor } from "@/catalog/evidence";

function actuator(id: string) {
    const row = ACTUATORS.find((a) => a.id === id);
    if (!row) throw new Error(`Missing actuator ${id}`);
    return row;
}

test("ordinary comparison revision notes retain verified versus unverified evidence", () => {
    const ordinary = actuator("cubemars-ak70-10");
    expect(ordinary).toBeDefined();
    for (const verified of [true, false]) {
        const row = { ...ordinary, verified };
        const evidence = evidenceFor(row);
        expect(revisionNote(row)).toContain(evidence.label);
        for (const caveat of evidence.caveats)
            expect(revisionNote(row)).toContain(caveat);
        expect(revisionNote(row)).toContain(
            "confirm the exact revision and operating conditions",
        );
    }
    expect(revisionNote({ ...ordinary, verified: true })).not.toBe(
        revisionNote({ ...ordinary, verified: false }),
    );
});

test("known revision and family warnings outrank either legacy verified flag", () => {
    for (const id of ["cubemars-ak80-9", "leaderdrive-lcs"]) {
        const source = actuator(id);
        expect(source).toBeDefined();
        const verified = { ...source, verified: true };
        const unverified = { ...source, verified: false };
        expect(revisionNote(verified)).toBe(revisionNote(unverified));
        expect(revisionNote(verified)).toContain(evidenceFor(source).label);
        for (const label of ["Mass", "Encoder (resolution is not accuracy)"]) {
            const spec = COMPARE_SPECS.find((s) => s.label === label);
            if (!spec) throw new Error(`Missing specification ${label}`);
            expect(spec.display(verified)).toBe(spec.display(unverified));
        }
    }
    expect(revisionNote(actuator("cubemars-ak80-9"))).toContain(
        "not confirmed V3.0 specifications",
    );
    expect(revisionNote(actuator("leaderdrive-lcs"))).toContain(
        "not an integrated motor and drive",
    );
});
