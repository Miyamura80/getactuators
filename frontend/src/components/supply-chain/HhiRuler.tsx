import type { PerspectivePoint } from "../../../../src/supply-chain/perspective";
import type { Sourced } from "../../../../src/supply-chain/sourced";
import { FootnoteRef, SourcedValue } from "./SourcedValue";

const MAX = 10000;
const TICKS = [0, 2500, 5000, 7500, 10000];
const pos = (v: number) => `${(Math.min(MAX, Math.max(0, v)) / MAX) * 100}%`;

// Perspective D: HHI values on the 0 to 10,000 scale against the US merger
// guideline line and familiar markets, one row each so labels never collide.
export function HhiRuler({ threshold, points }: { threshold: Sourced<number>; points: PerspectivePoint[] }) {
    const sorted = [...points].sort((a, b) => a.value.value - b.value.value);
    return <div className="sc-hhi">
        <div className="sc-hhi-row sc-hhi-axis" aria-hidden="true">
            <span />
            <span className="sc-hhi-track">
                {TICKS.map((t) => <span key={t} className="sc-hhi-tick" style={{ left: pos(t) }}>{t.toLocaleString("en-US")}</span>)}
            </span>
            <span />
        </div>
        <div className="sc-hhi-row sc-hhi-zone">
            <span className="sc-hhi-label">
                US guideline
                <FootnoteRef sources={threshold.sources} asOf={threshold.asOf} confidence={threshold.confidence} note={threshold.note} />
            </span>
            <span className="sc-hhi-track">
                <span className="sc-hhi-hot" style={{ left: pos(threshold.value) }}>
                    Highly concentrated
                </span>
                <span className="sc-hhi-line" style={{ left: pos(threshold.value) }} />
            </span>
            <span className="sc-hhi-value">{threshold.value.toLocaleString("en-US")}+</span>
        </div>
        {sorted.map((p) => <div key={p.id} className={`sc-hhi-row${p.headline ? " is-headline" : ""}`}>
            <span className="sc-hhi-label">{p.label}</span>
            <span className="sc-hhi-track" aria-hidden="true">
                <span className="sc-hhi-line" style={{ left: pos(threshold.value) }} />
                <span className="sc-hhi-stem" style={{ width: pos(p.value.value) }} />
                <span className="sc-hhi-dot" style={{ left: pos(p.value.value) }} />
            </span>
            <span className="sc-hhi-value"><SourcedValue value={p.value} /></span>
        </div>)}
    </div>;
}
