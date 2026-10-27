import type { Shares } from "../concentration";
import type { Sourced } from "../sourced";
import type { Stage } from "../stages";
import type { MetalId } from "./elements";

// Who controls each step from ore to magnet, per element: country shares of
// output as Sourced share maps. Mining and separation are reported for all
// rare earths together, not per element, so the light rare earths (Nd, Pr)
// reuse the all-rare-earth figures and say so. Where no public source splits
// a stage by country the entry is a gap with what is known in words.

export const METAL_STAGES = [
    "mining",
    "separation",
    "metal-alloy",
    "magnet",
] as const satisfies readonly Stage[];
export type MetalStage = (typeof METAL_STAGES)[number];

export type StageEntry =
    | { kind: "shares"; shares: Sourced<Shares> }
    | { kind: "gap"; text: string; sources: string[] };

// Rare earth mine production 2025, t REO. Other is the world total
// (390,000 t) less the named countries.
export const REE_MINING_2025: Sourced<Shares> = {
    value: { CN: 270000, US: 51000, AU: 29000, MM: 22000, TH: 4800, other: 13200 },
    unit: "t",
    sources: ["usgs-mcs-2026-ree"],
    asOf: "2025",
    confidence: "estimated",
    note: "Mine production, t REO, all rare earths together. Other is the world total (390,000 t) less named countries.",
};

export const REE_SEPARATION_2024: Sourced<Shares> = {
    value: { CN: 0.91, other: 0.09 },
    unit: "fraction",
    sources: ["iea-rare-earths-2025"],
    asOf: "2024",
    confidence: "estimated",
    note: "Share of refined rare earth output.",
};

export const NDFEB_MAGNETS_2024: Sourced<Shares> = {
    value: { CN: 0.94, other: 0.06 },
    unit: "fraction",
    sources: ["iea-rare-earths-2025"],
    asOf: "2024",
    confidence: "estimated",
    note: "Share of sintered permanent magnet output.",
};

const METAL_ALLOY_2023: Sourced<Shares> = {
    value: { CN: 0.9, other: 0.1 },
    unit: "fraction",
    sources: ["reuters-goldman-ndpr-2023"],
    asOf: "2023",
    confidence: "estimated",
    note: "Goldman Sachs: China holds over 90% of the downstream metal and magnet segment; 90% is drawn, a floor.",
};

const HREE_SEPARATION: Sourced<Shares> = {
    value: { CN: 0.95, other: 0.05 },
    unit: "fraction",
    sources: ["nus-eai-rare-earths-2025"],
    asOf: "2025",
    confidence: "estimated",
    note: "Heavy rare earth separation, China 95 to 98%; the low end is drawn.",
};

const COBALT_MINING_2025: Sourced<Shares> = {
    value: { CD: 230000, ID: 44000, other: 36000 },
    unit: "t",
    sources: ["usgs-mcs-2026-cobalt"],
    asOf: "2025",
    confidence: "estimated",
    note: "Mine production, t cobalt content. Other is the world total (310,000 t) less Congo (Kinshasa) and Indonesia.",
};

const shares = (s: Sourced<Shares>): StageEntry => ({ kind: "shares", shares: s });
const gap = (text: string, sources: string[]): StageEntry => ({
    kind: "gap",
    text,
    sources,
});

const LIGHT: Record<MetalStage, StageEntry> = {
    mining: shares(REE_MINING_2025),
    separation: shares(REE_SEPARATION_2024),
    "metal-alloy": shares(METAL_ALLOY_2023),
    magnet: shares(NDFEB_MAGNETS_2024),
};

const HEAVY: Record<MetalStage, StageEntry> = {
    mining: gap(
        "China and Myanmar together mine over 98% of heavy rare earths; no source splits the two.",
        ["nus-eai-rare-earths-2025"],
    ),
    separation: shares(HREE_SEPARATION),
    "metal-alloy": shares(METAL_ALLOY_2023),
    magnet: shares(NDFEB_MAGNETS_2024),
};

export const STAGE_SHARES: Record<MetalId, Record<MetalStage, StageEntry>> = {
    nd: LIGHT,
    pr: LIGHT,
    dy: HEAVY,
    tb: HEAVY,
    sm: {
        mining: gap("No public country split for samarium.", ["usgs-mcs-2026-ree"]),
        separation: gap(
            "China licenses samarium exports since April 2025; no public country split.",
            ["usgs-mcs-2026-ree"],
        ),
        "metal-alloy": gap("SmCo alloy is not reported by country.", [
            "usgs-mcs-2026-ree",
        ]),
        magnet: gap("SmCo magnet output is not reported by country.", [
            "arnold-dysprosium-2015",
        ]),
    },
    co: {
        mining: shares(COBALT_MINING_2025),
        separation: gap(
            "China is the leading producer of refined cobalt; USGS gives no share.",
            ["usgs-mcs-2026-cobalt"],
        ),
        "metal-alloy": gap("Cobalt alloys are not reported by country.", [
            "usgs-mcs-2026-cobalt",
        ]),
        magnet: gap("SmCo magnet output is not reported by country.", [
            "arnold-dysprosium-2015",
        ]),
    },
};

export const STAGE_LABEL_FOR: Record<MetalId, Partial<Record<MetalStage, string>>> = {
    nd: {},
    pr: {},
    dy: {},
    tb: {},
    sm: {},
    co: { separation: "Refining" },
};

export function stageEntry(metal: MetalId, stage: MetalStage): StageEntry {
    return STAGE_SHARES[metal][stage];
}
