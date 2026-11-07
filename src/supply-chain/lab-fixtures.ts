import { type Shares, concentration } from "./concentration";
import {
    NDFEB_MAGNETS_2024,
    REE_MINING_2025,
    REE_SEPARATION_2024,
} from "./metals/stage-shares";
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

// The stage shares come from the /metals dataset, which owns them.
const MINING = REE_MINING_2025;

export const LAB_STAGE_SHARES: StageShareRow[] = [
    { id: "mining", label: "Mining", shares: MINING },
    { id: "separation", label: "Separation", shares: REE_SEPARATION_2024 },
    { id: "magnet", label: "Magnets", shares: NDFEB_MAGNETS_2024 },
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
