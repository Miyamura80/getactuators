import { LAB_STAGE_SHARES } from "./lab-fixtures";
import { SITES } from "./sites";
import type { Sourced } from "./sourced";

// Reference points that put the headline numbers in perspective: unit
// translations and concentration yardsticks.
// Every reference is cited; derived figures are "modeled" with their method.

// What the magnet tonnage buys.
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

// How dominant the leader is, next to markets people know. Each market
// keeps its own share map (countries or companies) so the visuals name real
// players; stage maps reuse the cited lab fixtures.

export interface DominanceMarket {
    id: string;
    label: string;
    // What the share keys are: ISO country codes or company names.
    kind: "country" | "company";
    // A rare-earth stage (as opposed to a familiar reference market).
    rareEarth?: boolean;
    // Raw amounts or fractions; "other" is unattributed volume.
    shares: Sourced<Record<string, number>>;
}

function stage(id: string, label: string): DominanceMarket {
    const row = LAB_STAGE_SHARES.find((r) => r.id === id);
    if (!row) throw new Error(`no stage ${id}`);
    return {
        id,
        label,
        kind: "country",
        rareEarth: true,
        shares: row.shares as Sourced<Record<string, number>>,
    };
}

export const DOMINANCE_MARKETS: DominanceMarket[] = [
    stage("magnet", "NdFeB magnets"),
    stage("separation", "Rare earth separation"),
    stage("mining", "Rare earth mining"),
    {
        id: "search",
        label: "Web search",
        kind: "company",
        shares: {
            value: { Google: 0.91, Bing: 0.046 },
            unit: "fraction",
            sources: ["statcounter-search-2025-12"],
            asOf: "2025-12",
            confidence: "reported",
            note: "Worldwide share of search referrals; smaller engines not listed.",
        },
    },
    {
        id: "humanoids",
        label: "Humanoid robots",
        kind: "company",
        shares: {
            value: { AgiBot: 0.39, Unitree: 0.32 },
            unit: "fraction",
            sources: ["technode-omdia-humanoid-2025"],
            asOf: "2025",
            confidence: "reported",
            note: "Share of about 13,000 humanoids shipped worldwide; smaller makers not listed.",
        },
    },
    {
        id: "smartphones",
        label: "Smartphones",
        kind: "company",
        shares: {
            value: {
                Apple: 0.197,
                Samsung: 0.191,
                Xiaomi: 0.131,
                vivo: 0.082,
                OPPO: 0.081,
            },
            unit: "fraction",
            sources: ["idc-smartphones-2025"],
            asOf: "2025",
            confidence: "reported",
            note: "Share of 1.26 billion smartphones shipped worldwide; vendors below fifth not listed.",
        },
    },
];
