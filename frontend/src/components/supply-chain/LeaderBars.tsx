import { leaderOf } from "../../../../src/supply-chain/dominance";
import { percent } from "../../../../src/supply-chain/format";
import type { DominanceMarket } from "../../../../src/supply-chain/perspective";
import { Player } from "./Player";
import { FootnoteRef } from "./SourcedValue";

// Perspective D2: the leader's share of each market as one bar, sorted, rare
// earths in cyan and familiar markets in grey, the leader named at the end.
export function LeaderBars({ markets }: { markets: DominanceMarket[] }) {
    const rows = markets
        .map((m) => ({ m, lead: leaderOf(m.shares.value) }))
        .filter((r) => r.lead)
        .sort((a, b) => (b.lead?.share ?? 0) - (a.lead?.share ?? 0));
    return <div className="sc-lead">
        {rows.map(({ m, lead }) => lead ? <div key={m.id} className={`sc-lead-row${m.rareEarth ? " is-ree" : ""}`}>
            <span className="sc-lead-label">{m.label}</span>
            <span className="sc-lead-track">
                <span className="sc-lead-bar" style={{ width: `${lead.share * 100}%` }} />
            </span>
            <span className="sc-lead-who">
                <Player id={lead.key} kind={m.kind} withName />
                <b>{percent(lead.share)}</b>
                <FootnoteRef sources={m.shares.sources} asOf={m.shares.asOf} confidence={m.shares.confidence} note={m.shares.note} />
            </span>
        </div> : null)}
    </div>;
}
