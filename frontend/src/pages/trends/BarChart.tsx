import { type TrendChart, formatValue } from "../../../../src/trends";
import { colorAt, makeScale, tickLabel } from "./scale";

const ROW = 30;
const LABEL = 196;
const W = 640;
const PAD = { r: 64, t: 6, b: 24 };

// One horizontal bar per series (its single point), with the published range
// as a whisker. Hollow bars are estimated values.
export function BarChart({ chart }: { chart: TrendChart }) {
    const rows = chart.series.flatMap((s, i) => {
        const p = s.points[0];
        return p ? [{ s, p, color: colorAt(i) }] : [];
    });
    const H = PAD.t + rows.length * ROW + PAD.b;
    const vs = rows.flatMap(({ p }) => (p.range ? [p.value, p.range[1]] : [p.value]));
    const log = Boolean(chart.log);
    const lo = log ? Math.min(1, ...rows.map((r) => r.p.value)) : 0;
    const x = makeScale(lo, Math.max(...vs), LABEL, W - PAD.r, log);
    const base = x.at(log ? 10 ** Math.floor(Math.log10(lo)) : 0);
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="tr-svg" role="img" aria-label={`${chart.title}, ${chart.unit}`}>
            {x.ticks.map((t) => (
                <g key={t}>
                    <line x1={x.at(t)} x2={x.at(t)} y1={PAD.t} y2={H - PAD.b} className="tr-grid" />
                    <text x={x.at(t)} y={H - 8} textAnchor="middle" className="tr-axis">
                        {tickLabel(t)}
                    </text>
                </g>
            ))}
            {rows.map(({ s, p, color }, i) => {
                const yy = PAD.t + i * ROW;
                const end = x.at(p.value);
                const est = p.confidence !== "reported";
                return (
                    <g key={s.id} style={{ color }}>
                        <title>{`${s.label}: ${formatValue(p.value)} ${chart.unit}${p.range ? ` (${formatValue(p.range[0])} to ${formatValue(p.range[1])})` : ""}${est ? ` (${p.confidence})` : ""}. ${p.note ?? ""}`}</title>
                        <text x={LABEL - 10} y={yy + ROW / 2 + 4} textAnchor="end" className="tr-bar-label">
                            {s.label}
                        </text>
                        <rect
                            x={base}
                            y={yy + 7}
                            width={Math.max(1, end - base)}
                            height={ROW - 14}
                            fill={est ? "none" : "currentColor"}
                            fillOpacity={0.75}
                            stroke="currentColor"
                            strokeDasharray={est ? "3 2" : undefined}
                        />
                        {p.range && (
                            <line x1={x.at(p.range[0])} x2={x.at(p.range[1])} y1={yy + ROW / 2} y2={yy + ROW / 2} className="tr-whisker" />
                        )}
                        <text x={Math.max(end, p.range ? x.at(p.range[1]) : end) + 6} y={yy + ROW / 2 + 4} className="tr-bar-value">
                            {formatValue(p.value)}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}
