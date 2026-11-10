import { useState } from "react";
import { getActuator } from "../../../../src/catalog";
import { type GroupBy, groupStats, priceYears } from "../../../../src/prices";
import { formatValue } from "../../../../src/trends";
import { makeScale, tickLabel } from "../trends/scale";
import { useWidth } from "./chart";

const ROW = 26;

// $/N·m spread per country or brand in one year: a box (quartiles), the
// median, whiskers to the extremes and every actuator as a dot. Labels are
// HTML beside each row, so they never clip on a narrow screen.
export function CompareView() {
    const years = priceYears();
    const [by, setBy] = useState<GroupBy>("country");
    const [year, setYear] = useState(years.at(-1) ?? new Date().getFullYear());
    const groups = groupStats(by, year);
    const [ref, width] = useWidth(360);
    const all = groups.flatMap((g) => g.values.map((v) => v.usdPerNm));
    const lo = Math.min(...all);
    const hi = Math.max(...all);
    const pad = 8;
    const x = all.length ? makeScale(lo, hi, pad, Math.max(pad + 40, width - pad), true) : null;
    return (
        <section className="pr-view" aria-labelledby="pr-compare-title">
            <h2 id="pr-compare-title" className="pr-view-title">
                $/N·m by {by} in {year}
            </h2>
            <div className="pr-controls">
                <div className="tr-toggle" role="group" aria-label="Group by">
                    {(["country", "brand"] as const).map((g) => (
                        <button key={g} type="button" aria-pressed={by === g} onClick={() => setBy(g)}>
                            {g === "country" ? "Country" : "Brand"}
                        </button>
                    ))}
                </div>
                <div className="tr-toggle pr-years" role="group" aria-label="Year">
                    {years.map((y) => (
                        <button key={y} type="button" aria-pressed={year === y} onClick={() => setYear(y)}>
                            {y}
                        </button>
                    ))}
                </div>
            </div>
            <p className="pr-unit">US$ per N·m peak, log scale · one dot per actuator</p>
            <div className="pr-box-grid">
                {groups.map((g) => (
                    <div key={g.group} className="pr-box-row">
                        <span className="pr-box-label">
                            {g.group} <span className="pr-n">{g.n}</span>
                        </span>
                        <svg className="pr-box-svg" height={ROW} width="100%" role="img" aria-label={`${g.group}: median $${formatValue(g.median)} per N·m over ${g.n} actuators`}>
                            {x && (
                                <>
                                    <line x1={x.at(g.min)} x2={x.at(g.max)} y1={ROW / 2} y2={ROW / 2} className="pr-whisker" />
                                    <rect
                                        x={x.at(g.q1)}
                                        y={5}
                                        width={Math.max(1, x.at(g.q3) - x.at(g.q1))}
                                        height={ROW - 10}
                                        className="pr-box"
                                    />
                                    <line x1={x.at(g.median)} x2={x.at(g.median)} y1={3} y2={ROW - 3} className="pr-median" />
                                    {g.values.map((v) => (
                                        <circle key={v.actuatorId} cx={x.at(v.usdPerNm)} cy={ROW / 2} r={2.5} className="pr-box-dot">
                                            <title>{`${getActuator(v.actuatorId)?.name ?? v.actuatorId}: $${formatValue(v.usdPerNm)}/N·m`}</title>
                                        </circle>
                                    ))}
                                </>
                            )}
                        </svg>
                    </div>
                ))}
                <div className="pr-box-row pr-box-axis" aria-hidden="true">
                    <span />
                    <div ref={ref} className="pr-axis-strip">
                        {x?.ticks.map((t) => (
                            <span key={t} style={{ left: `${x.at(t)}px` }}>
                                {tickLabel(t)}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
