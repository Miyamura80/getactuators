import { useEffect } from "react";
import { PublicFooter } from "../../components/PublicFooter";
import { PublicHeader } from "../../components/PublicHeader";
import { TRENDS_AS_OF, TRENDS_PATH, TREND_CHARTS, TREND_SECTIONS, TREND_SECTION_LABEL, chartsIn } from "../../../../src/trends";
import { TrendFigure } from "./TrendFigure";
import "../tools.css";
import "./trends.css";

const TITLE = "Trends";

export function Trends({ menuOpen = false }: { menuOpen?: boolean }) {
    useEffect(() => {
        const prev = document.title;
        document.title = TITLE;
        // A #chart deep link (from the API or the markdown twin) opens on it.
        const id = window.location.hash.slice(1);
        if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
        return () => {
            document.title = prev;
        };
    }, []);
    return (
        <div className="tool-page tr-page">
            <PublicHeader path={TRENDS_PATH} initialOpen={menuOpen} />
            <main className="tool-main">
                <header className="tool-head">
                    <p className="tool-kicker">Trends</p>
                    <h1>What changed, and how fast</h1>
                    <p className="tool-lede">
                        {TREND_CHARTS.length} charts of dated, cited points on actuators, robots and the price of AI. As of {TRENDS_AS_OF}.
                    </p>
                </header>
                {TREND_SECTIONS.map((s) => (
                    <section key={s} className="tr-section" aria-labelledby={`tr-${s}`}>
                        <h2 id={`tr-${s}`}>{TREND_SECTION_LABEL[s]}</h2>
                        <div className="tr-grid-wrap">
                            {chartsIn(s).map((c) => (
                                <TrendFigure key={c.id} chart={c} />
                            ))}
                        </div>
                    </section>
                ))}
            </main>
            <PublicFooter />
        </div>
    );
}
