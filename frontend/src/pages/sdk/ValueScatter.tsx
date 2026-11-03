import type { KeyboardEvent } from "react";
import type { BrandSummary } from "../../../../src/sdk";
import { paretoFront } from "../../lib/pareto";

const W = 640;
const H = 300;
const PAD = { l: 44, r: 16, t: 14, b: 36 };

// Brands on the "best developer experience for the money" frontier (the shared
// price-scatter rule): no other brand is both cheaper per N.m and better
// scored. Ids left to right.
export function frontier(rows: { id: string; x: number; y: number }[]): string[] {
    const on = paretoFront(rows, (r) => r.x, (r) => r.y);
    return rows
        .filter((_, i) => on[i])
        .sort((a, b) => a.x - b.x)
        .map((r) => r.id);
}

// Enter or Space activates a plotted brand, like a native button.
function activate(e: KeyboardEvent, go: () => void) {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    go();
}

// 4. SDK score against median catalog price per N.m (log scale).
export function SdkValueScatter({ rows, focus }: { rows: BrandSummary[]; focus: (id: string) => void }) {
    const pts = rows.flatMap((s) => s.pricePerNm === null ? [] : [{ id: s.brand.id, name: s.brand.name, x: s.pricePerNm, y: s.score.overall }]);
    if (!pts.length) return null;
    const lo = Math.log10(Math.min(...pts.map((p) => p.x)) * 0.8);
    const hi = Math.log10(Math.max(...pts.map((p) => p.x)) * 1.25);
    const sx = (x: number) => PAD.l + ((Math.log10(x) - lo) / (hi - lo)) * (W - PAD.l - PAD.r);
    const sy = (y: number) => PAD.t + (1 - y / 100) * (H - PAD.t - PAD.b);
    const front = frontier(pts);
    const line = front.map((id) => pts.find((p) => p.id === id)).filter((p) => p !== undefined);
    const ticks = [1, 2, 5, 10, 20, 50, 100, 200].filter((t) => Math.log10(t) >= lo && Math.log10(t) <= hi);
    return <figure className="sdk-scatter">
        <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label="SDK score against price per newton-metre">
            {[0, 25, 50, 75, 100].map((y) => <g key={y}>
                <line className="sdk-grid" x1={PAD.l} x2={W - PAD.r} y1={sy(y)} y2={sy(y)} />
                <text className="sdk-tick" x={PAD.l - 6} y={sy(y)} textAnchor="end" dominantBaseline="middle">{y}</text>
            </g>)}
            {ticks.map((t) => <text key={t} className="sdk-tick" x={sx(t)} y={H - PAD.b + 16} textAnchor="middle">${t}</text>)}
            <text className="sdk-axis-label" x={W - PAD.r} y={H - 4} textAnchor="end">Median US$ per N.m (log)</text>
            <polyline className="sdk-frontier" points={line.map((p) => `${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(" ")} />
            {pts.map((p) => <g key={p.id} className={`sdk-dot${front.includes(p.id) ? " is-front" : ""}`} data-brand={p.id}
                role="button" tabIndex={0} aria-label={`${p.name}: score ${Math.round(p.y)}, $${p.x.toFixed(1)} per N.m`}
                onClick={() => focus(p.id)} onKeyDown={(e) => activate(e, () => focus(p.id))}>
                <circle cx={sx(p.x)} cy={sy(p.y)} r={5} />
                <title>{`${p.name}: ${Math.round(p.y)}, US$${p.x.toFixed(1)} per N.m`}</title>
                {front.includes(p.id) ? <text x={sx(p.x) > W - 140 ? sx(p.x) - 8 : sx(p.x) + 8} y={sy(p.y)}
                    textAnchor={sx(p.x) > W - 140 ? "end" : "start"} dominantBaseline="middle">{p.name}</text> : null}
            </g>)}
        </svg>
        <figcaption>Up and left is better. The line joins and names the brands no other brand beats on both price and SDK score; hover a dot for the rest.</figcaption>
    </figure>;
}
