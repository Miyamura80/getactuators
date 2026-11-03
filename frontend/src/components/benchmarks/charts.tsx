import {
    BENCHMARKS_PATH,
    type BenchmarkRun,
    ORIGIN_LABEL,
    measuredPeak,
} from "../../../../src/benchmarks";
import "./benchmarks.css";

// Shared SVG charts for measured runs: the T-N overlay (/benchmarks, the
// Measured panel, /compare) and thermal derating. Series differ by stroke
// pattern and a direct label, not by hue, so the overlay stays monochrome.

export const SERIES = [
    { stroke: "var(--cyan)", dash: "" },
    { stroke: "var(--text)", dash: "6 4" },
    { stroke: "var(--cyan-dim)", dash: "2 3" },
    { stroke: "var(--muted)", dash: "10 3 2 3" },
] as const;

export const MAX_OVERLAY = SERIES.length;

export interface Series {
    label: string;
    run: BenchmarkRun;
}

export const runHref = (r: Pick<BenchmarkRun, "actuatorId" | "runId">) =>
    `${BENCHMARKS_PATH}#run=${r.actuatorId}/${r.runId}`;

// Round up to 1, 2 or 5 times a power of ten.
export function niceMax(v: number): number {
    if (v <= 0) return 1;
    const p = 10 ** Math.floor(Math.log10(v));
    const n = v / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
}

const ticks = (max: number, n = 5) => Array.from({ length: n + 1 }, (_, i) => (max * i) / n);
const tickText = (v: number) => (v >= 100 ? v.toFixed(0) : String(Number(v.toPrecision(3))));

export function OriginBadge({ run }: { run: BenchmarkRun }) {
    return <span className={`bm-badge bm-badge-${run.origin}`} title={run.sourceKind ? `${ORIGIN_LABEL[run.origin]}: ${run.sourceKind}` : ORIGIN_LABEL[run.origin]}>
        {ORIGIN_LABEL[run.origin]}{run.sourceKind ? <small>{run.sourceKind}</small> : null}
    </span>;
}

const W = 640;
const H = 300;
const PAD = { l: 52, r: 16, t: 14, b: 40 };
const IW = W - PAD.l - PAD.r;
const IH = H - PAD.t - PAD.b;

function Axes({ xTicks, yTicks, x, y, xLabel, yLabel, xText = tickText }: {
    xTicks: number[]; yTicks: number[]; x: (v: number) => number; y: (v: number) => number;
    xLabel: string; yLabel: string; xText?: (v: number) => string;
}) {
    return <g className="bm-axes">
        {yTicks.map((t) => <g key={`y${t}`}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} className="bm-grid" />
            <text x={PAD.l - 6} y={y(t) + 4} textAnchor="end">{tickText(t)}</text>
        </g>)}
        {xTicks.map((t) => <text key={`x${t}`} x={x(t)} y={H - PAD.b + 16} textAnchor="middle">{xText(t)}</text>)}
        <text x={PAD.l + IW / 2} y={H - 4} textAnchor="middle" className="bm-axis-label">{xLabel}</text>
        <text x={12} y={PAD.t + IH / 2} textAnchor="middle" className="bm-axis-label" transform={`rotate(-90 12 ${PAD.t + IH / 2})`}>{yLabel}</text>
    </g>;
}

// Torque against speed for up to four runs.
export function TnChart({ series, title }: { series: Series[]; title: string }) {
    const shown = series.filter((s) => s.run.torqueSpeed?.length).slice(0, MAX_OVERLAY);
    const pts = shown.flatMap((s) => s.run.torqueSpeed ?? []);
    if (pts.length === 0) return null;
    const xMax = niceMax(Math.max(...pts.map((p) => p.rpm)));
    const yMax = niceMax(Math.max(...pts.map((p) => p.torqueNm)));
    const x = (v: number) => PAD.l + (v / xMax) * IW;
    const y = (v: number) => PAD.t + IH - (v / yMax) * IH;
    return <figure className="bm-chart bm-tn">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
            <title>{title}</title>
            <Axes xTicks={ticks(xMax)} yTicks={ticks(yMax)} x={x} y={y} xLabel="Speed (rpm)" yLabel="Torque (N·m)" />
            {shown.map((s, i) => {
                const st = SERIES[i] ?? SERIES[0];
                const tn = s.run.torqueSpeed ?? [];
                const first = tn[0];
                return <g key={`${s.run.actuatorId}/${s.run.runId}`} className="bm-series" data-series={s.run.actuatorId}>
                    <polyline points={tn.map((p) => `${x(p.rpm)},${y(p.torqueNm)}`).join(" ")} fill="none" stroke={st.stroke} strokeDasharray={st.dash} strokeWidth={1.8} />
                    {tn.map((p) => <circle key={p.rpm} cx={x(p.rpm)} cy={y(p.torqueNm)} r={2.2} fill={st.stroke}><title>{`${s.label}: ${p.torqueNm} N·m at ${p.rpm} rpm${p.efficiency === undefined ? "" : `, ${Math.round(p.efficiency * 100)}% efficient`}`}</title></circle>)}
                    {first ? <text x={Math.min(x(first.rpm) + 6, W - PAD.r - 4)} y={y(first.torqueNm) - 6} className="bm-direct" fill={st.stroke}>{s.label}</text> : null}
                </g>;
            })}
        </svg>
        <figcaption>
            <ul className="bm-legend">
                {shown.map((s, i) => <li key={`${s.run.actuatorId}/${s.run.runId}`}>
                    <svg width="28" height="8" aria-hidden="true"><line x1="0" x2="28" y1="4" y2="4" stroke={SERIES[i]?.stroke} strokeDasharray={SERIES[i]?.dash} strokeWidth="2" /></svg>
                    <a href={runHref(s.run)}>{s.label}</a>
                    <span className="bm-mono">{s.run.rig.busV === null ? "bus not stated" : `${s.run.rig.busV} V`} · {s.run.dataMethod}</span>
                </li>)}
            </ul>
        </figcaption>
    </figure>;
}

const T_MIN = 1;
const T_MAX = 3600;
// The log axis stops short of the right edge, which holds continuous points.
const CONT_GAP = 44;
const lx = (t: number) => (Math.log10(Math.min(Math.max(t, T_MIN), T_MAX)) / Math.log10(T_MAX)) * (IW - CONT_GAP) + PAD.l;
const timeText = (t: number) => (t >= 60 ? `${t / 60} min` : `${t} s`);

// Torque as % of the run's peak against time to the thermal limit (log);
// points held without reaching the limit sit on the right edge.
export function ThermalChart({ series, title }: { series: Series[]; title: string }) {
    const shown = series.filter((s) => s.run.thermal?.length).slice(0, MAX_OVERLAY);
    if (shown.length === 0) return null;
    const y = (pct: number) => PAD.t + IH - (pct / 100) * IH;
    const end = W - PAD.r - 10;
    return <figure className="bm-chart bm-thermal">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
            <title>{title}</title>
            <Axes xTicks={[1, 10, 60, 600, 3600]} yTicks={ticks(100)} x={lx} y={y} xLabel="Time to thermal limit (log)" yLabel="% of measured peak" xText={timeText} />
            <text x={end} y={H - PAD.b + 16} textAnchor="middle">∞</text>
            {shown.map((s, i) => {
                const st = SERIES[i] ?? SERIES[0];
                const peak = measuredPeak(s.run) ?? 1;
                const pts = (s.run.thermal ?? []).map((p) => ({ ...p, cx: p.tToLimitS === null ? end : lx(p.tToLimitS), cy: y((p.torqueNm / peak) * 100) }));
                return <g key={`${s.run.actuatorId}/${s.run.runId}`} className="bm-series" data-series={s.run.actuatorId}>
                    <polyline points={pts.map((p) => `${p.cx},${p.cy}`).join(" ")} fill="none" stroke={st.stroke} strokeDasharray={st.dash} strokeWidth={1.8} />
                    {pts.map((p) => <circle key={p.torqueNm} cx={p.cx} cy={p.cy} r={p.tToLimitS === null ? 3.6 : 2.2} fill={p.tToLimitS === null ? "var(--black)" : st.stroke} stroke={st.stroke}>
                        <title>{`${s.label}: ${p.torqueNm} N·m ${p.tToLimitS === null ? "held without reaching the limit" : `for ${p.tToLimitS} s`}`}</title>
                    </circle>)}
                </g>;
            })}
        </svg>
        <figcaption>
            <ul className="bm-legend">
                {shown.map((s, i) => <li key={`${s.run.actuatorId}/${s.run.runId}`}>
                    <svg width="28" height="8" aria-hidden="true"><line x1="0" x2="28" y1="4" y2="4" stroke={SERIES[i]?.stroke} strokeDasharray={SERIES[i]?.dash} strokeWidth="2" /></svg>
                    <a href={runHref(s.run)}>{s.label}</a>
                    <span className="bm-mono">{s.run.rig.ambientC === null ? "ambient not stated" : `${s.run.rig.ambientC} °C`}</span>
                </li>)}
            </ul>
        </figcaption>
    </figure>;
}
