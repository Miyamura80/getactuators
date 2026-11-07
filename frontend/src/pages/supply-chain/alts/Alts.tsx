import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PublicFooter } from "../../../components/PublicFooter";
import { PublicHeader } from "../../../components/PublicHeader";
import { FootnotesProvider } from "../../../components/supply-chain/footnotes";
import { FootnoteRef, SourcedValue } from "../../../components/supply-chain/SourcedValue";
import { SourcesSection } from "../../../components/supply-chain/SourcesSection";
import {
    ALT_FAMILIES,
    ALTS_AS_OF,
    ALTS_PATH,
    ALT_TECHS,
    type AltFamily,
    FAMILY_LABEL,
    MAGNET_USE_LABEL,
    MILESTONE_LABEL,
    deploymentsOf,
    getAltTech,
    techsIn,
} from "../../../../../src/supply-chain/alts";
import { NDFEB_PER_HUMANOID } from "../../../../../src/supply-chain/perspective";
import { Card } from "./Card";
import { FamilyGlyph, TechDot, TodayMark } from "./glyphs";
import { Ladder } from "./Ladder";
import { Landscape } from "./Landscape";
import { FAMILY_KEY, layout, radiusFor } from "./landscape-model";
import { MilestoneStrip } from "./MilestoneStrip";
import { readState, writeState } from "./url-state";
import "../../tools.css";
import "../../../components/supply-chain/supply-chain.css";
import "./alts.css";

const TITLE = "Alternatives";
const HEADLINE = "What could replace the rare-earth motor?";

// /alts as one readiness landscape: TRL across, rare-earth dependence up,
// one node per technology sized by the deployments we can date. Clicking a
// node opens its spec card under the chart; ?tech= keeps it in the URL.

function Evidence({ id }: { id: string | null }) {
    const t = id ? getAltTech(id) : undefined;
    if (!t) return <p className="al-evidence is-baseline">
        <svg viewBox="-14 -14 28 28" aria-hidden="true"><TodayMark r={7} /></svg>
        <span>Hover a node for its evidence, click it for the spec card.</span>
    </p>;
    const n = t.milestones.length;
    return <p className={`al-evidence al-f-${FAMILY_KEY[t.family]}`}>
        <svg viewBox="-8 -8 16 16" aria-hidden="true"><FamilyGlyph family={t.family} /></svg>
        <b>{t.name}</b>
        <span>TRL {t.trl.value}<FootnoteRef sources={t.trl.sources} asOf={t.trl.asOf} confidence={t.trl.confidence} note={t.trl.note} /></span>
        <span>{MAGNET_USE_LABEL[t.magnets]}</span>
        <span>{n ? t.milestones.map((m) => `${MILESTONE_LABEL[m.kind]} ${m.announced ? "target " : ""}${m.year.value}`).join(" · ") : "no dated milestone"}</span>
    </p>;
}

function Legend({ hidden, onToggle }: { hidden: ReadonlySet<AltFamily>; onToggle: (f: AltFamily) => void }) {
    return <div className="al-legend">
        <div className="al-fams" role="group" aria-label="Show families">
            {ALT_FAMILIES.map((f) => <button key={f} type="button" className={`al-fam al-f-${FAMILY_KEY[f]}`} aria-pressed={!hidden.has(f)} onClick={() => onToggle(f)}>
                <svg viewBox="-8 -8 16 16" aria-hidden="true"><circle r={7} /><FamilyGlyph family={f} scale={0.85} /></svg>
                {FAMILY_LABEL[f]}<span className="al-dim">{techsIn(f).length}</span>
            </button>)}
        </div>
        <div className="al-sizes" aria-label="Dot size: dated deployments we cite">
            {[0, 1, 2].map((n) => <svg key={n} viewBox="-13 -13 26 26" aria-hidden="true"><TechDot family="ree-free-motor" r={radiusFor(n)} deployments={n} /></svg>)}
            <span>deployments cited: 0, 1, 2</span>
        </div>
    </div>;
}

// The phone layout (ladder plus bottom sheet), as alts.css switches it.
const isNarrow = (): boolean => typeof window.matchMedia === "function" && window.matchMedia("(max-width: 760px)").matches;

export function Alts({ menuOpen = false }: { menuOpen?: boolean }) {
    const [tech, setTech] = useState<string | null>(() => readState(window.location.search).tech);
    const [hover, setHover] = useState<string | null>(null);
    const [hidden, setHidden] = useState<ReadonlySet<AltFamily>>(() => new Set());
    const geo = useMemo(() => layout(), []);
    useEffect(() => {
        const prev = document.title;
        document.title = TITLE;
        return () => { document.title = prev; };
    }, []);
    const pick = useCallback((id: string | null) => {
        setTech(id);
        window.history.replaceState(window.history.state, "", `${ALTS_PATH}${writeState(window.location.search, { tech: id })}${window.location.hash}`);
    }, []);
    const close = useCallback(() => {
        const was = tech;
        pick(null);
        // Back to the node that opened it: the ladder chip on phones, the
        // landscape node otherwise.
        if (was) requestAnimationFrame(() => {
            const root = isNarrow() ? ".al-ladder" : ".al-land";
            document.querySelector<HTMLElement | SVGElement>(`${root} [data-tech="${was}"]`)?.focus({ preventScroll: true });
        });
    }, [pick, tech]);
    // Desktop: when a card opens, bring the chart's top to the top of the
    // screen so the lit node and the docked card are both in view.
    const stageRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = stageRef.current;
        if (!tech || !el || typeof window.matchMedia !== "function" || isNarrow()) return;
        const top = el.getBoundingClientRect().top + window.scrollY - 12;
        const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (Math.abs(window.scrollY - top) > 40) window.scrollTo({ top, behavior: still ? "auto" : "smooth" });
    }, [tech]);
    const toggle = (f: AltFamily) => setHidden((cur) => {
        const next = new Set(cur);
        if (next.has(f)) next.delete(f);
        else next.add(f);
        if (next.size === ALT_FAMILIES.length) return new Set();
        return next;
    });
    return <div className="tool-page al-page">
        <PublicHeader path={ALTS_PATH} initialOpen={menuOpen} />
        <FootnotesProvider>
            <main className="tool-main">
                <header className="tool-head al-head">
                    <p className="tool-kicker">Supply chain · Alternatives · as of {ALTS_AS_OF}</p>
                    <h1>{HEADLINE}</h1>
                    <p className="tool-lede al-lede">
                        <span className="al-lede-num"><SourcedValue value={NDFEB_PER_HUMANOID} /></span>
                        <span>of rare-earth magnet in a humanoid today. {ALT_TECHS.length} ways to need less, or none, placed by how ready they are.</span>
                    </p>
                    <a className="al-cta" href="/api/v1/alts">Get the data</a>
                </header>

                <section className="al-hero" aria-label="Readiness landscape">
                    <Legend hidden={hidden} onToggle={toggle} />
                    <div className="al-stage" ref={stageRef}>
                        <div className="al-land">
                            <Landscape geo={geo} hidden={hidden} hover={hover} focus={tech} onHover={setHover} onPick={pick} />
                        </div>
                        <Ladder hidden={hidden} focus={tech} onPick={pick} />
                    </div>
                    {tech ? <>
                        <button type="button" className="al-scrim" aria-hidden="true" tabIndex={-1} onClick={close} />
                        <Card key={tech} id={tech} onClose={close} />
                    </> : null}
                    <Evidence id={hover} />
                    <MilestoneStrip hidden={hidden} hover={hover} focus={tech} onHover={setHover} onPick={pick} />
                    <details className="al-more">
                        <summary>How nodes are placed</summary>
                        <ul>
                            <li><b>Across</b> Technology readiness 1 to 9: our reading of the cited evidence, so a model, not a measurement. Hover the TRL figure for its sources.</li>
                            <li><b>Up</b> What the actuator does for magnets, from its sources. Hydraulics and pneumatic muscles inherit whatever motor drives their pump or air compressor, and a transmission inherits the magnets of the motor that drives it.</li>
                            <li><b>Size</b> How many dated deployments we cite (shipping, pilot, demo or retired). Hollow means none yet. No market estimate sets any size.</li>
                            <li><b>Milestones</b> The year of the earliest dated source we cite; the event may be earlier.</li>
                        </ul>
                    </details>
                    <details className="al-more">
                        <summary>Every node and its sources</summary>
                        <div className="al-table-wrap">
                            <table className="al-table">
                                <thead><tr><th>Technology</th><th>TRL</th><th>Magnets</th><th>Milestones</th><th>Deployments</th></tr></thead>
                                <tbody>
                                    {ALT_TECHS.map((t) => <tr key={t.id}>
                                        <th scope="row"><button type="button" className="al-link" onClick={() => pick(t.id)}>{t.short}</button></th>
                                        <td><SourcedValue value={t.trl} /></td>
                                        <td>{MAGNET_USE_LABEL[t.magnets]}</td>
                                        <td>{t.milestones.length ? t.milestones.map((m) => <span key={m.kind} className="al-cell-ms">{MILESTONE_LABEL[m.kind]} <SourcedValue value={m.year} format={(v) => `${m.announced ? "target " : ""}${v.value}`} /></span>) : <span className="al-gap">none dated</span>}</td>
                                        <td>{deploymentsOf(t.id).length || <span className="al-gap">0</span>}</td>
                                    </tr>)}
                                </tbody>
                            </table>
                        </div>
                    </details>
                </section>

                <p className="al-foot"><a href={`${ALTS_PATH}.md`}>Read as a list</a></p>
                <SourcesSection />
            </main>
        </FootnotesProvider>
        <PublicFooter />
    </div>;
}
