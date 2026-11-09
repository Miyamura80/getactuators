import { type TrendChart, type TrendPoint, formatValue, isEstimatedSeries, yearOf } from "../../../../src/trends";
import { colorAt, makeScale, tickLabel, yearTicks } from "./scale";

const W = 640;
const H = 300;
const PAD = { l: 52, r: 16, t: 14, b: 32 };

// Values over calendar time: one line per series (or labelled dots for a
// scatter). Filled dots are reported values, hollow ones estimated or modeled;
// whiskers show a published range.
export function LineChart({
    chart,
    value,
    unit,
    focus,
}: {
    chart: TrendChart;
    // Plotted value of a point, or null to skip it (e.g. no torque for $/N·m).
    value: (p: TrendPoint) => number | null;
    unit: string;
    focus: string | null;
}) {
    const series = chart.series.map((s, i) => ({
        s,
        color: colorAt(i),
        pts: s.points.flatMap((p) => {
            const v = value(p);
            return v === null ? [] : [{ p, v, x: yearOf(p.date) }];
        }),
    }));
    const all = series.flatMap((s) => s.pts);
    const vs = all.flatMap(({ p, v }) => (p.range && value(p) === p.value ? [v, p.range[0], p.range[1]] : [v]));
    const xs = all.map((a) => a.x);
    const x0 = Math.min(...xs) - 0.4;
    const x1 = Math.max(...xs) + 0.4;
    const log = Boolean(chart.log);
    const sx = (x: number) => PAD.l + ((x - x0) / (x1 - x0)) * (W - PAD.l - PAD.r);
    const y = makeScale(Math.min(...vs), Math.max(...vs) * (log ? 1 : 1.08), H - PAD.b, PAD.t, log);
    const scatter = chart.kind === "scatter";
    // Scatter labels: right of the dot, else left, else a line below or
    // above, whichever first clears every dot and label already placed.
    const labels = new Map<TrendPoint, { x: number; y: number; end: boolean }>();
    if (scatter) {
        const boxes = all.map(({ v, x }) => ({ x: sx(x) - 5, y: y.at(v) + 3, w: 10 }));
        const clear = (x: number, yy: number, w: number) =>
            !boxes.some((b) => x < b.x + b.w && b.x < x + w && Math.abs(b.y - yy) < 10);
        for (const { p, v, x } of [...all].sort((a, b) => a.x - b.x)) {
            const w = (p.label ?? "").length * 5.6;
            const cx = sx(x);
            const cy = y.at(v) + 3;
            const options = [
                { x: cx + 7, y: cy, end: false },
                { x: cx - 7 - w, y: cy, end: true },
                { x: cx - w / 2, y: cy + 13, end: false },
                { x: cx - w / 2, y: cy - 11, end: false },
            ];
            const pick = options.find((o) => clear(o.x, o.y, w)) ?? options[0]!;
            boxes.push({ x: pick.x, y: pick.y, w });
            labels.set(p, { ...pick, x: pick.end ? cx - 7 : pick.x });
        }
    }
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="tr-svg" role="img" aria-label={`${chart.title}, ${unit}, by year`}>
            {y.ticks.map((t) => (
                <g key={`y${t}`}>
                    <line x1={PAD.l} x2={W - PAD.r} y1={y.at(t)} y2={y.at(t)} className="tr-grid" />
                    <text x={PAD.l - 6} y={y.at(t) + 3} textAnchor="end" className="tr-axis">
                        {tickLabel(t)}
                    </text>
                </g>
            ))}
            {yearTicks(x0, x1).map((t) => (
                <text key={`x${t}`} x={sx(t)} y={H - PAD.b + 16} textAnchor="middle" className="tr-axis">
                    {t}
                </text>
            ))}
            <text x={PAD.l} y={H - 4} className="tr-axis">
                {unit}
                {log ? " (log)" : ""}
            </text>
            {series.map(({ s, color, pts }) => {
                const dim = focus !== null && focus !== s.id;
                return (
                    <g key={s.id} className={`tr-series${dim ? " is-dim" : ""}`} style={{ color }}>
                        {!scatter && pts.length > 1 && (
                            <polyline
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={1.6}
                                strokeDasharray={isEstimatedSeries(s) ? "4 3" : undefined}
                                points={pts.map((a) => `${sx(a.x)},${y.at(a.v)}`).join(" ")}
                            />
                        )}
                        {pts.map(({ p, v, x }) => (
                            <g key={p.date + (p.label ?? "")}>
                                <title>{`${p.label ?? s.label}, ${p.date}: ${formatValue(v)} ${unit}${p.confidence === "reported" ? "" : ` (${p.confidence})`}${p.note ? `. ${p.note}` : ""}`}</title>
                                {p.range && value(p) === p.value && (
                                    <line x1={sx(x)} x2={sx(x)} y1={y.at(p.range[0])} y2={y.at(p.range[1])} stroke="currentColor" strokeWidth={1} />
                                )}
                                <circle
                                    cx={sx(x)}
                                    cy={y.at(v)}
                                    r={scatter ? 4.5 : 3.5}
                                    className={p.confidence === "reported" ? "tr-dot" : "tr-dot is-est"}
                                />
                                {scatter && p.label && (
                                    <text
                                        x={labels.get(p)?.x ?? sx(x) + 7}
                                        y={labels.get(p)?.y ?? y.at(v) + 3}
                                        textAnchor={labels.get(p)?.end ? "end" : "start"}
                                        className="tr-label"
                                    >
                                        {p.label}
                                    </text>
                                )}
                            </g>
                        ))}
                    </g>
                );
            })}
        </svg>
    );
}
