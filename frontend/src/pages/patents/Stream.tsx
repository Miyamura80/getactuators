import { useMemo, useState } from "react";
import { countryName } from "../../../../src/country-flag";
import {
    LANDSCAPE,
    type LandscapeScope,
    PATENT_YEARS,
    type Series,
    seriesByCountry,
    seriesByTechnology,
} from "../../../../src/patents";
import { Axes, frame, useWidth } from "../prices/chart";

// Filings stream: families per priority year as a stacked area, stacked by
// applicant country (the selected scope) or by technology (every
// technology, the selected one lifted). The publication-lag window is shaded.

export type StackBy = "country" | "technology";

// The site's data palette, reordered so neighbouring bands stay apart under
// colour-vision deficiency (validated: adjacent CVD delta E >= 15).
export const BAND_COLORS = ["#4dabf7", "#51cf66", "#9775fa", "#ff6b9a", "#ffb547", "#66d9e8", "#ff922b"];
const OTHER = "#5c6366";
const MAX_BANDS = BAND_COLORS.length;

// Technologies take colours by overall size, fixed for every view, so a
// band keeps its colour whichever technology is selected.
const TECH_ORDER = seriesByTechnology()
    .map((s) => ({ key: s.key, total: s.values.reduce((a, b) => a + b, 0) }))
    .sort((a, b) => b.total - a.total)
    .map((s) => s.key);

function techBands(): Series[] {
    const all = seriesByTechnology();
    const head = TECH_ORDER.slice(0, MAX_BANDS - 1).map((k) => all.find((s) => s.key === k) as Series);
    const rest = all.filter((s) => !head.includes(s));
    if (rest.length === 0) return head;
    const other = PATENT_YEARS.map((_, i) => rest.reduce((sum, s) => sum + (s.values[i] ?? 0), 0));
    return [...head, { key: "other", label: `Other (${rest.length})`, values: other }];
}

export function bandsFor(scope: LandscapeScope, by: StackBy): Series[] {
    return by === "technology" ? techBands() : seriesByCountry(scope, MAX_BANDS - 1);
}

const colorOf = (s: Series, i: number) => (s.key === "other" ? OTHER : (BAND_COLORS[i] ?? OTHER));
const nameOf = (s: Series, by: StackBy) => (by === "country" && s.key !== "other" ? countryName(s.key) : s.label);

export function Stream({ scope, by }: { scope: LandscapeScope; by: StackBy }) {
    const [ref, width] = useWidth(720);
    const [hover, setHover] = useState<number | null>(null);
    const [focus, setFocus] = useState<string | null>(null);
    const bands = useMemo(() => bandsFor(scope, by), [scope, by]);
    const lifted = by === "technology" && scope !== "all" ? scope : focus;
    const totals = PATENT_YEARS.map((_, i) => bands.reduce((s, b) => s + (b.values[i] ?? 0), 0));
    const max = Math.max(1, ...totals);
    const height = width < 480 ? 220 : 280;
    const x0 = PATENT_YEARS[0] ?? 2010;
    const x1 = PATENT_YEARS.at(-1) ?? 2026;
    const f = frame({ width, height, x0, x1, y0: 0, y1: max, log: false });
    // Cumulative tops per band, bottom band first.
    const stacks = bands.map((_, b) => PATENT_YEARS.map((__, i) => bands.slice(0, b + 1).reduce((s, x) => s + (x.values[i] ?? 0), 0)));
    const path = (b: number) => {
        const top = PATENT_YEARS.map((y, i) => `${f.x(y)},${f.y.at(stacks[b]?.[i] ?? 0)}`);
        const bottom = PATENT_YEARS.map((y, i) => `${f.x(y)},${f.y.at(b === 0 ? 0 : (stacks[b - 1]?.[i] ?? 0))}`).reverse();
        return `M${top.join("L")}L${bottom.join("L")}Z`;
    };
    // Shade from the lag date (as a fraction of its year) to the end.
    const lag = new Date(`${LANDSCAPE.incompleteFrom}T00:00:00Z`);
    const lagX = f.x(lag.getUTCFullYear() + lag.getUTCMonth() / 12);
    const pick = (clientX: number, el: SVGSVGElement) => {
        const px = clientX - el.getBoundingClientRect().left;
        let best = 0;
        for (const [i, y] of PATENT_YEARS.entries()) if (Math.abs(f.x(y) - px) < Math.abs(f.x(PATENT_YEARS[best] ?? 0) - px)) best = i;
        setHover(best);
    };
    const hy = hover === null ? undefined : PATENT_YEARS[hover];
    return <div className="pt-stream">
        <ul className="tr-legend pt-legend" aria-label="Bands">
            {[...bands].reverse().map((s) => {
                const i = bands.indexOf(s);
                return <li key={s.key}>
                    <button type="button" aria-pressed={lifted === s.key} disabled={by === "technology" && scope !== "all"} onClick={() => setFocus(focus === s.key ? null : s.key)}>
                        <i className="pt-swatch" style={{ background: colorOf(s, i) }} aria-hidden="true" />
                        <span className="tr-legend-text">{nameOf(s, by)}</span>
                    </button>
                </li>;
            })}
        </ul>
        <div ref={ref} className="pt-chart">
            <svg width={f.w} height={f.h} role="img" aria-label={`Patent families per priority year, stacked by ${by}`}
                onPointerMove={(e) => pick(e.clientX, e.currentTarget)} onPointerLeave={() => setHover(null)}>
                <rect className="pt-lag" x={lagX} y={f.pad.t} width={Math.max(0, f.w - f.pad.r - lagX)} height={f.h - f.pad.t - f.pad.b} />
                <text className="pt-lag-text" x={Math.min(lagX + 4, f.w - f.pad.r - 4)} y={f.pad.t + 12} textAnchor={lagX > f.w - 90 ? "end" : "start"}>still publishing</text>
                <Axes f={f} />
                {bands.map((s, b) => <path key={s.key} d={path(b)} fill={colorOf(s, b)} className={`pt-band tr-series${lifted && lifted !== s.key ? " is-dim" : ""}`} />)}
                {hy !== undefined ? <line className="pt-cross" x1={f.x(hy)} x2={f.x(hy)} y1={f.pad.t} y2={f.h - f.pad.b} /> : null}
            </svg>
            {hover !== null && hy !== undefined ? <div className="pt-tip" style={{ left: `${Math.min(f.x(hy), f.w - 170)}px` }}>
                <b>{hy}{hy >= lag.getUTCFullYear() ? " (incomplete)" : ""}</b>
                <span className="pt-tip-total">{totals[hover]?.toLocaleString("en-US")} families</span>
                {[...bands].reverse().filter((s) => (s.values[hover] ?? 0) > 0).map((s) => <span key={s.key}>
                    <i className="pt-swatch" style={{ background: colorOf(s, bands.indexOf(s)) }} aria-hidden="true" />{nameOf(s, by)}<em>{s.values[hover]}</em>
                </span>)}
            </div> : null}
        </div>
        <div className="sr-only"><table>
            <caption>Families per priority year by {by}</caption>
            <thead><tr><th scope="col">Year</th>{bands.map((s) => <th key={s.key} scope="col">{nameOf(s, by)}</th>)}</tr></thead>
            <tbody>{PATENT_YEARS.map((y, i) => <tr key={y}><th scope="row">{y}</th>{bands.map((s) => <td key={s.key}>{s.values[i]}</td>)}</tr>)}</tbody>
        </table></div>
    </div>;
}
