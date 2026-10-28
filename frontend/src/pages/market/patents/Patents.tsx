import { type ReactNode, useEffect, useState } from "react";
import { PublicFooter } from "../../../components/PublicFooter";
import { PublicHeader } from "../../../components/PublicHeader";
import {
    LAG_MONTHS,
    LANDSCAPE,
    type LandscapeSnapshot,
    PATENTS_PATH,
    isCollected,
} from "../../../../../src/patents/landscape";
import { AssigneeMap } from "./AssigneeMap";
import { FamilyList } from "./FamilyList";
import { FilingsStream } from "./FilingsStream";
import { Leaderboard } from "./Leaderboard";
import { Scope } from "./Scope";
import { type PatentsState, readState, writeState } from "./url-state";
import "../../tools.css";
import "./patents.css";

const TITLE = "Actuator patent landscape";

function Section({ n, id, title, children }: { n: string; id: string; title: string; children: ReactNode }) {
    return <section className="pt-sec" id={id} aria-labelledby={`${id}-h`}>
        <h2 id={`${id}-h`}><span>{n}</span>{title}</h2>
        {children}
    </section>;
}

// /patents: who files actuator and magnet inventions, and where. Technology,
// stacking and search live in the URL. Until the first BigQuery snapshot is
// committed only the scope shows; no counts are drawn without data.
export function Patents({ menuOpen = false, snapshot = LANDSCAPE }: { menuOpen?: boolean; snapshot?: LandscapeSnapshot }) {
    const [state, setState] = useState<PatentsState>(() => readState(window.location.search));
    useEffect(() => {
        const prev = document.title;
        document.title = TITLE;
        return () => { document.title = prev; };
    }, []);
    const update = (patch: Partial<PatentsState>) => {
        setState((cur) => {
            const next = { ...cur, ...patch };
            const search = writeState(window.location.search, next);
            window.history.replaceState(window.history.state, "", `${PATENTS_PATH}${search}${window.location.hash}`);
            return next;
        });
    };
    const collected = isCollected(snapshot);
    return <div className="tool-page pt-page">
        <PublicHeader path={PATENTS_PATH} initialOpen={menuOpen} />
        <main className="tool-main">
            <header className="tool-head pt-head">
                <p className="tool-kicker">Patents · {collected ? `snapshot ${snapshot.collectedAt}` : "snapshot pending"}</p>
                <h1>{TITLE}</h1>
                <p className="tool-lede">Patent families since {snapshot.sinceYear}, scoped by CPC code. One invention filed in five countries counts once.</p>
                <a className="pt-cta" href="/api/v1/patents">Get the data</a>
            </header>

            <Section n="01" id="scope" title="What is counted">
                <Scope tech={state.tech} snapshot={snapshot} onTech={(tech) => update({ tech, q: "" })} />
            </Section>

            {collected ? <>
                <Section n="02" id="filings" title="Filings per year">
                    <FilingsStream tech={state.tech} stack={state.stack} snapshot={snapshot} onStack={(stack) => update({ stack })} />
                </Section>
                <Section n="03" id="map" title="Where the filers are">
                    <AssigneeMap tech={state.tech} snapshot={snapshot} />
                </Section>
                <Section n="04" id="leaders" title="Who files most">
                    <Leaderboard tech={state.tech} snapshot={snapshot} />
                </Section>
                <Section n="05" id="families" title="Recent families">
                    <FamilyList tech={state.tech} q={state.q} snapshot={snapshot} onQuery={(q) => update({ q })} />
                </Section>
            </> : <p className="pt-empty" role="status">
                No counts yet. The first snapshot from Google Patents Public Datasets has not been collected, so this page shows the scope only.
            </p>}

            <details className="pt-method">
                <summary>Method</summary>
                <ul>
                    <li>Source: Google Patents Public Datasets on BigQuery, queried by CPC code and priority date.</li>
                    <li>Families deduplicated by family id; priority year is the earliest in the family.</li>
                    <li>Applicant country: first assignee on the family's earliest publication.</li>
                    <li>Assignees folded into organisations with an alias table, linked to the company registry where listed.</li>
                    <li>The last {LAG_MONTHS} months are incomplete: applications publish about {LAG_MONTHS} months after filing.</li>
                </ul>
            </details>
        </main>
        <PublicFooter />
    </div>;
}
