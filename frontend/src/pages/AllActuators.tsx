import { useMemo, useState } from "react";
import type { Actuator } from "../types";
import { ACTUATORS, allUseCases, categoryCounts, maxValue } from "../lib/data";
import { COLUMNS } from "../lib/columns";
import { applyFilters, DEFAULT_FILTERS } from "../lib/filter";
import type { FilterState } from "../lib/filter";
import { Link } from "../lib/router";
import { BrandMark } from "../components/BrandMark";
import { BrandGlyph } from "../components/BrandGlyph";
import { FilterBar } from "../components/FilterBar";
import { Leaderboard } from "../components/Leaderboard";
import { DetailPanel } from "../components/DetailPanel";
import { ComparePanel } from "../components/ComparePanel";

const COMPARE_MAX = 4;

// The robot-type tiles link here as /all?use=<tag> to open on a pre-filtered
// table. The query is read once for the initial state; the filter bar owns it
// afterwards.
function initialFilters(): FilterState {
    if (typeof window === "undefined") return DEFAULT_FILTERS;
    const use = new URLSearchParams(window.location.search).get("use");
    if (!use) return DEFAULT_FILTERS;
    return { ...DEFAULT_FILTERS, useCases: new Set(use.split(",").filter(Boolean)) };
}

export function AllActuators() {
    const [filters, setFilters] = useState<FilterState>(initialFilters);
    const [selected, setSelected] = useState<Actuator | null>(null);
    const [compare, setCompare] = useState<Set<string>>(new Set());
    const [showCompare, setShowCompare] = useState(false);

    const counts = useMemo(() => categoryCounts(), []);
    const useCases = useMemo(() => allUseCases(), []);
    const maxes = useMemo(() => {
        const m: Record<string, number> = {};
        for (const c of COLUMNS) if (c.bar) m[c.key] = maxValue(ACTUATORS, c.value);
        return m;
    }, []);

    const rows = useMemo(() => applyFilters(ACTUATORS, filters), [filters]);
    const compareRows = useMemo(
        () => ACTUATORS.filter((a) => compare.has(a.id)),
        [compare],
    );

    const onSort = (key: string) =>
        setFilters((f) => ({
            ...f,
            sortKey: key,
            sortDir: f.sortKey === key ? (f.sortDir === "asc" ? "desc" : "asc") : "desc",
        }));

    const onToggleCompare = (id: string) =>
        setCompare((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else if (next.size < COMPARE_MAX) next.add(id);
            return next;
        });

    return (
        <div className="gallery-page">
            <header className="page-bar">
                <Link to="/" className="page-brand" aria-label="getactuators home">
                    <BrandMark size={24} />
                    <span>
                        get<b>actuators</b>.com
                    </span>
                </Link>
                <nav className="page-nav">
                    <Link to="/" className="page-nav-link">
                        Leaderboard
                    </Link>
                    <Link to="/robots" className="page-nav-link">
                        Robot types
                    </Link>
                    <Link to="/all" className="page-nav-link" data-on={true}>
                        All actuators
                    </Link>
                    <Link to="/actuators" className="page-nav-link">
                        Gallery
                    </Link>
                </nav>
            </header>

            <section className="gallery-hero">
                <h1>
                    <BrandGlyph className="block-tag" />
                    All actuators
                </h1>
                <p>
                    Every rotary actuator in the dataset. Filter and sort by torque,
                    density, price, speed and more. Every row links back to its source.
                </p>
            </section>

            <section id="table" className="block">
                <FilterBar
                    filters={filters}
                    counts={counts}
                    useCases={useCases}
                    total={ACTUATORS.length}
                    shown={rows.length}
                    onChange={setFilters}
                    onReset={() => setFilters(DEFAULT_FILTERS)}
                />
                <Leaderboard
                    rows={rows}
                    sortKey={filters.sortKey}
                    sortDir={filters.sortDir}
                    maxes={maxes}
                    compare={compare}
                    onSort={onSort}
                    onToggleCompare={onToggleCompare}
                    onSelect={setSelected}
                />
            </section>

            <footer className="foot">
                Community dataset {"·"} v1 sourced from manufacturer pages via web
                search {"·"} every row links its source {"·"} verify against
                datasheets before engineering use.
            </footer>

            {compare.size > 0 && !showCompare && (
                <div className="compare-dock">
                    <span>
                        {compare.size} selected {compare.size >= COMPARE_MAX && "(max)"}
                    </span>
                    <button type="button" onClick={() => setCompare(new Set())}>
                        Clear
                    </button>
                    <button
                        type="button"
                        className="primary"
                        disabled={compare.size < 2}
                        onClick={() => setShowCompare(true)}
                    >
                        Compare
                    </button>
                </div>
            )}

            {showCompare && (
                <ComparePanel
                    actuators={compareRows}
                    onRemove={onToggleCompare}
                    onClose={() => setShowCompare(false)}
                />
            )}

            <DetailPanel actuator={selected} onClose={() => setSelected(null)} />
        </div>
    );
}
