import type { Actuator, CategorySlug, SortDir } from "../types";
import { COLUMN_MAP } from "./columns";

export interface FilterState {
    search: string;
    categories: Set<CategorySlug>;
    useCases: Set<string>;
    sortKey: string;
    sortDir: SortDir;
}

export const DEFAULT_FILTERS: FilterState = {
    search: "",
    categories: new Set(),
    useCases: new Set(),
    sortKey: "torque_density_nm_per_kg",
    sortDir: "desc",
};

function matchesSearch(a: Actuator, q: string): boolean {
    if (!q) return true;
    const hay = `${a.name} ${a.brand} ${a.category} ${(a.notes ?? "")}`.toLowerCase();
    return q
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .every((term) => hay.includes(term));
}

export function applyFilters(list: Actuator[], f: FilterState): Actuator[] {
    const col = COLUMN_MAP[f.sortKey];
    const filtered = list.filter(
        (a) =>
            matchesSearch(a, f.search) &&
            (f.categories.size === 0 || f.categories.has(a.category)) &&
            (f.useCases.size === 0 ||
                (a.use_cases ?? []).some((u) => f.useCases.has(u))),
    );

    if (!col) return filtered;
    const dir = f.sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
        const va = col.value(a);
        const vb = col.value(b);
        // Always push nulls to the bottom, regardless of sort direction.
        if (va == null && vb == null) return 0;
        if (va == null) return 1;
        if (vb == null) return -1;
        return (va - vb) * dir;
    });
}
