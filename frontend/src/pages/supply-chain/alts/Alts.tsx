import { useCallback, useEffect, useMemo, useState } from "react";
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
import { FocusCard } from "./FocusCard";
import { FamilyGlyph, TechDot, TodayMark } from "./glyphs";
import { Ladder } from "./Ladder";
import { Landscape } from "./Landscape";
import { FAMILY_KEY, W, layout, radiusFor } from "./landscape-model";
import { MilestoneStrip } from "./MilestoneStrip";
import { readState, writeState } from "./url-state";
import "../../tools.css";
import "../../../components/supply-chain/supply-chain.css";
import "./alts.css";

const TITLE = "Alternatives";

// /alts as one readiness landscape: TRL across, rare-earth dependence up,
// one node per technology sized by the deployments we can date. Clicking a
// node zooms into its card; ?tech= keeps that zoom in the URL.

function Evidence({ id }: { id: string | null }) {
    const t = id ? getAltTech(id) : undefined;
    if (!t) return <p className="al-evidence is-baseline">
        <svg viewBox="-14 -14 28 28" aria-hidden="true"><TodayMark r={7} /></svg>
        <span>Today an NdFeB actuator humanoid carries about <SourcedValue value={NDFEB_PER_HUMANOID} /> of rare-earth magnet. Pick a node to compare.</span>
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
        if (was) requestAnimationFrame(() => document.querySelector<SVGElement>(`.al-land [data-tech="${was}"]`)?.focus({ preventScroll: true }));
    }, [pick, tech]);
    const toggle = (f: AltFamily) => setHidden((cur) => {
        const next = new Set(cur);
        if (next.has(f)) next.delete(f);
        else next.add(f);
        if (next.size === ALT_FAMILIES.length) return new Set();
        return next;
    });
    const focused = tech ? getAltTech(tech) : undefined;
    const node = geo.nodes.find((n) => n.id === tech);
    const origin = node ? { x: (node.x / W) * 100, y: (node.y / geo.height) * 100 } : { x: 50, y: 50 };
    return <div className="tool-page al-page">
        <PublicHeader path={ALTS_PATH} initialOpen={menuOpen} />
        <FootnotesProvider>
            <main className="tool-main">
                <header className="tool-head al-head">
                    <p className="tool-kicker">Supply chain · as of {ALTS_AS_OF}</p>
                    <h1>{TITLE}</h1>
                    <p className="tool-lede">{ALT_TECHS.length} ways to move a robot joint with less or no rare earth, placed by how ready they are.</p>
                    <a className="al-cta" href="/api/v1/alts">Get the data</a>
                </header>

                <section className="al-hero" aria-label="Readiness landscape">
                    <Legend hidden={hidden} onToggle={toggle} />
                    <div className={`al-stage${focused ? " is-zoomed" : ""}`}>
                        <div className="al-land" style={{ transformOrigin: `${origin.x}% ${origin.y}%` }} inert={focused ? true : undefined}>
                            <Landscape geo={geo} hidden={hidden} hover={hover} focus={tech} onHover={setHover} onPick={pick} />
                        </div>
                        <Ladder hidden={hidden} focus={tech} onPick={pick} />
                        {focused ? <>
                            <button type="button" className="al-scrim" aria-label="Close" tabIndex={-1} onClick={close} />
                            <FocusCard key={focused.id} t={focused} origin={origin} onClose={close} />
                        </> : null}
                    </div>
                    <Evidence id={hover} />
                    <MilestoneStrip hidden={hidden} hover={hover} focus={tech} onHover={setHover} onPick={pick} />
                    <details className="al-more">
                        <summary>How nodes are placed</summary>
                        <ul>
                            <li><b>Across</b> Technology readiness 1 to 9: our reading of the cited evidence, so a model, not a measurement. Hover the TRL figure for its sources.</li>
                            <li><b>Up</b> What the actuator does for magnets, from its sources. Pump-driven hydraulics inherit whatever motor drives the pump.</li>
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
