import { type ReactNode, useEffect, useState } from "react";
import { PublicFooter } from "../../components/PublicFooter";
import { PublicHeader } from "../../components/PublicHeader";
import { PRICES_PATH, PRICES_UPDATED, coverage } from "../../../../src/prices/history";
import { METHOD_LABEL, PRICE_METHODS } from "../../../../src/prices/types";
import { ActuatorHistory } from "./ActuatorHistory";
import { NmOverTime } from "./NmOverTime";
import { readActuator } from "./shared";
import { VsMetals } from "./VsMetals";
import { WhereCheapest } from "./WhereCheapest";
import "../tools.css";
import "./prices.css";

const TITLE = "Actuator prices";

function Section({ n, id, title, children }: { n: string; id: string; title: string; children: ReactNode }) {
    return <section className="pr-sec" id={id} aria-labelledby={`${id}-h`}>
        <h2 id={`${id}-h`}><span>{n}</span>{title}</h2>
        {children}
    </section>;
}

// /prices: how listed actuator prices move. $/Nm over time by class, where
// it is cheapest, one actuator's history (?actuator=<id>) and the price
// index against NdPr oxide. Data: data/prices/history.json, committed by the
// weekly snapshot bot.
export function Prices({ menuOpen = false }: { menuOpen?: boolean }) {
    const [actuator, setActuator] = useState(() => readActuator(window.location.search));
    const c = coverage();
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
    return <div className="tool-page pr-page">
        <PublicHeader path={PRICES_PATH} initialOpen={menuOpen} />
        <main className="tool-main">
            <header className="tool-head">
                <p className="tool-kicker">Market · updated {PRICES_UPDATED}</p>
                <h1>{TITLE}</h1>
                <p className="tool-lede">How fast actuators get cheaper, where they are cheapest, and whether they follow rare-earth prices.</p>
                <dl className="pr-cover">
                    <div><dt>Actuators</dt><dd>{c.actuators}</dd></div>
                    <div><dt>Price points</dt><dd>{c.points}</dd></div>
                    <div><dt>Since</dt><dd>{c.first ?? "n/a"}</dd></div>
                </dl>
            </header>

            <Section n="01" id="per-nm" title="$/Nm over time">
                <NmOverTime />
            </Section>
            <Section n="02" id="compare" title="Where it is cheapest">
                <WhereCheapest />
            </Section>
            <Section n="03" id="history" title="One actuator">
                {actuator ? <ActuatorHistory id={actuator} onPick={pick} /> : <p className="pr-empty">No history yet.</p>}
            </Section>
            <Section n="04" id="metals" title="Price vs metals">
                <VsMetals />
            </Section>

            <details className="pr-method">
                <summary>Method and sources</summary>
                <p>A weekly bot reads each catalog actuator's product page, converts the listed price to USD at that day's ECB reference rate (stored with the point) and opens a pull request; nothing is fetched when this page loads. Out-of-stock listings are flagged, not priced.</p>
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
