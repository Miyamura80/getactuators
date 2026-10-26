import { type Shares, concentration } from "./concentration";
import type { Sourced } from "./sourced";

// Fixtures for /lab/supply-chain, the hidden page that renders every shared
// kit component. The stage shares are real and cited; the /metals dataset
// will own the full series.

export const LAB_PATH = "/lab/supply-chain";

export interface StageShareRow {
    id: string;
    label: string;
    shares: Sourced<Shares>;
}

// USGS 2025 figures are themselves estimates ("e" in the table), so the row
// is marked estimated even though USGS is the publisher.
const MINING: Sourced<Shares> = {
    value: { CN: 270000, US: 51000, AU: 29000, MM: 22000, TH: 4800, other: 13200 },
    unit: "t",
    sources: ["usgs-mcs-2026-ree"],
    asOf: "2025",
    confidence: "estimated",
    note: "Mine production, t REO. Other is the world total (390,000 t) less named countries.",
};

export const LAB_STAGE_SHARES: StageShareRow[] = [
    { id: "mining", label: "Mining", shares: MINING },
    {
        id: "separation",
        label: "Separation",
        shares: {
            value: { CN: 0.91, other: 0.09 },
            unit: "fraction",
            sources: ["iea-rare-earths-2025"],
            asOf: "2024",
            confidence: "estimated",
            note: "Share of refined rare earth output.",
        },
    },
    {
        id: "magnet",
        label: "Magnets",
        shares: {
            value: { CN: 0.94, other: 0.06 },
            unit: "fraction",
            sources: ["iea-rare-earths-2025"],
            asOf: "2024",
            confidence: "estimated",
            note: "Share of sintered permanent magnet output.",
        },
    },
];

// One cited value per confidence style, for the legend and SourcedValue demo.
export const LAB_MINING_HHI: Sourced<number> = {
    value: concentration(MINING.value)?.hhi ?? 0,
    unit: "HHI",
    sources: ["usgs-mcs-2026-ree"],
    asOf: "2025",
    confidence: "modeled",
    note: "Herfindahl-Hirschman index of named-country shares of mine production.",
};
