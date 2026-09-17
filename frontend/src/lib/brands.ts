// Provider (brand) identity for chart colors, Artificial-Analysis style.
// Colors live only on data marks; the UI chrome stays SealGate cyan/grey.

const CANON: [string, string][] = [
    ["cubemars", "CubeMars"],
    ["t-motor", "CubeMars"],
    ["unitree", "Unitree"],
    ["robotis", "Robotis"],
    ["dynamixel", "Robotis"],
    ["myactuator", "MyActuator"],
    ["robstride", "RobStride"],
    ["steadywin", "Steadywin"],
    ["waveshare", "Waveshare"],
    ["feetech", "Feetech"],
    ["harmonic drive", "Harmonic Drive"],
    ["mjbots", "mjbots"],
    ["odrive", "ODrive"],
    ["leaderdrive", "Leaderdrive"],
    ["damiao", "DAMIAO"],
    ["nidec", "Nidec"],
    ["xiaomi", "Xiaomi"],
    ["hiwonder", "Hiwonder"],
    ["innfos", "INNFOS"],
    ["ipower", "iPower"],
    ["nabtesco", "Nabtesco"],
    ["spinea", "Spinea"],
    ["maxon", "maxon"],
    ["tq-systems", "TQ-Systems"],
    ["allied", "Allied Motion"],
    ["trampa", "VESC / Trampa"],
    ["vesc", "VESC / Trampa"],
    ["trinamic", "Trinamic"],
    ["lkm", "LKMTech"],
    ["atar", "ATAR"],
];

export function canonicalBrand(brand: string): string {
    const b = brand.toLowerCase();
    for (const [needle, name] of CANON) if (b.includes(needle)) return name;
    return brand.replace(/\s*\(.*\)\s*/g, "").trim();
}

export const OTHER_COLOR = "#8b95a1";

// Distinct, bright-on-black colors for the brands that appear more than once.
export const BRAND_COLORS: Record<string, string> = {
    Robotis: "#4dabf7",
    CubeMars: "#ff922b",
    MyActuator: "#9775fa",
    RobStride: "#51cf66",
    Steadywin: "#ffd43b",
    Feetech: "#ff6b6b",
    "Harmonic Drive": "#22d3ee",
    mjbots: "#f783ac",
    ODrive: "#a9e34b",
    Leaderdrive: "#38d9a9",
    Unitree: "#e599f7",
    Waveshare: "#74c0fc",
    DAMIAO: "#ffa94d",
    Nidec: "#ff8787",
};

export function colorForBrand(brand: string): string {
    return BRAND_COLORS[canonicalBrand(brand)] ?? OTHER_COLOR;
}

export interface LegendEntry {
    name: string;
    color: string;
}

// Legend for a set of actuators: the colored brands that appear, in a stable
// order, plus an "Other" swatch when any long-tail brand is present.
export function legendFor(brands: string[]): LegendEntry[] {
    const present = new Set(brands.map(canonicalBrand));
    const entries: LegendEntry[] = [];
    for (const name of Object.keys(BRAND_COLORS)) {
        if (present.has(name)) entries.push({ name, color: BRAND_COLORS[name] });
    }
    if ([...present].some((b) => !(b in BRAND_COLORS))) {
        entries.push({ name: "Other", color: OTHER_COLOR });
    }
    return entries;
}
