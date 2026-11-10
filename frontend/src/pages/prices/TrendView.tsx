import { useState } from "react";
import { getActuator } from "../../../../src/catalog";
import { FIT_METHOD, type ClassTrend, classTrends } from "../../../../src/prices";
import { formatValue } from "../../../../src/trends";
import { colorAt } from "../trends/scale";
import { Axes, frame, pct, useWidth } from "./chart";

const H = 320;

function fitText(t: ClassTrend): string {
    return t.fit ? `${pct(t.fit.annualChange)}/yr · R² ${t.fit.r2.toFixed(2)}` : "no fit yet";
}

// $/N·m over time, one colour per class; thin lines join one actuator's
// prices and the dashed line is the class's within-actuator fit.
export function TrendView() {
    const trends = classTrends();
    const [focus, setFocus] = useState<string | null>(null);
    const [ref, width] = useWidth();
    const all = trends.flatMap((t) => t.points);
    const xs = all.map((p) => p.year);
    const vs = all.map((p) => p.usdPerNm);
    // No priced points: legend and table only (min/max of nothing is
    // Infinity, which the scale cannot take).
    const f =
        all.length === 0
            ? null
            : frame({
                  width,
                  height: H,
                  x0: Math.floor(Math.min(...xs)) - 0.2,
                  x1: Math.max(...xs) + 0.3,
                  y0: Math.min(...vs),
                  y1: Math.max(...vs),
                  log: true,
              });
    return (
        <section className="pr-view" aria-labelledby="pr-trend-title">
            <h2 id="pr-trend-title" className="pr-view-title">
                $/N·m over time by class
            </h2>
            <ul className="tr-legend" aria-label="Classes">
                {trends.map((t, i) => (
                    <li key={t.category}>
                        <button
                            type="button"
                            aria-pressed={focus === t.category}
                            onClick={() => setFocus(focus === t.category ? null : t.category)}
                            style={{ color: colorAt(i) }}
                        >
                            <span className="tr-swatch" aria-hidden="true" />
                            <span className="tr-legend-text">{t.label}</span>
                            <span className="pr-fit">{fitText(t)}</span>
                        </button>
                    </li>
                ))}
            </ul>
            <p className="pr-unit">US$ per N·m peak, log scale</p>
            <div ref={ref} className="pr-chart">
                {f && (
                <svg width={f.w} height={f.h} className="pr-svg" role="img" aria-label="Price per newton metre of peak torque by year, coloured by actuator class">
                    <Axes f={f} />
                    {trends.map((t, i) => {
                        const dim = focus !== null && focus !== t.category;
                        const byId = new Map<string, typeof t.points>();
                        for (const p of t.points) byId.set(p.point.actuatorId, [...(byId.get(p.point.actuatorId) ?? []), p]);
                        return (
                            <g key={t.category} className={`tr-series${dim ? " is-dim" : ""}`} style={{ color: colorAt(i) }}>
                                {[...byId.entries()].map(([id, ps]) =>
                                    ps.length > 1 ? (
                                        <polyline
                                            key={id}
                                            fill="none"
                                            stroke="currentColor"
                                            strokeOpacity={0.45}
                                            strokeWidth={1}
                                            points={ps.map((p) => `${f.x(p.year)},${f.y.at(p.usdPerNm)}`).join(" ")}
                                        />
                                    ) : null,
                                )}
                                {t.fit && (
                                    <line
                                        className="pr-fit-line"
                                        x1={f.x(t.fit.line[0][0])}
                                        y1={f.y.at(t.fit.line[0][1])}
                                        x2={f.x(t.fit.line[1][0])}
                                        y2={f.y.at(t.fit.line[1][1])}
                                        stroke="currentColor"
                                    />
                                )}
                                {t.points.map((p) => (
                                    <circle
                                        key={`${p.point.actuatorId}${p.point.date}`}
                                        cx={f.x(p.year)}
                                        cy={f.y.at(p.usdPerNm)}
                                        r={3}
                                        className="tr-dot"
                                    >
                                        <title>{`${getActuator(p.point.actuatorId)?.name ?? p.point.actuatorId}, ${p.point.date}: $${formatValue(p.usdPerNm)}/N·m (${p.point.method})`}</title>
                                    </circle>
                                ))}
                            </g>
                        );
                    })}
                </svg>
                )}
            </div>
            <details className="tr-data">
                <summary>Fit method and data</summary>
                <p className="tr-notes">{FIT_METHOD}</p>
                <div className="tr-table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Class</th>
                                <th>Points</th>
                                <th>Fitted (actuators)</th>
                                <th>Change/yr</th>
                                <th>R²</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trends.map((t) => (
                                <tr key={t.category}>
                                    <th scope="row">{t.label}</th>
                                    <td>{t.points.length}</td>
                                    <td>{t.fit ? `${t.fit.n} (${t.fit.actuators})` : "0"}</td>
                                    <td>{t.fit ? pct(t.fit.annualChange) : "n/a"}</td>
                                    <td>{t.fit ? t.fit.r2.toFixed(2) : "n/a"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="tr-table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Actuator</th>
                                <th>Class</th>
                                <th>Date</th>
                                <th>$/N·m</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trends.flatMap((t) =>
                                t.points.map((p) => (
                                    <tr key={`${p.point.actuatorId}${p.point.date}${p.point.method}`}>
                                        <th scope="row">{getActuator(p.point.actuatorId)?.name ?? p.point.actuatorId}</th>
                                        <td>{t.label}</td>
                                        <td>{p.point.date}</td>
                                        <td>{formatValue(p.usdPerNm)}</td>
                                    </tr>
                                )),
                            )}
                        </tbody>
                    </table>
                </div>
            </details>
        </section>
    );
}
