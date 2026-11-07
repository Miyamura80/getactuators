import { priceAt } from "../metals/prices";
import type { Sourced } from "../sourced";

// Raw-material prices for /bom. Magnet metals come from the /metals series
// through priceAt(); everything else (copper, aluminium, steels, silicon) is
// one cited reading per commodity here, since /metals covers only magnet
// metals. Yuan prices convert at roughly 7.1 to 7.3 CNY per USD, the same
// band the /china company records use. Densities turn modeled part volumes
// into grams.

const CNY_PER_USD = 7.2;
const CNY_BAND: [number, number] = [7.3, 7.1];

const round = (n: number, d = 3) => Math.round(n * 10 ** d) / 10 ** d;

// US$/kg from a yuan-per-tonne quote, with the FX band as the range.
function fromCnyPerTonne(
    cny: number,
    sources: string[],
    asOf: string,
    note: string,
): Sourced<number> {
    const usd = (rate: number) => round(cny / rate / 1000);
    return {
        value: usd(CNY_PER_USD),
        unit: "USD/kg",
        range: [usd(CNY_BAND[0]), usd(CNY_BAND[1])],
        sources,
        asOf,
        confidence: "estimated",
        note: `${note} CNY ${cny.toLocaleString("en-US")}/t at ${CNY_BAND[1]} to ${CNY_BAND[0]} CNY per USD.`,
    };
}

function usdPerTonne(
    usd: number,
    sources: string[],
    asOf: string,
    note: string,
): Sourced<number> {
    return {
        value: round(usd / 1000),
        unit: "USD/kg",
        sources,
        asOf,
        confidence: "reported",
        note: `${note} US$${usd.toLocaleString("en-US")}/t.`,
    };
}

function density(
    value: number,
    sources: string[],
    note: string,
    range?: [number, number],
): Sourced<number> {
    return {
        value,
        unit: "g/cm3",
        sources,
        asOf: "2026",
        confidence: range ? "estimated" : "reported",
        note,
        ...(range ? { range } : {}),
    };
}

const DENSITY_TABLE = ["civils-metal-density"];
const STEEL_DENSITY = density(
    7.85,
    DENSITY_TABLE,
    "Mild carbon steel, the usual engineering default for steels.",
);

export interface Commodity {
    id: string;
    label: string;
    // US$ per kg.
    price: Sourced<number>;
    density: Sourced<number>;
}

export const COMMODITIES: Commodity[] = [
    {
        id: "copper",
        label: "Copper",
        price: usdPerTonne(
            14326,
            ["cbonds-wb-copper"],
            "2026-08",
            "World Bank Pink Sheet copper, 31 August 2026,",
        ),
        density: density(8.96, DENSITY_TABLE, "Pure copper."),
    },
    {
        id: "aluminium",
        label: "Aluminium",
        price: usdPerTonne(
            3251,
            ["cbonds-wb-aluminum"],
            "2026-08",
            "World Bank Pink Sheet aluminium, 31 August 2026,",
        ),
        density: density(2.7, DENSITY_TABLE, "6061 aluminium alloy."),
    },
    {
        id: "carbon-steel",
        label: "Steel",
        price: fromCnyPerTonne(
            3700,
            ["smm-shagang-hrc-2026-06"],
            "2026-06",
            "Shagang Q235B hot-rolled coil list price from 1 June 2026, tax included,",
        ),
        density: STEEL_DENSITY,
    },
    {
        id: "bearing-steel",
        label: "Bearing steel",
        price: fromCnyPerTonne(
            4867,
            ["cbcc-gcr15-2025"],
            "2025",
            "CBCC GCr15 bearing round steel absolute price index, late 2025,",
        ),
        density: STEEL_DENSITY,
    },
    {
        id: "electrical-steel",
        label: "Electrical steel",
        price: fromCnyPerTonne(
            4400,
            ["smm-silicon-steel-2026-06"],
            "2026-06",
            "Shanghai B50A800 non-oriented silicon steel, mid-June 2026; thinner motor grades cost more,",
        ),
        density: STEEL_DENSITY,
    },
    {
        id: "silicon",
        label: "Silicon",
        price: {
            value: round((142 / 100) * 2.20462),
            unit: "USD/kg",
            sources: ["usgs-mis-silicon-2025-12"],
            asOf: "2025-12",
            confidence: "reported",
            note: "US silicon metal spot, December 2025, 142 cents per pound (2.2046 lb/kg). The price of wafer-grade silicon is far higher; die mass is tiny either way.",
        },
        density: density(2.33, DENSITY_TABLE, "Crystalline silicon.", [2.32, 2.34]),
    },
];

// Sintered NdFeB, to weigh magnet parts.
export const NDFEB_DENSITY = density(
    7.5,
    ["alliance-magnet-properties"],
    "Sintered NdFeB: 7.5 to 7.8 g/cm3 in the published range; the low end is used.",
    [7.5, 7.8],
);

// The rare-earth price series a magnet is costed with: China-domestic metal,
// so magnet raw content is priced at the same month as copper and steel.
export const MAGNET_SERIES = { ndpr: "ndpr-alloy-cn", dy: "dy-metal-cn" } as const;

const METAL_LABEL: Record<string, string> = {
    "ndpr-alloy-cn": "NdPr metal",
    "dy-metal-cn": "Dy metal",
    "tb-metal-cn": "Tb metal",
};

export function getCommodity(id: string): Commodity | undefined {
    return COMMODITIES.find((c) => c.id === id);
}

export function materialLabel(seriesId: string): string {
    return METAL_LABEL[seriesId] ?? getCommodity(seriesId)?.label ?? seriesId;
}

export interface MaterialPrice {
    seriesId: string;
    price: Sourced<number>;
    // True when a /metals reading from an earlier month is carried forward.
    carried: boolean;
}

// US$/kg of a material in a month: a /metals series through priceAt(), else
// the commodity's single cited reading. Null for an unknown series.
export function materialPrice(seriesId: string, month: string): MaterialPrice | null {
    const metal = priceAt(seriesId, month);
    if (metal) return { seriesId, price: metal.value, carried: metal.carried };
    const c = getCommodity(seriesId);
    return c ? { seriesId, price: c.price, carried: false } : null;
}

export function isMaterialSeries(seriesId: string): boolean {
    return seriesId in METAL_LABEL || getCommodity(seriesId) !== undefined;
}
