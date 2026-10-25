import type { CompetitorEquivalent } from "../../../../src/supply-chain/perspective";
import type { Sourced } from "../../../../src/supply-chain/sourced";
import { FootnoteRef, SourcedValue } from "./SourcedValue";

const one = (v: Sourced<number>) => v.value.toFixed(1);

// Perspective D: how many equal-sized competitors each market behaves like
// (10,000 / HHI), one square per competitor, with the US "highly
// concentrated" line converted the same way.
export function CompetitorEquivalents({ markets, threshold, methodSources, max = 10 }: {
    markets: CompetitorEquivalent[];
    threshold: Sourced<number>;
    methodSources: readonly string[];
    max?: number;
}) {
    const rows = [...markets].sort((a, b) => a.value.value - b.value.value);
    const line = `${(Math.min(max, threshold.value) / max) * 100}%`;
    return <div className="sc-eq">
        <div className="sc-eq-row sc-eq-head">
            <span />
            <span className="sc-eq-squares">
                <span className="sc-eq-line" style={{ left: line }} />
                <span className="sc-eq-flag" style={{ right: `calc(100% - ${line})` }}>
                    below {one(threshold)}, regulators call it highly concentrated
                    <FootnoteRef sources={threshold.sources} asOf={threshold.asOf} confidence={threshold.confidence} note={threshold.note} />
                </span>
            </span>
            <span />
        </div>
        {rows.map((m) => {
            const n = m.value.value;
            return <div key={m.id} className={`sc-eq-row${m.headline ? " is-headline" : ""}`}>
                <span className="sc-eq-label">{m.label}</span>
                <span className="sc-eq-squares" role="img" aria-label={`${m.label} behaves like ${one(m.value)} equal-sized ${m.of}`}>
                    <span className="sc-eq-line" style={{ left: line }} />
                    {Array.from({ length: max }, (_, i) => {
                        const fill = Math.max(0, Math.min(1, n - i));
                        return <span key={i} className="sc-eq-sq">
                            {fill > 0 ? <span style={{ width: `${fill * 100}%` }} /> : null}
                        </span>;
                    })}
                </span>
                <span className="sc-eq-value">
                    <SourcedValue value={m.value} format={one} />
                    <span className="sc-eq-of">{m.of}</span>
                </span>
            </div>;
        })}
        <p className="sc-eq-cap">
            Equal-sized competitors each market acts like; unnamed players left out, so upper bounds.
            <FootnoteRef sources={methodSources} asOf={threshold.asOf} confidence="modeled" note="10,000 / HHI is the number of equal-sized firms with the same concentration." />
        </p>
    </div>;
}
