import { type ReactNode, useEffect, useState } from "react";
import { PublicFooter } from "../../../components/PublicFooter";
import { PublicHeader } from "../../../components/PublicHeader";
import { ConfidenceLegend } from "../../../components/supply-chain/ConfidenceLegend";
import { FootnotesProvider } from "../../../components/supply-chain/footnotes";
import { SourcesSection } from "../../../components/supply-chain/SourcesSection";
import { ALTS_AS_OF, ALTS_PATH, ALT_TECHS } from "../../../../../src/supply-chain/alts";
import { Deployments } from "./Deployments";
import { Performance } from "./Performance";
import { Readiness } from "./Readiness";
import { Treemap } from "./Treemap";
import { UnderHood } from "./UnderHood";
import { type AltsState, readState, writeState } from "./url-state";
import "../../tools.css";
import "../../../components/supply-chain/supply-chain.css";
import "./alts.css";

const TITLE = "Alternatives";

function Section({ n, id, title, children }: { n: string; id: string; title: string; children: ReactNode }) {
    return <section className="al-sec" id={id} aria-labelledby={`${id}-h`}>
        <h2 id={`${id}-h`}><span>{n}</span>{title}</h2>
        {children}
    </section>;
}

function Methodology() {
    return <details className="al-more al-method">
        <summary>How the market tiles are built</summary>
        <ul>
            <li><b>Size</b> One publisher's estimate per tile, from the public summary of a paid report (top-down). No company reports revenue by technology, so there is no bottom-up check yet.</li>
            <li><b>Colour</b> That report's forecast growth a year.</li>
            <li><b>Grouping</b> By family or end market a tile moves whole. By company type or country it is split evenly across the companies we list: our model, drawn dashed.</li>
            <li><b>Spread</b> Publishers disagree by several times; each figure's note gives the range we saw.</li>
        </ul>
        <ConfidenceLegend />
    </details>;
}

// /alts: every serious alternative to the rare-earth electric actuator. The
// treemap grouping and the selected technology live in the query
// (/alts?group=country&tech=hasel), so every view highlights the same one.
export function Alts({ menuOpen = false }: { menuOpen?: boolean }) {
    const [state, setState] = useState<AltsState>(() => readState(window.location.search));
    useEffect(() => {
        const prev = document.title;
        document.title = TITLE;
        return () => { document.title = prev; };
    }, []);
    const update = (patch: Partial<AltsState>) => {
        setState((cur) => {
            const next = { ...cur, ...patch };
            window.history.replaceState(window.history.state, "", `${ALTS_PATH}${writeState(window.location.search, next)}${window.location.hash}`);
            return next;
        });
    };
    const onTech = (tech: string) => update({ tech });
    return <div className="tool-page al-page">
        <PublicHeader path={ALTS_PATH} initialOpen={menuOpen} />
        <FootnotesProvider>
            <main className="tool-main">
                <header className="tool-head al-head">
                    <p className="tool-kicker">Supply chain · as of {ALTS_AS_OF}</p>
                    <h1>{TITLE}</h1>
                    <p className="tool-lede">{ALT_TECHS.length} ways to move a robot joint with less or no rare earth: how big, how fast, how ready, and how they work.</p>
                    <a className="al-cta" href="/api/v1/alts">Get the data</a>
                </header>

                <Section n="01" id="market" title="Market size and growth">
                    <Treemap group={state.group} onGroup={(group) => update({ group })} tech={state.tech} onTech={onTech} />
                    <Methodology />
                </Section>

                <Section n="02" id="performance" title="Performance and rare earth">
                    <Performance tech={state.tech} onTech={onTech} />
                </Section>

                <Section n="03" id="readiness" title="Readiness">
                    <Readiness tech={state.tech} onTech={onTech} />
                </Section>

                <Section n="04" id="deployments" title="Where it runs">
                    <Deployments tech={state.tech} onTech={onTech} />
                </Section>

                <Section n="05" id="under-the-hood" title="Under the hood">
                    <UnderHood tech={state.tech} onTech={onTech} />
                </Section>

                <p className="al-foot"><a href={`${ALTS_PATH}.md`}>Read as a list</a> · <a href="/api/v1/alts">Get the data</a></p>
                <SourcesSection />
            </main>
        </FootnotesProvider>
        <PublicFooter />
    </div>;
}
