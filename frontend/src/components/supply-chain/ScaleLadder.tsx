import { formatValue } from "../../../../src/supply-chain/format";
import type { PerspectivePoint } from "../../../../src/supply-chain/perspective";
import { SourcedValue } from "./SourcedValue";

// Perspective A: headline numbers among familiar references of the same unit
// on one log axis, with each value as a multiple of the first headline.
export function ScaleLadder({ points, unit = "USD" }: { points: PerspectivePoint[]; unit?: string }) {
    const values = points.map((p) => p.value.value).filter((v) => v > 0);
    const lo = 10 ** Math.floor(Math.log10(Math.min(...values)));
    const hi = 10 ** Math.ceil(Math.log10(Math.max(...values)));
    const span = Math.log10(hi) - Math.log10(lo);
    const pos = (v: number) => ((Math.log10(v) - Math.log10(lo)) / span) * 100;
    const ticks = Array.from({ length: Math.round(span) + 1 }, (_, i) => lo * 10 ** i);
    const base = points.find((p) => p.headline)?.value.value ?? values[0] ?? 1;
    return <div className="sc-ladder">
        <div className="sc-ladder-row sc-ladder-axis" aria-hidden="true">
            <span />
            <span className="sc-ladder-track">
                {ticks.map((t) => <span key={t} className="sc-ladder-tick" style={{ left: `${pos(t)}%` }}>{formatValue(t, unit)}</span>)}
            </span>
            <span />
            <span className="sc-ladder-x">× base</span>
        </div>
        {points.map((p) => <div key={p.id} className={`sc-ladder-row${p.headline ? " is-headline" : ""}`}>
            <span className="sc-ladder-label">{p.label}</span>
            <span className="sc-ladder-track" aria-hidden="true">
                {ticks.map((t) => <span key={t} className="sc-ladder-grid" style={{ left: `${pos(t)}%` }} />)}
                <span className="sc-ladder-bar" style={{ width: `${pos(p.value.value)}%` }} />
            </span>
            <span className="sc-ladder-value"><SourcedValue value={p.value} /></span>
            <span className="sc-ladder-x">{formatMultiple(p.value.value / base)}</span>
        </div>)}
    </div>;
}

function formatMultiple(x: number): string {
    if (x >= 10) return `×${Math.round(x)}`;
    return `×${Number(x.toFixed(1))}`;
}
