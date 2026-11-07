// /trends: dated, cited points on how actuator, robotics and AI quantities
// have moved over the last decade. A curated registry, not a scraper: the
// weekly price pipeline is issue #95's /prices.

// reported: the source states the value. estimated: the source gives a range,
// an analyst assumption or a value we converted (currency, share from units).
// modeled: computed by us or the source from a stated rate.
export type TrendConfidence = "reported" | "estimated" | "modeled";

export const TREND_SECTIONS = ["actuators", "ai", "misc"] as const;
export type TrendSection = (typeof TREND_SECTIONS)[number];

export const TREND_SECTION_LABEL: Record<TrendSection, string> = {
    actuators: "Actuators and robotics",
    ai: "The price of AI",
    misc: "Battery runtime",
};

export interface TrendPoint {
    // "YYYY" or "YYYY-MM": when the value applied (snapshot, report or launch).
    date: string;
    value: number;
    // Source ids (keys of SOURCES in ./sources), or "catalog:<actuator id>",
    // "robots:<robot id>" and "path:/<page>" for actuatorlist's own data.
    sources: string[];
    confidence: TrendConfidence;
    note?: string;
    // Inclusive low and high when the source gives a range.
    range?: readonly [low: number, high: number];
    // Peak torque of the unit priced at this date (N·m), for $/N·m.
    torqueNm?: number;
    // Point label on scatter charts (robot model).
    label?: string;
}

export interface TrendSeries {
    id: string;
    label: string;
    points: TrendPoint[];
    // Catalog actuator this series prices, for links.
    actuatorId?: string;
    note?: string;
}

// line: values over calendar time. scatter: labelled points over time.
// bars: one value per series (e.g. a rate per technology).
export type TrendChartKind = "line" | "scatter" | "bars";

export interface TrendChart {
    id: string;
    section: TrendSection;
    title: string;
    // One-line question the chart answers.
    question: string;
    unit: string;
    kind: TrendChartKind;
    log?: boolean;
    series: TrendSeries[];
    // Gaps, estimates and method notes shown under the chart.
    notes: string[];
    // Human-readable licence line for the footnote.
    licence: string;
    // The original work, for charts rebuilt from someone else's figures.
    original?: { label: string; url: string };
    // Too thin to read as a trend: the page shows the points with a note.
    sparse?: boolean;
    // Years the underlying data covers, when wider than the point dates
    // (a rate measured over a window).
    years?: readonly [number, number];
}
