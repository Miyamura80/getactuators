import { type ReactNode, useEffect, useMemo, useState } from "react";
import { PublicFooter } from "../../components/PublicFooter";
import { PublicHeader } from "../../components/PublicHeader";
import { PRICES_PATH, PRICE_HISTORY, coverage } from "../../../../src/prices/history";
import { boxStats, nmPoints } from "../../../../src/prices/trends";
import { METHOD_LABEL, PRICE_METHODS, type PriceObservation } from "../../../../src/prices/types";
import { ActuatorHistory } from "./ActuatorHistory";
import { NmOverTime } from "./NmOverTime";
import { gates } from "./readiness";
import { SelectedReadout } from "./selected-readout";
import { PRICED, historyIds, latestNm, perNmText, readActuator } from "./shared";
import { TodayStrip } from "./today-strip";
import { TrendGate } from "./trend-gate";
import { VsMetals } from "./VsMetals";
import "../tools.css";
import "./prices.css";

const TITLE = "Actuator prices";

function Section({ n, id, title, children }: { n: number; id: string; title: string; children: ReactNode }) {
    return <section className="pr-sec" id={id} aria-labelledby={`${id}-h`}>
        <h2 id={`${id}-h`}><span>{String(n).padStart(2, "0")}</span>{title}</h2>
        {children}
    </section>;
}

// /prices: today's $/Nm across the catalog first, because one snapshot
// supports that and little else. The trend views (learning curve, one
// actuator's history, price vs NdPr) each appear once the history clears
// its threshold; until then they wait in one progress panel. Data:
// data/prices/history.json, committed by the weekly snapshot bot. `points`
// is for tests.
export function Prices({ menuOpen = false, points = PRICE_HISTORY.points }: {
    menuOpen?: boolean;
    points?: readonly PriceObservation[];
}) {
    const nm = useMemo(() => nmPoints(PRICED, points), [points]);
    const latest = useMemo(() => latestNm(nm), [nm]);
    const ids = useMemo(() => latest.map((p) => p.actuatorId), [latest]);
    const cheapest = useMemo(() => latest.reduce<(typeof latest)[number] | undefined>((m, p) => (!m || p.usdPerNm < m.usdPerNm ? p : m), undefined), [latest]);
    const gs = useMemo(() => gates(nm, points), [nm, points]);
    const [actuator, setActuator] = useState(() => readActuator(window.location.search, ids));
    const c = coverage(points);
    const median = boxStats(latest.map((p) => p.usdPerNm))?.median;
    useEffect(() => {
        const prev = document.title;
        document.title = TITLE;
        return () => { document.title = prev; };
    }, []);
    const pick = (id: string) => {
        setActuator(id);
        const q = new URLSearchParams(window.location.search);
        q.set("actuator", id);
        window.history.replaceState(window.history.state, "", `${PRICES_PATH}?${q}${window.location.hash}`);
    };
    const selected = latest.find((p) => p.actuatorId === actuator) ?? cheapest;
    const open = new Set(gs.filter((g) => g.open).map((g) => g.id));
    const waiting = gs.filter((g) => !g.open);
    let n = 1;

    return <div className="tool-page pr-page">
        <PublicHeader path={PRICES_PATH} initialOpen={menuOpen} />
        <main className="tool-main">
            <header className="tool-head">
                <p className="tool-kicker">Market · updated {PRICE_HISTORY.updated}</p>
                <h1>{TITLE}</h1>
                <p className="tool-lede">Listed price per newton-metre of peak torque, for every catalog actuator with a price.</p>
                <dl className="pr-cover">
                    <div><dt>Actuators</dt><dd>{latest.length}</dd></div>
                    <div><dt>Median</dt><dd>{median ? perNmText(median) : "n/a"}</dd></div>
                    <div><dt>Since</dt><dd>{c.first ?? "n/a"}</dd></div>
                </dl>
            </header>

            <Section n={n++} id="today" title="$/Nm today">
                {selected
                    ? <>
                        <TodayStrip latest={latest} selected={selected.actuatorId} onPick={pick} />
                        <SelectedReadout point={selected} cheapest={selected === cheapest && !actuator} points={points}
                            anchor={open.has("history") ? undefined : "history"} />
                    </>
                    : <p className="pr-empty">No priced actuator with a peak torque yet.</p>}
            </Section>
            {open.has("curve") ? <Section n={n++} id="per-nm" title="$/Nm over time">
                <NmOverTime points={nm} />
            </Section> : null}
            {open.has("history") && selected ? <Section n={n++} id="history" title="One actuator">
                <ActuatorHistory id={selected.actuatorId} ids={historyIds(points)} points={points} onPick={pick} />
            </Section> : null}
            {open.has("metals") ? <Section n={n++} id="metals" title="Price vs metals">
                <VsMetals points={points} />
            </Section> : null}
            {waiting.length ? <Section n={n++} id="trends" title="Trends unlock as data arrives">
                <TrendGate gates={waiting} />
            </Section> : null}

            <details className="pr-method">
                <summary>Method and sources</summary>
                <p>A weekly bot reads each catalog actuator's product page, converts the listed price to USD at that day's ECB reference rate (stored with the point) and opens a pull request; nothing is fetched when this page loads. Out-of-stock listings are flagged, not priced. $/Nm is the latest listed price over the catalog's peak torque.</p>
                <ul>
                    {PRICE_METHODS.filter((m) => c.methods[m]).map((m) => <li key={m}><b>{m}</b> ({c.methods[m]}): {METHOD_LABEL[m]}</li>)}
                </ul>
                {c.methods.wayback ? null : <p>The Internet Archive back-fill has not run yet, so history starts when the catalog first recorded each price.</p>}
                <p><a href="/prices.md">Markdown</a> · <a href="/api/v1/prices/robstride-02">JSON per actuator</a></p>
            </details>
        </main>
        <PublicFooter />
    </div>;
}
