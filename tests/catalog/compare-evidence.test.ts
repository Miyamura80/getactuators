import { expect, test } from "bun:test";
import { ACTUATORS } from "@/catalog";
import { COMPARE_SPECS, revisionNote } from "@/catalog/compare";
test("dedicated comparison qualifies retained mass and encoder beside their values", () => {
    const a = ACTUATORS.find((a) => a.id === "cubemars-ak80-9")!;
    if (!a) throw new Error("Missing AK80-9 record");
    expect(revisionNote(a)).toContain("Revision conflict");
    const family = ACTUATORS.find((row) => row.id === "leaderdrive-lcs");
    if (!family) throw new Error("Missing LCS family record");
    expect(revisionNote(family)).toContain("Family-level");
    expect(revisionNote(family)).toContain("not an integrated motor");
    for (const label of ["Mass", "Encoder (resolution is not accuracy)"]) {
        expect(COMPARE_SPECS.find((s) => s.label === label)!.display(a)).toContain(
            "Revision conflict",
        );
    }
});
