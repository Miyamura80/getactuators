import { type TrendChart, allPoints, yearOf } from "../../../../src/trends";
import { headline } from "./headline";
import { colorAt } from "./scale";

const W = 200;
const H = 56;
const P = 4;

// Sparkline of a chart: one polyline per series (dots for scatters), or
// mini bars. Shape only; axes and labels live in the full chart.
export function Spark({ chart }: { chart: TrendChart }) {
    const log = Boolean(chart.log);
    const f = (v: number) => (log ? Math.log10(v) : v);
    if (chart.kind === "bars") {
        const vs = chart.series.map((s) => f(s.points[0]?.value ?? 0));
        const lo = 0;
        const hi = Math.max(...vs, 1e-9);
        const row = (H - P * 2) / chart.series.length;
        return (
            <svg viewBox={`0 0 ${W} ${H}`} className="tr-spark" aria-hidden="true">
                {chart.series.map((s, i) => (
                    <rect
                        key={s.id}
                        x={P}
                        y={P + i * row + row * 0.15}
                        width={Math.max(1.5, ((vs[i]! - lo) / (hi - lo)) * (W - P * 2))}
                        height={row * 0.7}
                        fill={colorAt(i)}
                        opacity={0.85}
                    />
                ))}
            </svg>
        );
    }
    const pts = allPoints(chart);
    const xs = pts.map((p) => yearOf(p.date));
    const ys = pts.map((p) => f(p.value));
    const x0 = Math.min(...xs);
    const x1 = Math.max(...xs);
    const y0 = Math.min(...ys);
    const y1 = Math.max(...ys);
    const sx = (x: number) => P + ((x - x0) / (x1 - x0 || 1)) * (W - P * 2);
    const sy = (v: number) => H - P - ((f(v) - y0) / (y1 - y0 || 1)) * (H - P * 2);
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="tr-spark" aria-hidden="true">
            {chart.series.map((s, i) =>
                chart.kind === "scatter" || s.points.length === 1 ? (
                    s.points.map((p) => <circle key={`${s.id}${p.date}${p.label ?? ""}`} cx={sx(yearOf(p.date))} cy={sy(p.value)} r={2.6} fill={colorAt(i)} />)
                ) : (
                    <polyline
                        key={s.id}
                        fill="none"
                        stroke={colorAt(i)}
                        strokeWidth={1.8}
                        strokeLinejoin="round"
                        points={s.points.map((p) => `${sx(yearOf(p.date))},${sy(p.value)}`).join(" ")}
                    />
                ),
            )}
        </svg>
    );
}

// A selectable thumbnail: title, one headline number and the sparkline.
export function Thumb({
    chart,
    selected,
    onSelect,
    controls,
}: {
    chart: TrendChart;
    selected: boolean;
    onSelect: () => void;
    // Id of the region the thumbnail opens, for aria-controls.
    controls?: string;
}) {
    const h = headline(chart);
    return (
        <button
            type="button"
            className={`tr-thumb${selected ? " is-on" : ""}`}
            aria-pressed={selected}
            aria-controls={controls}
            onClick={onSelect}
            data-chart={chart.id}
        >
            <span className="tr-thumb-title">{chart.title}</span>
            <span className="tr-thumb-num">
                <b>{h.value}</b> {h.label}
            </span>
            <Spark chart={chart} />
        </button>
    );
}
