import { useEffect, useMemo, useState } from "react";
import type { Actuator } from "./types";
import { ACTUATORS, allUseCases, categoryCounts, maxValue } from "./lib/data";
import { COLUMNS } from "./lib/columns";
import { applyFilters, DEFAULT_FILTERS } from "./lib/filter";
import type { FilterState } from "./lib/filter";
import { FilterBar } from "./components/FilterBar";
import { Leaderboard } from "./components/Leaderboard";
import { DetailPanel } from "./components/DetailPanel";
import { ComparePanel } from "./components/ComparePanel";

const COMPARE_MAX = 4;
const THEME_KEY = "getactuators-theme";

function readTheme(): "light" | "dark" | null {
    try {
        const t = localStorage.getItem(THEME_KEY);
        return t === "light" || t === "dark" ? t : null;
    } catch {
        return null;
    }
}

export default function App() {
    const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
    const [selected, setSelected] = useState<Actuator | null>(null);
    const [compare, setCompare] = useState<Set<string>>(new Set());
    const [showCompare, setShowCompare] = useState(false);
    const [theme, setTheme] = useState<"light" | "dark" | null>(readTheme);

    useEffect(() => {
        const root = document.documentElement;
        if (theme) root.setAttribute("data-theme", theme);
        else root.removeAttribute("data-theme");
        try {
            if (theme) localStorage.setItem(THEME_KEY, theme);
            else localStorage.removeItem(THEME_KEY);
        } catch {
            /* storage unavailable; theme still applies for this session */
        }
    }, [theme]);

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
            sortDir:
                f.sortKey === key ? (f.sortDir === "asc" ? "desc" : "asc") : "desc",
        }));

    const onToggleCompare = (id: string) =>
        setCompare((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else if (next.size < COMPARE_MAX) next.add(id);
            return next;
        });

    return (
        <div className="app">
            <header className="masthead">
                <div className="brand-row">
                    <h1>
                        get<span>actuators</span>
                    </h1>
                    <button
                        type="button"
                        className="theme-toggle"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        aria-label="Toggle color theme"
                    >
                        {theme === "dark" ? "☀" : "☽"}
                    </button>
                </div>
                <p className="tagline">
                    Actuator leaderboard for robot builders. Quadrupeds, arms, and
                    legged robots, compared on the specs that matter.
                </p>
                <div className="stats">
                    <span>
                        <b>{ACTUATORS.length}</b> actuators
                    </span>
                    <span>
                        <b>{Object.keys(counts).length}</b> categories
                    </span>
                    <span className="stat-note">
                        sort by torque density, $/N{"·"}m, backlash and more
                    </span>
                </div>
            </header>

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

            <footer className="foot">
                Community dataset {"·"} v1 sourced from manufacturer pages via web
                search {"·"} numbers should be verified against datasheets before
                engineering use.
            </footer>

            {compare.size > 0 && !showCompare && (
                <div className="compare-dock">
                    <span>
                        {compare.size} selected{" "}
                        {compare.size >= COMPARE_MAX && "(max)"}
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
