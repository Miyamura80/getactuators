import { priceAt } from "../supply-chain/metals/prices";
import { PRICE_POINTS, isPriced, yearFraction } from "./history";
import type { PricePoint } from "./types";

// Actuator price index against NdPr oxide (/metals).
//
// Index method (chain-linked repeat prices): for each actuator, the log
// change between consecutive priced points is spread evenly over the time
// between them. Each year's move (mid-year to mid-year) is the mean of those
// per-year rates over the actuators whose prices span any of it, each
// weighted by how much of the year it spans; the moves are chained from 100. $/N·m is used
// when both points have a torque, so a re-rated version is not a price move.
// A year no actuator spans breaks the chain, and later years stay empty.

export const INDEX_METHOD =
    "Chain-linked repeat-price index: each actuator's change between consecutive prices is spread evenly over the years between them; each year's move is the mean over the actuators spanning it, weighted by the share of the year each spans, chained from 100.";

export const METAL_SERIES_ID = "ndpr-oxide";

export const CAUSATION_NOTE =
    "Correlation is not causation: a handful of yearly points, list prices set by retailers, and a magnet that is a small share of an actuator's cost all mean a shared move can be chance or a third cause.";

export interface IndexYear {
    year: number;
    // Null where the chain is broken (no actuator spans the year).
    value: number | null;
    // Actuators whose price pairs span the move into this year.
    actuators: number;
}

interface Segment {
    t0: number;
    t1: number;
    // Log change per year.
    rate: number;
}

function ratio(a: PricePoint, b: PricePoint): number {
    return a.usdPerNm !== null && b.usdPerNm !== null
        ? b.usdPerNm / a.usdPerNm
        : b.priceUsd / a.priceUsd;
}

function segments(points: readonly PricePoint[]): Map<string, Segment[]> {
    const out = new Map<string, Segment[]>();
    const by = new Map<string, PricePoint[]>();
    for (const p of points.filter(isPriced))
        by.set(p.actuatorId, [...(by.get(p.actuatorId) ?? []), p]);
    for (const [id, unsorted] of by) {
        const ps = [...unsorted].sort(
            (a, b) => yearFraction(a.date) - yearFraction(b.date),
        );
        const segs: Segment[] = [];
        for (let i = 1; i < ps.length; i++) {
            const a = ps[i - 1] as PricePoint;
            const b = ps[i] as PricePoint;
            const t0 = yearFraction(a.date);
            const t1 = yearFraction(b.date);
            if (t1 > t0) segs.push({ t0, t1, rate: Math.log(ratio(a, b)) / (t1 - t0) });
        }
        if (segs.length) out.set(id, segs);
    }
    return out;
}

export function priceIndex(points: readonly PricePoint[] = PRICE_POINTS): IndexYear[] {
    const segs = segments(points);
    const all = [...segs.values()].flat();
    if (all.length === 0) return [];
    // First and last mid-year the prices span.
    const y0 = Math.ceil(Math.min(...all.map((s) => s.t0)) - 0.5 - 1e-9);
    const y1 = Math.floor(Math.max(...all.map((s) => s.t1)) - 0.5 + 1e-9);
    const out: IndexYear[] = [{ year: y0, value: 100, actuators: 0 }];
    let level: number | null = 100;
    for (let y = y0 + 1; y <= y1; y++) {
        // The move from mid y-1 to mid y.
        const a = y - 0.5;
        const b = y + 0.5;
        let sum = 0;
        let weight = 0;
        let n = 0;
        for (const list of segs.values()) {
            let w = 0;
            let s = 0;
            for (const g of list) {
                const overlap = Math.max(0, Math.min(b, g.t1) - Math.max(a, g.t0));
                w += overlap;
                s += g.rate * overlap;
            }
            // An actuator spanning a quarter of the year counts a quarter as
            // much as one spanning all of it.
            if (w > 0) {
                sum += s;
                weight += w;
                n++;
            }
        }
        level = n === 0 || level === null ? null : level * Math.exp(sum / weight);
        out.push({ year: y, value: level, actuators: n });
    }
    return out;
}

export interface MetalYear {
    year: number;
    // US$/kg.
    usdPerKg: number;
    // True when no reading covers the year and an earlier one is carried.
    carried: boolean;
    date: string;
    sources: string[];
}

// NdPr oxide per year: priceAt() for June, i.e. that year's average or the
// latest reading.
export function metalYears(years: number[]): MetalYear[] {
    return years.flatMap((year) => {
        const at = priceAt(METAL_SERIES_ID, `${year}-06`);
        return at
            ? [
                  {
                      year,
                      usdPerKg: at.value.value,
                      carried: at.carried,
                      date: at.date,
                      sources: at.value.sources,
                  },
              ]
            : [];
    });
}

export interface LagCorrelation {
    // Years the metal leads the index.
    lag: number;
    // Pearson r of year-on-year log changes; null under 3 pairs.
    r: number | null;
    n: number;
}

export function pearson(xs: number[], ys: number[]): number | null {
    const n = xs.length;
    if (n < 3 || ys.length !== n) return null;
    const mx = xs.reduce((s, x) => s + x, 0) / n;
    const my = ys.reduce((s, y) => s + y, 0) / n;
    let sxy = 0;
    let sxx = 0;
    let syy = 0;
    for (let i = 0; i < n; i++) {
        const dx = (xs[i] as number) - mx;
        const dy = (ys[i] as number) - my;
        sxy += dx * dy;
        sxx += dx * dx;
        syy += dy * dy;
    }
    return sxx === 0 || syy === 0 ? null : sxy / Math.sqrt(sxx * syy);
}

// Correlation of the index's yearly log change with the metal's, the metal
// leading by 0 to maxLag years. Years with a carried-forward metal price are
// left out.
export function lagCorrelations(
    index: IndexYear[],
    metal: MetalYear[],
    maxLag = 2,
): LagCorrelation[] {
    const lvl = new Map(index.map((i) => [i.year, i.value]));
    const met = new Map(
        metal.filter((m) => !m.carried).map((m) => [m.year, m.usdPerKg]),
    );
    const change = (m: Map<number, number | null>, y: number): number | null => {
        const a = m.get(y - 1);
        const b = m.get(y);
        return a != null && b != null ? Math.log(b / a) : null;
    };
    return Array.from({ length: maxLag + 1 }, (_, lag) => {
        const xs: number[] = [];
        const ys: number[] = [];
        for (const { year } of index) {
            const ci = change(lvl, year);
            const cm = change(met, year - lag);
            if (ci !== null && cm !== null) {
                xs.push(cm);
                ys.push(ci);
            }
        }
        return { lag, r: pearson(xs, ys), n: xs.length };
    });
}

export interface MetalsOverlay {
    index: IndexYear[];
    metal: MetalYear[];
    lags: LagCorrelation[];
}

export function metalsOverlay(): MetalsOverlay {
    const index = priceIndex();
    const metal = metalYears(index.map((i) => i.year));
    return { index, metal, lags: lagCorrelations(index, metal) };
}
