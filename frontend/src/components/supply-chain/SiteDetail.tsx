import type { ReactNode } from "react";
import { countryName } from "../../../../src/country-flag";
import { SUPPLY_CHAIN_AS_OF } from "../../../../src/supply-chain/registry";
import type { Site } from "../../../../src/supply-chain/sites";
import { STAGE_LABEL } from "../../../../src/supply-chain/stages";
import { Flag } from "../Flag";
import { FootnoteRef, SourcedValue } from "./SourcedValue";
import "./company.css";

const KIND: Record<Site["kind"], string> = {
    hq: "Headquarters",
    plant: "Plant",
    mine: "Mine",
    refinery: "Refinery",
    rnd: "R&D centre",
};

const STATUS: Record<NonNullable<Site["status"]>, string> = {
    operating: "Operating",
    construction: "Under construction",
    announced: "Announced",
    closed: "Closed",
};

const PIN: Record<Site["precision"], string> = {
    site: "Exact site",
    city: "City centre",
    region: "Prefecture or region only",
};

// One site in full: what it makes, capacity, year opened, status, how exact
// the pin is and its sources. Shared by every map drawer (via CompanyDrawer):
// the country pages and the map kit page.
export function SiteDetail({ site }: { site: Site }) {
    const rows: [string, ReactNode][] = [
        ["Where", <><Flag code={site.country} decorative /> {[site.admin1, countryName(site.country)].filter(Boolean).join(", ")}</>],
        ["Makes", site.makes?.length ? site.makes.join(", ") : null],
        ["Stage", site.stages.length ? site.stages.map((s) => STAGE_LABEL[s]).join(", ") : null],
        ["Capacity", site.capacity ? <SourcedValue value={site.capacity} /> : null],
        ["Opened", site.opened ? <SourcedValue value={site.opened} /> : null],
        ["Status", site.status ? <span className={`sc-site-status is-${site.status}`}>{STATUS[site.status]}</span> : null],
        ["Pin", PIN[site.precision]],
    ];
    return <div className="sc-site" data-site={site.id}>
        <p className="sc-site-kind">{KIND[site.kind]}</p>
        <dl className="sc-facts">
            {rows.filter(([, v]) => v !== null).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
        </dl>
        <p className="sc-site-src">Source<FootnoteRef sources={site.sources} asOf={SUPPLY_CHAIN_AS_OF} confidence="reported" /></p>
    </div>;
}
