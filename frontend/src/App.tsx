import { PublicHeader } from "./components/PublicHeader";
import { PublicFooter } from "./components/PublicFooter";
import { useEffect, useMemo, useState } from "react";
import { ACTUATORS } from "./lib/data";
import { Sidebar } from "./components/Sidebar";
import type { NavItem } from "./components/Sidebar";
import { Hero } from "./components/Hero";
import { BrandGlyph } from "./components/BrandGlyph";
import { HighlightCards } from "./components/HighlightCards";
import { BarChart } from "./components/BarChart";
import type { BarItem } from "./components/BarChart";
import { Scatter } from "./components/Scatter";
import { Legend } from "./components/Legend";
import { colorForBrand, legendFor } from "./lib/brands";
import { DetailPanel } from "./components/DetailPanel";
import { Link } from "./lib/router";
import type { Actuator } from "./types";

const NAV: NavItem[] = [
    { id: "highlights", label: "Highlights" },
    { id: "rankings", label: "Torque density" },
    { id: "scatter", label: "Torque vs Cost" },
];

export default function App({ menuOpen = false }: { menuOpen?: boolean }) {
    const [selected, setSelected] = useState<Actuator | null>(null);
    const [active, setActive] = useState("highlights");

    const legend = useMemo(() => legendFor(ACTUATORS.map((a) => a.brand)), []);
    const rankItems: BarItem[] = useMemo(
        () =>
            ACTUATORS.filter((a) => a.torque_density_nm_per_kg != null)
                .slice()
                .sort(
                    (a, b) =>
                        (b.torque_density_nm_per_kg ?? 0) - (a.torque_density_nm_per_kg ?? 0),
                )
                .slice(0, 20)
                .map((a) => ({
                    id: a.id,
                    name: a.name,
                    value: a.torque_density_nm_per_kg as number,
                    display: `${Math.round(a.torque_density_nm_per_kg as number)}`,
                    flag: a.country_flag,
                    color: colorForBrand(a.brand),
                })),
        [],
    );

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

    const openById = (id: string) => {
        const a = ACTUATORS.find((x) => x.id === id);
        if (a) setSelected(a);
    };

    return (
        <>
        <PublicHeader path="/" initialOpen={menuOpen} />
        <div className="shell">
            <Sidebar items={NAV} active={active} onSelect={goTo} />

            <main className="content">
                <Hero />

                <section id="highlights" className="block">
                    <h2 className="block-title">
                        <BrandGlyph className="block-tag" />
                        Highlights
                    </h2>
                    <HighlightCards actuators={ACTUATORS} onSelect={openById} />
                </section>

                <section id="rankings" className="block">
                    <h2 className="block-title">
                        <BrandGlyph className="block-tag" />
                        Torque density ranking
                    </h2>
                    <p className="block-sub">
                        Peak N{"·"}m per kg, top 20 across the dataset. Higher is better.
                        Colored by provider.
                    </p>
                    <Legend entries={legend} />
                    <div className="chart-scroll">
                        <BarChart items={rankItems} onSelect={openById} />
                    </div>
                </section>

                <section id="scatter" className="block">
                    <h2 className="block-title">
                        <BrandGlyph className="block-tag" />
                        Torque density vs Cost
                    </h2>
                    <p className="block-sub">
                        Priced actuators only. The shaded region is high density at low
                        cost; the dotted line is the Pareto frontier. Colored by provider.
                    </p>
                    <Legend entries={legend} />
                    <div className="chart-scroll">
                        <Scatter actuators={ACTUATORS} onSelect={openById} />
                    </div>
                </section>

                <Link to="/actuators?view=list" className="all-cta">
                    <span className="all-cta-kicker">Full dataset</span>
                    <span className="all-cta-title">Browse all {ACTUATORS.length} actuators</span>
                    <span className="all-cta-go" aria-hidden="true">→</span>
                </Link>
            </main>

            <DetailPanel actuator={selected} onClose={() => setSelected(null)} />
        </div>
        <PublicFooter />
        </>
    );
}
