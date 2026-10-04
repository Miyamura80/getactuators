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

export function isReducerFamily(id: string): boolean {
    return reducerFamilies.has(id);
}

export function fieldCaveat(a: EvidenceRecord, field: string): string | undefined {
    if (
        a.id === "cubemars-ak80-9" &&
        ["weight_g", "encoder", "torque_density_nm_per_kg"].includes(field)
    ) {
        return "Revision conflict: retained catalog value; confirm installed revision. Density inherits mass uncertainty.";
    }
    if (a.id === "myactuator-rmd-x8-pro-v2") {
        const caveats: Record<string, string> = {
            rated_torque_nm:
                "Revision conflict: retained 13 N·m legacy rating; current X8-25 documents specify 10 N·m. Applicability unconfirmed.",
            max_speed_rpm:
                "Revision conflict: retained 160 rpm legacy no-load value; current curve lists 254.3 rpm at 48.14 V. Applicability unconfirmed.",
            voltage_v:
                "Revision conflict: retained 24–48 V legacy range; current actuator sheet specifies 48 V. Driver range is not actuator rating.",
            encoder:
                "Revision conflict: current 240814 sheet says 16-bit, while 241227 manual says 18 bits. Confirm installed revision; resolution is not accuracy.",
            ip_rating:
                "Revision conflict: IP54 is a customization option; not established for the standard unit.",
            torque_density_nm_per_kg:
                "Revision scope: density is peak torque / mass (25 N·m / 0.710 kg). Current peak and mass agree; the 13-to-10 N·m rated-torque conflict does not change this density. Confirm installed revision.",
            power_w:
                "Revision conflict: retained 166 W legacy rating; current X8-25 documents specify 125 W. Applicability unconfirmed.",
        };
        return caveats[field];
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
    if (a.id === "myactuator-rmd-x8-pro-v2")
        return {
            label: "Revision conflict: unresolved",
            caveats: [
                "Current X8-25 alias does not establish unchanged legacy winding/driver/firmware or rating applicability. Retained torque, speed, voltage, encoder and IP54 values require revision/variant confirmation. Peak-based density uses matching 25 N·m and 0.710 kg; rated-torque conflict does not change it.",
            ],
        };
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
