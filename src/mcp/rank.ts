import type { Actuator } from "@/catalog";

// Deterministic, explainable scoring used by compare_actuators and
// recommend_actuators. No model calls: the same input always ranks the same.

export type Metric =
    | "peak_torque_nm"
    | "rated_torque_nm"
    | "max_speed_rpm"
    | "weight_g"
    | "torque_density_nm_per_kg"
    | "price_usd"
    | "price_per_nm"
    | "backlash_arcmin";

export const METRICS: Record<Metric, { higherIsBetter: boolean; unit: string }> = {
    peak_torque_nm: { higherIsBetter: true, unit: "N.m" },
    rated_torque_nm: { higherIsBetter: true, unit: "N.m" },
    max_speed_rpm: { higherIsBetter: true, unit: "rpm" },
    weight_g: { higherIsBetter: false, unit: "g" },
    torque_density_nm_per_kg: { higherIsBetter: true, unit: "N.m/kg" },
    price_usd: { higherIsBetter: false, unit: "USD" },
    price_per_nm: { higherIsBetter: false, unit: "USD per N.m" },
    backlash_arcmin: { higherIsBetter: false, unit: "arcmin" },
};

export const PRIORITIES = {
    balanced: {
        torque_density_nm_per_kg: 0.35,
        price_per_nm: 0.25,
        peak_torque_nm: 0.2,
        weight_g: 0.1,
        backlash_arcmin: 0.1,
    },
    torque_density: {
        torque_density_nm_per_kg: 0.7,
        peak_torque_nm: 0.15,
        weight_g: 0.15,
    },
    low_price: { price_usd: 0.5, price_per_nm: 0.3, torque_density_nm_per_kg: 0.2 },
    high_torque: {
        peak_torque_nm: 0.6,
        rated_torque_nm: 0.2,
        torque_density_nm_per_kg: 0.2,
    },
    low_weight: { weight_g: 0.6, torque_density_nm_per_kg: 0.4 },
    precision: {
        backlash_arcmin: 0.6,
        rated_torque_nm: 0.2,
        torque_density_nm_per_kg: 0.2,
    },
} as const satisfies Record<string, Partial<Record<Metric, number>>>;

export type Priority = keyof typeof PRIORITIES;

function isBetter(metric: Metric, v: number, than: number | null): boolean {
    if (than === null) return true;
    return METRICS[metric].higherIsBetter ? v > than : v < than;
}

function pickBest(items: readonly Actuator[], metric: Metric): Actuator | null {
    let best: Actuator | null = null;
    for (const a of items) {
        const v = a[metric];
        if (v !== null && isBetter(metric, v, best?.[metric] ?? null)) best = a;
    }
    return best;
}

// Best actuator per metric; null when no candidate documents that metric.
export function bestPerMetric(items: readonly Actuator[]) {
    return (Object.keys(METRICS) as Metric[]).map((metric) => {
        const best = pickBest(items, metric);
        return {
            metric,
            unit: METRICS[metric].unit,
            direction: METRICS[metric].higherIsBetter
                ? ("higher_is_better" as const)
                : ("lower_is_better" as const),
            actuator_id: best?.id ?? null,
            value: best?.[metric] ?? null,
        };
    });
}

function normalized(items: readonly Actuator[], metric: Metric): Map<string, number> {
    const vals = items.flatMap((a) => (a[metric] === null ? [] : [a[metric]]));
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const out = new Map<string, number>();
    for (const a of items) {
        const v = a[metric];
        if (v === null) continue;
        const t = hi === lo ? 1 : (v - lo) / (hi - lo);
        out.set(a.id, METRICS[metric].higherIsBetter ? t : 1 - t);
    }
    return out;
}

function rankOf(items: readonly Actuator[], a: Actuator, metric: Metric): number {
    const v = a[metric];
    const better = items.filter((x) => {
        const xv = x[metric];
        return xv !== null && v !== null && xv !== v && isBetter(metric, xv, v);
    });
    return better.length + 1;
}

export interface Scored {
    actuator: Actuator;
    score: number;
    reasons: string[];
    missing_data: Metric[];
}

// Weighted sum of min-max normalized metrics across the candidate set.
// Undocumented (null) metrics score 0, so sparse datasheets rank lower and
// are listed under missing_data instead of being guessed.
export function scoreCandidates(
    items: readonly Actuator[],
    priority: Priority,
): Scored[] {
    const weights = Object.entries(PRIORITIES[priority]) as [Metric, number][];
    const norms = new Map(weights.map(([m]) => [m, normalized(items, m)]));
    const total = weights.reduce((s, [, w]) => s + w, 0);
    const scored = items.map((a) => {
        let sum = 0;
        const reasons: string[] = [];
        const missing: Metric[] = [];
        for (const [m, w] of weights) {
            const n = norms.get(m)?.get(a.id);
            if (n === undefined) {
                missing.push(m);
                continue;
            }
            sum += w * n;
            const r = rankOf(items, a, m);
            reasons.push(
                `${m} ${a[m]} ${METRICS[m].unit} (rank ${r} of ${items.length})`,
            );
        }
        if (a.verified) reasons.push("specs verified against manufacturer sources");
        // 0-98 from the metrics, +2 for verified specs: a 0-100 scale.
        const score = Math.round((980 * sum) / total + (a.verified ? 20 : 0)) / 10;
        return { actuator: a, score, reasons, missing_data: missing };
    });
    return scored.sort(
        (x, y) => y.score - x.score || x.actuator.id.localeCompare(y.actuator.id),
    );
}
