import {
    type OpenRobot,
    bomCostUsd,
    repoStat,
} from "../../../../src/open-source";

// Cost to build (log x) against DOF (y); bubble area follows GitHub stars.
// Robots without a US-dollar cost or a DOF count are listed under the chart.

const W = 680;
const H = 340;
const PAD = { l: 44, r: 16, t: 14, b: 38 };
const X_TICKS = [100, 300, 1000, 3000, 10000, 30000];
const Y_MAX = 35;

const x = (usd: number) => {
    const [a, b] = [Math.log10(X_TICKS[0]!), Math.log10(X_TICKS[X_TICKS.length - 1]!)];
    return PAD.l + ((Math.log10(usd) - a) / (b - a)) * (W - PAD.l - PAD.r);
};
const y = (dof: number) => H - PAD.b - (dof / Y_MAX) * (H - PAD.t - PAD.b);
const radius = (stars: number | undefined) => (stars ? 4 + Math.sqrt(stars) / 9 : 4);

const tick = (v: number) => (v >= 1000 ? `$${v / 1000}k` : `$${v}`);

export function CostScatter({
    robots,
    selected,
    onPick,
}: {
    robots: readonly OpenRobot[];
    selected: string | null;
    onPick: (id: string) => void;
}) {
    const plotted = robots.filter((r) => bomCostUsd(r) !== null && r.dof !== null);
    const left = robots.filter((r) => !plotted.includes(r));
    return (
        <figure className="os-scatter">
            <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Cost to build against degrees of freedom; bubble size is GitHub stars">
                {X_TICKS.map((v) => (
                    <g key={v}>
                        <line x1={x(v)} x2={x(v)} y1={PAD.t} y2={H - PAD.b} className="os-grid" />
                        <text x={x(v)} y={H - PAD.b + 16} textAnchor="middle" className="os-tick">
                            {tick(v)}
                        </text>
                    </g>
                ))}
                {[0, 10, 20, 30].map((v) => (
                    <g key={v}>
                        <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} className="os-grid" />
                        <text x={PAD.l - 8} y={y(v) + 4} textAnchor="end" className="os-tick">
                            {v}
                        </text>
                    </g>
                ))}
                <text x={(W + PAD.l) / 2} y={H - 4} textAnchor="middle" className="os-axis">
                    Cost to build, US$ (log scale)
                </text>
                <text x={12} y={(H - PAD.b) / 2} textAnchor="middle" className="os-axis" transform={`rotate(-90 12 ${(H - PAD.b) / 2})`}>
                    DOF
                </text>
                {plotted.map((r) => {
                    const cx = x(bomCostUsd(r)!);
                    const cy = y(r.dof!);
                    const stars = repoStat(r)?.stars;
                    const rr = radius(stars);
                    return (
                        <g
                            key={r.id}
                            className={`os-dot${selected === r.id ? " is-on" : ""}${stars ? "" : " is-nostars"}`}
                            data-robot={r.id}
                            role="button"
                            tabIndex={0}
                            aria-label={`${r.name}: ${r.dof} DOF, $${bomCostUsd(r)}${stars ? `, ${stars} stars` : ""}`}
                            onClick={() => onPick(r.id)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    onPick(r.id);
                                }
                            }}
                        >
                            <circle cx={cx} cy={cy} r={rr} />
                            <text x={cx + rr + 4} y={cy + 4}>
                                {r.name}
                            </text>
                        </g>
                    );
                })}
            </svg>
            <figcaption>
                Bubble area follows GitHub stars (hollow: no repository found). Costs are as published, including kit and system prices
                (see each robot). Not plotted, no US$ cost or DOF: {left.map((r) => r.name).join(", ") || "none"}.
            </figcaption>
        </figure>
    );
}
