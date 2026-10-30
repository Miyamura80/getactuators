import { useEffect, useMemo, useState } from "react";
import { PublicHeader } from "../../components/PublicHeader";
import { PublicFooter } from "../../components/PublicFooter";
import { BrandGlyph } from "../../components/BrandGlyph";
import { FilterBar } from "../../components/FilterBar";
import { Leaderboard } from "../../components/Leaderboard";
import { DetailPanel } from "../../components/DetailPanel";
import { CompareTray } from "../../components/CompareTray";
import { galleryGroups, type GalleryGrouping } from "../../../../src/catalog/gallery";
import type { Actuator } from "../../types";
import { ACTUATORS, allUseCases, categoryCounts, countryCounts, maxValue } from "../../lib/data";
import { COLUMNS } from "../../lib/columns";
import { applyFilters, DEFAULT_FILTERS, filtersFromQuery, type FilterState } from "../../lib/filter";
import { useCompareSelection } from "../../lib/compare-selection";
import { useLocationKey } from "../../lib/router";
import { GalleryView } from "./GalleryView";
import { ViewSwitch } from "./ViewSwitch";
import {
    actuatorFromQuery,
    buildUrl,
    type CatalogUrlState,
    type CatalogView,
    groupingFromQuery,
    rememberView,
    viewFromQuery,
} from "./url-state";

const GROUPINGS: { key: GalleryGrouping; label: string }[] = [
    { key: "type", label: "Actuator type" },
    { key: "application", label: "Application" },
];

const DEFAULT_STATE: CatalogUrlState = {
    filters: DEFAULT_FILTERS,
    view: "gallery",
    by: "type",
    selected: null,
};

function stateFromUrl(): CatalogUrlState {
    const search = window.location.search;
    return {
        filters: filtersFromQuery(search),
        view: viewFromQuery(search),
        by: groupingFromQuery(search),
        selected: actuatorFromQuery(search),
    };
}

// One catalog page with switchable views, like a Finder window: the Gallery
// (photo cards grouped by type or application) and the List (sortable spec
// table). Search and filters apply to both. All of it lives in the URL so a
// view is shareable; the last view picked is remembered for the next visit.
//
// The prerendered document is always the default gallery, so a hydrating
// mount starts from defaults and applies the URL after hydration.
export function ActuatorsPage({ menuOpen = false, prerendered = false }: { menuOpen?: boolean; prerendered?: boolean }) {
    const [state, setState] = useState<CatalogUrlState>(() =>
        prerendered || typeof window === "undefined" ? DEFAULT_STATE : stateFromUrl(),
    );
    const { filters, view, by, selected } = state;
    const selection = useCompareSelection();
    const locKey = useLocationKey();

    // Resync on external navigation (back/forward, or a command-palette jump
    // while already here). User-action writers do not emit navigation events.
    // biome-ignore lint/correctness/useExhaustiveDependencies: locKey is the trigger; we intentionally read live location.
    useEffect(() => {
        setState(stateFromUrl());
    }, [locKey]);

    const counts = useMemo(() => categoryCounts(), []);
    const useCases = useMemo(() => allUseCases(), []);
    const countries = useMemo(() => countryCounts(), []);
    const maxes = useMemo(() => {
        const m: Record<string, number> = {};
        for (const c of COLUMNS) if (c.bar) m[c.key] = maxValue(ACTUATORS, c.value);
        return m;
    }, []);

    const rows = useMemo(() => applyFilters(ACTUATORS, filters), [filters]);
    // The gallery orders its own sections; keep catalog order for stable ties.
    const sections = useMemo(() => {
        const shown = new Set(rows.map((a) => a.id));
        return galleryGroups(ACTUATORS.filter((a) => shown.has(a.id)), by);
    }, [rows, by]);

    const update = (patch: Partial<CatalogUrlState>) => {
        const next = { ...state, ...patch };
        const url = buildUrl(next);
        if (url !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
            window.history.replaceState(window.history.state, "", url);
        }
        setState(next);
    };
    const onView = (next: CatalogView) => {
        rememberView(next);
        update({ view: next });
    };
    const onFilters = (next: FilterState) => update({ filters: next });
    const onSelect = (next: Actuator | null) => update({ selected: next });
    const onSort = (key: string) => onFilters({
        ...filters,
        sortKey: key,
        sortDir: filters.sortKey === key ? (filters.sortDir === "asc" ? "desc" : "asc") : "desc",
    });

    return (
        <div className="gallery-page">
            <PublicHeader path="/actuators" initialOpen={menuOpen} />

            <section className="gallery-hero">
                <h1>
                    <BrandGlyph className="block-tag" />
                    Actuators
                </h1>
                <p>
                    {ACTUATORS.length} rotary actuators. Browse them as a gallery or a
                    sortable spec table; search and filters apply to both.
                </p>
            </section>

            <div className="catalog" data-view={view}>
                <div className="gallery-toolbar">
                    <FilterBar
                        filters={filters}
                        counts={counts}
                        countries={countries}
                        useCases={useCases}
                        total={ACTUATORS.length}
                        shown={rows.length}
                        onChange={onFilters}
                    >
                        <ViewSwitch view={view} onChange={onView} />
                    </FilterBar>
                    {view === "gallery" && (
                        <div className="gallery-toolbar-row">
                            <div className="gallery-group-by" role="group" aria-label="Group actuators by">
                                <span>Group by</span>
                                {GROUPINGS.map((g) => (
                                    <button
                                        key={g.key}
                                        type="button"
                                        aria-pressed={by === g.key}
                                        onClick={() => update({ by: g.key })}
                                    >
                                        {g.label}
                                    </button>
                                ))}
                            </div>
                            <nav className="gallery-jump" aria-label="Jump to section">
                                {sections.map((s) => (
                                    <a key={s.key} href={`#${by}-${s.key}`}>
                                        {s.label} <b>{s.cards.length}</b>
                                    </a>
                                ))}
                            </nav>
                        </div>
                    )}
                </div>

                {view === "gallery" ? (
                    sections.length ? (
                        <GalleryView
                            sections={sections}
                            by={by}
                            picked={selection.ids}
                            pickReady={selection.ready}
                            onPick={selection.toggle}
                        />
                    ) : (
                        <p className="catalog-empty">No actuators match these filters.</p>
                    )
                ) : (
                    <section id="table" className="block">
                        <Leaderboard
                            rows={rows}
                            sortKey={filters.sortKey}
                            sortDir={filters.sortDir}
                            maxes={maxes}
                            compare={new Set(selection.ids)}
                            onSort={onSort}
                            onToggleCompare={selection.toggle}
                            onSelect={onSelect}
                        />
                    </section>
                )}
            </div>

            <p className="foot">
                Community dataset {"·"} sourced from manufacturer pages {"·"} every
                row links its source {"·"} verify against datasheets before engineering use.
                Gallery renders without a photo are schematic, drawn from the category.
            </p>
            <CompareTray rows={selection.rows} remove={selection.toggle} clear={() => selection.update([])} />
            <noscript>Picking requires JavaScript. Open product links for specifications, or use a shared /compare?compare=id,id URL.</noscript>
            <PublicFooter />

            <DetailPanel actuator={selected} onClose={() => onSelect(null)} />
        </div>
    );
}
