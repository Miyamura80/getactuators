// Venture-backed actuator and motor startups, shared by the /startups page and
// its markdown twin. A null figure means the company has not disclosed it; the
// page draws those as unscaled placeholder tiles rather than guessing a size.

export const STARTUPS_PATH = "/startups";

export interface Startup {
    id: string;
    name: string;
    url: string;
    // Served from frontend/public; a self-hosted copy, no third-party requests.
    // Omitted when we have no copy yet: the UI then falls back to CompanyLogo.
    logo?: string;
    hq: string;
    // Country of origin, ISO 3166-1 alpha-2.
    country: CountryCode;
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

export type CountryCode = "US" | "JP";

const COUNTRY_NAMES: Record<CountryCode, string> = {
    US: "United States",
    JP: "Japan",
};

// Flag emoji from the two regional indicator symbols of an ISO code.
export function countryFlag(code: CountryCode): string {
    return String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}

export function countryLabel(code: CountryCode): string {
    return `${countryFlag(code)} ${COUNTRY_NAMES[code]}`;
}

export const STARTUPS: Startup[] = [
    {
        id: "atlas-motion",
        name: "Atlas Motion",
        url: "https://atlasmotion.com/",
        logo: "/logos/startups/atlas-motion.jpg",
        hq: "Long Beach, CA",
        country: "US",
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
        logo: "/logos/startups/westmag.png",
        hq: "South San Francisco, CA",
        country: "US",
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
        logo: "/logos/startups/caldera.svg",
        hq: "United States",
        country: "US",
        raisedUsd: null,
        round: null,
        leadInvestor: null,
        unitsPerMonth: null,
        volumeNote: "No volume disclosed.",
        source: { label: "calderaindustries.ai", url: "https://calderaindustries.ai/" },
    },
    {
        id: "aster",
        name: "Aster",
        url: "https://www.ast-aster.biz/",
        hq: "Yokote, Akita",
        country: "JP",
        // ¥500M, the only round with a disclosed amount, at ~¥110/$ (Sep 2021).
        raisedUsd: 4_500_000,
        round: "¥500M (Sep 2021); Akari stake (Sep 2026), amount undisclosed",
        leadInvestor: "Akari",
        unitsPerMonth: null,
        volumeNote:
            "No monthly rate disclosed. Makes ASTERMOTOR drone and robot motors from its own laminated-coil process; plans a new plant in 2027 to raise output about 20x by FY2028. Press put the Akari investment at several billion yen, which Aster has not confirmed.",
        source: {
            label: "Aster, Sep 2021",
            url: "https://www.ast-aster.biz/en/news-1/%E7%AC%AC%E4%B8%89%E8%80%85%E5%89%B2%E5%BD%93%E5%A2%97%E8%B3%87%E3%81%AB%E3%82%88%E3%82%8B5%E5%84%84%E5%86%86%E3%81%AE%E8%B3%87%E9%87%91%E8%AA%BF%E9%81%94%E3%82%92%E5%AE%9F%E6%96%BD",
        },
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
