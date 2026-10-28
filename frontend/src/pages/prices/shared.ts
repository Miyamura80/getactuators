import { PRICE_HISTORY, toTime } from "../../../../src/prices/history";
import type { PricedActuator } from "../../../../src/prices/types";
import { ACTUATORS } from "../../lib/data";
import { CATEGORIES, CATEGORY_MAP, type CategorySlug } from "../../types";

// What the /prices views share: the catalog as the analysis wants it, one
// colour per class (the catalog's category hue), number formats and a time
// scale.

export const PRICED: PricedActuator[] = ACTUATORS;
export const byId = new Map(ACTUATORS.map((a) => [a.id, a]));

// Actuators with any recorded point, by name, for the history picker; the
// ?actuator= value falls back to the first.
export const HISTORY_IDS = [...new Set(PRICE_HISTORY.points.map((p) => p.actuatorId))]
    .filter((id) => byId.has(id))
    .sort((a, b) => (byId.get(a)?.name ?? a).localeCompare(byId.get(b)?.name ?? b));

export function readActuator(search: string): string {
    const id = new URLSearchParams(search).get("actuator") ?? "";
    return HISTORY_IDS.includes(id) ? id : (HISTORY_IDS[0] ?? "");
}

export const CLASSES = CATEGORIES;
export const classColor = (slug: string) =>
    `hsl(${CATEGORY_MAP[slug as CategorySlug]?.hue ?? 210} 70% 62%)`;

export const usd = (v: number) =>
    `$${v.toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 })}`;
export const perNmText = (v: number) => `$${v < 10 ? v.toFixed(2) : v.toFixed(1)}/Nm`;
export const pct = (v: number) => `${v >= 0 ? "+" : ""}${(v * 100).toFixed(1)}%`;

export const W = 720;
export const H = 280;
export const M = { l: 56, r: 16, t: 14, b: 34 };

const DAY = 86_400_000;

// Linear time axis over the dates, at least a month wide so a short history
// still reads as points in time.
export function timeAxis(dates: string[]) {
    const ts = dates.map(toTime).sort((a, b) => a - b);
    const t0 = (ts[0] ?? Date.UTC(2026, 0, 1)) - 3 * DAY;
    const t1 = Math.max((ts.at(-1) ?? t0) + 3 * DAY, t0 + 30 * DAY);
    const x = (date: string) => M.l + ((toTime(date) - t0) / (t1 - t0)) * (W - M.l - M.r);
    const ticks: string[] = [];
    const months = (t1 - t0) / (30 * DAY);
    const step = months > 36 ? 12 : months > 12 ? 3 : 1;
    const d = new Date(t0);
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + 1);
    while (d.getTime() <= t1) {
        ticks.push(d.toISOString().slice(0, 10));
        d.setUTCMonth(d.getUTCMonth() + step);
    }
    return { x, ticks };
}

export const tickLabel = (date: string) =>
    new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });

// Log scale over [lo, hi] with decade and 2x/5x ticks inside the range.
export function logAxis(lo: number, hi: number, top: number, bottom: number) {
    const a = Math.log10(lo);
    const b = Math.log10(hi);
    const span = b - a || 1;
    const y = (v: number) => bottom - ((Math.log10(v) - a) / span) * (bottom - top);
    const ticks: number[] = [];
    for (let e = Math.floor(a); e <= Math.ceil(b); e++)
        for (const m of [1, 2, 5]) {
            const v = m * 10 ** e;
            if (v >= lo && v <= hi) ticks.push(v);
        }
    return { y, ticks };
}
