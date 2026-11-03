import { useEffect, useMemo, useState } from "react";
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
    PEOPLE_AS_OF,
    PEOPLE_DOMAINS,
    PEOPLE_PATH,
    type PeopleDomain,
    orgOf,
} from "../../../../src/people";
import { crossLinks, domainCounts, peopleByCountry } from "../../../../src/people/views";
import { DomainLegend, DomainMark, PeopleNetwork } from "./Network";
import "../tools.css";
import "../../components/people/people.css";
import "./people.css";

const TITLE = "Leading people in actuators and rare earths";
const SORTS = { domain: "Domain", name: "Name" } as const;
type Sort = keyof typeof SORTS;

function readState(): { domain: PeopleDomain | null; country: string | null } {
    if (typeof window === "undefined") return { domain: null, country: null };
    const q = new URLSearchParams(window.location.search);
    const d = q.get("domain");
    return {
        domain: (PEOPLE_DOMAINS as readonly string[]).includes(d ?? "") ? (d as PeopleDomain) : null,
        country: q.get("country")?.toUpperCase() || null,
    };
}

function writeState(domain: PeopleDomain | null, country: string | null) {
    const q = new URLSearchParams(window.location.search);
    if (domain) q.set("domain", domain);
    else q.delete("domain");
    if (country) q.set("country", country);
    else q.delete("country");
    const s = q.toString();
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${s ? `?${s}` : ""}${window.location.hash}`);
}

function Details({ person }: { person: DirectoryPerson }) {
    const links = crossLinks(person);
    return <>
        <p className="pp-role">{person.role}</p>
        <p className="pp-why">
            <svg width="12" height="12" viewBox="-7 -7 14 14" aria-hidden="true"><DomainMark domain={person.domain} r={5} /></svg>
            {person.whyTheyMatter}
        </p>
        <details className="pp-more">
            <summary>Key works</summary>
            <ul>
                {person.keyWorks.map((w) => <li key={w.url + w.title}>
                    <a href={w.url} target="_blank" rel="noopener">{w.title}</a>
                    <span>{w.year ? `${w.year} · ` : ""}{w.kind}</span>
                </li>)}
            </ul>
            {links.length > 0 ? <p className="pp-site">
                On this site: {links.map((l, i) => <span key={l.href}>{i > 0 ? ", " : ""}<a href={l.href}>{l.label}</a></span>)}
            </p> : null}
            <p className="pp-cite">Criterion: {CRITERIA[person.criterion]}</p>
        </details>
    </>;
}

export function People({ menuOpen = false }: { menuOpen?: boolean }) {
    const [domain, setDomain] = useState<PeopleDomain | null>(() => readState().domain);
    const [country, setCountry] = useState<string | null>(() => readState().country);
    const [sort, setSort] = useState<Sort>("domain");
    const [hashId, setHashId] = useState<string | null>(null);
    const counts = useMemo(() => domainCounts(), []);

    useEffect(() => {
        const prev = document.title;
        document.title = TITLE;
        const onHash = () => setHashId(window.location.hash.slice(1) || null);
        onHash();
        window.addEventListener("hashchange", onHash);
        return () => {
            document.title = prev;
            window.removeEventListener("hashchange", onHash);
        };
    }, []);
    useEffect(() => writeState(domain, country), [domain, country]);

    const inDomain = useMemo(() => DIRECTORY.filter((p) => !domain || p.domain === domain), [domain]);
    const shown = useMemo(() => {
        const list = inDomain.filter((p) => !country || orgOf(p).country === country);
        return sort === "name" ? [...list].sort((a, b) => a.name.localeCompare(b.name)) : list;
    }, [inDomain, country, sort]);
    const byCountry = useMemo(() => peopleByCountry(inDomain), [inDomain]);

    return <div className="tool-page pp-page">
        <PublicHeader path={PEOPLE_PATH} initialOpen={menuOpen} />
        <main className="tool-main">
            <header className="tool-head">
                <p className="tool-kicker">People</p>
                <h1>Who shapes actuators and the magnet supply chain</h1>
                <p className="pp-lede">{DIRECTORY.length} researchers, founders, magnet and rare earth executives, analysts and policy leads. Roles checked {PEOPLE_AS_OF}.</p>
            </header>

            <div className="pp-bar">
                <div className="pp-filter" role="group" aria-label="Domain">
                    <button type="button" aria-pressed={domain === null} onClick={() => setDomain(null)}>All <span>{DIRECTORY.length}</span></button>
                    {PEOPLE_DOMAINS.map((d) => <button key={d} type="button" aria-pressed={domain === d} onClick={() => setDomain(domain === d ? null : d)}>
                        <svg width="12" height="12" viewBox="-7 -7 14 14" aria-hidden="true"><DomainMark domain={d} r={5} /></svg>
                        {DOMAIN_LABEL[d]} <span>{counts[d]}</span>
                    </button>)}
                </div>
                <label className="pp-sort">
                    Sort
                    <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                        {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                </label>
            </div>
            {country ? <p className="pp-chip">
                Affiliated in {countryName(country)}
                <button type="button" onClick={() => setCountry(null)} aria-label="Clear country filter">×</button>
            </p> : null}

            <section className="pg" aria-label="People">
                <h2 className="pg-label">Directory<span>{shown.length}</span></h2>
                <div className="pg-grid">
                    {shown.map((p) => <PersonCard key={p.id} person={p}><Details person={p} /></PersonCard>)}
                </div>
                {shown.length === 0 ? <p className="pp-empty">Nobody matches these filters.</p> : null}
            </section>

            <section className="pp-sec" aria-labelledby="pp-net-h">
                <h2 id="pp-net-h">Affiliation network</h2>
                <p className="pp-note">Lines join people to organisations; dashed lines are earlier or secondary affiliations. Shared organisations are labelled.</p>
                <PeopleNetwork people={inDomain} selected={hashId} />
            </section>

            <section className="pp-sec" aria-labelledby="pp-map-h">
                <h2 id="pp-map-h">Where they work</h2>
                <p className="pp-note">People per country of their main affiliation. Select a country to filter the directory.</p>
                <WorldMap
                    label="People per country of main affiliation"
                    values={byCountry}
                    valueLabel="People"
                    selectedCountry={country}
                    onSelectCountry={(iso) => setCountry(country === iso ? null : iso)}
                />
            </section>

            <section className="pp-sec pp-criteria" aria-labelledby="pp-crit-h">
                <h2 id="pp-crit-h">Who is listed</h2>
                <p>At least one of these holds, with a public source:</p>
                <ul>{Object.entries(CRITERIA).map(([k, v]) => <li key={k}>{v}</li>)}</ul>
                <p>{EXCLUSIONS} Photos appear only with a clear licence; everyone else gets initials.</p>
                <DomainLegend />
                <div className="ctb-foot">
                    <a className="req-cta" href="/contact">Suggest someone</a>
                    <p>Listed and want a change? <a href="/contact">Contact</a> · Sources: <a href={`${PEOPLE_PATH}.md`}>markdown</a>, <a href="/api/v1/people">JSON</a></p>
                </div>
            </section>
        </main>
        <PublicFooter />
    </div>;
}
