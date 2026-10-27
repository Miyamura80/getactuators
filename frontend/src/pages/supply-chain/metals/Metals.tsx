import { type ReactNode, useEffect, useState } from "react";
import { PublicFooter } from "../../../components/PublicFooter";
import { PublicHeader } from "../../../components/PublicHeader";
import { FootnotesProvider } from "../../../components/supply-chain/footnotes";
import { SourcesSection } from "../../../components/supply-chain/SourcesSection";
import { METALS_AS_OF, METALS_PATH } from "../../../../../src/supply-chain/metals";
import type { ReserveCommodity } from "../../../../../src/supply-chain/metals/reserves";
import { Market } from "./Market";
import { PriceChart } from "./PriceChart";
import { Reserves } from "./Reserves";
import { type MetalsState, readState, writeState } from "./url-state";
import { WhatGoesIn } from "./WhatGoesIn";
import { WhereFrom } from "./WhereFrom";
import "../../tools.css";
import "../../../components/supply-chain/supply-chain.css";
import "./metals.css";

const TITLE = "Magnet metals";

function useReducedMotion(): boolean {
    const query = "(prefers-reduced-motion: reduce)";
    const [still, setStill] = useState(() => typeof window.matchMedia === "function" && window.matchMedia(query).matches);
    useEffect(() => {
        if (typeof window.matchMedia !== "function") return;
        const m = window.matchMedia(query);
        const on = () => setStill(m.matches);
        m.addEventListener?.("change", on);
        return () => m.removeEventListener?.("change", on);
    }, []);
    return still;
}

function Section({ n, id, title, children }: { n: string; id: string; title: string; children: ReactNode }) {
    return <section className="mt-sec" id={id} aria-labelledby={`${id}-h`}>
        <h2 id={`${id}-h`}><span>{n}</span>{title}</h2>
        {children}
    </section>;
}

// /metals: the metals in an actuator's magnet, top to bottom: what goes in,
// where it comes from, how much is left, how the price is set and who moves
// it. Element, stage and grade live in the URL.
export function Metals({ menuOpen = false }: { menuOpen?: boolean }) {
    const [state, setState] = useState<MetalsState>(() => readState(window.location.search));
    const [commodity, setCommodity] = useState<ReserveCommodity>(state.element === "co" ? "co" : "ree");
    const still = useReducedMotion();
    useEffect(() => {
        const prev = document.title;
        document.title = TITLE;
        return () => { document.title = prev; };
    }, []);
    const update = (patch: Partial<MetalsState>) => {
        setState((cur) => {
            const next = { ...cur, ...patch };
            const search = writeState(window.location.search, next);
            window.history.replaceState(window.history.state, "", `${METALS_PATH}${search}${window.location.hash}`);
            return next;
        });
        if (patch.element) setCommodity(patch.element === "co" ? "co" : "ree");
    };
    return <div className={`tool-page mt-page${still ? " is-still" : ""}`}>
        <PublicHeader path={METALS_PATH} initialOpen={menuOpen} />
        <FootnotesProvider>
            <main className="tool-main">
                <header className="tool-head mt-head">
                    <p className="tool-kicker">Supply chain · as of {METALS_AS_OF}</p>
                    <h1>{TITLE}</h1>
                    <p className="tool-lede">Six metals make an actuator's magnet. Control tightens from mine to magnet.</p>
                    <a className="mt-cta" href="/api/v1/metals">Get the data</a>
                </header>

                <Section n="01" id="what-goes-in" title="What goes in">
                    <WhatGoesIn element={state.element} grade={state.grade}
                        onElement={(element) => update({ element })} onGrade={(grade) => update({ grade })} />
                </Section>

                <Section n="02" id="where-from" title="Where it comes from">
                    <WhereFrom element={state.element} stage={state.stage} chain={state.chain}
                        onElement={(element) => update({ element })}
                        onStage={(stage) => update({ stage })}
                        onChain={(chain) => update({ chain })} />
                </Section>

                <Section n="03" id="how-much-left" title="How much is left">
                    <Reserves commodity={commodity} onCommodity={setCommodity} />
                </Section>

                <Section n="04" id="prices" title="How the price moved">
                    <PriceChart />
                </Section>

                <Section n="05" id="market" title="Who sets the price">
                    <Market />
                </Section>

                <SourcesSection />
            </main>
        </FootnotesProvider>
        <PublicFooter />
    </div>;
}
