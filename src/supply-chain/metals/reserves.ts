import type { Sourced } from "../sourced";

// How much is left: USGS mine production and reserves by country, for every
// country USGS lists. Reserves are what can be mined profitably today with
// known deposits, not all that exists (resources). Years of supply is
// reserves over 2025 output, "at the current rate".

export const RESERVE_COMMODITIES = ["ree", "co"] as const;
export type ReserveCommodity = (typeof RESERVE_COMMODITIES)[number];

export interface ReserveRow {
    // ISO 3166 alpha-2, or "other" for the remainder USGS reports.
    country: string;
    production2024?: Sourced<number>;
    production2025: Sourced<number>;
    reserves?: Sourced<number>;
}

export interface ReserveTable {
    commodity: ReserveCommodity;
    label: string;
    // "t REO" or "t Co content"
    basis: string;
    rows: ReserveRow[];
    world: { production2025: Sourced<number>; reserves: Sourced<number> };
}

function usgs(source: string) {
    return (
        value: number,
        asOf: string,
        confidence: Sourced<number>["confidence"] = "estimated",
        note?: string,
    ): Sourced<number> => ({
        value,
        unit: "t",
        sources: [source],
        asOf,
        confidence,
        ...(note ? { note } : {}),
    });
}

const ree = usgs("usgs-mcs-2026-ree");
const PROD = "USGS estimate.";
const VIA_CHINA = "USGS estimate from China's reported imports.";

// [country, 2024, 2025, reserves]; undefined = not available (NA).
type Raw = [string, number, number, number | undefined, string?];

const REE_RAW: Raw[] = [
    ["CN", 270000, 270000, 44000000],
    ["US", 45500, 51000, 1900000],
    ["AU", 29000, 29000, 6300000],
    ["MM", 27000, 22000, undefined, VIA_CHINA],
    ["TH", 2100, 4800, undefined, VIA_CHINA],
    ["IN", 2900, 2900, undefined],
    ["MG", 1400, 2700, undefined, VIA_CHINA],
    ["RU", 2600, 2600, 3800000],
    ["BR", 560, 2000, 11000000],
    ["NG", 1500, 1500, undefined],
    ["VN", 300, 150, 3500000, VIA_CHINA],
    ["MY", 140, 110, 710000, VIA_CHINA],
    ["CA", 0, 0, 830000],
    ["GL", 0, 0, 1500000],
    ["ZA", 0, 0, 860000],
    ["TZ", 0, 0, 890000],
    ["other", 1000, 550, undefined],
];

// Largest 2025 producer first, "other" last. USGS prints a zero as a dash.
function rows(raw: Raw[], f: ReturnType<typeof usgs>, reported?: string): ReserveRow[] {
    const prod = (v: number, year: string, country: string, note?: string) =>
        v === 0
            ? f(0, year, "reported", "USGS reports no production.")
            : f(
                  v,
                  year,
                  country === reported && year === "2024" ? "reported" : "estimated",
                  note ?? PROD,
              );
    return [...raw]
        .sort((a, b) => (a[0] === "other" ? 1 : b[0] === "other" ? -1 : b[2] - a[2]))
        .map(([country, p24, p25, reserves, note]) => ({
            country,
            production2024: prod(p24, "2024", country, note),
            production2025: prod(p25, "2025", country, note),
            ...(reserves === undefined
                ? {}
                : { reserves: f(reserves, "2025", "reported", "USGS reserves.") }),
        }));
}

const co = usgs("usgs-mcs-2026-cobalt");

const CO_RAW: Raw[] = [
    ["CD", 226000, 230000, 6000000],
    ["ID", 35000, 44000, 760000],
    ["RU", 8000, 7700, 800000],
    ["AU", 4780, 3700, 1700000],
    ["MG", 3100, 3900, 100000],
    ["PH", 3100, 3700, 260000],
    ["CA", 3350, 3500, 220000],
    ["PG", 2630, 2800, 84000],
    ["CN", 2000, 2000, 160000],
    ["CU", 3450, 2000, 500000],
    ["TR", 2200, 1900, 91000],
    ["US", 200, 300, 70000],
    ["other", 7780, 9100, 780000],
];

export const RESERVES: ReserveTable[] = [
    {
        commodity: "ree",
        label: "Rare earths",
        basis: "t REO",
        rows: rows(REE_RAW, ree, "US"),
        world: {
            production2025: ree(390000, "2025", "estimated", "World total, rounded."),
            reserves: ree(
                75000000,
                "2025",
                "reported",
                "World total: more than 75,000,000 t.",
            ),
        },
    },
    {
        commodity: "co",
        label: "Cobalt",
        basis: "t Co content",
        rows: rows(CO_RAW, co),
        world: {
            production2025: co(310000, "2025", "estimated", "World total, rounded."),
            reserves: co(12000000, "2025", "reported", "World total, rounded."),
        },
    },
];

export function reserveTable(c: ReserveCommodity): ReserveTable {
    const t = RESERVES.find((r) => r.commodity === c);
    if (!t) throw new Error(`no reserves for ${c}`);
    return t;
}

// Reserves over 2025 mine output; null without both numbers.
export function yearsOfSupply(row: ReserveRow): Sourced<number> | null {
    const r = row.reserves;
    const p = row.production2025;
    if (!r || p.value <= 0) return null;
    return {
        value: Math.round(r.value / p.value),
        unit: "years",
        sources: [...new Set([...r.sources, ...p.sources])],
        asOf: p.asOf,
        confidence: "modeled",
        note: "Reserves divided by 2025 mine production, at the current rate.",
    };
}
