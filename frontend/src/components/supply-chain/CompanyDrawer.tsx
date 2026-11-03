import type { ReactNode } from "react";
import { countryName } from "../../../../src/country-flag";
import { SUPPLY_CHAIN_PAGES_LIVE } from "../../../../src/public-navigation";
import { SEGMENT_LABEL } from "../../../../src/supply-chain/companies";
import { type LinkKind, type SupplyLink, linkKind } from "../../../../src/supply-chain/links";
import { SUPPLY_CHAIN_AS_OF, getCompany, linksOf, sitesOf } from "../../../../src/supply-chain/registry";
import { STAGE_LABEL } from "../../../../src/supply-chain/stages";
import { CompanyLogo } from "../CompanyLogo";
import { Flag } from "../Flag";
import { NodeBadge } from "../flows/NodeBadge";
import { liveCountryPage } from "../maps/Arcs";
import { MapDrawer } from "../maps/MapDrawer";
import { SiteDetail } from "./SiteDetail";
import { FootnoteRef, SourcedValue } from "./SourcedValue";
import "./company.css";

export interface CompanyDrawerProps {
    companyId: string;
    siteId?: string | null;
    // The map's country: plants there are listed first and a company
    // headquartered elsewhere gets an owner-country chip.
    country?: string;
    onClose: () => void;
    onSelectSite?: (siteId: string) => void;
    // Opens another company in place; partners not on this map link to
    // their country page instead (once it is live).
    onSelectCompany?: (companyId: string) => void;
    onMap?: (companyId: string) => boolean;
}

const OWNERSHIP: Record<string, string> = {
    listed: "Listed",
    private: "Private",
    state: "State-owned",
    subsidiary: "Subsidiary",
};

function Partner({ id, onSelect, onMap }: { id: string; onSelect?: (id: string) => void; onMap?: (id: string) => boolean }) {
    const c = getCompany(id);
    const name = c?.name ?? id;
    const flag = c ? <Flag code={c.hqCountry} decorative /> : null;
    if (onSelect && (onMap?.(id) ?? true)) return <button type="button" className="sc-partner" onClick={() => onSelect(id)}>{flag}{name}</button>;
    const page = c ? liveCountryPage(c.hqCountry) : undefined;
    if (page) return <a className="sc-partner" href={`${page}?company=${encodeURIComponent(id)}`}>{flag}{name}</a>;
    return <span className="sc-partner">{flag}{name}{c ? <small> ({countryName(c.hqCountry)})</small> : null}</span>;
}

// What the arrow means, read from this company's side.
const DIR_LABEL: Record<LinkKind, { to: string; from: string }> = {
    supply: { to: "Supplies", from: "Buys from" },
    investment: { to: "Invests in", from: "Funded by" },
    partnership: { to: "Partners with", from: "Partners with" },
};

function LinkRow({ link, dir, ...p }: { link: SupplyLink; dir: "to" | "from"; onSelect?: (id: string) => void; onMap?: (id: string) => boolean }) {
    const other = dir === "to" ? link.to : link.from;
    const kind = linkKind(link);
    const label = DIR_LABEL[kind][dir];
    return <li className={`sc-link is-${link.confidence} is-${kind}`}>
        <span className="sc-link-dir" role="img" aria-label={label} title={label}>{kind === "partnership" ? "↔" : dir === "to" ? "→" : "←"}</span>
        <Partner id={other} {...p} />
        <span className="sc-link-what">{link.what}<FootnoteRef sources={link.sources} asOf={SUPPLY_CHAIN_AS_OF} confidence={link.confidence} note={link.note} /></span>
    </li>;
}

// The company card a map selection opens (inside <MapDrawer>): HQ, plants,
// products, role in the chain, revenue, gross margin, ownership, and its
// suppliers and customers. Selecting a plant expands its <SiteDetail>.
// Shared by the country pages and the map kit page.
export function CompanyDrawer({ companyId, siteId = null, country, onClose, onSelectSite, onSelectCompany, onMap }: CompanyDrawerProps) {
    const c = getCompany(companyId);
    if (!c) return null;
    const sites = sitesOf(c.id).sort((a, b) => Number(b.country === country) - Number(a.country === country) || Number(b.kind === "hq") - Number(a.kind === "hq"));
    const { supplies, buys } = linksOf(c.id);
    const current = [...supplies.filter((l) => !l.ended).map((l) => ({ l, dir: "to" as const })), ...buys.filter((l) => !l.ended).map((l) => ({ l, dir: "from" as const }))];
    const foreign = country && c.hqCountry !== country;
    const facts: [string, ReactNode][] = [
        ["Revenue", c.revenue ? <SourcedValue value={c.revenue} /> : null],
        ["Gross margin", c.grossMargin ? <NodeBadge kind="margin" value={c.grossMargin} /> : null],
        ["Ownership", c.ownership ? [OWNERSHIP[c.ownership.kind], c.ownership.ticker, c.ownership.parent ? `of ${c.ownership.parent}` : null].filter(Boolean).join(" · ") : null],
        ["Role", c.stages.map((s) => STAGE_LABEL[s]).join(", ")],
        ["Products", c.products?.length ? c.products.join(", ") : null],
    ];
    const bom = SUPPLY_CHAIN_PAGES_LIVE.has("/bom") ? `/bom?company=${encodeURIComponent(c.id)}` : null;
    return <MapDrawer
        open
        title={c.name}
        kicker={<><Flag code={c.hqCountry} decorative /> {SEGMENT_LABEL[c.segment]}{foreign ? <span className="sc-owner-chip">Owner: {countryName(c.hqCountry)}</span> : null}</>}
        onClose={onClose}
    >
        <div className="sc-company" data-company={c.id}>
            <p className="sc-company-head">
                <CompanyLogo name={c.name} size={20} />
                {c.localName ? <span lang={c.hqCountry === "JP" ? "ja" : undefined}>{c.localName}</span> : null}
                <a href={c.url} rel="noopener">Website</a>
                {c.sources?.length ? <FootnoteRef sources={c.sources} asOf={SUPPLY_CHAIN_AS_OF} confidence="reported" /> : null}
            </p>
            <dl className="sc-facts">
                {facts.filter(([, v]) => v !== null).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
            </dl>
            <h4>Sites <span>{sites.length}</span></h4>
            <ul className="sc-sites">
                {sites.map((s) => <li key={s.id} className={s.id === siteId ? "is-on" : undefined}>
                    <button type="button" aria-expanded={s.id === siteId} onClick={() => onSelectSite?.(s.id)}>
                        <span>{s.name}</span>
                        <small><Flag code={s.country} decorative /> {s.admin1 ?? countryName(s.country)}{s.precision === "site" ? "" : " · approx."}</small>
                    </button>
                    {s.id === siteId ? <SiteDetail site={s} /> : null}
                </li>)}
            </ul>
            {current.length ? <>
                <h4>Supply links <span>{current.length}</span></h4>
                <ul className="sc-links">
                    {current.map(({ l, dir }) => <LinkRow key={`${l.from}-${l.to}`} link={l} dir={dir} onSelect={onSelectCompany} onMap={onMap} />)}
                </ul>
            </> : null}
            {bom ? <p className="sc-company-bom"><a href={bom}>In the bill of materials</a></p> : null}
        </div>
    </MapDrawer>;
}
