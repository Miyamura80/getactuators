import { PublicHeader } from "../components/PublicHeader";
import { PublicFooter } from "../components/PublicFooter";
import { useEffect, useMemo, useState } from "react";
import type { Actuator } from "../types";
import { ACTUATORS, allUseCases, categoryCounts, countryCounts, maxValue } from "../lib/data";
import { COLUMNS } from "../lib/columns";
import {
    applyFilters,
    DEFAULT_FILTERS,
    filtersFromQuery,
    filtersToQuery,
} from "../lib/filter";
import type { FilterState } from "../lib/filter";
import { useLocationKey } from "../lib/router";
import { selectedIds } from "../lib/compare-selection";
import { BrandGlyph } from "../components/BrandGlyph";
import { FilterBar } from "../components/FilterBar";
import { Leaderboard } from "../components/Leaderboard";
import { DetailPanel } from "../components/DetailPanel";
import { ComparePanel } from "../components/ComparePanel";

const COMPARE_MAX = 4;

// The whole filter/search/sort state lives in the URL so a filtered view is
// shareable and survives a refresh (the robot-type tiles' /all?use=<tag>
// deep-link is one case of this). The open detail drawer rides in the same URL
// as ?sel=<id>, so every actuator has a shareable deeplink. Read once for the
// initial state; the effects below keep state and URL in sync from there.
function initialFilters(): FilterState {
    if (typeof window === "undefined") return DEFAULT_FILTERS;
    return filtersFromQuery(window.location.search);
}

function actuatorFromQuery(search: string): Actuator | null {
    const id = new URLSearchParams(search).get("sel");
    return id ? (ACTUATORS.find((a) => a.id === id) ?? null) : null;
}

// Build the page URL from the current filters plus the selected actuator, so a
// single writer owns the query string. filtersToQuery drops defaults; ?sel is
// merged on top and the hash is preserved (filtering must not scroll-reset).
function buildUrl(filters: FilterState, selId: string | null, compare: Set<string>): string {
    const params = new URLSearchParams(window.location.search);
    for (const key of ["q", "cat", "use", "country", "sort", "dir", "sel", "compare"]) params.delete(key);
    new URLSearchParams(filtersToQuery(filters)).forEach((value, key) => params.set(key, value));
    if (selId) params.set("sel", selId);
    const ids = selectedIds(`?compare=${encodeURIComponent([...compare].join(","))}`);
    if (ids.length) params.set("compare", ids.join(","));
    const q = params.toString();
    return `${window.location.pathname}${q ? `?${q}` : ""}${window.location.hash}`;
}

export function AllActuators({ menuOpen = false }: { menuOpen?: boolean }) {
    const [filters, setFilters] = useState<FilterState>(initialFilters);
    const [selected, setSelected] = useState<Actuator | null>(() =>
        typeof window === "undefined"
            ? null
            : actuatorFromQuery(window.location.search),
    );
    const [compare, setCompare] = useState<Set<string>>(() =>
        new Set(typeof window === "undefined" ? [] : selectedIds(window.location.search)),
    );
    const [showCompare, setShowCompare] = useState(false);
    const locKey = useLocationKey();

    const counts = useMemo(() => categoryCounts(), []);
    const useCases = useMemo(() => allUseCases(), []);
    const countries = useMemo(() => countryCounts(), []);
    const maxes = useMemo(() => {
        const m: Record<string, number> = {};
        for (const c of COLUMNS) if (c.bar) m[c.key] = maxValue(ACTUATORS, c.value);
        return m;
    }, []);

    // Resync all URL-owned state on external navigation (back/forward, or a
    // command-palette jump while already on /all). User-action writers do not
    // emit navigation events, and restoration never writes history.
    // biome-ignore lint/correctness/useExhaustiveDependencies: locKey is the trigger; we intentionally read live location, not stale closures.
    useEffect(() => {
        setFilters(filtersFromQuery(window.location.search));
        setSelected(actuatorFromQuery(window.location.search));
        const restored = new Set(selectedIds(window.location.search));
        setCompare(restored);
        if (!restored.size) setShowCompare(false);
    }, [locKey]);

    const rows = useMemo(() => applyFilters(ACTUATORS, filters), [filters]);
    const compareRows = useMemo(
        () => ACTUATORS.filter((a) => compare.has(a.id)),
        [compare],
    );

    const onSort = (key: string) => onFiltersChange({
        ...filters,
        sortKey: key,
        sortDir: filters.sortKey === key ? (filters.sortDir === "asc" ? "desc" : "asc") : "desc",
    });

    // User actions alone write history. Restoration never writes, avoiding
    // stale-state effects that overwrite a back/forward target.
    const writeUrl = (nextFilters: FilterState, nextSelected: Actuator | null, nextCompare: Set<string>, push = false) => {
        const url = buildUrl(nextFilters, nextSelected?.id ?? null, nextCompare);
        if (url === `${window.location.pathname}${window.location.search}${window.location.hash}`) return;
        window.history[push ? "pushState" : "replaceState"](window.history.state, "", url);
    };
    const onFiltersChange = (next: FilterState) => {
        writeUrl(next, selected, compare);
        setFilters(next);
    };
    const onSelect = (next: Actuator | null) => {
        writeUrl(filters, next, compare);
        setSelected(next);
    };
    const updateCompare = (next: Set<string>) => {
        writeUrl(filters, selected, next, true);
        setCompare(next);
    };
    const onToggleCompare = (id: string) => {
        if (!ACTUATORS.some(a => a.id === id)) return;
        const next = new Set(compare);
        if (next.has(id)) next.delete(id);
        else if (next.size < COMPARE_MAX) next.add(id);
        else return;
        updateCompare(next);
    };

    return (
        <div className="gallery-page">
            <PublicHeader path="/all" initialOpen={menuOpen} />

            <section className="gallery-hero">
                <h1>
                    <BrandGlyph className="block-tag" />
                    All actuators
                </h1>
                <p>
                    Every rotary actuator in the dataset. Filter by type, country and use,
                    sort by torque, density, price, speed and more. Every row links back to its source.
                </p>
            </section>

            <section id="table" className="block">
                <FilterBar
                    filters={filters}
                    counts={counts}
                    countries={countries}
                    useCases={useCases}
                    total={ACTUATORS.length}
                    shown={rows.length}
                    onChange={onFiltersChange}
                />
                <Leaderboard
                    rows={rows}
                    sortKey={filters.sortKey}
                    sortDir={filters.sortDir}
                    maxes={maxes}
                    compare={compare}
                    onSort={onSort}
                    onToggleCompare={onToggleCompare}
                    onSelect={onSelect}
                />
            </section>

            <p className="foot">
                Community dataset {"·"} v1 sourced from manufacturer pages via web
                search {"·"} every row links its source {"·"} verify against
                datasheets before engineering use.
            </p>
                <PublicFooter />

            {compare.size > 0 && !showCompare && (
                <div className="compare-dock">
                    <span>
                        {compare.size} selected {compare.size >= COMPARE_MAX && "(max)"}
                    </span>
                    <button type="button" onClick={() => updateCompare(new Set())}>
                        Clear
                    </button>
                    <button
                        type="button"
                        className="primary"
                        disabled={compare.size < 2}
                        onClick={() => {
                            if (compareRows.length < 2) return;
                            window.dispatchEvent(new CustomEvent("actuatorlist:compare", { detail: { action: "open", productIds: compareRows.map((a) => a.id) } }));
                            setShowCompare(true);
                        }}
                    >
                        Compare
                    </button>
                </div>
            )}

            {showCompare && (
                <ComparePanel
                    actuators={compareRows}
                    onRemove={(id) => {
                        window.dispatchEvent(new CustomEvent("actuatorlist:compare", { detail: { action: "update", productIds: compareRows.filter((a) => a.id !== id).map((a) => a.id) } }));
                        onToggleCompare(id);
                        // Removing the last row empties the panel; drop back to the
                        // compare dock so the next selection starts clean.
                        if (compare.size === 1) setShowCompare(false);
                    }}
                    onClose={() => setShowCompare(false)}
                />
            )}

            <DetailPanel actuator={selected} onClose={() => onSelect(null)} />
        </div>
    );
}
