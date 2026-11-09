import { useEffect, useRef, useState } from "react";
import { PublicFooter } from "../../components/PublicFooter";
import { PublicHeader } from "../../components/PublicHeader";
import { TRENDS_AS_OF, TRENDS_PATH, TREND_CHARTS, TREND_SECTIONS, TREND_SECTION_LABEL, chartsIn, getTrendChart } from "../../../../src/trends";
import { Thumb } from "./Thumb";
import { TrendFigure } from "./TrendFigure";
import "../tools.css";
import "./trends.css";

const TITLE = "Trends";
const PANEL = "tr-panel";

// The chart to open: ?chart=<id>, or a #<id> link from the API or the
// markdown twin, else the first chart.
function readChart(): string {
    const q = new URLSearchParams(window.location.search).get("chart");
    const hash = window.location.hash.slice(1);
    return [q, hash].find((id) => id && getTrendChart(id)) ?? TREND_CHARTS[0]?.id ?? "";
}

// Matches the trends.css breakpoint where the panel stacks under the list.
const stacked = () => Boolean(window.matchMedia?.("(max-width: 900px)").matches);

// Thumbnails (title, one headline number, sparkline) beside a sticky panel
// with the selected chart in full.
export function Trends({ menuOpen = false }: { menuOpen?: boolean }) {
    const [open, setOpen] = useState(readChart);
    const panel = useRef<HTMLDivElement>(null);
    const chart = getTrendChart(open) ?? TREND_CHARTS[0];
    useEffect(() => {
        const prev = document.title;
        document.title = TITLE;
        // A deep link on the stacked layout lands below the thumbnails, so
        // bring the opened chart into view.
        const linked = new URLSearchParams(window.location.search).has("chart") || window.location.hash.length > 1;
        if (linked && stacked()) requestAnimationFrame(() => panel.current?.scrollIntoView({ block: "start" }));
        return () => {
            document.title = prev;
        };
    }, []);
    const pick = (id: string) => {
        setOpen(id);
        const q = new URLSearchParams(window.location.search);
        q.set("chart", id);
        window.history.replaceState(window.history.state, "", `${TRENDS_PATH}?${q.toString()}`);
        // Stacked layout: bring the panel into view.
        if (stacked()) panel.current?.scrollIntoView({ block: "start" });
    };
    return (
        <div className="tool-page tr-page">
            <PublicHeader path={TRENDS_PATH} initialOpen={menuOpen} />
            <main className="tool-main">
                <header className="tr-head">
                    <h1>What changed, and how fast</h1>
                    <p>
                        {TREND_CHARTS.length} cited charts · {TRENDS_AS_OF}
                    </p>
                </header>
                <div className="tr-layout">
                    <div className="tr-list">
                        {TREND_SECTIONS.map((s) => (
                            <section key={s} aria-labelledby={`tr-${s}`}>
                                <h2 className="tr-section-label" id={`tr-${s}`}>
                                    {TREND_SECTION_LABEL[s]}
                                </h2>
                                <div className="tr-thumbs">
                                    {chartsIn(s).map((c) => (
                                        <Thumb key={c.id} chart={c} selected={chart?.id === c.id} controls={PANEL} onSelect={() => pick(c.id)} />
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                    <div className="tr-panel" id={PANEL} ref={panel} aria-live="polite">
                        {chart && <TrendFigure key={chart.id} chart={chart} />}
                    </div>
                </div>
            </main>
            <PublicFooter />
        </div>
    );
}
