// Venture-backed actuator and motor startups, shared by the /startups page and
// its markdown twin. A null figure means the company has not disclosed it; the
// page draws those as unscaled placeholder tiles rather than guessing a size.

export const STARTUPS_PATH = "/startups";

export interface Startup {
    id: string;
    name: string;
    url: string;
    hq: string;
    // Total disclosed funding in USD.
    raisedUsd: number | null;
    round: string | null;
    leadInvestor: string | null;
    // Company-reported production rate, motors and actuators per month.
    unitsPerMonth: number | null;
    // What the company has said about volume when no rate is public.
    volumeNote: string;
    source: { label: string; url: string };
}

export const STARTUPS: Startup[] = [
    {
        id: "atlas-motion",
        name: "Atlas Motion",
        url: "https://atlasmotion.com/",
        hq: "Long Beach, CA",
        raisedUsd: 11_500_000,
        round: "Seed / Series A (Aug 2026)",
        leadInvestor: "Greycroft",
        unitsPerMonth: 10_000,
        volumeNote: "About 10,000 motors a month, aiming past 40,000 by December 2026.",
        source: {
            label: "FinSMEs, Aug 2026",
            url: "https://www.finsmes.com/2026/08/atlas-motion-raises-11-5m-in-funding.html",
        },
    },
    {
        id: "westmag",
        name: "Westmag",
        url: "https://www.westmag.com/",
        hq: "South San Francisco, CA",
        raisedUsd: 11_000_000,
        round: "Seed (closed 2025, announced Jun 2026)",
        leadInvestor: "Andreessen Horowitz",
        unitsPerMonth: null,
        volumeNote:
            "No shipped volume disclosed. Order book of hundreds of thousands of units, targeting tens of thousands a month by end of 2026.",
        source: {
            label: "Business Wire, Jun 2026",
            url: "https://www.businesswire.com/news/home/20260602552448/en/Westmag-Emerges-With-$11-Million-Seed-Led-By-Andreessen-Horowitz-to-Build-Americas-Drone-Motor-and-Robot-Actuator-Industry",
        },
    },
    {
        id: "caldera",
        name: "Caldera",
        url: "https://calderaindustries.ai/",
        hq: "United States",
        raisedUsd: null,
        round: null,
        leadInvestor: null,
        unitsPerMonth: null,
        volumeNote: "No volume disclosed.",
        source: { label: "calderaindustries.ai", url: "https://calderaindustries.ai/" },
    },
];

export type StartupMetric = "raisedUsd" | "unitsPerMonth";

export const STARTUP_METRICS: Record<StartupMetric, { label: string }> = {
    raisedUsd: { label: "Money raised" },
    unitsPerMonth: { label: "Reported actuators made per month" },
};

export function formatMetric(metric: StartupMetric, value: number | null): string {
    if (value === null) return "Undisclosed";
    if (metric === "raisedUsd")
        return `$${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
    return `${value.toLocaleString("en-US")} / mo`;
}
