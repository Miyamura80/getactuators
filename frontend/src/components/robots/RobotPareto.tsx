import type { Robot } from "../../types";
import { hours, usdShort } from "../../lib/format";
import { frontierPath, paretoFront } from "../../lib/pareto";
import { KIND_COLOR, ROBOTS, runtimeHours, totalPeakTorque } from "../../lib/robots";
import { navigate } from "../../lib/router";
import { activation } from "../../lib/svg-link";
import { BrandGlyph } from "../BrandGlyph";

const W = 620;
const H = 360;
const M = { top: 22, right: 20, bottom: 44, left: 56 };

interface Pt {
    r: Robot;
    price: number;
    y: number;
}

// Log-axis ticks at 1, 2 and 5 times each power of ten inside the range.
function logTicks(lo: number, hi: number): number[] {
    const out: number[] = [];
    for (let e = Math.floor(Math.log10(lo)); e <= Math.ceil(Math.log10(hi)); e++)
        for (const m of [1, 2, 5]) {
            const v = m * 10 ** e;
            if (v >= lo && v <= hi) out.push(v);
        }
    return out;
}

// About four round linear ticks from zero to max.
function linTicks(max: number): number[] {
    const raw = max / 4;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const step = ([1, 2, 2.5, 5, 10].find((m) => m * mag >= raw) ?? 10) * mag;
    const out: number[] = [];
    for (let v = step; v <= max; v += step) out.push(v);
    return out;
}

// One label per frontier position: robots that tie on both axes share a
// label, and labels that would collide are nudged down a line.
function frontLabels(pts: Pt[], front: boolean[], sx: (v: number) => number, sy: (v: number) => number) {
    const groups = new Map<string, { x: number; y: number; names: string[] }>();
    pts.forEach((p, i) => {
        if (!front[i]) return;
        const k = `${p.price}|${p.y}`;
        const g = groups.get(k) ?? { x: sx(p.price), y: sy(p.y), names: [] };
        g.names.push(p.r.name);
        groups.set(k, g);
    });
    const placed: { x: number; y: number; text: string; end: boolean }[] = [];
    for (const g of [...groups.values()].sort((a, b) => a.y - b.y)) {
        let y = g.y + 4;
        while (placed.some((l) => Math.abs(l.y - y) < 12 && Math.abs(l.x - g.x) < 90)) y += 12;
        const end = g.x > W - M.right - 110;
        placed.push({ x: end ? g.x - 9 : g.x + 9, y, text: g.names.join(" / "), end });
    }
    return placed;
}

interface Props {
    pts: Pt[];
    yLabel: string;
    yLog: boolean;
    fmtY: (v: number) => string;
}

function ParetoPlot({ pts, yLabel, yLog, fmtY }: Props) {
    const prices = pts.map((p) => p.price);
    const ys = pts.map((p) => p.y);
    const minP = Math.min(...prices) / 1.4;
    const maxP = Math.max(...prices) * 1.4;
    const minY = yLog ? Math.min(...ys) / 1.6 : 0;
    const maxY = yLog ? Math.max(...ys) * 1.6 : Math.max(...ys) * 1.15;
    const sx = (v: number) =>
        M.left + ((Math.log10(v) - Math.log10(minP)) / (Math.log10(maxP) - Math.log10(minP))) * (W - M.left - M.right);
    const fy = (v: number) =>
        yLog ? (Math.log10(v) - Math.log10(minY)) / (Math.log10(maxY) - Math.log10(minY)) : v / maxY;
    const sy = (v: number) => H - M.bottom - fy(v) * (H - M.top - M.bottom);
    const yTicks = yLog ? logTicks(minY, maxY) : linTicks(maxY);
    const front = paretoFront(
        pts,
        (p) => p.price,
        (p) => p.y,
    );
    const path = frontierPath(pts.filter((_, i) => front[i]).map((p) => ({ x: sx(p.price), y: sy(p.y) })));

    return (
        <svg className="scatter robot-scatter" viewBox={`0 0 ${W} ${H}`} role="img">
            {logTicks(minP, maxP)
                .filter((t) => sx(t) <= W - M.right - 14)
                .map((t) => (
                <g key={t}>
                    <line x1={sx(t)} x2={sx(t)} y1={M.top} y2={H - M.bottom} className="grid" />
                    <text x={sx(t)} y={H - M.bottom + 16} className="axis-tick" textAnchor="middle">
                        {usdShort(t)}
                    </text>
                </g>
            ))}
            {yTicks.map((t) => (
                <g key={t}>
                    <line x1={M.left} x2={W - M.right} y1={sy(t)} y2={sy(t)} className="grid" />
                    <text x={M.left - 8} y={sy(t) + 4} className="axis-tick" textAnchor="end">
                        {fmtY(t)}
                    </text>
                </g>
            ))}
            {path && <path d={path} className="pareto" />}
            {pts.map((p, i) => (
                <g key={p.r.id} {...activation(p.r.name, () => navigate(`/robots#${p.r.id}`))}>
                    <title>{`${p.r.name}: ${usdShort(p.price)}, ${fmtY(p.y)}`}</title>
                    <circle
                        cx={sx(p.price)}
                        cy={sy(p.y)}
                        r={front[i] ? 6.5 : 5}
                        className={front[i] ? "dot dot-front" : "dot"}
                        style={{ fill: KIND_COLOR[p.r.kind] }}
                    />
                </g>
            ))}
            {frontLabels(pts, front, sx, sy).map((l) => (
                <text
                    key={l.text}
                    x={l.x}
                    y={l.y}
                    className="dot-label"
                    textAnchor={l.end ? "end" : "start"}
                >
                    {l.text}
                </text>
            ))}
            <text x={M.left} y={H - 8} className="axis-label">
                Entry price (USD, log) {"→"}
            </text>
            <text x={12} y={M.top - 8} className="axis-label">
                {yLabel} {"↑"}
            </text>
        </svg>
    );
}

function points(metric: (r: Robot) => number | null): Pt[] {
    return ROBOTS.flatMap((r) => {
        const y = metric(r);
        return r.price_usd != null && y != null && y > 0 ? [{ r, price: r.price_usd, y }] : [];
    });
}

const PLOTS = [
    {
        key: "torque",
        title: "Price vs total joint torque",
        sub: "Summed peak torque of every joint motor",
        yLabel: "Total peak torque (N·m, log)",
        yLog: true,
        fmtY: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10_000 ? 0 : 1)}k` : `${Math.round(v)}`),
        pts: points(totalPeakTorque),
    },
    {
        key: "dof",
        title: "Price vs DOF",
        sub: "Degrees of freedom for the money",
        yLabel: "Degrees of freedom",
        yLog: false,
        fmtY: (v: number) => `${Math.round(v)}`,
        pts: points((r) => r.dof),
    },
    {
        key: "runtime",
        title: "Price vs runtime",
        sub: "Battery robots with a published runtime",
        yLabel: "Runtime per charge (h)",
        yLog: false,
        fmtY: hours,
        pts: points(runtimeHours),
    },
];

// Price trade-off scatters with the Pareto frontier drawn through the robots
// nothing else beats on both price and the metric.
export function RobotPareto() {
    return (
        <div className="robot-paretos">
            {PLOTS.map((p) => (
                <section className="hi-card" key={p.key}>
                    <div className="hi-head">
                        <BrandGlyph className="hi-tag" />
                        <div>
                            <h3>{p.title}</h3>
                            <p>
                                {p.sub} · dashed line is the Pareto frontier · {p.pts.length} robots
                            </p>
                        </div>
                    </div>
                    <div className="hi-chart">
                        <ParetoPlot pts={p.pts} yLabel={p.yLabel} yLog={p.yLog} fmtY={p.fmtY} />
                    </div>
                </section>
            ))}
        </div>
    );
}
