import { expect, test } from "bun:test";
import { evidenceFor, fieldCaveat } from "@/catalog/evidence";

// Editorial policy is frozen independently of the production helper so content
// normalization cannot silently accept changed evidence language.
test("approved revision and family evidence wording remains exact", () => {
    const ak = { id: "cubemars-ak80-9", verified: true };
    expect(evidenceFor(ak)).toEqual({
        label: "Revision conflict: unresolved",
        caveats: [
            "Catalog mass and encoder conflict with reviewed V3.0 documentation; confirm installed revision. Derived density inherits the mass conflict.",
        ],
    });
    for (const field of ["weight_g", "encoder", "torque_density_nm_per_kg"]) {
        expect(fieldCaveat(ak, field)).toBe(
            "Revision conflict: retained catalog value; confirm installed revision. Density inherits mass uncertainty.",
        );
    }
    for (const id of [
        "leaderdrive-lcs",
        "leaderdrive-lhd",
        "leaderdrive-lhs",
        "nidec-flexwave-wpg",
        "nidec-smart-flexwave-srh",
    ]) {
        const family = { id, verified: true };
        expect(evidenceFor(family)).toEqual({
            label: "Family-level evidence: confirm variant",
            caveats: [
                "Reviewed family examples are not selected SKUs; confirm frame, ratio, variant and applicable revision. Manufacturer data is not independent bench validation.",
            ],
        });
        expect(fieldCaveat(family, "weight_g")).toBe(
            "Family-level catalog value; confirm frame, ratio and variant. Reducer/sensor assembly, not an integrated motor and drive.",
        );
        for (const field of ["backdrivable", "backlash_arcmin", "encoder"]) {
            expect(fieldCaveat(family, field)).toBe(
                "Legacy catalog placeholder; not measured. Confirm selected reducer variant.",
            );
        }
    }
});
