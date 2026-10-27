import { type ReactNode, useMemo, useState } from "react";
import { countryName } from "../../../../../src/country-flag";
import { SEGMENT_LABEL } from "../../../../../src/supply-chain/companies";
import { normalizeShares } from "../../../../../src/supply-chain/concentration";
import { percent } from "../../../../../src/supply-chain/format";
import { LAB_STAGE_SHARES } from "../../../../../src/supply-chain/lab-fixtures";
import { LAB_CLUSTERS } from "../../../../../src/supply-chain/lab-kit";
import { ADMIN1_COUNTRIES, type Admin1Country, arcsTouching, sitePins, supplyArcs } from "../../../../../src/supply-chain/map";
import { getCompany, linksOf, sitesOf } from "../../../../../src/supply-chain/registry";
import { STAGE_LABEL } from "../../../../../src/supply-chain/stages";
import { Flag } from "../../../components/Flag";
import { Arcs } from "../../../components/maps/Arcs";
import { ClusterZoom } from "../../../components/maps/ClusterZoom";
import { CountryMap } from "../../../components/maps/CountryMap";
import type { MapTopology } from "../../../components/maps/geo";
import { MapDrawer } from "../../../components/maps/MapDrawer";
import { PinLegend } from "../../../components/maps/Pins";
import { useMapSelection } from "../../../components/maps/use-map-selection";
import { WorldMap } from "../../../components/maps/WorldMap";

type Origin = "world" | Admin1Country;

function SiteDetail({ companyId, siteId }: { companyId: string; siteId: string | null }) {
    const sites = sitesOf(companyId);
    const { supplies, buys } = linksOf(companyId);
    const name = (id: string) => getCompany(id)?.name ?? id;
    return <div className="sc-lab-detail">
        <ul className="sc-lab-sites">
            {sites.map((s) => <li key={s.id} className={s.id === siteId ? "is-on" : undefined}>
                <span>{s.name}</span>
                <small>{[s.admin1, s.country].filter(Boolean).join(", ")} · {s.kind}{s.precision === "site" ? "" : " · approx."}</small>
            </li>)}
        </ul>
        {[...supplies.filter((l) => !l.ended).map((l) => ({ dir: "To", who: name(l.to), what: l.what })),
            ...buys.filter((l) => !l.ended).map((l) => ({ dir: "From", who: name(l.from), what: l.what }))].map((l) => <p key={`${l.dir}-${l.who}`} className="sc-lab-link">
            <b>{l.dir === "To" ? "→" : "←"} {l.who}</b> {l.what}
        </p>)}
    </div>;
}

// Map kit demo: world choropleth with a stage toggle, pins, arcs and named
// clusters; the four admin-1 maps below. `?company=`, `?site=` and
// `?cluster=` drive selection, so any view is a shareable link.
export function LabMaps({ topologies }: { topologies?: Partial<Record<string, MapTopology>> }) {
    const sel = useMapSelection();
    const [stage, setStage] = useState("magnet");
    const [origin, setOrigin] = useState<Origin>("world");
    const pins = useMemo(() => sitePins(), []);
    const arcs = useMemo(() => supplyArcs(), []);
    const row = LAB_STAGE_SHARES.find((r) => r.id === stage) ?? LAB_STAGE_SHARES[0];
    const values = useMemo(() => Object.fromEntries((row ? normalizeShares(row.shares.value).countries : []).map((c) => [c.country, c.share])), [row]);
    const site = pins.find((p) => p.id === sel.site) ?? null;
    const companyId = site?.companyId ?? sel.company;
    const company = companyId ? getCompany(companyId) : undefined;
    const selectedPin = site?.id ?? pins.find((p) => p.companyId === companyId)?.id ?? null;
    const close = () => sel.select({ site: null, company: null });
    const drawer = (here: Origin): ReactNode => (company && origin === here ? <MapDrawer
        open
        title={company.name}
        kicker={<><Flag code={company.hqCountry} decorative /> {SEGMENT_LABEL[company.segment]}</>}
        onClose={close}
    >
        <SiteDetail companyId={company.id} siteId={site?.id ?? null} />
    </MapDrawer> : null);
    const pick = (here: Origin) => (p: { id: string; companyId?: string }) => {
        setOrigin(here);
        sel.select({ site: p.id, company: p.companyId ?? null });
    };
    const toggle = <div className="sc-lab-toggle" role="radiogroup" aria-label="Stage">
        {LAB_STAGE_SHARES.map((r) => <button key={r.id} type="button" role="radio" aria-checked={r.id === stage} onClick={() => setStage(r.id)}>
            {STAGE_LABEL[r.id as keyof typeof STAGE_LABEL] ?? r.label}
        </button>)}
    </div>;
    return <>
        <div className="sc-lab-mapwrap">
            <WorldMap
                label={`World share of ${row?.label.toLowerCase() ?? "stage"} by country, with company sites and supply links`}
                values={values}
                max={1}
                format={percent}
                valueLabel={`${row?.label ?? ""} share`}
                toggle={toggle}
                topology={topologies?.world}
            >
                <Arcs arcs={arcs} selectedId={null} />
                <ClusterZoom
                    pins={pins}
                    clusters={LAB_CLUSTERS}
                    activeCluster={origin === "world" ? sel.cluster : null}
                    onCluster={(id) => { setOrigin("world"); sel.select({ cluster: id }); }}
                    selectedId={selectedPin}
                    onSelect={pick("world")}
                />
            </WorldMap>
            {drawer("world")}
        </div>
        <PinLegend />
        <div className="sc-lab-countries">
            {ADMIN1_COUNTRIES.map((code) => <section key={code} className="sc-lab-mapwrap" aria-label={countryName(code)}>
                <h3><Flag code={code} decorative /> {countryName(code)}</h3>
                <CountryMap code={code} topology={topologies?.[code]}>
                    <Arcs arcs={arcsTouching(arcs, code)} />
                    <ClusterZoom
                        pins={pins.filter((p) => p.country === code)}
                        clusters={LAB_CLUSTERS}
                        activeCluster={origin === code ? sel.cluster : null}
                        onCluster={(id) => { setOrigin(code); sel.select({ cluster: id }); }}
                        selectedId={selectedPin}
                        onSelect={pick(code)}
                        table={`${countryName(code)} sites`}
                    />
                </CountryMap>
                {drawer(code)}
            </section>)}
        </div>
    </>;
}
