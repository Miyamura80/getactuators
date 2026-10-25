import type { ReactNode } from "react";
import { countryName } from "../../../../src/country-flag";
import { outOf } from "../../../../src/supply-chain/dominance";
import { percent } from "../../../../src/supply-chain/format";
import type { DominanceMarket } from "../../../../src/supply-chain/perspective";
import { COUNTRY_COLOR, OTHER_COLOR } from "./country-colors";
import { Player } from "./Player";
import { FootnoteRef } from "./SourcedValue";

export type ItemIcon = "ore" | "flask" | "magnet";

const ICONS: Record<ItemIcon, ReactNode> = {
    ore: <path d="M5 9l5-5h6l4 6-3 9H8l-5-5z" />,
    flask: <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6A2 2 0 0 0 19 18l-5-9V3" />,
    magnet: <path d="M5 4h4v8a3 3 0 0 0 6 0V4h4v8A7 7 0 0 1 5 12z M5 7h4 M15 7h4" />,
};

// Perspective D1: ten real items per stage, each coloured by the country that
// makes it. "9 of every 10 magnets are made in China" reads at a glance.
export function OutOfTen({ rows }: { rows: { market: DominanceMarket; icon: ItemIcon; item: string }[] }) {
    return <div className="sc-ten">
        {rows.map(({ market, icon, item }) => {
            const parts = outOf(market.shares.value);
            const items = parts.flatMap((p) => Array.from({ length: p.count }, () => p));
            const lead = parts[0];
            return <div key={market.id} className="sc-ten-row">
                <span className="sc-ten-label">
                    {market.label}
                    <FootnoteRef sources={market.shares.sources} asOf={market.shares.asOf}
                        confidence={market.shares.confidence} note={market.shares.note} />
                </span>
                <span className="sc-ten-items" role="img"
                    aria-label={parts.map((p) => `${p.count} of 10 ${item} from ${p.key === "other" ? "others" : countryName(p.key)}`).join(", ")}>
                    {items.map((p, i) => <svg key={i} viewBox="0 0 24 24" aria-hidden="true"
                        style={{ color: p.key === "other" ? OTHER_COLOR : COUNTRY_COLOR[p.key as keyof typeof COUNTRY_COLOR] ?? "#8b95a1" }}>
                        <title>{`${p.key === "other" ? "Others" : countryName(p.key)} ${percent(p.share)}`}</title>
                        {ICONS[icon]}
                    </svg>)}
                </span>
                {lead ? <span className="sc-ten-lead">
                    <Player id={lead.key} kind={market.kind} />
                    <b>{lead.count}</b> of 10
                </span> : null}
            </div>;
        })}
    </div>;
}
