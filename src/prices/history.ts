import raw from "../../data/prices/history.json";
import type { PriceHistoryFile, PriceObservation, PricedActuator } from "./types";

// The committed price history and per-actuator reads over it. Points come
// only from data/prices/history.json; nothing is fetched at page load.

export const PRICES_PATH = "/prices";
export const PRICE_HISTORY: PriceHistoryFile = raw as PriceHistoryFile;
export const PRICES_UPDATED = PRICE_HISTORY.updated;

const DAY = 86_400_000;
export const toTime = (date: string) => Date.parse(`${date}T00:00:00Z`);
export const daysBetween = (a: string, b: string) =>
    Math.round((toTime(b) - toTime(a)) / DAY);

export function historyOf(
    id: string,
    points: readonly PriceObservation[] = PRICE_HISTORY.points,
): PriceObservation[] {
    return points
        .filter((p) => p.actuatorId === id)
        .sort(
            (a, b) => a.date.localeCompare(b.date) || a.method.localeCompare(b.method),
        );
}

export type PricedPoint = PriceObservation & { priceUsd: number };

export const priced = (points: readonly PriceObservation[]) =>
    points.filter((p): p is PricedPoint => p.priceUsd !== null);

// The price in effect on a date: the last priced point on or before it.
export function priceOn(
    points: readonly PriceObservation[],
    date: string,
): number | null {
    let out: number | null = null;
    for (const p of priced(points)) if (p.date <= date) out = p.priceUsd;
    return out;
}

export interface PriceSummary {
    actuatorId: string;
    points: number;
    first: string | null;
    latest: PricedPoint | null;
    // Change from the price in effect a year before the latest point; null
    // until the history spans a year.
    yearChange: number | null;
    outOfStock: boolean;
}

export function summarize(
    id: string,
    points: readonly PriceObservation[] = PRICE_HISTORY.points,
): PriceSummary {
    const h = historyOf(id, points);
    const p = priced(h);
    const latest = p.at(-1) ?? null;
    let yearChange: number | null = null;
    if (latest) {
        const yearAgo = new Date(toTime(latest.date) - 365 * DAY)
            .toISOString()
            .slice(0, 10);
        const before = priceOn(h, yearAgo);
        if (before) yearChange = latest.priceUsd / before - 1;
    }
    return {
        actuatorId: id,
        points: h.length,
        first: h[0]?.date ?? null,
        latest,
        yearChange,
        outOfStock: h.at(-1)?.inStock === false,
    };
}

export const perNm = (a: Pick<PricedActuator, "peak_torque_nm">, usd: number) =>
    a.peak_torque_nm ? usd / a.peak_torque_nm : null;

export interface Coverage {
    actuators: number;
    points: number;
    first: string | null;
    last: string | null;
    methods: Partial<Record<PriceObservation["method"], number>>;
}

export function coverage(
    points: readonly PriceObservation[] = PRICE_HISTORY.points,
): Coverage {
    const dates = points.map((p) => p.date).sort();
    const methods: Coverage["methods"] = {};
    for (const p of points) methods[p.method] = (methods[p.method] ?? 0) + 1;
    return {
        actuators: new Set(points.map((p) => p.actuatorId)).size,
        points: points.length,
        first: dates[0] ?? null,
        last: dates.at(-1) ?? null,
        methods,
    };
}
