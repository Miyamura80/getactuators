import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PublicFooter } from "../../components/PublicFooter";
import { PublicHeader } from "../../components/PublicHeader";
import { PersonCard } from "../../components/people/PersonCard";
import { WorldMap } from "../../components/maps/WorldMap";
import { countryName } from "../../../../src/country-flag";
import {
    CRITERIA,
    DIRECTORY,
    DOMAIN_LABEL,
    type DirectoryPerson,
    EXCLUSIONS,
    ORGS,
    type OrgId,
    PEOPLE_AS_OF,
    PEOPLE_DOMAINS,
    PEOPLE_PATH,
    type PeopleDomain,
    getDirectoryPerson,
    initials,
    orgOf,
} from "../../../../src/people";
import { getSource } from "../../../../src/supply-chain/sources";
import { crossLinks, domainCounts, orgLogoOnLight, peopleAt, peopleByCountry } from "../../../../src/people/views";
import { PeopleNetwork, type Selection, useOrgLogos } from "./Network";
import "../tools.css";
import "../../components/people/people.css";
import "./people.css";

const TITLE = "Leading people in actuators and rare earths";
const PARAM = { person: "p", org: "org", country: "country" } as const;

// ?p=<id>, ?org=<id> or ?country=<ISO>; a bare #<person id> (the anchors the
// markdown twin and JSON-LD use) maps to ?p=<id>.
function readSelection(): Selection {
    if (typeof window === "undefined") return null;
    const q = new URLSearchParams(window.location.search);
    const p = q.get(PARAM.person);
    if (p && getDirectoryPerson(p)) return { kind: "person", id: p };
    const org = q.get(PARAM.org);
    if (org && org in ORGS && peopleAt(org).length) return { kind: "org", id: org };
    const c = q.get(PARAM.country)?.toUpperCase();
    if (c && peopleByCountry()[c]) return { kind: "country", id: c };
    const hash = window.location.hash.slice(1);
    if (hash && getDirectoryPerson(hash)) return { kind: "person", id: hash };
    return null;
}

function selectionUrl(s: Selection): string {
    const q = new URLSearchParams(window.location.search);
    for (const k of Object.values(PARAM)) q.delete(k);
    if (s) q.set(PARAM[s.kind], s.id);
    const qs = q.toString();
    return `${window.location.pathname}${qs ? `?${qs}` : ""}`;
}

function PersonChip({ p, onOpen }: { p: DirectoryPerson; onOpen: (id: string) => void }) {
    return <a className={`pp-chip pp-${p.domain}`} href={`?p=${p.id}`} onClick={(e) => { e.preventDefault(); onOpen(p.id); }}>
        <i className={`pp-dot pp-${p.domain}`} aria-hidden="true" />{p.name}
    </a>;
}

function PersonDetail({ person, onOrg }: { person: DirectoryPerson; onOrg: (id: string) => void }) {
    const links = crossLinks(person);
    const others = (person.alsoOrgIds ?? []).map((id) => ORGS[id]);
    return <PersonCard person={person}>
        <p className="pp-role">{person.role}</p>
        <p className="pp-domain"><i className={`pp-dot pp-${person.domain}`} aria-hidden="true" />{DOMAIN_LABEL[person.domain]}</p>
        <p className="pp-why">{person.whyTheyMatter}</p>
        <h4>Key works</h4>
        <ul className="pp-works">
            {person.keyWorks.map((w) => <li key={w.url + w.title}>
                <a href={w.url} target="_blank" rel="noopener">{w.title}</a>
                <span>{w.year ? `${w.year} · ` : ""}{w.kind}</span>
            </li>)}
        </ul>
        {others.length ? <p className="pp-also">Also: {others.map((o, i) => <span key={o.id}>{i > 0 ? ", " : ""}<a href={`?org=${o.id}`} onClick={(e) => { e.preventDefault(); onOrg(o.id); }}>{o.name}</a></span>)}</p> : null}
        {links.length ? <p className="pp-site">On this site: {links.map((l, i) => <span key={l.href}>{i > 0 ? ", " : ""}<a href={l.href}>{l.label}</a></span>)}</p> : null}
        <details className="pp-more">
            <summary>Sources</summary>
            <ol>
                {person.sources.map((id) => {
                    const s = getSource(id);
                    return <li key={id}><a href={s?.url} target="_blank" rel="noopener">{s?.title ?? id}</a> <span>{s?.publisher}</span></li>;
                })}
            </ol>
            <p className="pp-cite">Listed because: {CRITERIA[person.criterion]}</p>
        </details>
    </PersonCard>;
}

function OrgDetail({ orgId, onPerson }: { orgId: string; onPerson: (id: string) => void }) {
    const org = ORGS[orgId as OrgId];
    const logos = useOrgLogos();
    const logo = logos.url(org, 72);
    return <div className="pp-orgcard">
        <div className="pp-orgcard-head">
            {logo ? <img className={orgLogoOnLight(org, logo) ? "is-light" : ""} src={logo} alt="" width={64} height={64} onError={() => logos.fail(logo)} /> : <span className="pp-tip-mono" aria-hidden="true">{initials(org.name)}</span>}
            <div>
                <h3>{org.name}</h3>
                <p>{org.country ? countryName(org.country) : ""} · <a href={org.url} target="_blank" rel="noopener">Website</a></p>
            </div>
        </div>
        <div className="pp-chips">{peopleAt(org.id).map((p) => <PersonChip key={p.id} p={p} onOpen={onPerson} />)}</div>
    </div>;
}

// Matches the map: with a domain selected, only that domain's people count.
function CountryDetail({ code, domain, onPerson }: { code: string; domain: PeopleDomain | null; onPerson: (id: string) => void }) {
    const people = DIRECTORY.filter((p) => orgOf(p).country === code && (!domain || p.domain === domain));
    return <div className="pp-orgcard">
        <h3>{countryName(code)}</h3>
        <p className="pp-note">{people.length} {people.length === 1 ? "person" : "people"}{domain ? ` in ${DOMAIN_LABEL[domain]}` : ""} with a main affiliation here</p>
        <div className="pp-chips">{people.map((p) => <PersonChip key={p.id} p={p} onOpen={onPerson} />)}</div>
    </div>;
}

// The detail view: a side panel on desktop, a bottom sheet on phones.
function Panel({ selection, domain, onClose, onSelect }: { selection: NonNullable<Selection>; domain: PeopleDomain | null; onClose: () => void; onSelect: (s: Selection) => void }) {
    const close = useRef<HTMLButtonElement>(null);
    // Give focus back to whatever opened the panel when it closes. Declared
    // before the effect below, so it records the opener, not the close button.
    useEffect(() => {
        const opener = document.activeElement;
        return () => {
            if ((opener instanceof HTMLElement || opener instanceof SVGElement) && opener.isConnected) opener.focus();
        };
    }, []);
    useEffect(() => close.current?.focus(), [selection.kind, selection.id]);
    const person = selection.kind === "person" ? getDirectoryPerson(selection.id) : undefined;
    const label = person?.name ?? (selection.kind === "org" ? ORGS[selection.id as OrgId].name : countryName(selection.id));
    return <aside className="pp-panel" role="dialog" aria-modal="false" aria-label={label}>
        <button ref={close} type="button" className="pp-close" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        {person ? <PersonDetail person={person} onOrg={(id) => onSelect({ kind: "org", id })} /> : null}
        {selection.kind === "org" ? <OrgDetail orgId={selection.id} onPerson={(id) => onSelect({ kind: "person", id })} /> : null}
        {selection.kind === "country" ? <CountryDetail code={selection.id} domain={domain} onPerson={(id) => onSelect({ kind: "person", id })} /> : null}
    </aside>;
}

export function People({ menuOpen = false }: { menuOpen?: boolean }) {
    const [domain, setDomain] = useState<PeopleDomain | null>(null);
    const [selection, setSelection] = useState<Selection>(() => readSelection());
    const counts = useMemo(() => domainCounts(), []);
    const byCountry = useMemo(() => peopleByCountry(DIRECTORY.filter((p) => !domain || p.domain === domain)), [domain]);

    const select = useCallback((s: Selection) => {
        setSelection(s);
        window.history.pushState(window.history.state, "", selectionUrl(s));
    }, []);

    // Escape closes the panel. The history push stays out of the state
    // updater (which must be pure), so StrictMode adds one entry, not two.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && selection) select(null);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [selection, select]);

    useEffect(() => {
        const prev = document.title;
        document.title = TITLE;
        // Old #<id> anchors become ?p=<id>.
        const initial = readSelection();
        if (initial && window.location.hash) window.history.replaceState(window.history.state, "", selectionUrl(initial));
        const onPop = () => setSelection(readSelection());
        window.addEventListener("popstate", onPop);
        window.addEventListener("hashchange", onPop);
        return () => {
            document.title = prev;
            window.removeEventListener("popstate", onPop);
            window.removeEventListener("hashchange", onPop);
        };
    }, []);

    return <div className={`tool-page pp-page${selection ? " has-panel" : ""}`}>
        <PublicHeader path={PEOPLE_PATH} initialOpen={menuOpen} />
        <main className="tool-main">
            <header className="tool-head">
                <p className="tool-kicker">People</p>
                <h1>Who shapes actuators and the magnet supply chain</h1>
                <p className="pp-lede">{DIRECTORY.length} researchers, founders, magnet and rare earth executives, analysts and policy leads. Select anyone to see why they matter. Roles checked {PEOPLE_AS_OF}.</p>
            </header>

            <div className="pp-filter" role="group" aria-label="Domain">
                <button type="button" aria-pressed={domain === null} onClick={() => setDomain(null)}>All <span>{DIRECTORY.length}</span></button>
                {PEOPLE_DOMAINS.map((d) => <button key={d} type="button" aria-pressed={domain === d} onClick={() => setDomain(domain === d ? null : d)}>
                    <i className={`pp-dot pp-${d}`} aria-hidden="true" />{DOMAIN_LABEL[d]} <span>{counts[d]}</span>
                </button>)}
            </div>

            <PeopleNetwork domain={domain} selected={selection} onSelect={select} />

            <section className="pp-sec pp-map" aria-labelledby="pp-map-h">
                <h2 id="pp-map-h">Where they work</h2>
                <WorldMap
                    label="People per country of main affiliation"
                    values={byCountry}
                    valueLabel="People"
                    selectedCountry={selection?.kind === "country" ? selection.id : null}
                    onSelectCountry={(iso) => select(selection?.kind === "country" && selection.id === iso ? null : { kind: "country", id: iso })}
                />
            </section>

            {/* Every person as a plain link, for crawlers and screen readers;
                the network is the visual index. */}
            <nav className="sr-only" aria-label="Everyone listed">
                <ul>{DIRECTORY.map((p) => <li key={p.id}><a href={`?p=${p.id}`}>{p.name}, {p.role}</a></li>)}</ul>
            </nav>

            <section className="pp-sec pp-criteria" aria-labelledby="pp-crit-h">
                <details>
                    <summary><h2 id="pp-crit-h">Who is listed</h2></summary>
                    <ul>{Object.entries(CRITERIA).map(([k, v]) => <li key={k}>{v}</li>)}</ul>
                    <p>{EXCLUSIONS} Photos appear only with a clear licence; everyone else gets initials.</p>
                </details>
                <div className="ctb-foot">
                    <a className="req-cta" href="/contact">Suggest someone</a>
                    <p>Listed and want a change? <a href="/contact">Contact</a> · <a href={`${PEOPLE_PATH}.md`}>Markdown</a> · <a href="/api/v1/people">JSON</a></p>
                </div>
            </section>
        </main>
        {selection ? <Panel selection={selection} domain={domain} onClose={() => select(null)} onSelect={select} /> : null}
        <PublicFooter />
    </div>;
}
