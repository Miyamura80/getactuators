import { getActuator } from "../catalog";
import { PRICE_POINTS, isPriced } from "./history";

// $/N·m spread by country or brand in one calendar year. Each actuator counts
// once per year (its last priced point that year), so a product snapshotted
// every week weighs the same as one priced once.

export type GroupBy = "country" | "brand";

export interface GroupValue {
    actuatorId: string;
    usdPerNm: number;
}

export interface GroupStats {
    group: string;
    n: number;
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
    values: GroupValue[];
}

// Linear-interpolated quantile of sorted values.
export function quantile(sorted: number[], q: number): number {
    const pos = (sorted.length - 1) * q;
    const lo = Math.floor(pos);
    const hi = Math.ceil(pos);
    const a = sorted[lo] ?? 0;
    const b = sorted[hi] ?? a;
    return a + (b - a) * (pos - lo);
}

// Calendar years with at least one $/N·m point, oldest first.
export function priceYears(): number[] {
    return [
        ...new Set(
            PRICE_POINTS.filter((p) => isPriced(p) && p.usdPerNm !== null).map((p) =>
                Number(p.date.slice(0, 4)),
            ),
        ),
    ].sort((a, b) => a - b);
}

function yearValues(year: number): GroupValue[] {
    const last = new Map<string, GroupValue>();
    for (const p of PRICE_POINTS)
        if (isPriced(p) && p.usdPerNm !== null && p.date.startsWith(String(year)))
            last.set(p.actuatorId, { actuatorId: p.actuatorId, usdPerNm: p.usdPerNm });
    return [...last.values()];
}

// Groups by median $/N·m, cheapest first.
export function groupStats(by: GroupBy, year: number): GroupStats[] {
    const groups = new Map<string, GroupValue[]>();
    for (const v of yearValues(year)) {
        const a = getActuator(v.actuatorId);
        const key = (by === "country" ? a?.country : a?.brand) ?? "Unknown";
        groups.set(key, [...(groups.get(key) ?? []), v]);
    }
    return [...groups.entries()]
        .map(([group, values]): GroupStats => {
            const s = values.map((v) => v.usdPerNm).sort((a, b) => a - b);
            return {
                group,
                n: s.length,
                min: s[0] ?? 0,
                q1: quantile(s, 0.25),
                median: quantile(s, 0.5),
                q3: quantile(s, 0.75),
                max: s.at(-1) ?? 0,
                values: [...values].sort((a, b) => a.usdPerNm - b.usdPerNm),
            };
        })
        .sort((a, b) => a.median - b.median || a.group.localeCompare(b.group));
}
