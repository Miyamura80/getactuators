import { useState } from "react";
import type { LeaderRow } from "../../../../src/sdk";
import { fmtScore } from "./shared";

const W = 640;
const H = 300;
const PAD = { l: 52, r: 16, t: 14, b: 40 };

// 04: SDK score against the median catalog price per N.m (log scale). The
// upper-left frontier is the best developer experience for the money.
export function PriceScatter({ rows }: { rows: LeaderRow[] }) {
    const [hover, setHover] = useState<string | null>(null);
    const pts = rows.filter((r) => r.brand.medianPricePerNm !== null && r.overall.score !== null);
    if (pts.length === 0) return <p className="sdk-note">No priced brands in this view.</p>;
    const prices = pts.map((r) => r.brand.medianPricePerNm as number);
    const lo = Math.log10(Math.min(...prices) * 0.8);
    const hi = Math.log10(Math.max(...prices) * 1.25);
    const x = (s: number) => PAD.l + (s / 10) * (W - PAD.l - PAD.r);
    const y = (p: number) => PAD.t + ((hi - Math.log10(p)) / (hi - lo)) * (H - PAD.t - PAD.b);
    const ticks = [1, 3, 10, 30, 100, 300].filter((t) => Math.log10(t) >= lo && Math.log10(t) <= hi);
    const frontier = pts
        .filter((a) => !pts.some((b) => b !== a && (b.overall.score ?? 0) >= (a.overall.score ?? 0) && (b.brand.medianPricePerNm ?? 0) <= (a.brand.medianPricePerNm ?? 0) && ((b.overall.score ?? 0) > (a.overall.score ?? 0) || (b.brand.medianPricePerNm ?? 0) < (a.brand.medianPricePerNm ?? 0))))
        .sort((a, b) => (a.overall.score ?? 0) - (b.overall.score ?? 0));
    const onFrontier = new Set(frontier.map((r) => r.brand.brand));
    return <div className="sdk-scatter">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="SDK score against median price per newton-metre">
            {ticks.map((t) => <g key={t}>
                <line className="sdk-grid" x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} />
                <text className="sdk-axis" x={PAD.l - 8} y={y(t)} textAnchor="end" dominantBaseline="middle">${t}</text>
            </g>)}
            {[0, 2, 4, 6, 8, 10].map((s) => <text key={s} className="sdk-axis" x={x(s)} y={H - PAD.b + 16} textAnchor="middle">{s}</text>)}
            <text className="sdk-axis" x={(PAD.l + W - PAD.r) / 2} y={H - 6} textAnchor="middle">SDK score (preset)</text>
            <text className="sdk-axis" x={12} y={PAD.t + 4} dominantBaseline="hanging">$/N·m</text>
            <polyline className="sdk-frontier" points={frontier.map((r) => `${x(r.overall.score ?? 0)},${y(r.brand.medianPricePerNm ?? 1)}`).join(" ")} />
            {pts.map((r) => {
                const cx = x(r.overall.score ?? 0);
                const cy = y(r.brand.medianPricePerNm ?? 1);
                const label = onFrontier.has(r.brand.brand) || hover === r.brand.brand;
                return <g key={r.brand.brand} onMouseEnter={() => setHover(r.brand.brand)} onMouseLeave={() => setHover(null)} data-brand={r.brand.brand}>
                    <circle cx={cx} cy={cy} r={12} fill="transparent" />
                    <circle cx={cx} cy={cy} r={5} className={onFrontier.has(r.brand.brand) ? "sdk-dot is-front" : "sdk-dot"} />
                    {label ? <text className="sdk-label" x={cx + 8} y={cy - 8}>{r.brand.name}</text> : null}
                    <title>{`${r.brand.name}: SDK ${fmtScore(r.overall.score)}, median $${r.brand.medianPricePerNm} per N·m`}</title>
                </g>;
            })}
        </svg>
        <p className="sdk-note">Filled cyan: on the frontier (no brand is both cheaper per N·m and better scored). Price is the median catalog price per N·m of the brand's commandable actuators.</p>
    </div>;
}
