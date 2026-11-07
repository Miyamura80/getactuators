import { HUMANOIDS } from "../humanoids";
import type { TrendChart, TrendConfidence, TrendPoint, TrendSeries } from "./types";

// Market share, rated life, roller screw cost and the rotary/linear split.
// Shares are from analysts' public press releases (single figures, never the
// full vendor tables they sell).

function p(
    date: string,
    value: number,
    sources: string[],
    confidence: TrendConfidence = "reported",
    note?: string,
    range?: readonly [number, number],
): TrendPoint {
    return {
        date,
        value,
        sources,
        confidence,
        ...(note ? { note } : {}),
        ...(range ? { range } : {}),
    };
}

export const HUMANOID_SHARE_CHART: TrendChart = {
    id: "humanoid-share",
    section: "actuators",
    title: "Humanoid shipments by company",
    question: "Who ships the humanoids?",
    unit: "% of units",
    kind: "line",
    series: [
        {
            id: "agibot",
            label: "AgiBot",
            points: [
                p(
                    "2025-06",
                    25,
                    ["sag-humanoid-1h2026"],
                    "reported",
                    "1H 2025 share (SAG).",
                ),
                p(
                    "2025-12",
                    39,
                    ["agibot-omdia-2025"],
                    "reported",
                    "Full-year 2025: 5,168 of about 13,000 units (Omdia).",
                ),
                p(
                    "2026-06",
                    44,
                    ["sag-humanoid-1h2026"],
                    "reported",
                    "1H 2026: about 8,400 units (SAG).",
                ),
            ],
        },
        {
            id: "unitree",
            label: "Unitree",
            points: [
                p(
                    "2025-06",
                    43,
                    ["sag-humanoid-1h2026"],
                    "estimated",
                    "Back-computed: SAG gives 5,900 units in 1H 2026, up 170%, so about 2,200 of 5,100 in 1H 2025.",
                ),
                p(
                    "2026-06",
                    31,
                    ["sag-humanoid-1h2026"],
                    "reported",
                    "1H 2026: about 5,900 units (SAG).",
                ),
            ],
        },
        {
            id: "others",
            label: "Everyone else",
            points: [
                p(
                    "2025-06",
                    32,
                    ["sag-humanoid-1h2026"],
                    "estimated",
                    "100% less the two shares above.",
                ),
                p(
                    "2026-06",
                    25,
                    ["sag-humanoid-1h2026"],
                    "reported",
                    "AgiBot and Unitree together about 75% (SAG); Galbot about 900 units, UBTech 700, Leju 600.",
                ),
            ],
        },
    ],
    notes: [
        "Half-year (SAG) and full-year (Omdia) counts from two analysts, plotted at the period's end. Market size: 5.1K units in 1H 2025, about 13K in 2025, 19.1K in 1H 2026.",
        "Unitree's full-year 2025 count is left out: press reports of the same Omdia study give 4,200 and 5,500 units.",
    ],
    licence: "Facts from analysts' public press releases (SAG, Omdia via AgiBot).",
};

export const CHINA_INDUSTRIAL_SHARE_CHART: TrendChart = {
    id: "china-industrial-share",
    section: "actuators",
    title: "Chinese brands in China's industrial robot market",
    question: "How fast have domestic makers taken their home market?",
    unit: "% of installations",
    kind: "line",
    series: [
        {
            id: "chinese-brands",
            label: "Chinese brands",
            points: [
                p(
                    "2017",
                    25,
                    ["usitc-china-robots"],
                    "estimated",
                    "34,700 of 137,900 robots sold in China.",
                ),
                p(
                    "2020",
                    29,
                    ["estun-mir-share"],
                    "reported",
                    "MIR Databank: under 29%.",
                ),
                p("2023", 47, ["ifr-wr2024-slides"]),
                p("2024", 57, ["csis-chinapower-robots"]),
                p(
                    "2025",
                    55,
                    ["bri-ifr-2025"],
                    "reported",
                    "195,000 units by domestic suppliers.",
                ),
            ],
        },
    ],
    notes: [
        "Mixes three counters (USITC from IFR, MIR Databank, IFR), so treat year-to-year steps as approximate; the 2024 to 2025 dip is within that noise.",
    ],
    licence: "Facts from USITC, IFR summaries, MIR via Estun and CSIS.",
};

export const RATED_LIFE_CHART: TrendChart = {
    id: "rated-life",
    section: "actuators",
    title: "Rated life of strain-wave gears",
    question: "Do actuators last longer than they used to?",
    unit: "hours (L10 at rated torque)",
    kind: "bars",
    sparse: true,
    series: [
        {
            id: "hd-csf",
            label: "HD CSF, older",
            points: [
                p(
                    "2026",
                    7000,
                    ["tqg-csg-csf-life"],
                    "estimated",
                    "Back-computed: CSG is 43% above CSF.",
                ),
            ],
        },
        {
            id: "hd-csg",
            label: "HD CSG, newer",
            points: [p("2026", 10000, ["tqg-csg-csf-life"])],
        },
    ],
    notes: [
        "Too thin to chart over time. Rated life, MTBF and duty-cycle hours are rarely published for robot actuators, and when they are, makers quote them per product generation, not per year. Two generations of one Harmonic Drive (HD) strain-wave gear are the best comparison we could cite.",
    ],
    licence: "Facts from a distributor's datasheet summary.",
};

const CNY_PER_USD = { "2023": 7.2, "2024": 7.2, "2026": 7.1 } as const;

export const ROLLER_SCREW_CHART: TrendChart = {
    id: "roller-screw-cost",
    section: "actuators",
    title: "Planetary roller screw cost",
    question: "What does one humanoid linear actuator screw cost?",
    unit: "USD per screw",
    kind: "line",
    log: true,
    series: [
        {
            id: "china-mass",
            label: "Chinese screw, volume price",
            points: [
                p(
                    "2023-08",
                    Math.round(1080 / CNY_PER_USD["2023"]),
                    ["baidu-roller-screw-2023"],
                    "estimated",
                    "1,080 CNY in a broker's model.",
                ),
                p(
                    "2024-03",
                    Math.round(2000 / CNY_PER_USD["2024"]),
                    ["huaxin-roller-screw-2024"],
                    "estimated",
                    "About 2,000 CNY (Huaxin Securities).",
                ),
                p(
                    "2026",
                    Math.round(499 / CNY_PER_USD["2026"]),
                    ["path:/manufacturing"],
                    "reported",
                    "499 CNY mass-production price, from /manufacturing.",
                ),
            ],
        },
        {
            id: "swiss",
            label: "Swiss screw, early humanoid builds",
            estimated: true,
            points: [
                p(
                    "2026",
                    2025,
                    ["path:/manufacturing"],
                    "estimated",
                    "Reported range from Swiss makers, from /manufacturing.",
                    [1350, 2700],
                ),
            ],
        },
    ],
    notes: [
        "Converted from CNY at 7.2 (2023, 2024) and 7.1 (2026) CNY per USD. The 2023 and 2024 figures are brokers' planning numbers, not quotes, and disagree with each other; only the 2026 price is a maker's.",
    ],
    licence:
        "Facts from broker notes; 2026 points CC BY 4.0 (actuatorlist /manufacturing).",
};

// Linear actuators' share of each mapped humanoid's actuators (rotary plus
// screw types whose type is known), from /humanoids. A snapshot of designs,
// not a market share over time.
function rotaryLinearSeries(): TrendSeries[] {
    return HUMANOIDS.flatMap((h) => {
        let linear = 0;
        let rotary = 0;
        for (const j of h.joints) {
            if (j.actuatorType.startsWith("linear")) linear += j.count;
            else if (j.actuatorType !== "hydraulic" && j.actuatorType !== "other")
                rotary += j.count;
        }
        if (linear + rotary === 0) return [];
        return [
            {
                id: h.id,
                label: `${h.brand.split(" ")[0]} ${h.name}`,
                points: [
                    p(
                        "2026-10",
                        Math.round((100 * linear) / (linear + rotary)),
                        ["path:/humanoids"],
                        "reported",
                        `${linear} linear, ${rotary} rotary.`,
                    ),
                ],
            },
        ];
    }).sort((a, b) => (b.points[0]?.value ?? 0) - (a.points[0]?.value ?? 0));
}

export const ROTARY_LINEAR_CHART: TrendChart = {
    id: "rotary-vs-linear",
    section: "actuators",
    title: "Rotary vs linear actuators",
    question: "How much of a humanoid moves on screws?",
    unit: "% of actuators that are linear",
    kind: "bars",
    sparse: true,
    series: rotaryLinearSeries(),
    notes: [
        "No public source tracks the rotary and linear split by year. This is a snapshot of the humanoids mapped on /humanoids (October 2026), counting actuators whose type is known; robots that do not disclose types are left out.",
    ],
    licence: "CC BY 4.0 (actuatorlist /humanoids).",
};
