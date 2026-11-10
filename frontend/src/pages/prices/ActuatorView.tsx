import { getActuator } from "../../../../src/catalog";
import {
    METHOD_LABEL,
    type PricePoint,
    actuatorsWithHistory,
    historyFor,
    isPriced,
    latestPoint,
    seriesNote,
    yearChange,
    yearFraction,
} from "../../../../src/prices";
import { formatValue, sourceOf } from "../../../../src/trends";
import { Axes, frame, money, pct, useWidth } from "./chart";

const H = 260;

function sourceLink(id: string): { title: string; url: string } {
    if (id.startsWith("url:")) return { title: "Product page", url: id.slice(4) };
    const s = sourceOf(id);
    return { title: s.title, url: s.url };
}

// Step chart: a listed price holds until the next one. Out-of-stock listings
// are hollow and do not move the line.
function StepChart({ points }: { points: readonly PricePoint[] }) {
    const [ref, width] = useWidth();
    const priced = points.filter(isPriced);
    const xs = points.map((p) => yearFraction(p.date));
    const vs = points.map((p) => p.priceUsd);
    const x0 = Math.min(...xs);
    const x1 = Math.max(...xs);
    const f = frame({
        width,
        height: H,
        x0: Math.floor(x0) - (x1 - x0 < 1 ? 0.5 : 0.2),
        x1: x1 + (x1 - x0 < 1 ? 0.5 : 0.3),
        y0: Math.min(...vs) * 0.9,
        y1: Math.max(...vs) * 1.08,
        log: false,
        yLabel: (v) => `$${v >= 1000 ? `${v / 1000}k` : v}`,
    });
    const path = priced
        .map((p, i) => {
            const px = f.x(yearFraction(p.date));
            const py = f.y.at(p.priceUsd);
            return i === 0 ? `M${px},${py}` : `H${px}V${py}`;
        })
        .join("");
    return (
        <div ref={ref} className="pr-chart">
            <svg width={f.w} height={f.h} className="pr-svg" role="img" aria-label="Listed price over time">
                <Axes f={f} yLabel={(v) => `$${v >= 1000 ? `${v / 1000}k` : v}`} />
                {priced.length > 1 && <path d={path} fill="none" stroke="var(--cyan-dim)" strokeWidth={1.6} />}
                {points.map((p) => (
                    <circle
                        key={p.date + p.method}
                        cx={f.x(yearFraction(p.date))}
                        cy={f.y.at(p.priceUsd)}
                        r={3.5}
                        className={p.outOfStock ? "tr-dot is-est pr-step-dot" : "tr-dot pr-step-dot"}
                    >
                        <title>{`${p.date}: ${money(p.priceUsd)}${p.outOfStock ? " (out of stock)" : ""}, ${METHOD_LABEL[p.method]}`}</title>
                    </circle>
                ))}
            </svg>
        </div>
    );
}

export function ActuatorView({ id, onPick }: { id: string; onPick: (id: string) => void }) {
    const known = actuatorsWithHistory();
    const ids = known.includes(id) || !getActuator(id) ? known : [id, ...known];
    const a = getActuator(id);
    const points = historyFor(id);
    const last = latestPoint(id);
    const yc = yearChange(id);
    const note = seriesNote(id);
    return (
        <section className="pr-view" aria-labelledby="pr-actuator-title">
            <h2 id="pr-actuator-title" className="pr-view-title">
                Price history
            </h2>
            <label className="pr-pick">
                <span className="pr-pick-label">Actuator</span>
                <select value={id} onChange={(e) => onPick(e.target.value)}>
                    {ids.map((x) => {
                        const ax = getActuator(x);
                        return (
                            <option key={x} value={x}>
                                {ax ? `${ax.brand} ${ax.name}` : x} ({historyFor(x).length})
                            </option>
                        );
                    })}
                </select>
            </label>
            {a && last ? (
                <>
                    <dl className="pr-stats">
                        <div>
                            <dt>Latest</dt>
                            <dd>{money(last.priceUsd)}</dd>
                        </div>
                        <div>
                            <dt>$/N·m</dt>
                            <dd>{last.usdPerNm === null ? "n/a" : `$${formatValue(last.usdPerNm)}`}</dd>
                        </div>
                        <div>
                            <dt>1 year</dt>
                            <dd title={yc ? `since ${yc.from.date}` : "no price a year earlier"}>{yc ? pct(yc.change) : "n/a"}</dd>
                        </div>
                        <div>
                            <dt>Points</dt>
                            <dd>{points.length}</dd>
                        </div>
                    </dl>
                    <StepChart points={points} />
                    {points.length === 1 && <p className="tr-sparse">One dated price so far; weekly snapshots add more.</p>}
                    {note && <p className="tr-notes">{note}</p>}
                    <details className="tr-data">
                        <summary>Data and sources</summary>
                        <div className="tr-table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>US$</th>
                                        <th>Listed</th>
                                        <th>Method</th>
                                        <th>Source</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {points.map((p) => (
                                        <tr key={p.date + p.method}>
                                            <th scope="row">{p.date}</th>
                                            <td>
                                                {money(p.priceUsd)}
                                                {p.outOfStock ? " (out of stock)" : ""}
                                            </td>
                                            <td>{p.currency === "USD" ? "USD" : `${p.originalPrice} ${p.currency} × ${p.fxRate}`}</td>
                                            <td>{p.method}</td>
                                            <td>
                                                {p.sources.map((s) => (
                                                    <a key={s} href={sourceLink(s).url} title={sourceLink(s).title} className="pr-src">
                                                        {s.startsWith("catalog:") ? "catalog" : s.startsWith("url:") ? "page" : s}
                                                    </a>
                                                ))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </details>
                    <a className="pr-detail-link" href={`/actuators/${encodeURIComponent(id)}`}>
                        {a.brand} {a.name} specs
                    </a>
                </>
            ) : (
                <p className="tr-sparse">No dated price for this actuator yet.</p>
            )}
        </section>
    );
}
