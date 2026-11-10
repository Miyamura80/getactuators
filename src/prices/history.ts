import historyFile from "../../data/prices/history.json";
import { ACTUATORS, type Actuator, getActuator } from "../catalog";
import { CATALOG_PRICE_DATE, getTrendChart, sourceOf } from "../trends";
import type { HistoryFile, PricePoint, PriceRecord } from "./types";

// Every dated price point per catalog actuator, merged from three places:
// 1. the curated /trends sample (its archived pages, papers and forum posts
//    keep their source ids, so the facts live in one registry),
// 2. data/prices/history.json, written by scripts/price-snapshot,
// 3. the catalog's current price, dated CATALOG_PRICE_DATE, unless a
//    snapshot already covers that month.

export const HISTORY_RECORDS: readonly PriceRecord[] = (historyFile as HistoryFile)
    .points;

const round2 = (v: number) => Math.round(v * 100) / 100;

function withTorque(
    r: PriceRecord,
    sources: string[],
    torqueNm: number | null,
    range?: readonly [number, number],
): PricePoint {
    return {
        ...r,
        sources,
        torqueNm,
        usdPerNm: torqueNm ? round2(r.priceUsd / torqueNm) : null,
        ...(range ? { range } : {}),
    };
}

function catalogUrl(a: Actuator): string {
    return a.product_url ?? `/actuators/${a.id}`;
}

// The /trends actuator price chart, as price points. Its last point per
// series is the catalog price, which (3) adds for every actuator.
function trendPoints(): PricePoint[] {
    const chart = getTrendChart("actuator-prices");
    return (chart?.series ?? []).flatMap((s) =>
        s.points
            .filter((p) => !p.sources.some((id) => id.startsWith("catalog:")))
            .map((p) => {
                const wayback = p.sources.find((id) => id.startsWith("wb-"));
                const url = sourceOf(wayback ?? p.sources[0] ?? "").url;
                return withTorque(
                    {
                        actuatorId: s.actuatorId ?? s.id,
                        date: p.date,
                        priceUsd: p.value,
                        currency: "USD",
                        originalPrice: p.value,
                        fxRate: 1,
                        url,
                        method: wayback ? "wayback" : "manual",
                        ...(p.note ? { note: p.note } : {}),
                    },
                    p.sources,
                    p.torqueNm ?? null,
                    p.range,
                );
            }),
    );
}

function snapshotPoints(): PricePoint[] {
    return HISTORY_RECORDS.map((r) =>
        withTorque(
            r,
            [`url:${r.url}`],
            getActuator(r.actuatorId)?.peak_torque_nm ?? null,
        ),
    );
}

function catalogPoints(covered: Set<string>): PricePoint[] {
    return ACTUATORS.filter(
        (a) => a.price_usd != null && !covered.has(`${a.id}@${CATALOG_PRICE_DATE}`),
    ).map((a) =>
        withTorque(
            {
                actuatorId: a.id,
                date: CATALOG_PRICE_DATE,
                priceUsd: a.price_usd as number,
                currency: "USD",
                originalPrice: a.price_usd as number,
                fxRate: 1,
                url: catalogUrl(a),
                method: "manual",
                note: "Current catalog price.",
            },
            [`catalog:${a.id}`],
            a.peak_torque_nm,
        ),
    );
}

// Sorted by effective date: "YYYY-MM" is mid-month (yearFraction), so it
// sorts after "YYYY-MM-01". An out-of-stock snapshot does not stand in for
// the catalog price of its month.
function build(): PricePoint[] {
    const snaps = snapshotPoints();
    const covered = new Set(
        snaps
            .filter((p) => !p.outOfStock)
            .map(
                (p) => `${p.actuatorId}@${p.date.slice(0, CATALOG_PRICE_DATE.length)}`,
            ),
    );
    return [...trendPoints(), ...snaps, ...catalogPoints(covered)].sort(
        (a, b) =>
            a.actuatorId.localeCompare(b.actuatorId) ||
            yearFraction(a.date) - yearFraction(b.date) ||
            a.date.localeCompare(b.date),
    );
}

export const PRICE_POINTS: readonly PricePoint[] = build();

// Caveats on a whole series (a change of seller or version), from /trends.
export function seriesNote(id: string): string | undefined {
    return getTrendChart("actuator-prices")?.series.find((s) => s.actuatorId === id)
        ?.note;
}

const byActuator = new Map<string, PricePoint[]>();
for (const p of PRICE_POINTS) {
    const list = byActuator.get(p.actuatorId) ?? [];
    list.push(p);
    byActuator.set(p.actuatorId, list);
}

// Points for one actuator, oldest first; empty when it has none.
export function historyFor(id: string): readonly PricePoint[] {
    return byActuator.get(id) ?? [];
}

// Actuators with at least one point, most points first, then by id.
export function actuatorsWithHistory(): string[] {
    return [...byActuator.keys()].sort(
        (a, b) =>
            (byActuator.get(b)?.length ?? 0) - (byActuator.get(a)?.length ?? 0) ||
            a.localeCompare(b),
    );
}

// A listed price that counts: not flagged out of stock.
export const isPriced = (p: PricePoint): boolean => !p.outOfStock;

// "YYYY", "YYYY-MM" or "YYYY-MM-DD" as a fractional year (mid-month or
// mid-year when the day or month is missing).
export function yearFraction(date: string): number {
    const [y, m, d] = date.split("-").map(Number);
    if (!m) return (y ?? 0) + 0.5;
    const day = d ? (d - 0.5) / 31 : 0.5;
    return (y ?? 0) + (m - 1 + day) / 12;
}

export function latestPoint(id: string): PricePoint | undefined {
    return historyFor(id).filter(isPriced).at(-1);
}

// Latest priced point on or before a fractional year.
function priceOn(id: string, year: number): PricePoint | undefined {
    return historyFor(id)
        .filter((p) => isPriced(p) && yearFraction(p.date) <= year + 1e-9)
        .at(-1);
}

export interface YearChange {
    from: PricePoint;
    to: PricePoint;
    // to / from - 1.
    change: number;
}

// Change of the latest price against the price a year earlier (the last
// point on or before that day, carried forward); null without one.
export function yearChange(id: string): YearChange | null {
    const to = latestPoint(id);
    if (!to) return null;
    const from = priceOn(id, yearFraction(to.date) - 1);
    if (!from) return null;
    return { from, to, change: to.priceUsd / from.priceUsd - 1 };
}
