import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PublicFooter } from "../../../components/PublicFooter";
import { PublicHeader } from "../../../components/PublicHeader";
import { FootnotesProvider } from "../../../components/supply-chain/footnotes";
import { FootnoteRef } from "../../../components/supply-chain/SourcedValue";
import { SourcesSection } from "../../../components/supply-chain/SourcesSection";
import {
    MEASURE_STATUSES,
    MEASURE_STATUS_LABEL,
    MEASURE_TYPES,
    MEASURE_TYPE_LABEL,
    POLICY_AS_OF,
    POLICY_FEED_PATH,
    POLICY_MEASURES,
    POLICY_PATH,
    type PolicyMeasure,
    getMeasure,
    lastChange,
    policyChanges,
    startDate,
} from "../../../../../src/supply-chain/policy";
import { STAGE_LABEL, STAGES, type Stage } from "../../../../../src/supply-chain/stages";
import { FeedIcon, StatusGlyph, TypeGlyph } from "./glyphs";
import { MeasureCard, fmtDate } from "./MeasureCard";
import { Swimlane } from "./Swimlane";
import { ALL_FILTERS, type PolicyFilters, readFilters, readMeasure, writeFilters } from "./url-state";
import "../../tools.css";
import "../../../components/supply-chain/supply-chain.css";
import "./policy.css";

const TITLE = "Policy";

const pushURL = (search: string, hash: string) =>
    window.history.replaceState(window.history.state, "", `${POLICY_PATH}${search}${hash}`);

// Stages any measure touches, in chain order.
const USED_STAGES = STAGES.filter((s) => POLICY_MEASURES.some((m) => m.stages.includes(s)));

function matches(m: PolicyMeasure, f: PolicyFilters): boolean {
    return f.types.includes(m.type) && f.statuses.includes(m.status) && (!f.stage || m.stages.includes(f.stage));
}

function toggle<T>(all: readonly T[], on: T[], v: T): T[] {
    // From "all on", a click isolates that value; clicking the last one restores all.
    if (on.length === all.length) return [v];
    const next = on.includes(v) ? on.filter((x) => x !== v) : [...on, v];
    return next.length === 0 ? [...all] : all.filter((x) => next.includes(x));
}

// /policy: every measure that touches the actuator chain on one swimlane
// timeline. Filters live in the query, the open measure in the hash.
export function Policy({ menuOpen = false }: { menuOpen?: boolean }) {
    const [filters, setFilters] = useState<PolicyFilters>(() => readFilters(window.location.search));
    const [focus, setFocus] = useState<string | null>(() => readMeasure(window.location.hash));
    const cardRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const prev = document.title;
        document.title = TITLE;
        return () => { document.title = prev; };
    }, []);
    useEffect(() => {
        const onHash = () => setFocus(readMeasure(window.location.hash));
        window.addEventListener("hashchange", onHash);
        return () => window.removeEventListener("hashchange", onHash);
    }, []);
    const shown = useMemo(() => POLICY_MEASURES.filter((m) => matches(m, filters)), [filters]);
    const measure = focus ? getMeasure(focus) : undefined;
    const today = POLICY_AS_OF;

    const update = (patch: Partial<PolicyFilters>) => {
        const next = { ...filters, ...patch };
        setFilters(next);
        pushURL(writeFilters(window.location.search, next), window.location.hash);
    };
    const pick = useCallback((id: string | null) => {
        setFocus(id);
        pushURL(window.location.search, id ? `#measure=${id}` : "");
        if (id) requestAnimationFrame(() => cardRef.current?.scrollIntoView?.({ block: "nearest" }));
    }, []);
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") pick(null); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [pick]);

    const typeCount = (t: (typeof MEASURE_TYPES)[number]) => POLICY_MEASURES.filter((m) => m.type === t).length;
    return <div className="tool-page pl-page">
        <PublicHeader path={POLICY_PATH} initialOpen={menuOpen} />
        <FootnotesProvider>
            <main className="tool-main">
                <header className="tool-head pl-head">
                    <p className="tool-kicker">Supply chain · as of {fmtDate(POLICY_AS_OF)}</p>
                    <h1>{TITLE}</h1>
                    <p className="tool-lede">{POLICY_MEASURES.length} government measures on the actuator chain, from rare earth mine to robot.</p>
                    <a className="pl-cta" href="/api/v1/policy">Get the data</a>
                </header>

                <div className="pl-filters">
                    <div className="pl-types" role="group" aria-label="Type">
                        {MEASURE_TYPES.map((t) => <button key={t} type="button" aria-pressed={filters.types.includes(t)}
                            onClick={() => update({ types: toggle(MEASURE_TYPES, filters.types, t) })}>
                            <TypeGlyph type={t} ring={false} />
                            <span>{MEASURE_TYPE_LABEL[t]}</span>
                            <b>{typeCount(t)}</b>
                        </button>)}
                    </div>
                    <div className="pl-row">
                        <label className="pl-select">
                            <span>Stage</span>
                            <select value={filters.stage ?? ""} onChange={(e) => update({ stage: (e.target.value || null) as Stage | null })}>
                                <option value="">All stages</option>
                                {USED_STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
                            </select>
                        </label>
                        <div className="pl-statuses" role="group" aria-label="Status">
                            {MEASURE_STATUSES.map((s) => <button key={s} type="button" aria-pressed={filters.statuses.includes(s)}
                                onClick={() => update({ statuses: toggle(MEASURE_STATUSES, filters.statuses, s) })}>
                                <StatusGlyph status={s} />
                                <span>{MEASURE_STATUS_LABEL[s]}</span>
                            </button>)}
                        </div>
                        {shown.length < POLICY_MEASURES.length
                            ? <button type="button" className="pl-reset" onClick={() => update(ALL_FILTERS)}>
                                {shown.length} of {POLICY_MEASURES.length} · clear
                            </button>
                            : null}
                    </div>
                </div>

                <Swimlane measures={shown} today={today} focus={measure ? measure.id : null} onFocus={pick} />

                <div ref={cardRef} className="pl-card-slot" aria-live="polite">
                    {measure
                        ? <MeasureCard measure={measure} onClose={() => pick(null)} />
                        : <p className="pl-hint">Pick a mark to open the measure.</p>}
                </div>

                <section className="pl-sec" aria-labelledby="pl-latest-h">
                    <h2 id="pl-latest-h">Latest changes <a className="pl-feed" href={POLICY_FEED_PATH} aria-label="Atom feed of status changes"><FeedIcon /></a></h2>
                    <ol className="pl-latest">
                        {policyChanges().slice(0, 6).map((c) => <li key={`${c.measure.id}-${c.index}`}>
                            <span className="pl-mono">{fmtDate(c.date)}</span>
                            <TypeGlyph type={c.measure.type} status={c.status} size={14} />
                            <button type="button" className="pl-link" onClick={() => pick(c.measure.id)}>{c.measure.title}</button>
                            <b className={`pl-status pl-status-${c.status}`}>{MEASURE_STATUS_LABEL[c.status]}</b>
                        </li>)}
                    </ol>
                </section>

                <details className="pl-list">
                    <summary>All {shown.length} measures as a list</summary>
                    <table>
                        <thead><tr><th>Date</th><th>Where</th><th>Measure</th><th>Status</th></tr></thead>
                        <tbody>
                            {shown.map((m) => <tr key={m.id}>
                                <td className="pl-mono">{startDate(m)}</td>
                                <td className="pl-mono">{m.jurisdiction}</td>
                                <td>
                                    <TypeGlyph type={m.type} status={m.status} size={14} />
                                    <button type="button" className="pl-link" onClick={() => pick(m.id)}>{m.title}</button>
                                    <FootnoteRef sources={m.sources} asOf={lastChange(m)} confidence="reported" />
                                </td>
                                <td>{MEASURE_STATUS_LABEL[m.status]}</td>
                            </tr>)}
                        </tbody>
                    </table>
                </details>

                <SourcesSection />
            </main>
        </FootnotesProvider>
        <PublicFooter />
    </div>;
}
