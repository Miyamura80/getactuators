import { MIN_CORRELATION_MONTHS, lagCorrelation, ndprByMonth, priceIndex } from "../../../../src/prices/trends";
import { H, M, W, tickLabel, timeAxis } from "./shared";

// 04: the chain-weighted actuator price index against NdPr oxide, both
// rebased to 100 in the index's first month so one axis serves both, with
// the lagged correlation of monthly changes.

const NDPR = "#ffd43b";
const INDEX = "#4dabf7";

export function VsMetals() {
    const index = priceIndex();
    const months = index.map((p) => p.month);
    const ndpr = ndprByMonth(months);
    const base = ndpr.find((v) => v != null) ?? null;
    const metal = ndpr.map((v) => (v != null && base ? (v / base) * 100 : null));
    const corr = lagCorrelation(index, ndpr);
    const dates = months.map((m) => `${m}-15`);
    const { x, ticks } = timeAxis(dates);
    const vals = [...index.map((p) => p.index), ...metal.filter((v): v is number => v != null)];
    const lo = Math.min(...vals, 90) * 0.95;
    const hi = Math.max(...vals, 110) * 1.05;
    const y = (v: number) => H - M.b - ((v - lo) / (hi - lo)) * (H - M.b - M.t);
    const yTicks = [lo, (lo + hi) / 2, hi].map((v) => Math.round(v));
    const line = (vs: (number | null)[]) =>
        vs.map((v, i) => (v == null ? "" : `${i ? "L" : "M"}${x(dates[i] ?? "").toFixed(1)},${y(v).toFixed(1)}`)).join("");
    const series = [
        { id: "index", label: "Actuator price index", color: INDEX, vs: index.map((p) => p.index) },
        { id: "ndpr", label: "NdPr oxide (FOB China)", color: NDPR, vs: metal },
    ];

    return <div className="pr-view">
        {index.length < 2
            ? <p className="pr-empty">The index needs two months with two or more priced actuators; it has {index.length}.</p>
            : <>
                <ul className="pr-legend">
                    {series.map((s) => <li key={s.id}><i style={{ background: s.color }} aria-hidden="true" />{s.label}</li>)}
                </ul>
                <svg className="pr-chart" viewBox={`0 0 ${W} ${H}`} role="img"
                    aria-label={`Actuator price index and NdPr oxide, both 100 in ${months[0]}`}>
                    {yTicks.map((v) => <g key={v} className="pr-grid">
                        <line x1={M.l} x2={W - M.r} y1={y(v)} y2={y(v)} />
                        <text x={M.l - 6} y={y(v) + 4} textAnchor="end">{v}</text>
                    </g>)}
                    {ticks.map((t) => <text key={t} className="pr-axis" x={x(t)} y={H - M.b + 16} textAnchor="middle">{tickLabel(t)}</text>)}
                    {series.map((s) => <g key={s.id} className="pr-line" data-series={s.id} style={{ color: s.color }}>
                        <path d={line(s.vs)} />
                        {s.vs.map((v, i) => v == null ? null : <circle key={months[i]} cx={x(dates[i] ?? "")} cy={y(v)} r={4}>
                            <title>{`${s.label}, ${months[i]}: ${v.toFixed(1)}`}</title>
                        </circle>)}
                    </g>)}
                </svg>
            </>}
        <table className="pr-fits pr-corr">
            <caption>Correlation of monthly log changes, NdPr leading by n months</caption>
            <tbody>
                {corr.map((c) => <tr key={c.lag}>
                    <th scope="row">{c.lag === 0 ? "Same month" : `${c.lag} month${c.lag > 1 ? "s" : ""}`}</th>
                    <td>{c.r === null ? `n/a: ${c.n} paired months (needs ${MIN_CORRELATION_MONTHS})` : `r = ${c.r.toFixed(2)} over ${c.n} months`}</td>
                </tr>)}
            </tbody>
        </table>
        <p className="pr-note">Index: chain-weighted geometric mean of month-on-month price changes over actuators priced in both months, 100 in the first month. NdPr from /metals (annual averages before 2026, monthly readings in 2026). Correlation is not causation: magnets are one input among motors, gears, electronics and margins.</p>
    </div>;
}
