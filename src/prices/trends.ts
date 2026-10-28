import { priceAt } from "../supply-chain/metals/prices";
import { PRICE_HISTORY, perNm, priceOn, priced, toTime } from "./history";
import type { PriceObservation, PricedActuator } from "./types";

// The analysis behind /prices: $/Nm points by class with a fitted learning
// curve, $/Nm distributions by country and brand per year, a chain-weighted
// price index and its lagged correlation with NdPr oxide. Every function
// declines (null or "insufficient") rather than fit noise.

const YEAR_MS = 365.25 * 86_400_000;

export interface NmPoint {
    actuatorId: string;
    category: string;
    brand: string;
    country: string | null;
    date: string;
    usdPerNm: number;
}

export function nmPoints(
    actuators: readonly PricedActuator[],
    points: readonly PriceObservation[] = PRICE_HISTORY.points,
): NmPoint[] {
    const byId = new Map(actuators.map((a) => [a.id, a]));
    return priced(points).flatMap((p) => {
        const a = byId.get(p.actuatorId);
        const v = a ? perNm(a, p.priceUsd) : null;
        return a && v !== null
            ? [
                  {
                      actuatorId: a.id,
                      category: a.category,
                      brand: a.brand,
                      country: a.country,
                      date: p.date,
                      usdPerNm: v,
                  },
              ]
            : [];
    });
}

// Ordinary least squares y = a + b x with R squared.
export function ols(
    xs: number[],
    ys: number[],
): { a: number; b: number; r2: number } | null {
    const n = xs.length;
    if (n < 2 || n !== ys.length) return null;
    const mx = xs.reduce((s, x) => s + x, 0) / n;
    const my = ys.reduce((s, y) => s + y, 0) / n;
    let sxx = 0;
    let sxy = 0;
    let syy = 0;
    for (let i = 0; i < n; i++) {
        const dx = (xs[i] ?? 0) - mx;
        const dy = (ys[i] ?? 0) - my;
        sxx += dx * dx;
        sxy += dx * dy;
        syy += dy * dy;
    }
    if (sxx === 0) return null;
    const b = sxy / sxx;
    return { a: my - b * mx, b, r2: syy === 0 ? 1 : (sxy * sxy) / (sxx * syy) };
}

export const MIN_FIT_POINTS = 4;
export const MIN_FIT_DAYS = 365;

export type FitMode = "time" | "models";

export type Fit =
    | {
          status: "fit";
          mode: FitMode;
          n: number;
          r2: number;
          // time: ln($/Nm) = a + b * years since `from`.
          // models: ln($/Nm) = a + b * ln(models listed in the class so far).
          a: number;
          b: number;
          // time: change per year (exp(b) - 1). models: change per doubling
          // of models (2^b - 1).
          rate: number;
          from: string;
          to: string;
      }
    | {
          status: "insufficient";
          mode: FitMode;
          n: number;
          days: number;
          reason: string;
      };

export function learningCurve(pts: readonly NmPoint[], mode: FitMode): Fit {
    const sorted = [...pts].sort((x, y) => x.date.localeCompare(y.date));
    const from = sorted[0]?.date ?? "";
    const to = sorted.at(-1)?.date ?? "";
    const days = from ? Math.round((toTime(to) - toTime(from)) / 86_400_000) : 0;
    const n = sorted.length;
    if (n < MIN_FIT_POINTS || days < MIN_FIT_DAYS)
        return {
            status: "insufficient",
            mode,
            n,
            days,
            reason: `needs ${MIN_FIT_POINTS}+ points over ${MIN_FIT_DAYS}+ days; has ${n} points over ${days} days`,
        };
    const firstSeen = new Map<string, string>();
    for (const p of sorted)
        if (!firstSeen.has(p.actuatorId)) firstSeen.set(p.actuatorId, p.date);
    const models = (date: string) =>
        [...firstSeen.values()].filter((d) => d <= date).length;
    const xs = sorted.map((p) =>
        mode === "time"
            ? (toTime(p.date) - toTime(from)) / YEAR_MS
            : Math.log(models(p.date)),
    );
    const fit = ols(
        xs,
        sorted.map((p) => Math.log(p.usdPerNm)),
    );
    if (!fit)
        return { status: "insufficient", mode, n, days, reason: "no spread in x" };
    return {
        status: "fit",
        mode,
        n,
        r2: fit.r2,
        a: fit.a,
        b: fit.b,
        rate: mode === "time" ? Math.exp(fit.b) - 1 : 2 ** fit.b - 1,
        from,
        to,
    };
}

export interface BoxStats {
    n: number;
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
}

function quantile(sorted: number[], q: number): number {
    const pos = (sorted.length - 1) * q;
    const lo = Math.floor(pos);
    const hi = Math.ceil(pos);
    const a = sorted[lo] ?? 0;
    const b = sorted[hi] ?? a;
    return a + (b - a) * (pos - lo);
}

export function boxStats(values: number[]): BoxStats | null {
    if (values.length === 0) return null;
    const s = [...values].sort((a, b) => a - b);
    return {
        n: s.length,
        min: s[0] ?? 0,
        q1: quantile(s, 0.25),
        median: quantile(s, 0.5),
        q3: quantile(s, 0.75),
        max: s.at(-1) ?? 0,
    };
}

export type GroupBy = "country" | "brand";

// $/Nm per group in one year: each actuator counts once, at its last price
// that year. Groups sorted cheapest median first.
export function distribution(
    pts: readonly NmPoint[],
    by: GroupBy,
    year: string,
): { group: string; stats: BoxStats }[] {
    const last = new Map<string, NmPoint>();
    for (const p of [...pts].sort((a, b) => a.date.localeCompare(b.date)))
        if (p.date.startsWith(year)) last.set(p.actuatorId, p);
    const groups = new Map<string, number[]>();
    for (const p of last.values()) {
        const g = (by === "country" ? p.country : p.brand) ?? "Unknown";
        groups.set(g, [...(groups.get(g) ?? []), p.usdPerNm]);
    }
    return [...groups]
        .flatMap(([group, vals]) => {
            const stats = boxStats(vals);
            return stats ? [{ group, stats }] : [];
        })
        .sort(
            (a, b) => a.stats.median - b.stats.median || a.group.localeCompare(b.group),
        );
}

export const years = (pts: readonly { date: string }[]) =>
    [...new Set(pts.map((p) => p.date.slice(0, 4)))].sort();

const monthEnd = (month: string) => `${month}-31`;

function nextMonth(month: string): string {
    const [y = 0, m = 1] = month.split("-").map(Number);
    return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

export function monthsBetween(from: string, to: string): string[] {
    const out: string[] = [];
    for (let m = from; m <= to; m = nextMonth(m)) out.push(m);
    return out;
}

export interface IndexPoint {
    month: string;
    index: number;
    // Actuators priced in both this month and the previous one.
    matched: number;
}

// Chain-weighted (Jevons) price index: each month's link is the geometric
// mean of price relatives over actuators priced at the end of both months,
// so models entering or leaving the catalog do not move it. 100 at the first
// month with two or more priced actuators.
export function priceIndex(
    points: readonly PriceObservation[] = PRICE_HISTORY.points,
): IndexPoint[] {
    const p = priced(points);
    if (p.length === 0) return [];
    const ids = [...new Set(p.map((x) => x.actuatorId))];
    const byId = new Map(
        ids.map((id) => [id, points.filter((x) => x.actuatorId === id)]),
    );
    const dates = points.map((x) => x.date).sort();
    const months = monthsBetween(
        (dates[0] ?? "").slice(0, 7),
        (dates.at(-1) ?? "").slice(0, 7),
    );
    const at = (id: string, month: string) =>
        priceOn(byId.get(id) ?? [], monthEnd(month));
    const out: IndexPoint[] = [];
    for (const month of months) {
        const prev = out.at(-1);
        if (!prev) {
            const n = ids.filter((id) => at(id, month) !== null).length;
            if (n >= 2) out.push({ month, index: 100, matched: n });
            continue;
        }
        const logs = ids.flatMap((id) => {
            const a = at(id, prev.month);
            const b = at(id, month);
            return a && b ? [Math.log(b / a)] : [];
        });
        const link = logs.length
            ? Math.exp(logs.reduce((s, x) => s + x, 0) / logs.length)
            : 1;
        out.push({ month, index: prev.index * link, matched: logs.length });
    }
    return out;
}

// NdPr oxide (FOB China) in each month, from the /metals series.
export function ndprByMonth(months: readonly string[]): (number | null)[] {
    return months.map((m) => priceAt("ndpr-oxide", m)?.value.value ?? null);
}

export function pearson(xs: number[], ys: number[]): number | null {
    const fit = ols(xs, ys);
    if (!fit) return null;
    return Math.sign(fit.b) * Math.sqrt(fit.r2);
}

export const MIN_CORRELATION_MONTHS = 6;

// Correlation of monthly log changes in the index with NdPr's log changes
// `lag` months earlier, for lag 0..maxLag. Null r until enough months.
export function lagCorrelation(
    index: readonly IndexPoint[],
    ndpr: readonly (number | null)[],
    maxLag = 6,
): { lag: number; r: number | null; n: number }[] {
    const dIdx = index.map((p, i) => {
        const prev = index[i - 1];
        return i > 0 && prev ? Math.log(p.index / prev.index) : null;
    });
    const dM = ndpr.map((v, i) => {
        const prev = ndpr[i - 1];
        return i > 0 && v && prev ? Math.log(v / prev) : null;
    });
    return Array.from({ length: maxLag + 1 }, (_, lag) => {
        const xs: number[] = [];
        const ys: number[] = [];
        for (let i = lag; i < dIdx.length; i++) {
            const a = dIdx[i];
            const b = dM[i - lag];
            if (a != null && b != null) {
                xs.push(b);
                ys.push(a);
            }
        }
        return {
            lag,
            r: xs.length >= MIN_CORRELATION_MONTHS ? pearson(xs, ys) : null,
            n: xs.length,
        };
    });
}
