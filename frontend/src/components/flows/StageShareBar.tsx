import { countryName } from "../../../../src/country-flag";
import { type Shares, normalizeShares } from "../../../../src/supply-chain/concentration";
import { percent } from "../../../../src/supply-chain/format";
import { type Sourced, isSourced } from "../../../../src/supply-chain/sourced";
import { Flag } from "../Flag";
import { COUNTRY_COLOR, COUNTRY_FALLBACK, OTHER_COLOR } from "../supply-chain/country-colors";
import { FootnoteRef } from "../supply-chain/SourcedValue";
import "./flows.css";

// One stage's country shares as a single stacked bar (largest first, the
// unattributed rest grey and last), with the top countries named under it.
// Used by /manufacturing step cards and /bom tiers; WaffleGrid is the
// full-size version.
export function StageShareBar({ shares, label, top = 3, cite = true }: {
    shares: Shares | Sourced<Shares>;
    label: string;
    top?: number;
    cite?: boolean;
}) {
    const cited = isSourced(shares) ? (shares as Sourced<Shares>) : null;
    const value = cited ? cited.value : (shares as Shares);
    const { countries, other } = normalizeShares(value);
    const est = cited?.confidence === "estimated" ? "~" : "";
    const summary = [...countries.map((c) => `${countryName(c.country)} ${percent(c.share)}`), ...(other > 0.005 ? [`other ${percent(other)}`] : [])].join(", ");
    return <figure className="fk-sharebar">
        <div className="fk-sharebar-bar" role="img" aria-label={`${label}: ${summary}`}>
            {countries.map((c) => <i key={c.country} style={{ width: `${c.share * 100}%`, background: COUNTRY_COLOR[c.country] ?? COUNTRY_FALLBACK }} />)}
            {other > 0 ? <i style={{ width: `${other * 100}%`, background: OTHER_COLOR }} /> : null}
        </div>
        <figcaption>
            {countries.slice(0, top).map((c) => <span key={c.country} className="fk-sharebar-key">
                <Flag code={c.country} decorative />
                <span className="sc-num">{est}{percent(c.share)}</span>
            </span>)}
            {other > 0.005 ? <span className="fk-sharebar-key is-other"><i aria-hidden="true" /><span className="sc-num">{percent(other)}</span></span> : null}
            {cite && cited ? <FootnoteRef sources={cited.sources} asOf={cited.asOf} confidence={cited.confidence} note={cited.note} /> : null}
        </figcaption>
    </figure>;
}
