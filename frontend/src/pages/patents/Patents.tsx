import { type ReactNode, useEffect, useState } from "react";
import { PublicFooter } from "../../components/PublicFooter";
import { PublicHeader } from "../../components/PublicHeader";
import {
    LANDSCAPE,
    type LandscapeScope,
    METHODOLOGY,
    PATENTS_AS_OF,
    PATENTS_PATH,
    TECHNOLOGIES,
    isLandscapeScope,
    landscapeOf,
    patentsApiPath,
    scopeLabel,
} from "../../../../src/patents";
import { AssigneeMap } from "./AssigneeMap";
import { FamilyList } from "./FamilyList";
import { Leaders } from "./Leaders";
import { type StackBy, Stream } from "./Stream";
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
}

// ?technology=<id> picks the scope; ?stack=technology stacks by technology.
function readState(): State {
    const q = new URLSearchParams(window.location.search);
    const t = q.get("technology") ?? "";
    return { scope: isLandscapeScope(t) ? t : "all", by: q.get("stack") === "technology" ? "technology" : "country" };
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
        q.delete("technology");
        q.delete("stack");
        if (next.scope !== "all") q.set("technology", next.scope);
        if (next.by === "technology") q.set("stack", "technology");
        const qs = q.toString();
        window.history.replaceState(window.history.state, "", `${PATENTS_PATH}${qs ? `?${qs}` : ""}`);
    };
    const tech = TECHNOLOGIES.find((t) => t.id === state.scope);
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

            <Section id="pt-stream" title="Families per priority year" aside={<div className="tr-toggle" role="group" aria-label="Stack by">
                    {(["country", "technology"] as const).map((b) => <button key={b} type="button" aria-pressed={state.by === b} onClick={() => update({ ...state, by: b })}>
                        By {b}
                    </button>)}
                </div>}>
                <Stream scope={state.scope} by={state.by} />
            </Section>

            <Section id="pt-leaders" title="Top assignees" aside={<span className="pt-aside">{l.assignees.toLocaleString("en-US")} assignees</span>}>
                <Leaders scope={state.scope} />
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
