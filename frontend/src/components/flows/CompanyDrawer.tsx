import { countryName } from "../../../../src/country-flag";
import { SEGMENT_LABEL } from "../../../../src/supply-chain/companies";
import { getCompany, sitesOf } from "../../../../src/supply-chain/registry";
import { STAGE_LABEL } from "../../../../src/supply-chain/stages";
import { Flag } from "../Flag";
import { MapDrawer } from "../maps/MapDrawer";
import { SourcedValue } from "../supply-chain/SourcedValue";
import { monogram } from "./graph-layout";
import "./flows.css";

// The panel a company click opens on any supply-chain page (/manufacturing
// step cards, /bom chain graphs, maps): who they are, where, which stages
// they cover, and links out. Sits in MapDrawer, so it is a side panel on
// wide screens and a bottom sheet on phones.
export function CompanyDrawer({ companyId, onClose }: { companyId: string | null; onClose: () => void }) {
    const c = companyId ? getCompany(companyId) : undefined;
    if (!c) return null;
    const sites = sitesOf(c.id).length;
    return <MapDrawer open title={c.name} kicker={<><Flag code={c.hqCountry} decorative /> {countryName(c.hqCountry)}</>} onClose={onClose}>
        <div className="fk-company">
            <span className="fk-mono fk-company-mono" aria-hidden="true">{monogram(c.name)}</span>
            {c.localName ? <p className="fk-company-local">{c.localName}</p> : null}
            <p className="fk-company-seg">{SEGMENT_LABEL[c.segment]}</p>
            <ul className="fk-company-stages" aria-label="Stages">
                {c.stages.map((s) => <li key={s}>{STAGE_LABEL[s]}</li>)}
            </ul>
            {c.revenue ? <p className="fk-company-num"><span>Revenue</span> <SourcedValue value={c.revenue} /></p> : null}
            {c.ownership?.ticker ? <p className="fk-company-num"><span>Ticker</span> <b>{c.ownership.ticker}</b></p> : null}
            {c.products?.length ? <ul className="fk-company-products">{c.products.map((p) => <li key={p}>{p}</li>)}</ul> : null}
            <p className="fk-company-links">
                <a href={c.url} rel="noopener noreferrer" target="_blank">Website</a>
                <a href={`/api/v1/companies/${c.id}`}>Data{sites ? ` (${sites} site${sites > 1 ? "s" : ""})` : ""}</a>
            </p>
        </div>
    </MapDrawer>;
}
