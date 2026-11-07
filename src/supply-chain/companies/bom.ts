import type { Confidence, SourceId, Sourced } from "../sourced";
import type { Company } from "./types";

// Companies the /bom teardowns reach that are not in the registry yet, and
// the latest gross margins /bom's margin capture reads for companies that
// are (attached to their records in ./index and ./china).

export function margin(
    value: number,
    sources: SourceId[],
    asOf: string,
    note: string,
    confidence: Confidence = "reported",
): Sourced<number> {
    return { value, unit: "fraction", sources, asOf, confidence, note };
}

export const BOM_MARGINS = {
    sanhua: margin(
        0.284,
        ["stockanalysis-sanhua"],
        "2025",
        "Gross profit CNY 8,806.7 m over revenue CNY 31,011.7 m in 2025; group figure, mostly thermal-management parts.",
        "modeled",
    ),
    tuopu: margin(
        0.1943,
        ["gasgoo-tuopu-2025"],
        "2025",
        "Group gross margin for 2025, mostly automotive parts.",
    ),
    beite: margin(
        0.1948,
        ["stockanalysis-beite"],
        "2025",
        "Latest fiscal year on an aggregator; roller screws are still a small part of a chassis-parts business.",
        "estimated",
    ),
    jlMag: margin(
        0.2047,
        ["stockanalysis-jlmag"],
        "2025",
        "S&P Global data via an aggregator; the company reports 21.18% consolidated.",
        "estimated",
    ),
    northern: margin(
        0.1175,
        ["stockanalysis-northern-re"],
        "2025",
        "Gross profit about CNY 5.0 bn on revenue of CNY 42.6 bn in 2025, per an aggregator.",
        "estimated",
    ),
    leaderdrive: margin(
        0.2556,
        ["stockanalysis-leaderdrive"],
        "2025",
        "Latest fiscal year on an aggregator, down from 28.7% in 2024.",
        "estimated",
    ),
    leadshine: margin(
        0.39,
        ["leadshine-2025-annual"],
        "2025",
        "2025 gross margin from the company's annual report release.",
    ),
    unitree: margin(
        0.6013,
        ["sse-unitree-pricing-2026"],
        "2025",
        "Gross margin of the core businesses in 2025, the prospectus figure as quoted in the exchange's IPO pricing news release; the prospectus itself is not cited.",
    ),
    renishaw: margin(
        0.617,
        ["renishaw-fy2025"],
        "2025-06",
        "Gross margin excluding engineering costs, year to June 2025.",
    ),
} as const;

export const BOM_COMPANIES: Company[] = [
    {
        id: "renishaw",
        name: "Renishaw",
        hqCountry: "GB",
        stages: ["electronics"],
        segment: "magnets-motors",
        ownership: { kind: "listed", ticker: "LSE: RSW" },
        grossMargin: BOM_MARGINS.renishaw,
        products: ["Absolute and incremental position encoders", "Metrology systems"],
        url: "https://www.renishaw.com/",
        sources: ["renishaw-encoders"],
    },
    {
        id: "cmsemicon",
        name: "Cmsemicon",
        localName: "中微半导",
        hqCountry: "CN",
        stages: ["electronics"],
        segment: "magnets-motors",
        ownership: { kind: "listed", ticker: "SHA: 688380" },
        products: ["Motor-control microcontrollers", "Mixed-signal chips"],
        url: "https://app.dealroom.co/companies/cmsemicon",
        sources: ["dealroom-cmsemicon"],
    },
];
