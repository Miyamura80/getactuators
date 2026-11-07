import type { Segment } from "./companies";
import type { Sourced } from "./sourced";

// Market share by company, one market per segment. Each segment uses the
// most specific market with public numbers; a company with no public share
// is left out (the UI shows a dash) rather than guessed.

export interface SegmentMarket {
    segment: Segment;
    // What the share is a share of, shown as the caption.
    market: string;
    asOf: string;
    // company id -> share as a fraction 0..1
    shares: Record<string, Sourced<number>>;
}

const share = (
    value: number,
    asOf: string,
    confidence: Sourced<number>["confidence"],
    sources: string[],
    note?: string,
    range?: [number, number],
): Sourced<number> => ({
    value,
    unit: "fraction",
    asOf,
    confidence,
    sources,
    ...(note ? { note } : {}),
    ...(range ? { range } : {}),
});

const QUOTA = [
    "fastmarkets-ree-quota-2024-1",
    "asianmetal-ree-quota-2024-2",
    "usgs-mcs-2025-ree",
];
const OMDIA = ["technode-omdia-humanoid-2025"];

export const SEGMENT_MARKETS: SegmentMarket[] = [
    {
        segment: "ree-mining-refining",
        market: "Rare earth mine production, t REO",
        asOf: "2024",
        shares: {
            "china-northern-rare-earth": share(
                0.484,
                "2024",
                "estimated",
                QUOTA,
                "2024 mining quota of 188,650 t REO over USGS world mine production of 390,000 t; the quota stands in for output.",
            ),
            "china-rare-earth-group": share(
                0.209,
                "2024",
                "estimated",
                QUOTA,
                "2024 mining quota of 81,350 t REO over USGS world mine production of 390,000 t; the quota stands in for output.",
            ),
            "mp-materials": share(
                0.117,
                "2024",
                "modeled",
                ["mp-results-fy2024", "usgs-mcs-2025-ree"],
                "45,455 t REO in concentrate over USGS world mine production of 390,000 t.",
            ),
        },
    },
    {
        segment: "magnets-motors",
        market: "NdFeB magnet output, t",
        asOf: "2024",
        shares: {
            "jl-mag": share(
                0.098,
                "2024",
                "modeled",
                ["smm-jlmag-2024-briefing", "qyresearch-ndfeb-2025"],
                "29,300 t of magnet blanks over a 299,501 t global NdFeB estimate.",
            ),
        },
    },
    {
        segment: "gears-screws-bearings",
        market: "Strain-wave (harmonic) reducers, global",
        asOf: "2026",
        shares: {
            leaderdrive: share(
                0.15,
                "2026",
                "estimated",
                ["gasgoo-leaderdrive-ipo-2026"],
                "Approximate global share as reported; second worldwide, first in China.",
            ),
        },
    },
    {
        segment: "robot-actuator-oem",
        market: "Humanoid robot shipments, units (about 13,000)",
        asOf: "2025",
        shares: {
            agibot: share(0.39, "2025", "reported", OMDIA),
            unitree: share(0.32, "2025", "reported", OMDIA),
            ubtech: share(
                0.077,
                "2025",
                "modeled",
                OMDIA,
                "1,000 units over about 13,000 shipped worldwide.",
            ),
            tesla: share(
                0.025,
                "2025",
                "estimated",
                ["chinadaily-humanoid-2025", ...OMDIA],
                "Named among makers shipping 150 to 500 units, over about 13,000.",
                [0.012, 0.038],
            ),
        },
    },
];

export function marketOf(segment: Segment): SegmentMarket | undefined {
    return SEGMENT_MARKETS.find((m) => m.segment === segment);
}
