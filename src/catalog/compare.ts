// Shared display adapter only: catalog values are not newly validated measurements.
import { evidenceFor, fieldCaveat } from "./evidence";
export interface CompareActuator {
    id: string;
    verified: boolean;
    name: string;
    image_url?: string | null;
    peak_torque_nm: number | null;
    rated_torque_nm: number | null;
    max_speed_rpm: number | null;
    weight_g: number | null;
    gear_ratio: string | null;
    voltage_v: string | number | null;
    price_usd: number | null;
    encoder: string | null;
}
export const UNKNOWN = "Unknown: not documented";
export function validatedCompareIds(
    search: string,
    knownIds: readonly string[],
): string[] {
    const values = new URLSearchParams(search).getAll("compare");
    const raw = values[0];
    if (values.length !== 1 || raw === undefined || raw.length > 512) return [];
    const ids = raw.split(",");
    const known = new Set(knownIds);
    if (
        ids.length > 4 ||
        ids.some((id) => !known.has(id)) ||
        new Set(ids).size !== ids.length
    )
        return [];
    return ids.sort();
}
export function revisionNote(a: CompareActuator): string {
    const evidence = evidenceFor({ id: a.id, verified: a.verified });
    if (a.id === "cubemars-ak80-9")
        return `${evidence.label}. ${evidence.caveats.join(" ")} Catalog entry names V3.0 KV100; retained values are not confirmed V3.0 specifications.`;
    if (evidence.label.startsWith("Family-level"))
        return `${evidence.label}. ${evidence.caveats.join(" ")} Reducer/sensor assembly, not an integrated motor and drive.`;
    if (a.id === "xiaomi-cybergear")
        return "Original 24 V, 7.75:1, 317 g catalog entry; not a newer or different CyberGear revision.";
    return `${evidence.label}. ${evidence.caveats.join(" ")} Catalog entry only; confirm the exact revision and operating conditions with the linked source.`;
}
const value = (v: string | number | null, unit = "") =>
    v == null ? UNKNOWN : `${v}${unit}`;
function qualified(a: CompareActuator, field: string, displayed: string): string {
    const note = fieldCaveat({ id: a.id, verified: a.verified }, field);
    return note ? `${displayed}: ${note}` : displayed;
}
export const COMPARE_SPECS: {
    label: string;
    display: (a: CompareActuator) => string;
}[] = [
    { label: "Peak torque (catalog)", display: (a) => value(a.peak_torque_nm, " N·m") },
    {
        label: "Rated torque (catalog)",
        display: (a) => value(a.rated_torque_nm, " N·m"),
    },
    {
        label: "Maximum speed (catalog)",
        display: (a) => value(a.max_speed_rpm, " rpm"),
    },
    {
        label: "Mass",
        display: (a) => qualified(a, "weight_g", value(a.weight_g, " g")),
    },
    { label: "Gear ratio", display: (a) => value(a.gear_ratio) },
    { label: "Voltage", display: (a) => value(a.voltage_v, " V") },
    {
        label: "Price (catalog, not a live quote)",
        display: (a) => value(a.price_usd, " USD"),
    },
    {
        label: "Encoder (resolution is not accuracy)",
        display: (a) => qualified(a, "encoder", value(a.encoder)),
    },
    ...[
        "Complete actuator efficiency",
        "Cooling / thermal duty",
        "Loaded repeatability",
        "Calibrated simulation model",
    ].map((label) => ({ label, display: () => UNKNOWN })),
];
