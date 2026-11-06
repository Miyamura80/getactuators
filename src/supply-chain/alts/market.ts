import type { SourceId, Sourced } from "../sourced";
import type { MarketSlice } from "./types";

// Market size and growth per technology, from the public summaries of paid
// market reports. Publishers disagree, often by several times, because each
// scopes its market differently; each tile names one publisher's figure and
// its note gives the spread we saw. Technologies with no published market
// (HASEL, dielectric elastomers, coiled polymer, iron nitride, wound-field
// and ferrite motors, magnetic gears, cable drives) have no tile.

function size(
    value: number,
    source: SourceId,
    asOf: string,
    note: string,
): Sourced<number> {
    return {
        value,
        unit: "USD",
        sources: [source],
        asOf,
        confidence: "estimated",
        note,
    };
}

function growth(
    value: number,
    source: SourceId,
    asOf: string,
    window: string,
): Sourced<number> {
    return {
        value,
        unit: "fraction",
        sources: [source],
        asOf,
        confidence: "estimated",
        note: `Forecast compound annual growth, ${window}.`,
    };
}

export const MARKET_SLICES: MarketSlice[] = [
    {
        id: "induction-motors",
        label: "Induction motors",
        techIds: ["induction"],
        revenueUsd: size(
            23.4e9,
            "imarc-induction-motor-2025",
            "2024",
            "Per IMARC; other publishers put 2024 between about $16B and $26B.",
        ),
        cagr: growth(0.0687, "imarc-induction-motor-2025", "2024", "2025 to 2033"),
        endMarket: "industrial",
    },
    {
        id: "switched-reluctance-motors",
        label: "Switched reluctance motors",
        techIds: ["switched-reluctance"],
        revenueUsd: size(
            653.5e6,
            "marketglass-srm-2025",
            "2024",
            "Per Market Glass; other publishers put 2024 between about $0.3B and $0.6B.",
        ),
        cagr: growth(0.038, "marketglass-srm-2025", "2024", "2024 to 2030"),
        endMarket: "other",
    },
    {
        id: "synrm-motors",
        label: "Synchronous reluctance motors",
        techIds: ["synchronous-reluctance"],
        revenueUsd: size(
            1.26e9,
            "reportprime-synrm-2025",
            "2025",
            "Per Report Prime; an industrial-only estimate is about $1.1B for 2025.",
        ),
        cagr: growth(0.0803, "reportprime-synrm-2025", "2025", "2025 to 2032"),
        endMarket: "industrial",
    },
    {
        id: "axial-flux-motors",
        label: "Axial-flux motors (all magnet types)",
        techIds: ["axial-flux"],
        revenueUsd: size(
            240.5e6,
            "techsci-axial-flux-2025",
            "2024",
            "Per TechSci; mostly NdFeB designs, so it overstates the ferrite share. Other 2024 figures run from about $0.24B to $1.2B.",
        ),
        cagr: growth(0.291, "techsci-axial-flux-2025", "2024", "to 2030"),
        endMarket: "automotive",
    },
    {
        id: "artificial-muscles",
        label: "Artificial muscles (all types)",
        techIds: [
            "mckibben",
            "shape-memory-alloy",
            "hasel",
            "dielectric-elastomer",
            "twisted-coiled-polymer",
            "hydraulic-muscle",
        ],
        revenueUsd: size(
            1.98e9,
            "techsci-artificial-muscle-2025",
            "2024",
            "Per TechSci; other 2024 figures run from about $0.7B to $2.5B. Not split by muscle type.",
        ),
        cagr: growth(0.0962, "techsci-artificial-muscle-2025", "2024", "to 2030"),
        endMarket: "medical-exo",
    },
    {
        id: "hydraulic-actuators",
        label: "Hydraulic actuators",
        techIds: ["servo-hydraulic"],
        revenueUsd: size(
            3.144e9,
            "ksi-hydraulic-actuator-2024",
            "2024",
            "Per Knowledge Sourcing Intelligence; other 2024 figures run from about $1B to $16.5B.",
        ),
        cagr: growth(0.0388, "ksi-hydraulic-actuator-2024", "2024", "2024 to 2029"),
        endMarket: "industrial",
    },
    {
        id: "eha",
        label: "Electro-hydrostatic actuators",
        techIds: ["electrohydrostatic"],
        revenueUsd: size(
            1.2e9,
            "datahorizzon-eha-2025",
            "2024",
            "Per DataHorizzon, the only EHA-specific estimate we found.",
        ),
        cagr: growth(0.089, "datahorizzon-eha-2025", "2024", "2025 to 2033"),
        endMarket: "other",
    },
    {
        id: "cycloidal-reducers",
        label: "Cycloidal reducers",
        techIds: ["cycloidal"],
        revenueUsd: size(
            1.461e9,
            "intel-cycloidal-2025",
            "2024",
            "Per Intel Market Research; other 2024 figures run from about $0.2B to $1.9B.",
        ),
        cagr: growth(0.047, "intel-cycloidal-2025", "2024", "to 2032"),
        endMarket: "industrial",
    },
    {
        id: "roller-screws",
        label: "Planetary roller screws",
        techIds: ["roller-screw"],
        revenueUsd: size(
            610e6,
            "tmr-roller-screw-2025",
            "2024",
            "Per Transparency Market Research; other 2024 figures run from about $0.4B to $0.9B.",
        ),
        cagr: growth(0.056, "tmr-roller-screw-2025", "2024", "2025 to 2035"),
        endMarket: "industrial",
    },
];
