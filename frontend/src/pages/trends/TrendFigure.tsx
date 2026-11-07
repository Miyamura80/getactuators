import { useState } from "react";
import { type TrendChart, type TrendPoint, chartSources, formatValue, perNm, sourceOf, yearSpan } from "../../../../src/trends";
import { BarChart } from "./BarChart";
import { LineChart } from "./LineChart";
import { colorAt } from "./scale";

type Measure = "usd" | "per-nm";

// One chart: title and question, the SVG, a legend that highlights a series,
// notes on gaps, and the data with numbered sources behind a disclosure.
export function TrendFigure({ chart }: { chart: TrendChart }) {
    const [focus, setFocus] = useState<string | null>(null);
    const [measure, setMeasure] = useState<Measure>("usd");
    const priced = chart.id === "actuator-prices";
    const value = (p: TrendPoint) => (priced && measure === "per-nm" ? perNm(p) : p.value);
    const unit = priced && measure === "per-nm" ? "USD per N·m peak" : chart.unit;
    const ids = chartSources(chart);
    const [y0, y1] = yearSpan(chart);
    const points = chart.series.reduce((n, s) => n + s.points.length, 0);
    return (
        <figure className="tr-figure" id={chart.id} aria-labelledby={`${chart.id}-title`}>
            <header className="tr-figure-head">
                <div>
                    <h3 id={`${chart.id}-title`}>{chart.title}</h3>
                    <p className="tr-question">{chart.question}</p>
                </div>
                <span className="tr-span">
                    {y0 === y1 ? y0 : `${y0} to ${y1}`}, {points} points
                </span>
            </header>
            {chart.sparse && <p className="tr-sparse">Too thin to chart as a trend: these are the points we have.</p>}
            {priced && (
                <div className="tr-toggle" role="group" aria-label="Measure">
                    <button type="button" aria-pressed={measure === "usd"} onClick={() => setMeasure("usd")}>
                        $
                    </button>
                    <button type="button" aria-pressed={measure === "per-nm"} onClick={() => setMeasure("per-nm")}>
                        $/N·m
                    </button>
                </div>
            )}
            {chart.kind === "bars" ? <BarChart chart={chart} /> : <LineChart chart={chart} value={value} unit={unit} focus={focus} />}
            {chart.kind === "line" && chart.series.length > 1 && (
                <ul className="tr-legend" aria-label="Series">
                    {chart.series.map((s, i) => (
                        <li key={s.id}>
                            <button
                                type="button"
                                aria-pressed={focus === s.id}
                                onClick={() => setFocus(focus === s.id ? null : s.id)}
                                style={{ color: colorAt(i) }}
                            >
                                <span className="tr-swatch" aria-hidden="true" />
                                <span className="tr-legend-text">{s.label}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <figcaption className="tr-notes">
                <p>
                    {chart.kind === "bars" ? `Unit: ${chart.unit}. ` : ""}
                    {chart.notes[0]}
                </p>
                {chart.notes.slice(1).map((n) => (
                    <p key={n}>{n}</p>
                ))}
                <p className="tr-licence">
                    {chart.licence}
                    {chart.original && (
                        <>
                            {" "}
                            Original:{" "}
                            <a href={chart.original.url} target="_blank" rel="noopener">
                                {chart.original.label}
                            </a>
                            .
                        </>
                    )}{" "}
                    Hollow marks are estimated or modeled.
                </p>
            </figcaption>
            <details className="tr-data">
                <summary>Data and {ids.length} sources</summary>
                <div className="tr-table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th scope="col">Series</th>
                                <th scope="col">Date</th>
                                <th scope="col">{chart.unit}</th>
                                {priced && <th scope="col">$/N·m</th>}
                                <th scope="col">Confidence</th>
                                <th scope="col">Sources</th>
                            </tr>
                        </thead>
                        <tbody>
                            {chart.series.flatMap((s) =>
                                s.points.map((p) => (
                                    <tr key={`${s.id}-${p.date}-${p.label ?? ""}`}>
                                        <th scope="row">{p.label ?? s.label}</th>
                                        <td>{p.date}</td>
                                        <td>
                                            {formatValue(p.value)}
                                            {p.range ? ` (${formatValue(p.range[0])} to ${formatValue(p.range[1])})` : ""}
                                        </td>
                                        {priced && <td>{perNm(p) === null ? "n/a" : formatValue(perNm(p) as number)}</td>}
                                        <td>{p.confidence}</td>
                                        <td>{p.sources.map((id) => `[${ids.indexOf(id) + 1}]`).join(" ")}</td>
                                    </tr>
                                )),
                            )}
                        </tbody>
                    </table>
                </div>
                <ol className="tr-sources">
                    {ids.map((id) => {
                        const src = sourceOf(id);
                        return (
                            <li key={id}>
                                <a href={src.url} target={src.url.startsWith("/") ? undefined : "_blank"} rel="noopener">
                                    {src.title}
                                </a>{" "}
                                <span className="tr-reuse">{src.reuse}</span>
                            </li>
                        );
                    })}
                </ol>
            </details>
        </figure>
    );
}
