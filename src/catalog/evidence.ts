// Display-only evidence policy. Never mutate catalog values or the legacy flag.
interface EvidenceRecord {
    id: string;
    verified: boolean;
}

const reducerFamilies = new Set([
    "leaderdrive-lcs",
    "leaderdrive-lhd",
    "leaderdrive-lhs",
    "nidec-flexwave-wpg",
    "nidec-smart-flexwave-srh",
]);

export function fieldCaveat(a: EvidenceRecord, field: string): string | undefined {
    if (
        a.id === "cubemars-ak80-9" &&
        ["weight_g", "encoder", "torque_density_nm_per_kg"].includes(field)
    ) {
        return "Revision conflict: retained catalog value; confirm installed revision. Density inherits mass uncertainty.";
    }
    if (
        reducerFamilies.has(a.id) &&
        ["backdrivable", "backlash_arcmin", "encoder"].includes(field)
    ) {
        return "Legacy catalog placeholder; not measured. Confirm selected reducer variant.";
    }
    if (reducerFamilies.has(a.id)) {
        return "Family-level catalog value; confirm frame, ratio and variant. Reducer/sensor assembly, not an integrated motor and drive.";
    }
    return undefined;
}

export function evidenceFor(a: EvidenceRecord) {
    if (a.id === "cubemars-ak80-9")
        return {
            label: "Revision conflict: unresolved",
            caveats: [
                "Catalog mass and encoder conflict with reviewed V3.0 documentation; confirm installed revision. Derived density inherits the mass conflict.",
            ],
        };
    if (reducerFamilies.has(a.id))
        return {
            label: "Family-level evidence: confirm variant",
            caveats: [
                "Reviewed family examples are not selected SKUs; confirm frame, ratio, variant and applicable revision. Manufacturer data is not independent bench validation.",
            ],
        };
    return {
        label: a.verified
            ? "Catalog headline specs spot-checked: confirm revision"
            : "Unverified catalog: confirm sources",
        caveats: [
            "The legacy verified flag is a catalog spot-check, not verification of every field, installed revision or independent performance validation.",
        ],
    };
}
