import { countryName } from "../../../../src/country-flag";
import { leaderOf } from "../../../../src/supply-chain/dominance";
import { percent } from "../../../../src/supply-chain/format";
import type { DominanceMarket } from "../../../../src/supply-chain/perspective";
import { Player } from "./Player";
import { FootnoteRef } from "./SourcedValue";

// Perspective D4: world supply of each stage with the leader's part drawn as
// gone, leaving what the rest of the world makes.
export function WithoutLeader({ markets }: { markets: DominanceMarket[] }) {
    return <div className="sc-gone">
        {markets.map((m) => {
            const lead = leaderOf(m.shares.value);
            if (!lead) return null;
            const left = 1 - lead.share;
            return <div key={m.id} className="sc-gone-row">
                <span className="sc-gone-label">
                    {m.label}
                    <FootnoteRef sources={m.shares.sources} asOf={m.shares.asOf} confidence={m.shares.confidence} note={m.shares.note} />
                </span>
                <span className="sc-gone-bar" role="img"
                    aria-label={`${m.label}: without ${countryName(lead.key)}, ${percent(left)} of supply is left`}>
                    <span className="sc-gone-lost" style={{ flexGrow: lead.share }}>
                        <Player id={lead.key} kind={m.kind} /> {percent(lead.share)} gone
                    </span>
                    <span className="sc-gone-left" style={{ flexGrow: left }} />
                </span>
                <span className="sc-gone-value"><b>{percent(left)}</b> left</span>
            </div>;
        })}
    </div>;
}
