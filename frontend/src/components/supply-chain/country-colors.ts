import type { ShareKey } from "../../../../src/supply-chain/concentration";

// Country colour for share visuals (bars, waffles). Bright on black, never
// the status red or green; the unattributed rest stays grey.
export const COUNTRY_COLOR: Partial<Record<ShareKey, string>> = {
    CN: "#ff922b",
    US: "#4dabf7",
    JP: "#f783ac",
    KR: "#9775fa",
    AU: "#ffd43b",
    MM: "#a9e34b",
    TH: "#38d9a9",
};
export const COUNTRY_FALLBACK = "#8b95a1";
export const OTHER_COLOR = "#383838";
