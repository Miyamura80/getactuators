import { ACTUATOR_PRICE_CHART } from "./actuator-prices";
import { PRICE_OF_AI_CHART, PRICE_PER_RD_CHART } from "./ai-prices";
import {
    CHINA_INDUSTRIAL_SHARE_CHART,
    HUMANOID_SHARE_CHART,
    RATED_LIFE_CHART,
    ROLLER_SCREW_CHART,
    ROTARY_LINEAR_CHART,
} from "./markets";
import { RUNTIME_CHART } from "./runtime";
import { isOwnSource } from "./sources";
import {
    TREND_SECTIONS,
    type TrendChart,
    type TrendPoint,
    type TrendSection,
    type TrendSeries,
} from "./types";

export * from "./types";
export { CATALOG_PRICE_DATE, perNm } from "./actuator-prices";
export { SOURCES, isOwnSource, sourceOf, type Source } from "./sources";

export const TRENDS_PATH = "/trends";
// Month the registry was last checked.
export const TRENDS_AS_OF = "November 2026";

// Page order. Section 1 runs from actuator prices to the rotary/linear split.
export const TREND_CHARTS: readonly TrendChart[] = [
    ACTUATOR_PRICE_CHART,
    RATED_LIFE_CHART,
    HUMANOID_SHARE_CHART,
    CHINA_INDUSTRIAL_SHARE_CHART,
    ROTARY_LINEAR_CHART,
    ROLLER_SCREW_CHART,
    PRICE_OF_AI_CHART,
    PRICE_PER_RD_CHART,
    RUNTIME_CHART,
];

export function getTrendChart(id: string): TrendChart | undefined {
    return TREND_CHARTS.find((c) => c.id === id);
}

export function chartsIn(section: TrendSection): TrendChart[] {
    return TREND_CHARTS.filter((c) => c.section === section);
}

export function isTrendSection(s: string): s is TrendSection {
    return (TREND_SECTIONS as readonly string[]).includes(s);
}

// True when no point in the series is reported (all estimated or modeled).
export function isEstimatedSeries(s: TrendSeries): boolean {
    return s.points.every((p) => p.confidence !== "reported");
}

export function allPoints(c: TrendChart): TrendPoint[] {
    return c.series.flatMap((s) => s.points);
}

// "YYYY" or "YYYY-MM" as a fractional year (mid-month), for plotting.
export function yearOf(date: string): number {
    const [y, m] = date.split("-");
    return Number(y) + (m ? (Number(m) - 0.5) / 12 : 0.5);
}

// First and last calendar year a chart's points cover.
export function yearSpan(c: TrendChart): readonly [number, number] {
    if (c.years) return c.years;
    const ys = allPoints(c).map((p) => Number(p.date.slice(0, 4)));
    return [Math.min(...ys), Math.max(...ys)];
}

// Distinct source ids a chart cites, own data last.
export function chartSources(c: TrendChart): string[] {
    const ids = [...new Set(allPoints(c).flatMap((p) => p.sources))];
    return [...ids.filter((id) => !isOwnSource(id)), ...ids.filter(isOwnSource)];
}

// Number with up to 3 significant digits, for labels and the twin.
export function formatValue(v: number): string {
    if (v >= 100) return Math.round(v).toLocaleString("en-US");
    if (v >= 10) return String(Math.round(v * 10) / 10);
    return String(Math.round(v * 100) / 100);
}
