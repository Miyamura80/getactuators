import type { CategorySlug } from "../types";
import { CATEGORIES, USE_CASE_LABELS } from "../types";
import type { FilterState } from "../lib/filter";

interface Props {
    filters: FilterState;
    counts: Record<CategorySlug, number>;
    useCases: string[];
    total: number;
    shown: number;
    onChange: (next: FilterState) => void;
    onReset: () => void;
}

function toggle<T>(set: Set<T>, v: T): Set<T> {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    return next;
}

export function FilterBar({
    filters,
    counts,
    useCases,
    total,
    shown,
    onChange,
    onReset,
}: Props) {
    const ucLabel = (u: string) =>
        USE_CASE_LABELS[u] ?? u.replace(/_/g, " ");
    const active =
        filters.search !== "" ||
        filters.categories.size > 0 ||
        filters.useCases.size > 0;

    return (
        <div className="filterbar">
            <div className="filterbar-row">
                <input
                    id="search"
                    className="search"
                    type="search"
                    placeholder="Search actuators, brands..."
                    value={filters.search}
                    onChange={(e) => onChange({ ...filters, search: e.target.value })}
                />
                <span className="count">
                    {shown} / {total}
                </span>
                {active && (
                    <button type="button" className="reset" onClick={onReset}>
                        Clear
                    </button>
                )}
            </div>

            <div className="chips" role="group" aria-label="Category filter">
                {CATEGORIES.map((c) => (
                    <button
                        type="button"
                        key={c.slug}
                        className="chip"
                        data-on={filters.categories.has(c.slug)}
                        style={{ ["--hue" as string]: String(c.hue) }}
                        onClick={() =>
                            onChange({
                                ...filters,
                                categories: toggle(filters.categories, c.slug),
                            })
                        }
                    >
                        {c.label}
                        <span className="chip-count">{counts[c.slug] ?? 0}</span>
                    </button>
                ))}
            </div>

            <div className="chips chips-uc" role="group" aria-label="Use case filter">
                {useCases.map((u) => (
                    <button
                        type="button"
                        key={u}
                        className="chip chip-uc"
                        data-on={filters.useCases.has(u)}
                        onClick={() =>
                            onChange({ ...filters, useCases: toggle(filters.useCases, u) })
                        }
                    >
                        {ucLabel(u)}
                    </button>
                ))}
            </div>
        </div>
    );
}
