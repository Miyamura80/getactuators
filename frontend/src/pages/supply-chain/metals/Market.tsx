import { COMPANIES, SEGMENT_LABEL } from "../../../../../src/supply-chain/companies";
import { marketOf } from "../../../../../src/supply-chain/market-share";
import { type DriverDirection, PRICE_DRIVERS } from "../../../../../src/supply-chain/metals/drivers";
import { PRICE_CHAIN } from "../../../../../src/supply-chain/metals/market";
import { SUPPLY_CHAIN_PAGES_LIVE } from "../../../../../src/public-navigation";
import { MarketShareList } from "../../../components/supply-chain/MarketShareList";
import { FootnoteRef } from "../../../components/supply-chain/SourcedValue";

// 5. Who controls the market and what moves it: how a price is made, the
// companies at each end of the chain, and one card per driver.

const SEGMENTS = ["ree-mining-refining", "magnets-motors"] as const;

function Arrow({ dir }: { dir: DriverDirection }) {
    const label = dir === "up" ? "Pushes prices up" : dir === "down" ? "Pushes prices down" : "Sets a floor";
    return <svg className={`mt-dir mt-dir-${dir}`} width="16" height="16" viewBox="0 0 16 16" role="img" aria-label={label}>
        <title>{label}</title>
        {dir === "floor"
            ? <path d="M3 4h10M3 12h10M8 4v8" fill="none" stroke="currentColor" strokeWidth="1.6" />
            : <path d={dir === "up" ? "M8 13V3M4 7l4-4 4 4" : "M8 3v10M4 9l4 4 4-4"} fill="none" stroke="currentColor" strokeWidth="1.6" />}
    </svg>;
}

export function Market() {
    return <div className="mt-market">
        <ol className="mt-flow" aria-label="How a price is made">
            {PRICE_CHAIN.map((s, i) => <li key={s.id}>
                <span className="mt-flow-n" aria-hidden="true">{i + 1}</span>
                <b>{s.label}</b>
                <span>{s.detail}<FootnoteRef sources={s.sources} asOf="2026" confidence="reported" /></span>
            </li>)}
        </ol>

        <div className="mt-players">
            {SEGMENTS.map((seg) => <section key={seg}>
                <h3>{SEGMENT_LABEL[seg]}</h3>
                <MarketShareList companies={COMPANIES.filter((c) => c.segment === seg)} market={marketOf(seg)} />
            </section>)}
        </div>

        <div className="mt-drivers">
            {PRICE_DRIVERS.map((d) => <details key={d.id} className="mt-driver" data-driver={d.id}>
                <summary><Arrow dir={d.direction} /><span>{d.title}</span></summary>
                <p>
                    {d.example}<FootnoteRef sources={d.sources} asOf="2026" confidence="reported" />
                    {d.link && SUPPLY_CHAIN_PAGES_LIVE.has(d.link) ? <> <a href={d.link}>Alternatives</a></> : null}
                </p>
            </details>)}
        </div>
    </div>;
}
