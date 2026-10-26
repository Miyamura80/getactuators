import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import type { CategorySlug } from "../types";
import { CATEGORIES, CATEGORY_MAP, USE_CASE_LABELS } from "../types";
import { activeFilterCount, type FilterState } from "../lib/filter";

interface Country {
    country: string;
    flag: string;
    count: number;
}

interface Props {
    filters: FilterState;
    counts: Record<CategorySlug, number>;
    countries: Country[];
    useCases: string[];
    total: number;
    shown: number;
    onChange: (next: FilterState) => void;
    // Extra controls at the end of the search row (e.g. a view switch).
    children?: ReactNode;
}

function toggle<T>(set: Set<T>, v: T): Set<T> {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    return next;
}

const ucLabel = (u: string) => {
    const raw = USE_CASE_LABELS[u] ?? u.replace(/_/g, " ");
    return raw.charAt(0).toUpperCase() + raw.slice(1);
};

function FunnelIcon() {
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
                d="M3 5h18l-7 8.5V19l-4 2v-7.5L3 5z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function FilterBar({
    filters,
    counts,
    countries,
    useCases,
    total,
    shown,
    onChange,
    children,
}: Props) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);
    const panelId = useId();
    const n = activeFilterCount(filters);
    const flagOf = new Map(countries.map((c) => [c.country, c.flag]));
    // Clearing drops the folded-away choices; the search box has its own clear.
    const clear = () =>
        onChange({ ...filters, categories: new Set(), useCases: new Set(), countries: new Set() });

    // Close on Escape or a click outside the button + panel.
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
        const onDown = (e: PointerEvent) => {
            if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("keydown", onKey);
        document.addEventListener("pointerdown", onDown);
        return () => {
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("pointerdown", onDown);
        };
    }, [open]);

    // Active choices stay visible as removable pills while the panel is shut.
    const pills = [
        ...[...filters.categories].map((c) => ({
            key: `cat:${c}`,
            label: CATEGORY_MAP[c]?.label ?? c,
            name: CATEGORY_MAP[c]?.label ?? c,
            hue: CATEGORY_MAP[c]?.hue,
            remove: () => onChange({ ...filters, categories: toggle(filters.categories, c) }),
        })),
        ...[...filters.countries].map((c) => ({
            key: `country:${c}`,
            label: `${flagOf.get(c) ?? ""} ${c}`.trim(),
            name: c,
            hue: undefined,
            remove: () => onChange({ ...filters, countries: toggle(filters.countries, c) }),
        })),
        ...[...filters.useCases].map((u) => ({
            key: `use:${u}`,
            label: ucLabel(u),
            name: ucLabel(u),
            hue: undefined,
            remove: () => onChange({ ...filters, useCases: toggle(filters.useCases, u) }),
        })),
    ];

    return (
        <div className="filterbar" ref={wrapRef}>
            <div className="filterbar-row">
                <input
                    id="search"
                    className="search"
                    type="search"
                    placeholder="Search actuators, brands..."
                    value={filters.search}
                    onChange={(e) => onChange({ ...filters, search: e.target.value })}
                />
                <button
                    type="button"
                    className="filter-toggle"
                    aria-label={n ? `Filters, ${n} active` : "Filters"}
                    title="Filters"
                    aria-expanded={open}
                    aria-controls={panelId}
                    data-on={open || n > 0}
                    onClick={() => setOpen((o) => !o)}
                >
                    <FunnelIcon />
                    {n > 0 && <span className="filter-badge">{n}</span>}
                </button>
                <span className="count" title={`${shown} of ${total} shown`}>
                    {shown} / {total}
                </span>
                {children}
            </div>

            {pills.length > 0 && (
                <div className="filter-pills" aria-label="Active filters">
                    {pills.map((p) => (
                        <button
                            type="button"
                            key={p.key}
                            className="chip filter-pill"
                            data-on="true"
                            style={p.hue != null ? { ["--hue" as string]: String(p.hue) } : undefined}
                            aria-label={`Clear filter: ${p.name}`}
                            onClick={p.remove}
                        >
                            {p.label}
                            <span aria-hidden="true">×</span>
                        </button>
                    ))}
                    <button type="button" className="reset" onClick={clear}>
                        Clear
                    </button>
                </div>
            )}

            {open && (
                <div className="filter-panel" id={panelId} role="dialog" aria-label="Filters">
                    <fieldset>
                        <legend>Category</legend>
                        <div className="chips" role="group" aria-label="Category filter">
                            {CATEGORIES.map((c) => (
                                <button
                                    type="button"
                                    key={c.slug}
                                    className="chip"
                                    aria-pressed={filters.categories.has(c.slug)}
                                    data-on={filters.categories.has(c.slug)}
                                    style={{ ["--hue" as string]: String(c.hue) }}
                                    onClick={() =>
                                        onChange({
                                            ...filters,
                                            categories: toggle(filters.categories, c.slug),
                                        })
                                    }
                                >
                                    <span className="chip-swatch" aria-hidden="true" />
                                    {c.label}
                                    <span className="chip-count">{counts[c.slug] ?? 0}</span>
                                </button>
                            ))}
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend>Country</legend>
                        <div className="chips" role="group" aria-label="Country filter">
                            {countries.map((c) => (
                                <button
                                    type="button"
                                    key={c.country}
                                    className="chip"
                                    aria-pressed={filters.countries.has(c.country)}
                                    data-on={filters.countries.has(c.country)}
                                    title={c.country}
                                    onClick={() =>
                                        onChange({
                                            ...filters,
                                            countries: toggle(filters.countries, c.country),
                                        })
                                    }
                                >
                                    <span className="chip-flag" aria-hidden="true">{c.flag}</span>
                                    {c.country}
                                    <span className="chip-count">{c.count}</span>
                                </button>
                            ))}
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend>Use case</legend>
                        <div className="chips" role="group" aria-label="Use case filter">
                            {useCases.map((u) => (
                                <button
                                    type="button"
                                    key={u}
                                    className="chip chip-uc"
                                    aria-pressed={filters.useCases.has(u)}
                                    data-on={filters.useCases.has(u)}
                                    onClick={() =>
                                        onChange({ ...filters, useCases: toggle(filters.useCases, u) })
                                    }
                                >
                                    {ucLabel(u)}
                                </button>
                            ))}
                        </div>
                    </fieldset>

                    <div className="filter-panel-foot">
                        <span className="count">{shown} / {total}</span>
                        {n > 0 && (
                            <button type="button" className="reset" onClick={clear}>
                                Clear
                            </button>
                        )}
                        <button type="button" className="reset primary" onClick={() => setOpen(false)}>
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
