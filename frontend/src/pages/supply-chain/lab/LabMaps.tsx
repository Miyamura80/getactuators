import { type ReactNode, useMemo, useState } from "react";
import { countryName } from "../../../../../src/country-flag";
import { normalizeShares } from "../../../../../src/supply-chain/concentration";
import { percent } from "../../../../../src/supply-chain/format";
import { LAB_STAGE_SHARES } from "../../../../../src/supply-chain/lab-fixtures";
import { LAB_CLUSTERS } from "../../../../../src/supply-chain/lab-kit";
import { ADMIN1_COUNTRIES, type Admin1Country, arcsTouching, sitePins, supplyArcs } from "../../../../../src/supply-chain/map";
import { getCompany } from "../../../../../src/supply-chain/registry";
import { STAGE_LABEL } from "../../../../../src/supply-chain/stages";
import { Flag } from "../../../components/Flag";
import { CompanyDrawer } from "../../../components/supply-chain/CompanyDrawer";
import { Arcs } from "../../../components/maps/Arcs";
import { ClusterZoom } from "../../../components/maps/ClusterZoom";
import { CountryMap } from "../../../components/maps/CountryMap";
import type { MapTopology } from "../../../components/maps/geo";
import { PinLegend } from "../../../components/maps/Pins";
import { useMapSelection } from "../../../components/maps/use-map-selection";
import { WorldMap } from "../../../components/maps/WorldMap";

type Origin = "world" | Admin1Country;

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
    const drawer = (here: Origin): ReactNode => (company && origin === here ? <CompanyDrawer
        companyId={company.id}
        siteId={site?.id ?? null}
        country={here === "world" ? undefined : here}
        onClose={close}
        onSelectSite={(id) => sel.select({ site: id, company: company.id })}
        onSelectCompany={(id) => sel.select({ company: id, site: null })}
    /> : null);
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
                    labels="groups"
                />
            </WorldMap>
            {drawer("world")}
        </div>
        <PinLegend />
        <div className="sc-lab-countries">
            {ADMIN1_COUNTRIES.map((code) => [code, pins.filter((p) => p.country === code)] as const).map(([code, here]) => <section key={code} className="sc-lab-mapwrap" aria-label={countryName(code)}>
                <h3><Flag code={code} decorative /> {countryName(code)}</h3>
                <CountryMap code={code} sites={here} topology={topologies?.[code]}>
                    <Arcs arcs={arcsTouching(arcs, code)} />
                    <ClusterZoom
                        pins={here}
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
