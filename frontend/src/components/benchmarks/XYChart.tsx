// A small SVG line chart for the benchmark curves: up to four series, linear
// or log x axis, mono tick labels. Each point carries its own label for the
// hover title and the hidden table.

export interface XYPoint {
    x: number;
    y: number;
    label: string;
}

export interface XYSeries {
    id: string;
    name: string;
    points: XYPoint[];
}

const W = 640;
const H = 300;
const PAD = { l: 48, r: 16, t: 12, b: 36 };

function niceTicks(max: number, count = 5): number[] {
    if (max <= 0) return [0];
    const raw = max / count;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
    const ticks: number[] = [];
    for (let i = 0; ; i++) {
        const v = Number((i * step).toPrecision(6));
        ticks.push(v);
        if (v >= max) return ticks;
    }
}

function logTicks(min: number, max: number): number[] {
    const ticks: number[] = [];
    for (let e = Math.floor(Math.log10(min)); e <= Math.ceil(Math.log10(max)); e++) ticks.push(10 ** e);
    return ticks;
}

export function XYChart({ series, xLabel, yLabel, logX = false, xTickLabel, ariaLabel }: {
    series: XYSeries[];
    xLabel: string;
    yLabel: string;
    logX?: boolean;
    xTickLabel?: (v: number) => string;
    ariaLabel: string;
}) {
    const xs = series.flatMap((s) => s.points.map((p) => p.x));
    const ys = series.flatMap((s) => s.points.map((p) => p.y));
    const yTicks = niceTicks(Math.max(1, ...ys) * 1.05);
    const yMax = yTicks.at(-1) ?? 1;
    const xMinRaw = logX ? Math.min(...xs.filter((x) => x > 0), 1) : 0;
    const xTicks = logX ? logTicks(xMinRaw, Math.max(10, ...xs)) : niceTicks(Math.max(1, ...xs) * 1.05);
    const xMin = logX ? (xTicks[0] ?? 1) : 0;
    const xMax = xTicks.at(-1) ?? 1;
    const sx = (x: number) => {
        const t = logX ? (Math.log10(x) - Math.log10(xMin)) / (Math.log10(xMax) - Math.log10(xMin) || 1) : x / (xMax || 1);
        return PAD.l + t * (W - PAD.l - PAD.r);
    };
    const sy = (y: number) => H - PAD.b - (y / yMax) * (H - PAD.t - PAD.b);
    const fmt = xTickLabel ?? ((v: number) => `${v}`);
    return <figure className="bm-chart">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}>
            {yTicks.map((t) => <g key={`y${t}`}>
                <line x1={PAD.l} x2={W - PAD.r} y1={sy(t)} y2={sy(t)} className="bm-grid" />
                <text x={PAD.l - 6} y={sy(t) + 4} textAnchor="end" className="bm-tick">{t}</text>
            </g>)}
            {xTicks.map((t) => <text key={`x${t}`} x={sx(t)} y={H - PAD.b + 16} textAnchor="middle" className="bm-tick">{fmt(t)}</text>)}
            <text x={W - PAD.r} y={H - 4} textAnchor="end" className="bm-axis">{xLabel}</text>
            <text x={4} y={PAD.t + 4} className="bm-axis">{yLabel}</text>
            {series.map((s, i) => <g key={s.id} className={`bm-series bm-c${i % 4}`}>
                {s.points.length > 1 && <polyline fill="none" points={s.points.map((p) => `${sx(p.x)},${sy(p.y)}`).join(" ")} />}
                {s.points.map((p) => <circle key={`${p.x}-${p.y}`} cx={sx(p.x)} cy={sy(p.y)} r={4}><title>{`${s.name}: ${p.label}`}</title></circle>)}
            </g>)}
        </svg>
        <figcaption className="bm-legend">
            {series.map((s, i) => <span key={s.id} className={`bm-key bm-c${i % 4}`}><i aria-hidden="true" />{s.name}</span>)}
        </figcaption>
    </figure>;
}
