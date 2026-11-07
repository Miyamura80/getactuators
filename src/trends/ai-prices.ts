import type { TrendChart, TrendSeries } from "./types";

// The price of AI against earlier transformative technologies. Rebuilt from
// the summary figures Epoch AI and Karthik Tadepalli publish; their charts and
// underlying series are not copied (no open licence is stated for either).

const EPOCH = "epoch-plunging-price";
const TADEPALLI = "tadepalli-rd-price";

interface Tech {
    id: string;
    label: string;
    // Inclusive years of the price window.
    window: readonly [number, number];
}

function rateSeries(
    t: Tech,
    value: number,
    sources: string[],
    extra: { note?: string; range?: readonly [number, number] } = {},
): TrendSeries {
    return {
        id: t.id,
        label: t.label,
        points: [
            {
                date: String(t.window[1]),
                value,
                sources,
                confidence: "reported",
                note: `${t.window[0]} to ${t.window[1]}.${extra.note ? ` ${extra.note}` : ""}`,
                ...(extra.range ? { range: extra.range } : {}),
            },
        ],
    };
}

export const PRICE_OF_AI_CHART: TrendChart = {
    id: "price-of-ai",
    section: "ai",
    title: "How fast the price falls, by technology",
    question:
        "Is AI getting cheaper faster than electricity, compute or batteries did?",
    unit: "× cheaper per year",
    kind: "bars",
    years: [1892, 2026],
    log: true,
    series: [
        rateSeries(
            { id: "llm", label: "LLM inference", window: [2023, 2026] },
            13,
            [EPOCH],
            {
                note: "Cost of a fixed benchmark score, 47% lower each quarter.",
            },
        ),
        rateSeries({ id: "dna", label: "DNA sequencing", window: [2001, 2025] }, 1.84, [
            EPOCH,
        ]),
        rateSeries({ id: "compute", label: "Compute", window: [1940, 2001] }, 1.51, [
            EPOCH,
        ]),
        rateSeries(
            { id: "li-ion", label: "Lithium-ion batteries", window: [1991, 2024] },
            1.16,
            [EPOCH],
        ),
        rateSeries(
            {
                id: "electricity",
                label: "Electricity (US residential)",
                window: [1892, 1973],
            },
            1.05,
            [EPOCH],
        ),
    ],
    notes: [
        "Average yearly price decline over each technology's window, as published by Epoch AI. In log points AI's fall is 4× DNA sequencing's, 6× compute's, 18× batteries' and 54× electricity's.",
        "AI's figure is the cost of reaching a fixed benchmark score with the cheapest model, not a list price, so the comparison is approximate, as Epoch notes.",
    ],
    licence:
        "Facts from Epoch AI; no open licence is stated, so only the five published rates are shown.",
    original: {
        label: "Epoch AI, The plunging price of thought",
        url: "https://epoch.ai/publications/the-plunging-price-of-thought",
    },
};

export const PRICE_PER_RD_CHART: TrendChart = {
    id: "price-per-rd",
    section: "ai",
    title: "Price decline per unit of R&D",
    question: "Is AI's R&D unusually productive, or just unusually large?",
    unit: "log price decline per log R&D growth",
    kind: "bars",
    years: [1892, 2026],
    series: [
        rateSeries(
            { id: "llm", label: "LLM inference", window: [2023, 2026] },
            2.7,
            [TADEPALLI],
            {
                note: "Price 12.7× lower a year while the R&D stock grew 2.5× a year.",
                range: [2.5, 5.4],
            },
        ),
        rateSeries(
            { id: "dna", label: "DNA sequencing", window: [2001, 2022] },
            5.9,
            [TADEPALLI],
            {
                note: "1.84× a year on 1.11× R&D growth.",
                range: [4.5, 12.9],
            },
        ),
        rateSeries(
            { id: "compute", label: "Compute", window: [1940, 2001] },
            4.1,
            [TADEPALLI],
            {
                note: "1.51× a year on 1.11× R&D growth.",
                range: [3.5, 4.7],
            },
        ),
        rateSeries(
            { id: "li-ion", label: "Lithium-ion batteries", window: [1991, 2024] },
            1.2,
            [TADEPALLI],
            {
                note: "1.16× a year on 1.13× R&D growth.",
                range: [1.0, 2.1],
            },
        ),
        rateSeries(
            { id: "electricity", label: "Electricity (US)", window: [1892, 1973] },
            0.5,
            [TADEPALLI],
            {
                note: "1.05× a year on 1.09× R&D growth.",
                range: [0.4, 0.7],
            },
        ),
    ],
    notes: [
        "Slope of log price against log cumulative R&D stock over Epoch's windows, with Tadepalli's sensitivity range (scope, R&D path, depreciation 0 to 30%). Per unit of R&D, AI sits mid-pack: its fast fall tracks fast growth in R&D spending.",
        "Descriptive, not causal: the fit credits every price decline to R&D and ignores scale economies, learning by doing and spillovers.",
    ],
    licence:
        "Facts from Karthik Tadepalli's repository (no licence file), built on Epoch AI's series.",
    original: {
        label: "Karthik Tadepalli, rd-price-declines",
        url: "https://github.com/karthiktadepalli1/rd-price-declines",
    },
};
