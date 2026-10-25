import { countryName } from "../../../../src/country-flag";
import { playersToReach } from "../../../../src/supply-chain/dominance";
import { percent } from "../../../../src/supply-chain/format";
import type { DominanceMarket } from "../../../../src/supply-chain/perspective";
import { Player } from "./Player";
import { FootnoteRef } from "./SourcedValue";

// Perspective D3: the actual players it takes to cover 90% of each market,
// as chips, with the count. One chip means one country holds the market.
export function PlayersToNinety({ markets, target = 0.9 }: { markets: DominanceMarket[]; target?: number }) {
    const rows = markets
        .map((m) => ({ m, r: playersToReach(m.shares.value, target) }))
        .sort((a, b) => a.r.count - b.r.count);
    return <div className="sc-ninety">
        {rows.map(({ m, r }) => <div key={m.id} className={`sc-ninety-row${m.rareEarth ? " is-ree" : ""}`}>
            <span className="sc-ninety-label">
                {m.label}
                <FootnoteRef sources={m.shares.sources} asOf={m.shares.asOf} confidence={m.shares.confidence} note={m.shares.note} />
            </span>
            <span className="sc-ninety-chips">
                {r.players.map((p) => <span key={p.key} className="sc-chip"
                    title={`${m.kind === "country" ? countryName(p.key) : p.key} ${percent(p.share)}`}>
                    <Player id={p.key} kind={m.kind} withName={m.kind === "country" && r.players.length === 1} />
                </span>)}
                {!r.reached ? <span className="sc-chip is-more">+{r.count - r.players.length} more</span> : null}
            </span>
            <span className="sc-ninety-count"><b>{r.count}{r.reached ? "" : "+"}</b></span>
        </div>)}
    </div>;
}
