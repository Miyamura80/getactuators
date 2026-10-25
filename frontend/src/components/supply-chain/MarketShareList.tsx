import type { Company } from "../../../../src/supply-chain/companies";
import { percent } from "../../../../src/supply-chain/format";
import type { SegmentMarket } from "../../../../src/supply-chain/market-share";
import { Flag } from "../Flag";
import { SourcedValue } from "./SourcedValue";

// Companies in one segment with their share of that segment's market: a thin
// bar and the cited percentage, "Other" for the rest. No public share reads
// as a dash, never a guess.
export function MarketShareList({ companies, market }: { companies: Company[]; market?: SegmentMarket }) {
    const shareOf = (id: string) => market?.shares[id];
    const sorted = [...companies].sort((a, b) => (shareOf(b.id)?.value ?? -1) - (shareOf(a.id)?.value ?? -1));
    const named = market ? Object.values(market.shares).reduce((t, s) => t + s.value, 0) : 0;
    const rows = sorted.map((c) => {
        const s = shareOf(c.id);
        return <li key={c.id} className={s ? undefined : "sc-share-none"}>
            <Flag code={c.hqCountry} />
            <span className="sc-share-name">{c.name}</span>
            <span className="sc-share-track" aria-hidden="true">
                {s ? <span className={`sc-share-fill sc-share-${s.confidence}`} style={{ width: `${s.value * 100}%` }} /> : null}
            </span>
            <span className="sc-share-pct">
                {s ? <SourcedValue value={s} /> : <span aria-label="No public share">-</span>}
            </span>
        </li>;
    });
    return <div className="sc-share">
        {market ? <p className="sc-share-cap">{market.market} · {market.asOf}</p> : null}
        <ul>
            {rows}
            {market ? <li className="sc-share-other">
                <span className="flag" aria-hidden="true" />
                <span className="sc-share-name">Other</span>
                <span className="sc-share-track" aria-hidden="true">
                    <span className="sc-share-fill" style={{ width: `${Math.max(0, 1 - named) * 100}%` }} />
                </span>
                <span className="sc-share-pct">{percent(Math.max(0, 1 - named))}</span>
            </li> : null}
        </ul>
    </div>;
}
