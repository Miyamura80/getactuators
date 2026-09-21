import type { Actuator, CategorySlug, SortDir } from "../types";
import { CATEGORIES } from "../types";
import { COLUMN_MAP } from "./columns";

const CATEGORY_SLUGS = new Set<string>(CATEGORIES.map((c) => c.slug));

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

// Serialize the filter state into a query string (with leading "?", or empty
// when nothing is active) so a filtered view is shareable and survives a
// refresh. Only non-default values are written, keeping clean URLs the norm.
export function filtersToQuery(f: FilterState): string {
    const p = new URLSearchParams();
    if (f.search) p.set("q", f.search);
    if (f.categories.size) p.set("cat", [...f.categories].join(","));
    if (f.useCases.size) p.set("use", [...f.useCases].join(","));
    if (f.sortKey !== DEFAULT_FILTERS.sortKey) p.set("sort", f.sortKey);
    if (f.sortDir !== DEFAULT_FILTERS.sortDir) p.set("dir", f.sortDir);
    const s = p.toString();
    return s ? `?${s}` : "";
}

// Parse a query string back into filter state. Unknown category slugs and sort
// keys are dropped so a stale or hand-edited URL still yields a valid view.
// The legacy `use` deep-link (robot-type tiles) keeps working unchanged.
export function filtersFromQuery(search: string): FilterState {
    const p = new URLSearchParams(search);
    const cats = (p.get("cat") ?? "")
        .split(",")
        .filter((s): s is CategorySlug => CATEGORY_SLUGS.has(s));
    const uses = (p.get("use") ?? "").split(",").filter(Boolean);
    const sort = p.get("sort");
    const dir = p.get("dir");
    return {
        search: p.get("q") ?? "",
        categories: new Set(cats),
        useCases: new Set(uses),
        // Object.hasOwn, not COLUMN_MAP[sort]: a crafted ?sort=toString would
        // otherwise match an inherited prototype member and crash applyFilters.
        sortKey:
            sort && Object.hasOwn(COLUMN_MAP, sort) ? sort : DEFAULT_FILTERS.sortKey,
        sortDir: dir === "asc" || dir === "desc" ? dir : DEFAULT_FILTERS.sortDir,
    };
}
