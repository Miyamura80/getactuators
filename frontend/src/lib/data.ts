import type { Actuator, CategorySlug } from "../types";
import raw from "../data/actuators.json";

export const ACTUATORS: Actuator[] = raw as unknown as Actuator[];

export function categoryCounts(): Record<CategorySlug, number> {
    const counts = {} as Record<CategorySlug, number>;
    for (const a of ACTUATORS) {
        counts[a.category] = (counts[a.category] ?? 0) + 1;
    }
    return counts;
}

// Use-case tags are free-form across sources; only surface the ones common
// enough to be useful filters (drops the long tail of one-off tags).
export function allUseCases(minCount = 3): string[] {
    const counts = new Map<string, number>();
    for (const a of ACTUATORS)
        for (const u of a.use_cases ?? []) counts.set(u, (counts.get(u) ?? 0) + 1);
    return [...counts.entries()]
        .filter(([, n]) => n >= minCount)
        .sort((a, b) => b[1] - a[1])
        .map(([u]) => u);
}

export function maxValue(
    list: Actuator[],
    f: (a: Actuator) => number | null,
): number {
    let max = 0;
    for (const a of list) {
        const v = f(a);
        if (typeof v === "number" && v > max) max = v;
    }
    return max || 1;
}

export const BRANDS = [...new Set(ACTUATORS.map((a) => a.brand))].sort();

// Countries with their flag, most actuators first, for the country filter.
export function countryCounts(): { country: string; flag: string; count: number }[] {
    const map = new Map<string, { country: string; flag: string; count: number }>();
    for (const a of ACTUATORS) {
        if (!a.country) continue;
        const row = map.get(a.country) ?? { country: a.country, flag: a.country_flag ?? "", count: 0 };
        row.count++;
        map.set(a.country, row);
    }
    return [...map.values()].sort((x, y) => y.count - x.count || x.country.localeCompare(y.country));
}
