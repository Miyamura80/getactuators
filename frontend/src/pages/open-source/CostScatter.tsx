import { useState } from "react";
import { type OpenRobot, formatUsd, repoStat } from "../../../../src/open-source";

const W = 640;
const H = 320;
const PAD = { l: 48, r: 16, t: 16, b: 40 };

type Y = "dof" | "payload";

function yValue(r: OpenRobot, y: Y): number | null {
    return y === "dof" ? r.dof : (r.payloadKg?.value ?? null);
}

// Cost against capability: x is BOM or kit cost (log), y is DOF or payload,
// bubble area is GitHub stars. Each bubble selects its robot.
export function CostScatter({ robots, active, onSelect }: { robots: OpenRobot[]; active: string | null; onSelect: (id: string) => void }) {
    const [y, setY] = useState<Y>("dof");
    const pts = robots.flatMap((r) => {
        const cost = r.bomCostUsd?.value;
        const v = yValue(r, y);
        return cost && v !== null ? [{ r, cost, v, stars: repoStat(r)?.stars ?? 0 }] : [];
    });
    const xs = pts.map((p) => Math.log10(p.cost));
    const x0 = Math.floor(Math.min(2, ...xs));
    const x1 = Math.ceil(Math.max(3, ...xs));
    const yMax = Math.max(1, ...pts.map((p) => p.v)) * 1.1;
    const maxStars = Math.max(1, ...pts.map((p) => p.stars));
    const sx = (c: number) => PAD.l + ((Math.log10(c) - x0) / (x1 - x0)) * (W - PAD.l - PAD.r);
    const sy = (v: number) => H - PAD.b - (v / yMax) * (H - PAD.t - PAD.b);
    const rad = (s: number) => 4 + 14 * Math.sqrt(s / maxStars);
    const ticks = Array.from({ length: x1 - x0 + 1 }, (_, i) => 10 ** (x0 + i));
    const missing = robots.length - pts.length;
    return (
        <div className="os-scatter">
            <div className="os-toggle" role="group" aria-label="Vertical axis">
                <button type="button" aria-pressed={y === "dof"} onClick={() => setY("dof")}>
                    DOF
                </button>
                <button type="button" aria-pressed={y === "payload"} onClick={() => setY("payload")}>
                    Payload
                </button>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Cost against ${y === "dof" ? "degrees of freedom" : "payload"}`}>
                {ticks.map((t) => (
                    <g key={t}>
                        <line x1={sx(t)} x2={sx(t)} y1={PAD.t} y2={H - PAD.b} className="os-grid" />
                        <text x={sx(t)} y={H - PAD.b + 16} textAnchor="middle" className="os-axis">
                            {formatUsd(t)}
                        </text>
                    </g>
                ))}
                <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} className="os-axis-line" />
                <text x={PAD.l - 8} y={PAD.t + 4} textAnchor="end" className="os-axis">
                    {Math.round(yMax)}
                </text>
                <text x={PAD.l - 8} y={H - PAD.b} textAnchor="end" className="os-axis">
                    0
                </text>
                <text x={12} y={H / 2} className="os-axis" transform={`rotate(-90 12 ${H / 2})`} textAnchor="middle">
                    {y === "dof" ? "DOF" : "Payload kg"}
                </text>
                <text x={W - PAD.r} y={H - 6} textAnchor="end" className="os-axis">
                    BOM or kit cost (log)
                </text>
                {[...pts]
                    .sort((a, b) => b.stars - a.stars)
                    .map((p) => (
                        <g
                            key={p.r.id}
                            className={`os-bubble${p.r.id === active ? " is-on" : ""}`}
                            tabIndex={0}
                            role="button"
                            aria-label={`${p.r.name}: ${formatUsd(p.cost)}, ${p.v} ${y === "dof" ? "DOF" : "kg"}, ${p.stars} stars`}
                            onClick={() => onSelect(p.r.id)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    onSelect(p.r.id);
                                }
                            }}
                        >
                            <title>{`${p.r.name}: ${formatUsd(p.cost)}, ${p.v} ${y === "dof" ? "DOF" : "kg"}, ${p.stars.toLocaleString("en-US")} stars`}</title>
                            <circle cx={sx(p.cost)} cy={sy(p.v)} r={rad(p.stars)} />
                            <text x={sx(p.cost)} y={sy(p.v) - rad(p.stars) - 4} textAnchor="middle">
                                {p.r.name}
                            </text>
                        </g>
                    ))}
            </svg>
            {missing > 0 && <p className="os-note">{missing} robots without a published cost or {y === "dof" ? "DOF" : "payload"} are not plotted. Bubble area: GitHub stars.</p>}
        </div>
    );
}
