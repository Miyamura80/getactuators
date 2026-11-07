import { countryName } from "../../../../src/country-flag";
import type { Shares } from "../../../../src/supply-chain/concentration";
import { TIER_LABEL, concentrationTier } from "../../../../src/supply-chain/concentration-tier";
import { percent } from "../../../../src/supply-chain/format";
import { type Sourced, isSourced } from "../../../../src/supply-chain/sourced";
import { Flag } from "../Flag";
import "./flows.css";

// A tier word for a stage (MONOPOLIZED, CONCENTRATED, DISTRIBUTED) with the
// leading country's flag and share, so chokepoints read before any text.
export function ConcentrationBadge({ shares, compact = false }: {
    shares: Shares | Sourced<Shares>;
    compact?: boolean;
}) {
    const cited = isSourced(shares) ? (shares as Sourced<Shares>) : null;
    const c = concentrationTier(cited ? cited.value : (shares as Shares));
    if (!c) return null;
    // Estimates and models both read as approximate.
    const est = cited && cited.confidence !== "reported" ? "~" : "";
    const label = `${TIER_LABEL[c.tier]}: ${countryName(c.top.country)} ${est}${percent(c.top.share)}`;
    return <span className={`fk-tier is-${c.tier}${compact ? " is-compact" : ""}`} role="img" aria-label={label} title={label}>
        <b>{TIER_LABEL[c.tier]}</b>
        <Flag code={c.top.country} decorative />
        <span className="sc-num">{est}{percent(c.top.share)}</span>
    </span>;
}
