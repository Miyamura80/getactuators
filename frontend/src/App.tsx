import { useEffect, useMemo, useState } from "react";
import type { Actuator } from "./types";
import { ACTUATORS, allUseCases, categoryCounts, maxValue } from "./lib/data";
import { COLUMNS } from "./lib/columns";
import { applyFilters, DEFAULT_FILTERS } from "./lib/filter";
import type { FilterState } from "./lib/filter";
import { Sidebar } from "./components/Sidebar";
import type { NavItem } from "./components/Sidebar";
import { Hero } from "./components/Hero";
import { HighlightCards } from "./components/HighlightCards";
import { BarChart } from "./components/BarChart";
import type { BarItem } from "./components/BarChart";
import { Scatter } from "./components/Scatter";
import { Legend } from "./components/Legend";
import { colorForBrand, legendFor } from "./lib/brands";
import { FilterBar } from "./components/FilterBar";
import { Leaderboard } from "./components/Leaderboard";
import { DetailPanel } from "./components/DetailPanel";
import { ComparePanel } from "./components/ComparePanel";

const COMPARE_MAX = 4;

const NAV: NavItem[] = [
    { id: "highlights", label: "Highlights" },
    { id: "rankings", label: "Torque density" },
    { id: "scatter", label: "Torque vs Cost" },
    { id: "table", label: "All actuators" },
];

export default function App() {
    const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
    const [selected, setSelected] = useState<Actuator | null>(null);
    const [compare, setCompare] = useState<Set<string>>(new Set());
    const [showCompare, setShowCompare] = useState(false);
    const [active, setActive] = useState("highlights");

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

    const rankItems: BarItem[] = useMemo(
        () =>
            rows
                .filter((a) => a.torque_density_nm_per_kg != null)
                .slice(0, 20)
                .sort(
                    (a, b) =>
                        (b.torque_density_nm_per_kg ?? 0) - (a.torque_density_nm_per_kg ?? 0),
                )
                .map((a) => ({
                    id: a.id,
                    name: a.name,
                    value: a.torque_density_nm_per_kg as number,
                    display: `${Math.round(a.torque_density_nm_per_kg as number)}`,
                    flag: a.country_flag,
                    color: colorForBrand(a.brand),
                })),
        [rows],
    );
    const legend = useMemo(() => legendFor(rows.map((a) => a.brand)), [rows]);

    useEffect(() => {
        const ids = NAV.map((n) => n.id);
        const obs = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    if (e.isIntersecting) setActive(e.target.id);
                }
            },
            { rootMargin: "-45% 0px -50% 0px" },
        );
        for (const id of ids) {
            const el = document.getElementById(id);
            if (el) obs.observe(el);
        }
        return () => obs.disconnect();
    }, []);

    const goTo = (id: string) => {
        setActive(id);
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

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

    const openById = (id: string) => {
        const a = ACTUATORS.find((x) => x.id === id);
        if (a) setSelected(a);
    };

    return (
        <div className="shell">
            <Sidebar items={NAV} active={active} onSelect={goTo} />

            <main className="content">
                <Hero />

                <section id="highlights" className="block">
                    <h2 className="block-title">
                        <span className="block-tag" />
                        Highlights
                    </h2>
                    <HighlightCards actuators={ACTUATORS} onSelect={openById} />
                </section>

                <section id="rankings" className="block">
                    <h2 className="block-title">
                        <span className="block-tag" />
                        Torque density ranking
                    </h2>
                    <p className="block-sub">
                        Peak N{"·"}m per kg, top 20 of the current filter. Higher is
                        better. Colored by provider.
                    </p>
                    <Legend entries={legend} />
                    <div className="chart-scroll">
                        <BarChart items={rankItems} onSelect={openById} />
                    </div>
                </section>

                <section id="scatter" className="block">
                    <h2 className="block-title">
                        <span className="block-tag" />
                        Torque density vs Cost
                    </h2>
                    <p className="block-sub">
                        Priced actuators only. The shaded region is high density at low
                        cost; the dotted line is the Pareto frontier. Colored by provider.
                    </p>
                    <Legend entries={legend} />
                    <div className="chart-scroll">
                        <Scatter actuators={rows} onSelect={openById} />
                    </div>
                </section>

                <section id="table" className="block">
                    <h2 className="block-title">
                        <span className="block-tag" />
                        All actuators
                    </h2>
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
            </main>

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
