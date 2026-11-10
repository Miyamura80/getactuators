import { type CategorySlug, getActuator } from "../catalog";
import { PRICE_POINTS, isPriced, yearFraction } from "./history";
import type { PricePoint } from "./types";

// $/N·m over time per actuator class, with a fitted learning curve.
//
// Method: least squares on log10($/N·m) against calendar year with one
// intercept per actuator (a within, or fixed-effects, fit). Each actuator is
// compared only with itself, so a class whose newer models are cheaper per
// N·m does not read as a price fall. Actuators with a single dated price add
// nothing to the slope; they are drawn but not fitted. R² is the share of the
// within-actuator variance the line explains.

export const FIT_METHOD =
    "Least squares on log10($/N·m) vs year, one intercept per actuator (within fit); R² is within-actuator. Actuators with one price are drawn, not fitted.";

export const CLASS_ORDER: readonly CategorySlug[] = [
    "qdd_proprioceptive",
    "integrated_joint",
    "smart_servo",
    "harmonic_precision",
    "cycloidal_premium",
    "frameless_driver",
];

export const CLASS_LABEL: Record<CategorySlug, string> = {
    qdd_proprioceptive: "QDD",
    integrated_joint: "Integrated joint",
    smart_servo: "Smart servo",
    harmonic_precision: "Harmonic",
    cycloidal_premium: "Cycloidal",
    frameless_driver: "Frameless kit",
};

export interface ClassPoint {
    point: PricePoint;
    year: number;
    usdPerNm: number;
}

export interface ClassFit {
    // Slope in log10($/N·m) per year.
    slope: number;
    // 10^slope - 1: the fitted change per year.
    annualChange: number;
    r2: number;
    // Points and actuators that entered the fit.
    n: number;
    actuators: number;
    // The fitted line through the centre of the fitted points.
    line: readonly [[number, number], [number, number]];
}

export interface ClassTrend {
    category: CategorySlug;
    label: string;
    points: ClassPoint[];
    // Null when fewer than 3 points from actuators with 2+ dated prices.
    fit: ClassFit | null;
}

const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;

export function classPoints(category: CategorySlug): ClassPoint[] {
    return PRICE_POINTS.filter(
        (p) =>
            isPriced(p) &&
            p.usdPerNm !== null &&
            getActuator(p.actuatorId)?.category === category,
    ).map((p) => ({
        point: p,
        year: yearFraction(p.date),
        usdPerNm: p.usdPerNm as number,
    }));
}

// The within fit described above; exported for tests.
export function withinFit(points: ClassPoint[]): ClassFit | null {
    const groups = new Map<string, ClassPoint[]>();
    for (const p of points) {
        const g = groups.get(p.point.actuatorId) ?? [];
        g.push(p);
        groups.set(p.point.actuatorId, g);
    }
    const used = [...groups.values()].filter(
        (g) => new Set(g.map((p) => p.year)).size > 1,
    );
    const rows = used.flatMap((g) => {
        const mx = mean(g.map((p) => p.year));
        const my = mean(g.map((p) => Math.log10(p.usdPerNm)));
        return g.map((p) => ({ x: p.year - mx, y: Math.log10(p.usdPerNm) - my, p }));
    });
    const sxx = rows.reduce((s, r) => s + r.x * r.x, 0);
    if (rows.length < 3 || sxx === 0) return null;
    const slope = rows.reduce((s, r) => s + r.x * r.y, 0) / sxx;
    const sst = rows.reduce((s, r) => s + r.y * r.y, 0);
    const sse = rows.reduce((s, r) => s + (r.y - slope * r.x) ** 2, 0);
    const xs = rows.map((r) => r.p.year);
    const cx = mean(xs);
    const cy = mean(rows.map((r) => Math.log10(r.p.usdPerNm)));
    const at = (x: number): [number, number] => [x, 10 ** (cy + slope * (x - cx))];
    return {
        slope,
        annualChange: 10 ** slope - 1,
        r2: sst === 0 ? 1 : 1 - sse / sst,
        n: rows.length,
        actuators: used.length,
        line: [at(Math.min(...xs)), at(Math.max(...xs))],
    };
}

export function classTrends(): ClassTrend[] {
    return CLASS_ORDER.map((category) => {
        const points = classPoints(category);
        return {
            category,
            label: CLASS_LABEL[category],
            points,
            fit: withinFit(points),
        };
    }).filter((t) => t.points.length > 0);
}
