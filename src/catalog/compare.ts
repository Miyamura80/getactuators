import { type EngineeringTopic, engineeringEvidenceFor } from "./engineering-evidence";
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
export const COMPARISON_PHOTO_NOTE =
    "Catalog photo; illustrative. Confirm hardware revision/variant.";
export function comparisonPhotoAlt(a: Pick<CompareActuator, "name">): string {
    return `${a.name}: illustrative catalog photo; revision/variant unconfirmed`;
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
// Caveats shown once per comparison, not once per model: the photo note, then
// the revision note, named per model only when the models' notes differ.
export function comparisonCaveats(rows: readonly CompareActuator[]): string[] {
    const notes = rows.map((a) => ({ name: a.name, note: revisionNote(a) }));
    const distinct = [...new Set(notes.map(({ note }) => note))];
    return [
        COMPARISON_PHOTO_NOTE,
        ...(distinct.length === 1
            ? distinct
            : notes.map(({ name, note }) => `${name}: ${note}`)),
    ];
}
const value = (v: string | number | null, unit = "") =>
    v == null ? UNKNOWN : `${v}${unit}`;
function qualified(a: CompareActuator, field: string, displayed: string): string {
    const note = fieldCaveat({ id: a.id, verified: a.verified }, field);
    return note ? `${displayed}: ${note}` : displayed;
}
export function comparisonHubNumbers(a: CompareActuator): string {
    return `${qualified(a, "peak_torque_nm", value(a.peak_torque_nm, " N·m"))} peak · ${qualified(a, "weight_g", value(a.weight_g, " g"))}`;
}
function engineeringDisplay(a: CompareActuator, topic: EngineeringTopic): string {
    const evidence = engineeringEvidenceFor(a.id);
    if (!evidence) return UNKNOWN;
    const item = evidence.topics[topic];
    const source = "Source: model/topic scope & sources.";
    if (topic === "thermal") {
        const condition =
            a.id === "xiaomi-cybergear"
                ? "Vendor overload table: 24 rpm / 25 °C / 120 °C winding endpoint; mirror provenance limited."
                : a.id === "myactuator-rmd-x8-pro-v2"
                  ? "Current 10 N·m rating: 24 °C ambient / 60 °C rise; not confirmed for legacy 13 N·m."
                  : "Motor/MOS temperature telemetry only; not a thermal-duty measurement.";
        return `${condition} Repeated duty/recovery unknown. ${source}`;
    }
    if (topic === "efficiency")
        return `${UNKNOWN}. ${item.status === "manufacturer" ? "A manufacturer curve is available; boundary and revision unconfirmed." : "No complete bus-to-output map established."} ${source}`;
    if (topic === "precision")
        return `${UNKNOWN}. Resolution/backlash are not loaded accuracy. ${source}`;
    return `${UNKNOWN}. ${item.status === "research" ? "Exploratory identification only; no portable validation." : "CAD available; not calibrated dynamics."} ${source}`;
}
export const COMPARE_SPECS: {
    label: string;
    display: (a: CompareActuator) => string;
}[] = [
    { label: "Peak torque (catalog)", display: (a) => value(a.peak_torque_nm, " N·m") },
    {
        label: "Rated torque (catalog)",
        display: (a) =>
            qualified(a, "rated_torque_nm", value(a.rated_torque_nm, " N·m")),
    },
    {
        label: "Maximum speed (catalog)",
        display: (a) => qualified(a, "max_speed_rpm", value(a.max_speed_rpm, " rpm")),
    },
    {
        label: "Mass",
        display: (a) => qualified(a, "weight_g", value(a.weight_g, " g")),
    },
    { label: "Gear ratio", display: (a) => value(a.gear_ratio) },
    {
        label: "Voltage",
        display: (a) => qualified(a, "voltage_v", value(a.voltage_v, " V")),
    },
    {
        label: "Price (catalog, not a live quote)",
        display: (a) => value(a.price_usd, " USD"),
    },
    {
        label: "Encoder (resolution is not accuracy)",
        display: (a) => qualified(a, "encoder", value(a.encoder)),
    },
    ...(
        [
            ["Complete actuator efficiency", "efficiency"],
            ["Cooling / thermal duty", "thermal"],
            ["Loaded repeatability", "precision"],
            ["Calibrated simulation model", "modeling"],
        ] as const
    ).map(([label, topic]) => ({
        label,
        display: (a: CompareActuator) => engineeringDisplay(a, topic),
    })),
];
