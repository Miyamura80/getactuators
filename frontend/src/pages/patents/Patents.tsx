import { type ReactNode, useEffect, useState } from "react";
import { PublicFooter } from "../../components/PublicFooter";
import { PublicHeader } from "../../components/PublicHeader";
import {
    LANDSCAPE,
    type LandscapeScope,
    METHODOLOGY,
    PATENTS_AS_OF,
    PATENTS_PATH,
    STREAM_FILTERS,
    type StreamFilter,
    TECHNOLOGIES,
    isLandscapeScope,
    isStreamFilter,
    landscapeOf,
    patentsApiPath,
    scopeLabel,
} from "../../../../src/patents";
import { Areas, type AreasView } from "./Areas";
import { AssigneeMap } from "./AssigneeMap";
import { FamilyList } from "./FamilyList";
import { Leaders } from "./Leaders";
import { type StackBy, Stream } from "./Stream";
import { Value } from "./Value";
import "../tools.css";
import "../trends/trends.css";
import "./patents.css";

const TITLE = "Actuator patents";

export const SCOPES: { id: LandscapeScope; label: string }[] = [
    { id: "all", label: "All" },
    ...TECHNOLOGIES.map((t) => ({ id: t.id as LandscapeScope, label: t.short })),
];

interface State {
    scope: LandscapeScope;
    by: StackBy;
    filter: StreamFilter;
    // null: the device default (grid on a phone, flow otherwise).
    areas: AreasView | null;
}

const narrowScreen = () => typeof window.matchMedia === "function" && window.matchMedia("(max-width: 560px)").matches;

// ?technology=<id> picks the scope; ?stack=technology stacks by technology;
// ?filter=granted|intl|triadic filters the stream; ?areas=flow|grid picks
// the application view.
function readState(): State {
    const q = new URLSearchParams(window.location.search);
    const t = q.get("technology") ?? "";
    const f = q.get("filter") ?? "";
    const a = q.get("areas");
    return {
        scope: isLandscapeScope(t) ? t : "all",
        by: q.get("stack") === "technology" ? "technology" : "country",
        filter: isStreamFilter(f) ? f : "all",
        areas: a === "flow" || a === "grid" ? a : null,
    };
}

function Toggle<T extends string>({ label, options, value, onChange }: { label: string; options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
    return <div className="tr-toggle" role="group" aria-label={label}>
        {options.map((o) => <button key={o.id} type="button" aria-pressed={value === o.id} onClick={() => onChange(o.id)}>{o.label}</button>)}
    </div>;
}

function Section({ id, title, children, aside }: { id: string; title: string; children: ReactNode; aside?: ReactNode }) {
    return <section className="pt-sec" aria-labelledby={`${id}-h`}>
        <div className="pt-sec-head"><h2 id={`${id}-h`}>{title}</h2>{aside}</div>
        {children}
    </section>;
}

export function Patents({ menuOpen = false }: { menuOpen?: boolean }) {
    const [state, setState] = useState(readState);
    const [country, setCountry] = useState<string | null>(null);
    useEffect(() => {
        const prev = document.title;
        document.title = TITLE;
        return () => {
            document.title = prev;
        };
    }, []);
    const update = (next: State) => {
        setState(next);
        if (next.scope !== state.scope) setCountry(null);
        const q = new URLSearchParams(window.location.search);
        for (const k of ["technology", "stack", "filter", "areas"]) q.delete(k);
        if (next.scope !== "all") q.set("technology", next.scope);
        if (next.by === "technology") q.set("stack", "technology");
        if (next.filter !== "all") q.set("filter", next.filter);
        if (next.areas) q.set("areas", next.areas);
        const qs = q.toString();
        window.history.replaceState(window.history.state, "", `${PATENTS_PATH}${qs ? `?${qs}` : ""}`);
    };
    const tech = TECHNOLOGIES.find((t) => t.id === state.scope);
    const [defaultAreas] = useState<AreasView>(() => (narrowScreen() ? "grid" : "flow"));
    const areasView = state.areas ?? defaultAreas;
    const l = landscapeOf(state.scope);
    return <div className="tool-page tr-page pt-page">
        <PublicHeader path={PATENTS_PATH} initialOpen={menuOpen} />
        <main className="tool-main">
            <header className="tr-head">
                <h1>Who patents actuator technology</h1>
                <p>{LANDSCAPE.all.families.toLocaleString("en-US")} patent families · {TECHNOLOGIES.length} technologies · priority 2010 on · {PATENTS_AS_OF}</p>
            </header>
            <div className="pt-scopes" role="group" aria-label="Technology">
                {SCOPES.map((s) => <button key={s.id} type="button" aria-pressed={state.scope === s.id} onClick={() => update({ ...state, scope: s.id })}>
                    {s.label}<span>{landscapeOf(s.id).families.toLocaleString("en-US")}</span>
                </button>)}
            </div>
            <p className="pt-scope-line" aria-live="polite"><b>{scopeLabel(state.scope)}</b>{tech ? ` · ${tech.scope}` : ""}</p>

            <Section id="pt-stream" title="Families per priority year" aside={<div className="pt-toggles">
                    <Toggle label="Stack by" value={state.by} onChange={(by) => update({ ...state, by })}
                        options={[{ id: "country", label: "By country" }, { id: "technology", label: "By technology" }]} />
                    <Toggle label="Quality filter" value={state.filter} onChange={(filter) => update({ ...state, filter })} options={STREAM_FILTERS} />
                </div>}>
                <Stream scope={state.scope} by={state.by} filter={state.filter} />
            </Section>

            <Section id="pt-leaders" title="Top assignees" aside={<span className="pt-aside">{l.assignees.toLocaleString("en-US")} assignees</span>}>
                <Leaders scope={state.scope} />
            </Section>

            <Section id="pt-value" title="Value vs volume">
                <Value scope={state.scope} />
            </Section>

            <Section id="pt-areas" title="Where it ends up" aside={<Toggle label="Application view" value={areasView} onChange={(areas) => update({ ...state, areas })}
                options={[{ id: "flow", label: "Flow" }, { id: "grid", label: "Grid" }]} />}>
                <Areas scope={state.scope} view={areasView} />
            </Section>

            <Section id="pt-map" title="Where they file from">
                <AssigneeMap scope={state.scope} country={country} onCountry={setCountry} />
            </Section>

            <Section id="pt-families" title="Largest families">
                <FamilyList scope={state.scope} country={country} onClearCountry={() => setCountry(null)} />
            </Section>

            <section className="pt-sec pt-method" aria-labelledby="pt-method-h">
                <details>
                    <summary><h2 id="pt-method-h">Method</h2></summary>
                    <ul>{Object.entries(METHODOLOGY).map(([k, v]) => <li key={k}>{v}</li>)}</ul>
                    {tech ? <>
                        <h3>CPC codes: {tech.label}</h3>
                        <ul className="pt-codes">{tech.codes.map((c) => <li key={c.code}><code>{c.code}</code>{"filtered" in c && c.filtered ? <em>filtered</em> : null} {c.why}</li>)}</ul>
                    </> : null}
                </details>
                <p className="pt-links">
                    <a href={`${PATENTS_PATH}.md`}>Markdown</a> · <a href={patentsApiPath(state.scope)}>JSON</a> · Data: Google Patents Public Datasets (CC BY 4.0)
                </p>
            </section>
        </main>
        <PublicFooter />
    </div>;
}
