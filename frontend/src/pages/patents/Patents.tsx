import { type ReactNode, useEffect, useState } from "react";
import { PublicFooter } from "../../components/PublicFooter";
import { PublicHeader } from "../../components/PublicHeader";
import {
    FIRST_YEAR,
    LANDSCAPE,
    type LandscapeScope,
    METHODOLOGY,
    PATENTS_AS_OF,
    PATENTS_PATH,
    STREAM_FILTERS,
    type Applicants,
    type StreamFilter,
    TECHNOLOGY_LIST,
    type TechnologyId,
    getTechnology,
    isLandscapeScope,
    isStreamFilter,
    isTechnologyId,
    landscapeOf,
    patentsApiPath,
    scopeLabel,
} from "../../../../src/patents";
import { Areas, type AreasView } from "./Areas";
import { AssigneeMap } from "./AssigneeMap";
import { FamilyList } from "./FamilyList";
import { Leaders } from "./Leaders";
import { Momentum, type MomentumView, WINDOWS } from "./Momentum";
import { type StackBy, Stream } from "./Stream";
import { Value } from "./Value";
import "../tools.css";
import "../trends/trends.css";
import "./patents.css";

const TITLE = "Actuator patents";

export const SCOPES: { id: LandscapeScope; label: string }[] = [
    { id: "all", label: "All" },
    ...TECHNOLOGY_LIST.map((t) => ({ id: t.id, label: t.short })),
];

interface State {
    scope: LandscapeScope;
    by: StackBy;
    filter: StreamFilter;
    // null: the device default (grid on a phone, flow otherwise).
    areas: AreasView | null;
    trend: MomentumView;
    applicants: Applicants;
    // Technologies hidden from the momentum view.
    hide: TechnologyId[];
}

const narrowScreen = () => typeof window.matchMedia === "function" && window.matchMedia("(max-width: 560px)").matches;

// URL state, one query parameter per field: ?technology=<id> picks the
// scope; ?stack=technology stacks by technology; ?filter=granted|intl|triadic
// filters the stream; ?areas=flow|grid picks the application view;
// ?trend=index, ?applicants=ex-cn and ?hide=<ids> set momentum. A field at
// its default is left out of the URL. Table order is URL order.
interface Param<T> {
    key: string;
    fallback: T;
    // The value a query string gives, or undefined to fall back.
    parse: (raw: string) => T | undefined;
    // "" leaves the parameter out.
    format: (v: T) => string;
}

const oneOf = <T extends string>(ids: readonly T[]) => (raw: string) => ids.find((id) => id === raw);
const omitting = <T extends string>(fallback: T) => (v: T) => (v === fallback ? "" : v);

const PARAMS: { [K in keyof State]: Param<State[K]> } = {
    scope: { key: "technology", fallback: "all", parse: (raw) => (isLandscapeScope(raw) ? raw : undefined), format: omitting<LandscapeScope>("all") },
    by: { key: "stack", fallback: "country", parse: oneOf<StackBy>(["country", "technology"]), format: omitting<StackBy>("country") },
    filter: { key: "filter", fallback: "all", parse: (raw) => (isStreamFilter(raw) ? raw : undefined), format: omitting<StreamFilter>("all") },
    trend: { key: "trend", fallback: "tiles", parse: oneOf<MomentumView>(["tiles", "index"]), format: omitting<MomentumView>("tiles") },
    applicants: { key: "applicants", fallback: "all", parse: oneOf<Applicants>(["all", "ex-cn"]), format: omitting<Applicants>("all") },
    hide: { key: "hide", fallback: [], parse: (raw) => raw.split(",").filter(isTechnologyId), format: (v) => v.join(",") },
    areas: { key: "areas", fallback: null, parse: oneOf<AreasView>(["flow", "grid"]), format: (v) => v ?? "" },
};
const FIELDS = Object.keys(PARAMS) as (keyof State)[];

function readParam<T>(q: URLSearchParams, p: Param<T>): T {
    const raw = q.get(p.key);
    return raw === null ? p.fallback : (p.parse(raw) ?? p.fallback);
}

function readState(): State {
    const q = new URLSearchParams(window.location.search);
    const read = <K extends keyof State>(k: K): State[K] => readParam(q, PARAMS[k]);
    return { scope: read("scope"), by: read("by"), filter: read("filter"), areas: read("areas"), trend: read("trend"), applicants: read("applicants"), hide: read("hide") };
}

// The page URL for a state, keeping any other query parameters.
function stateUrl(next: State): string {
    const q = new URLSearchParams(window.location.search);
    for (const k of FIELDS) q.delete(PARAMS[k].key);
    const put = <K extends keyof State>(k: K) => {
        const v = PARAMS[k].format(next[k]);
        if (v) q.set(PARAMS[k].key, v);
    };
    for (const k of FIELDS) put(k);
    const qs = q.toString();
    return `${PATENTS_PATH}${qs ? `?${qs}` : ""}`;
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
        window.history.replaceState(window.history.state, "", stateUrl(next));
    };
    const tech = state.scope === "all" ? undefined : getTechnology(state.scope);
    const [defaultAreas] = useState<AreasView>(() => (narrowScreen() ? "grid" : "flow"));
    const areasView = state.areas ?? defaultAreas;
    const l = landscapeOf(state.scope);
    return <div className="tool-page tr-page pt-page">
        <PublicHeader path={PATENTS_PATH} initialOpen={menuOpen} />
        <main className="tool-main">
            <header className="tr-head">
                <h1>Who patents actuator technology</h1>
                <p>{LANDSCAPE.all.families.toLocaleString("en-US")} patent families · {TECHNOLOGY_LIST.length} technologies · priority {FIRST_YEAR} on · {PATENTS_AS_OF}</p>
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

            <Section id="pt-momentum" title={`Momentum ${WINDOWS}`} aside={<div className="pt-toggles">
                    <Toggle label="Momentum view" value={state.trend} onChange={(trend) => update({ ...state, trend })}
                        options={[{ id: "tiles", label: "Tiles" }, { id: "index", label: "Indexed" }]} />
                    <Toggle label="Applicants" value={state.applicants} onChange={(applicants) => update({ ...state, applicants })}
                        options={[{ id: "all", label: "All" }, { id: "ex-cn", label: "Outside China" }]} />
                </div>}>
                <Momentum scope={state.scope} view={state.trend} applicants={state.applicants}
                    hidden={state.hide} onHidden={(hide) => update({ ...state, hide })} onPick={(scope) => update({ ...state, scope })} />
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
                        <ul className="pt-codes">{tech.codes.map((c) => <li key={c.code}><code>{c.code}</code>{c.filtered ? <em>filtered</em> : null} {c.why}</li>)}</ul>
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
