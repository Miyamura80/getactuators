import { PRICE_HISTORY, historyOf, priced, summarize } from "../../../../src/prices/history";
import type { PriceObservation } from "../../../../src/prices/types";
import { H, M, W, byId, pct, timeAxis, tickLabel, usd } from "./shared";

// One actuator's listed price as a step chart (a price holds until the
// next reading), with every point's method, currency, FX rate and source.

export function ActuatorHistory({ id, ids, points: all, onPick }: {
    id: string;
    ids: readonly string[];
    points: readonly PriceObservation[];
    onPick: (id: string) => void;
}) {
    const a = byId.get(id);
    const points = historyOf(id, all);
    const p = priced(points);
    const s = summarize(id, all);
    const { x, ticks } = timeAxis([...points.map((q) => q.date), PRICE_HISTORY.updated]);
    const vals = p.map((q) => q.priceUsd);
    const top = Math.max(...vals, 1) * 1.15;
    const y = (v: number) => H - M.b - (v / top) * (H - M.b - M.t);
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * top));
    const end = PRICE_HISTORY.updated;
    const d = p
        .map((q, i) => {
            const next = p[i + 1]?.date ?? end;
            return `${i ? "L" : "M"}${x(q.date).toFixed(1)},${y(q.priceUsd).toFixed(1)}H${x(next).toFixed(1)}`;
        })
        .join("");

    return <div className="pr-view">
        <div className="pr-controls">
            <label className="pr-pick">
                <span>Actuator</span>
                <select value={id} onChange={(e) => onPick(e.target.value)}>
                    {ids.map((h) => <option key={h} value={h}>{byId.get(h)?.name ?? h} ({byId.get(h)?.brand})</option>)}
                </select>
            </label>
            {s.latest
                ? <span className="pr-note pr-latest">Latest {usd(s.latest.priceUsd)} on {s.latest.date}; 1-year change {s.yearChange === null ? "n/a (under a year of history)" : pct(s.yearChange)}</span>
                : null}
        </div>
        {a && p.length
            ? <svg className="pr-chart" viewBox={`0 0 ${W} ${H}`} role="img"
                aria-label={`${a.name} listed price over time, ${p.length} price points`}>
                {yTicks.map((v) => <g key={v} className="pr-grid">
                    <line x1={M.l} x2={W - M.r} y1={y(v)} y2={y(v)} />
                    <text x={M.l - 6} y={y(v) + 4} textAnchor="end">${v.toLocaleString("en-US")}</text>
                </g>)}
                {ticks.map((t) => <text key={t} className="pr-axis" x={x(t)} y={H - M.b + 16} textAnchor="middle">{tickLabel(t)}</text>)}
                <path className="pr-step" d={d} />
                {p.map((q) => <circle key={`${q.date}-${q.method}`} className="pr-dot pr-hist-dot" cx={x(q.date)} cy={y(q.priceUsd)} r={4}>
                    <title>{`${q.date}: ${usd(q.priceUsd)} (${q.method})`}</title>
                </circle>)}
                {points.filter((q) => q.inStock === false).map((q) => <text key={`oos-${q.date}`} className="pr-oos" x={x(q.date)} y={H - M.b - 4} textAnchor="middle">
                    ×<title>{`${q.date}: out of stock`}</title>
                </text>)}
            </svg>
            : <p className="pr-empty">No price recorded for this actuator yet.</p>}
        <details className="pr-points">
            <summary>Points ({points.length})</summary>
            <div className="pr-table-scroll">
                <table>
                    <thead><tr><th>Date</th><th>USD</th><th>Listed</th><th>FX</th><th>Method</th><th>Source</th></tr></thead>
                    <tbody>
                        {points.map((q) => <tr key={`${q.date}-${q.method}`}>
                            <td>{q.date}</td>
                            <td>{q.priceUsd === null ? "out of stock" : usd(q.priceUsd)}</td>
                            <td>{q.originalPrice === null ? "n/a" : `${q.originalPrice} ${q.currency}`}</td>
                            <td>{q.fxRate}</td>
                            <td>{q.method}{q.note ? ` (${q.note})` : ""}</td>
                            <td><a href={q.url} rel="nofollow noopener" target="_blank">{new URL(q.url).host}</a></td>
                        </tr>)}
                    </tbody>
                </table>
            </div>
        </details>
    </div>;
}
