import { useEffect, useMemo, useRef } from "react";
import { SEGMENTS, SEGMENT_LABEL } from "../../../../../src/supply-chain/companies";
import {
    COUNTRY_AS_OF,
    type CountryPage as CountryPageData,
    clusterSites,
    countryCompanies,
    countryLinks,
    countrySites,
} from "../../../../../src/supply-chain/country-pages";
import { SEGMENT_SHORT, sitePins, supplyArcs } from "../../../../../src/supply-chain/map";
import { getCompany, sitesOf } from "../../../../../src/supply-chain/registry";
import { Arcs } from "../../../components/maps/Arcs";
import { ClusterZoom } from "../../../components/maps/ClusterZoom";
import { CountryMap } from "../../../components/maps/CountryMap";
import type { MapTopology } from "../../../components/maps/geo";
import { SegmentTile } from "../../../components/maps/SegmentTile";
import { PublicFooter } from "../../../components/PublicFooter";
import { PublicHeader } from "../../../components/PublicHeader";
import { CompanyDrawer } from "../../../components/supply-chain/CompanyDrawer";
import { CompanyTable } from "../../../components/supply-chain/CompanyTable";
import { FootnotesProvider } from "../../../components/supply-chain/footnotes";
import { SourcesSection } from "../../../components/supply-chain/SourcesSection";
import { StageStrip } from "./StageStrip";
import { useCountryState } from "./url-state";
import "../../tools.css";
import "../../../components/supply-chain/supply-chain.css";
import "./country.css";

// One country of the supply-chain atlas (/japan, ...): the overview strip,
// then a map of every company's headquarters and plants by segment, with
// supply arcs (those leaving the country end in a chip that links to that
// country's page once live), named clusters to zoom to, the company card in
// a drawer (a bottom sheet on phones) and the company table. Segment,
// company, site and cluster live in the URL.
//
// A busy country (more links or sites than below) opens calm: links draw
// once a company or site is chosen, and single sites are named
// once the map is zoomed in; group and cluster names always show.
const BUSY_LINKS = 45;
const BUSY_SITES = 100;
export function CountryPage({ page, menuOpen = false, topology }: {
    page: CountryPageData;
    menuOpen?: boolean;
    // Preloaded admin-1 outlines (tests); the map fetches them otherwise.
    topology?: MapTopology;
}) {
    const state = useCountryState();
    const mapRef = useRef<HTMLElement>(null);
    const title = `${page.name}: actuator supply chain`;
    useEffect(() => {
        const prev = document.title;
        document.title = title;
        return () => { document.title = prev; };
    }, [title]);
    const data = useMemo(() => {
        const sites = countrySites(page.code);
        return {
            companies: countryCompanies(page.code),
            sites,
            pins: sitePins(sites),
            arcs: supplyArcs(countryLinks(page.code)),
        };
    }, [page.code]);
    const segment = state.segment;
    const pins = segment ? data.pins.filter((p) => p.segment === segment) : data.pins;
    const companies = segment ? data.companies.filter((c) => c.segment === segment) : data.companies;
    const siteCount = (id: string) => data.sites.filter((s) => s.companyId === id).length;
    const inCountry = (id: string | null) => id !== null && data.companies.some((c) => c.id === id);
    // Only this country's companies open a drawer; their sites may be abroad
    // (the drawer lists every site of the company).
    const company = inCountry(state.company) ? state.company : null;
    const site = state.site
        ? (data.sites.find((s) => s.id === state.site)
            ?? (company ? sitesOf(company).find((s) => s.id === state.site) : undefined)
            ?? null)
        : null;
    const companyId = site?.companyId ?? company;
    const busy = data.arcs.length > BUSY_LINKS || data.sites.length > BUSY_SITES;
    const arcs = busy && !companyId
        ? []
        : companyId
        ? data.arcs.filter((a) => a.from.id === companyId || a.to.id === companyId)
        : segment
            ? data.arcs.filter((a) => [a.from.id, a.to.id].some((id) => getCompany(id)?.segment === segment))
            : data.arcs;
    const selectedPin = pins.find((p) => p.id === site?.id)?.id ?? pins.find((p) => p.companyId === companyId)?.id ?? null;
    const onMap = (id: string) => data.sites.some((s) => s.companyId === id);
    const cluster = page.clusters.find((c) => c.id === state.cluster) ?? null;
    const members = cluster ? [...new Set(clusterSites(cluster, data.sites).map((s) => s.companyId))] : [];
    return <div className="tool-page cp-page">
        <PublicHeader path={page.path} initialOpen={menuOpen} />
        <FootnotesProvider>
            <main className="tool-main">
                <header className="tool-head cp-head">
                    <p className="tool-kicker">Supply chain · as of {COUNTRY_AS_OF}</p>
                    <h1>{title}</h1>
                    <p className="tool-lede">{page.lede}</p>
                    <a className="cp-cta" href={`/api/v1/countries/${page.code}`}>Get the data</a>
                </header>

                <StageStrip page={page} />

                <div className="cp-filter" role="radiogroup" aria-label="Segment">
                    <button type="button" role="radio" aria-checked={!segment} onClick={() => state.set({ segment: null })}>All <b>{data.companies.length}</b></button>
                    {SEGMENTS.map((s) => <button key={s} type="button" role="radio" aria-checked={segment === s} title={SEGMENT_LABEL[s]}
                        onClick={() => state.set({ segment: s, company: null, site: null })}>
                        <SegmentTile segment={s} size={14} />{SEGMENT_SHORT[s]} <b>{data.companies.filter((c) => c.segment === s).length}</b>
                    </button>)}
                </div>

                <section ref={mapRef} className="cp-mapwrap" aria-label={`Map of ${page.name}`}>
                    <CountryMap code={page.code} label={`${page.name}: company headquarters and plants`} sites={pins} topology={topology}>
                        <Arcs arcs={arcs} />
                        <ClusterZoom
                            pins={pins}
                            clusters={page.clusters}
                            activeCluster={state.cluster}
                            onCluster={(id) => state.set({ cluster: id })}
                            selectedId={selectedPin}
                            onSelect={(p) => state.set({ site: p.id, company: p.companyId ?? null })}
                            table={`${page.name} sites`}
                            labels={busy ? "zoomed" : true}
                        />
                    </CountryMap>
                    {companyId ? <CompanyDrawer
                        companyId={companyId}
                        siteId={site?.id ?? null}
                        country={page.code}
                        onClose={() => state.set({ site: null, company: null })}
                        onSelectSite={(id) => state.set({ site: id === site?.id ? null : id, company: companyId })}
                        onSelectCompany={(id) => state.set({ company: id, site: null })}
                        onMap={onMap}
                    /> : null}
                </section>

                {cluster ? <section className="cp-cluster" aria-label={cluster.label}>
                    <h2>{cluster.label} <span>{members.length} companies</span></h2>
                    <p>{cluster.blurb}</p>
                    <ul>{members.map((id) => <li key={id}>
                        <button type="button" onClick={() => state.set({ company: id, site: null })}>{getCompany(id)?.name ?? id}</button>
                    </li>)}</ul>
                    <button type="button" className="cp-cluster-close" onClick={() => state.set({ cluster: null })}>Show all of {page.name}</button>
                </section> : null}

                <CompanyTable
                    companies={companies}
                    sitesOf={siteCount}
                    sitesLabel={`Sites in ${page.name}`}
                    selectedId={companyId}
                    onSelect={(id) => {
                        state.set({ company: id, site: null });
                        mapRef.current?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
                    }}
                    caption={`${companies.length} companies${segment ? `: ${SEGMENT_LABEL[segment]}` : ""}, headquartered in ${page.name} or with a site there`}
                />

                <SourcesSection />
            </main>
        </FootnotesProvider>
        <PublicFooter />
    </div>;
}
