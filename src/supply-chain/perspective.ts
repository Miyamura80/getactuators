import { COMPANIES } from "./companies";
import { concentration, hhi } from "./concentration";
import { LAB_MINING_HHI, LAB_STAGE_SHARES } from "./lab-fixtures";
import { SEGMENT_MARKETS } from "./market-share";
import { SITES } from "./sites";
import type { Sourced } from "./sourced";

// Reference points that put the headline numbers in perspective: familiar
// magnitudes of the same unit, unit translations and concentration yardsticks.
// Every reference is cited; derived figures are "modeled" with their method.

export interface PerspectivePoint {
    id: string;
    label: string;
    value: Sourced<number>;
    // A headline number from the page, as opposed to a reference point.
    headline?: boolean;
}

function companyRevenue(id: string): Sourced<number> {
    const r = COMPANIES.find((c) => c.id === id)?.revenue;
    if (!r) throw new Error(`no revenue for ${id}`);
    return r;
}

// A. Revenue ladder, USD, on a log scale.
export const REVENUE_LADDER: PerspectivePoint[] = [
    {
        id: "mp",
        label: "MP Materials",
        value: companyRevenue("mp-materials"),
        headline: true,
    },
    {
        id: "hds",
        label: "Harmonic Drive Systems",
        value: companyRevenue("harmonic-drive-systems"),
    },
    {
        id: "northern",
        label: "Northern Rare Earth",
        value: companyRevenue("china-northern-rare-earth"),
        headline: true,
    },
    {
        id: "ndfeb-market",
        label: "World NdFeB magnet sales",
        value: {
            value: 14.065e9,
            unit: "USD",
            sources: ["qyresearch-ndfeb-2025"],
            asOf: "2024",
            confidence: "estimated",
            note: "Market research estimate of global NdFeB magnet sales.",
        },
    },
    {
        id: "tesla",
        label: "Tesla",
        value: {
            value: 94.83e9,
            unit: "USD",
            sources: ["tesla-10k-2025"],
            asOf: "2025",
            confidence: "reported",
        },
    },
];

// B. What the magnet tonnage buys.
const BAOTOU = SITES.find((s) => s.id === "jlmag-baotou-expansion")?.capacity;
if (!BAOTOU) throw new Error("jlmag-baotou-expansion capacity missing");
export const MAGNET_CAPACITY: Sourced<number> = BAOTOU;

export const NDFEB_PER_HUMANOID: Sourced<number> = {
    value: 3.25,
    unit: "kg",
    range: [2, 4.5],
    sources: ["fai-robot-magnets"],
    asOf: "2026",
    confidence: "estimated",
    note: "Published estimates converge on 2 to 4.5 kg of NdFeB per humanoid; makers do not disclose it.",
};

export const NDFEB_PER_EV: Sourced<number> = {
    value: 1.5,
    unit: "kg",
    sources: ["thundersaid-ev-magnets"],
    asOf: "2024",
    confidence: "estimated",
    note: "Average across 20 OEM vehicles; individual models range from 0 to 4 kg.",
};

export const HUMANOIDS_SHIPPED_2025: Sourced<number> = {
    value: 13000,
    unit: "units",
    sources: ["technode-omdia-humanoid-2025"],
    asOf: "2025",
    confidence: "reported",
    note: "Omdia's count of global humanoid shipments, about 13,000.",
};

const KG_PER_T = 1000;
const tonnes = MAGNET_CAPACITY.value;
const [kgLow, kgHigh] = NDFEB_PER_HUMANOID.range ?? [
    NDFEB_PER_HUMANOID.value,
    NDFEB_PER_HUMANOID.value,
];

export const HUMANOIDS_PER_YEAR: Sourced<number> = {
    value: (tonnes * KG_PER_T) / NDFEB_PER_HUMANOID.value,
    unit: "units",
    range: [(tonnes * KG_PER_T) / kgHigh, (tonnes * KG_PER_T) / kgLow],
    sources: [...MAGNET_CAPACITY.sources, ...NDFEB_PER_HUMANOID.sources],
    asOf: MAGNET_CAPACITY.asOf,
    confidence: "modeled",
    note: "20,000 t a year divided by 2 to 4.5 kg of NdFeB per humanoid.",
};

export const EVS_PER_YEAR: Sourced<number> = {
    value: (tonnes * KG_PER_T) / NDFEB_PER_EV.value,
    unit: "units",
    sources: [...MAGNET_CAPACITY.sources, ...NDFEB_PER_EV.sources],
    asOf: MAGNET_CAPACITY.asOf,
    confidence: "modeled",
    note: "20,000 t a year divided by 1.5 kg of NdFeB per electric vehicle.",
};

// D. Concentration yardsticks on the 0 to 10,000 HHI scale.
export const HIGHLY_CONCENTRATED_HHI: Sourced<number> = {
    value: 1800,
    unit: "HHI",
    sources: ["doj-ftc-merger-guidelines-2023"],
    asOf: "2023-12",
    confidence: "reported",
    note: "Above 1,800 the 2023 US Merger Guidelines call a market highly concentrated.",
};

function stageHhi(id: string, note: string): Sourced<number> {
    const row = LAB_STAGE_SHARES.find((r) => r.id === id);
    if (!row) throw new Error(`no stage ${id}`);
    return {
        value: concentration(row.shares.value)?.hhi ?? 0,
        unit: "HHI",
        sources: row.shares.sources,
        asOf: row.shares.asOf,
        confidence: "modeled",
        note,
    };
}

const humanoidShares = Object.values(
    SEGMENT_MARKETS.find((m) => m.segment === "robot-actuator-oem")?.shares ?? {},
);

interface HhiPoint {
    id: string;
    label: string;
    // What the equal-sized players are.
    of: "countries" | "companies";
    hhi: Sourced<number>;
    headline?: boolean;
}

const HHI_POINTS: HhiPoint[] = [
    {
        id: "magnets",
        label: "NdFeB magnets",
        of: "countries",
        hhi: stageHhi(
            "magnet",
            "Country shares of sintered magnet output; named countries only.",
        ),
        headline: true,
    },
    {
        id: "separation",
        label: "Rare earth separation",
        of: "countries",
        hhi: stageHhi(
            "separation",
            "Country shares of refined output; named countries only.",
        ),
        headline: true,
    },
    {
        id: "search",
        label: "Web search",
        of: "companies",
        hhi: {
            value: hhi([0.91, 0.046]),
            unit: "HHI",
            sources: ["statcounter-search-2025-12"],
            asOf: "2025-12",
            confidence: "modeled",
            note: "Google about 91% and Bing about 4.6% of worldwide search; other engines excluded.",
        },
    },
    {
        id: "mining",
        label: "Rare earth mining",
        of: "countries",
        hhi: LAB_MINING_HHI,
        headline: true,
    },
    {
        id: "humanoids",
        label: "Humanoid makers",
        of: "companies",
        hhi: {
            value: hhi(humanoidShares.map((s) => s.value)),
            unit: "HHI",
            sources: [...new Set(humanoidShares.flatMap((s) => s.sources))],
            asOf: "2025",
            confidence: "modeled",
            note: "Company shares of 2025 humanoid shipments; unnamed makers excluded.",
        },
    },
    {
        id: "smartphones",
        label: "Smartphone makers",
        of: "companies",
        hhi: {
            value: hhi([0.197, 0.191, 0.131, 0.082, 0.081]),
            unit: "HHI",
            sources: ["idc-smartphones-2025"],
            asOf: "2025",
            confidence: "modeled",
            note: "Top five vendors by 2025 shipments (Apple 19.7%, Samsung 19.1%, Xiaomi 13.1%, vivo 8.2%, OPPO 8.1%); the rest excluded.",
        },
    },
];

// 10,000 / HHI: how many equal-sized players would give the same HHI.
const EQUIVALENT_SOURCES = ["foley-merger-guidelines-2023", "doj-hhi"];

function equivalent(h: Sourced<number>): Sourced<number> {
    return {
        value: 10000 / h.value,
        unit: "equal players",
        sources: h.sources,
        asOf: h.asOf,
        confidence: "modeled",
        note: `10,000 / HHI ${Math.round(h.value).toLocaleString("en-US")}. ${h.note ?? ""}`.trim(),
    };
}

export interface CompetitorEquivalent {
    id: string;
    label: string;
    of: "countries" | "companies";
    value: Sourced<number>;
    headline?: boolean;
}

// D. Markets as the number of equal-sized competitors they behave like.
// Unnamed players are left out of each HHI, so every count is an upper bound.
export const EFFECTIVE_COMPETITORS: CompetitorEquivalent[] = HHI_POINTS.map((p) => ({
    id: p.id,
    label: p.label,
    of: p.of,
    headline: p.headline,
    value: equivalent(p.hhi),
}));

// The reading of 10,000 / HHI as equal-sized competitors, cited once.
export const EQUIVALENT_METHOD_SOURCES = EQUIVALENT_SOURCES;

export const HIGHLY_CONCENTRATED_EQUIVALENT: Sourced<number> = {
    ...equivalent(HIGHLY_CONCENTRATED_HHI),
    sources: [...HIGHLY_CONCENTRATED_HHI.sources, ...EQUIVALENT_SOURCES],
    note: "10,000 / 1,800. Fewer equal-sized players than this and US merger guidelines call a market highly concentrated.",
};
