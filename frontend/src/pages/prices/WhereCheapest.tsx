import { useState } from "react";
import { type GroupBy, distribution, nmPoints, years } from "../../../../src/prices/trends";
import { M, PRICED, W, logAxis, perNmText } from "./shared";

// 02: $/Nm distribution per country or brand in one year, as box plots on a
// log axis (whiskers min to max, box the middle half, tick the median).

const ROW = 26;

export function WhereCheapest() {
    const pts = nmPoints(PRICED);
    const ys = years(pts);
    const [by, setBy] = useState<GroupBy>("country");
    const [year, setYear] = useState(ys.at(-1) ?? "");
    const rows = distribution(pts, by, year);
    const vals = rows.flatMap((r) => [r.stats.min, r.stats.max]);
    const lo = Math.max(0.1, Math.min(...vals, 1) / 1.3);
    const hi = Math.max(...vals, 10) * 1.3;
    const left = 150;
    const h = M.t + rows.length * ROW + 30;
    // logAxis maps to a vertical range; flip it for a horizontal axis.
    const { y: v, ticks } = logAxis(lo, hi, left, W - M.r);
    const x = (n: number) => W - M.r + left - v(n);

    return <div className="pr-view">
        <div className="pr-controls">
            <span className="pr-seg" role="group" aria-label="Group by">
                {(["country", "brand"] as const).map((g) => <button key={g} type="button" aria-pressed={by === g}
                    className={by === g ? "is-on" : undefined} onClick={() => setBy(g)}>{g === "country" ? "Country" : "Brand"}</button>)}
            </span>
            <span className="pr-seg" role="group" aria-label="Year">
                {ys.map((yr) => <button key={yr} type="button" aria-pressed={year === yr}
                    className={year === yr ? "is-on" : undefined} onClick={() => setYear(yr)}>{yr}</button>)}
            </span>
        </div>
        <svg className="pr-chart pr-boxes" viewBox={`0 0 ${W} ${h}`} role="img"
            aria-label={`Price per newton-metre by ${by}, ${year}, cheapest median first`}>
            {ticks.map((t) => <g key={t} className="pr-grid">
                <line x1={x(t)} x2={x(t)} y1={M.t} y2={h - 26} />
                <text x={x(t)} y={h - 10} textAnchor="middle">${t}</text>
            </g>)}
            {rows.map(({ group, stats }, i) => {
                const cy = M.t + i * ROW + ROW / 2;
                return <g key={group} className="pr-box" data-group={group}>
                    <text className="pr-box-label" x={left - 8} y={cy + 4} textAnchor="end">{group} ({stats.n})</text>
                    <line className="pr-whisker" x1={x(stats.min)} x2={x(stats.max)} y1={cy} y2={cy} />
                    <rect x={x(stats.q1)} y={cy - 7} width={Math.max(2, x(stats.q3) - x(stats.q1))} height={14} rx={2} />
                    <line className="pr-median" x1={x(stats.median)} x2={x(stats.median)} y1={cy - 8} y2={cy + 8} />
                    <title>{`${group}, ${year}: median ${perNmText(stats.median)}, middle half ${perNmText(stats.q1)} to ${perNmText(stats.q3)}, range ${perNmText(stats.min)} to ${perNmText(stats.max)}, ${stats.n} actuators`}</title>
                </g>;
            })}
        </svg>
        <p className="pr-note">Each actuator counts once per year, at its last listed price that year. $/Nm is the listed price over peak torque; country is the maker's, from the catalog.</p>
    </div>;
}
