import { CAUSATION_NOTE, INDEX_METHOD, metalsOverlay } from "../../../../src/prices";
import { Axes, frame, useWidth } from "./chart";

const H = 260;
const INDEX_COLOR = "#4dabf7";
const METAL_COLOR = "#ffb547";

// The actuator price index and NdPr oxide, both rebased to 100 in the first
// year they share, with the lagged correlation of their yearly changes.
export function MetalsView() {
    const { index, metal, lags } = metalsOverlay();
    const [ref, width] = useWidth();
    const metalBy = new Map(metal.map((m) => [m.year, m]));
    const base = index.find((i) => i.value !== null && metalBy.has(i.year));
    const baseMetal = base ? metalBy.get(base.year) : undefined;
    const idx = index.flatMap((i) =>
        i.value !== null && base?.value ? [{ year: i.year, v: (i.value / base.value) * 100 }] : [],
    );
    const met = metal.map((m) => ({ ...m, v: baseMetal ? (m.usdPerKg / baseMetal.usdPerKg) * 100 : 0 }));
    const xs = [...idx, ...met].map((p) => p.year);
    const vs = [...idx, ...met].map((p) => p.v);
    const f = frame({
        width,
        height: H,
        x0: Math.min(...xs) - 0.3,
        x1: Math.max(...xs) + 0.3,
        y0: Math.min(...vs) * 0.9,
        y1: Math.max(...vs) * 1.05,
        log: false,
    });
    const line = (pts: { year: number; v: number }[]) => pts.map((p) => `${f.x(p.year)},${f.y.at(p.v)}`).join(" ");
    return (
        <section className="pr-view" aria-labelledby="pr-metals-title">
            <h2 id="pr-metals-title" className="pr-view-title">
                Actuator prices vs NdPr oxide
            </h2>
            <ul className="pr-key" aria-label="Series">
                <li style={{ color: INDEX_COLOR }}>
                    <span className="tr-swatch" aria-hidden="true" />
                    <span className="tr-legend-text">Actuator price index</span>
                </li>
                <li style={{ color: METAL_COLOR }}>
                    <span className="tr-swatch" aria-hidden="true" />
                    <span className="tr-legend-text">NdPr oxide, FOB China</span>
                </li>
            </ul>
            <p className="pr-unit">Index, {base?.year ?? ""} = 100</p>
            <div ref={ref} className="pr-chart">
                <svg width={f.w} height={f.h} className="pr-svg" role="img" aria-label="Actuator price index and NdPr oxide price, both indexed">
                    <Axes f={f} />
                    <g style={{ color: INDEX_COLOR }}>
                        <polyline fill="none" stroke="currentColor" strokeWidth={1.8} points={line(idx)} />
                        {idx.map((p) => (
                            <circle key={p.year} cx={f.x(p.year)} cy={f.y.at(p.v)} r={3} className="tr-dot">
                                <title>{`${p.year}: ${p.v.toFixed(1)}`}</title>
                            </circle>
                        ))}
                    </g>
                    <g style={{ color: METAL_COLOR }}>
                        <polyline fill="none" stroke="currentColor" strokeWidth={1.8} points={line(met)} />
                        {met.map((p) => (
                            <circle key={p.year} cx={f.x(p.year)} cy={f.y.at(p.v)} r={3} className={p.carried ? "tr-dot is-est" : "tr-dot"}>
                                <title>{`${p.year}: $${p.usdPerKg}/kg${p.carried ? ` (carried from ${p.date})` : ""}`}</title>
                            </circle>
                        ))}
                    </g>
                </svg>
            </div>
            <table className="pr-lags">
                <caption>Correlation of yearly changes</caption>
                <thead>
                    <tr>
                        <th>NdPr leads by</th>
                        <th>r</th>
                        <th>Years</th>
                    </tr>
                </thead>
                <tbody>
                    {lags.map((l) => (
                        <tr key={l.lag}>
                            <th scope="row">
                                {l.lag} {l.lag === 1 ? "year" : "years"}
                            </th>
                            <td>{l.r === null ? "n/a" : l.r.toFixed(2)}</td>
                            <td>{l.n}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <p className="pr-caution">{CAUSATION_NOTE}</p>
            <details className="tr-data">
                <summary>Method</summary>
                <p className="tr-notes">
                    {INDEX_METHOD} NdPr oxide is the /metals series, read with priceAt() for June of each year; hollow points carry an earlier year forward and are left out of the correlation.
                </p>
            </details>
        </section>
    );
}
