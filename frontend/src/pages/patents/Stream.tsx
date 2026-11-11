import { useId, useMemo, useState } from "react";
import { countryName } from "../../../../src/country-flag";
import {
    LANDSCAPE,
    type LandscapeScope,
    PATENT_YEARS,
    STREAM_FILTERS,
    type Series,
    type StreamFilter,
    filterSummary,
    seriesByCountry,
    seriesByTechnology,
} from "../../../../src/patents";
import { Axes, frame, useWidth } from "../prices/chart";

// Filings stream: families per priority year as a stacked area, stacked by
// applicant country (the selected scope) or by technology (every
// technology, the selected one lifted). The publication-lag window is shaded.

export type StackBy = "country" | "technology";
// Last fully published priority year. Years after it are drawn greyed out
// behind a cutoff line: their filings are still publishing.
export const COMPLETE_THROUGH = LANDSCAPE.completeThrough;

// The site's data palette, reordered so neighbouring bands stay apart under
// colour-vision deficiency (validated: adjacent CVD delta E >= 15).
export const BAND_COLORS = ["#4dabf7", "#51cf66", "#9775fa", "#ff6b9a", "#ffb547", "#66d9e8", "#ff922b"];
export const OTHER_COLOR = "#5c6366";
const OTHER = OTHER_COLOR;
const MAX_BANDS = BAND_COLORS.length;

// Technologies take colours by overall size, fixed for every view, so a
// band keeps its colour whichever technology is selected.
const TECH_ORDER = seriesByTechnology()
    .map((s) => ({ key: s.key, total: s.values.reduce((a, b) => a + b, 0) }))
    .sort((a, b) => b.total - a.total)
    .map((s) => s.key);

function techBands(filter: StreamFilter): Series[] {
    const all = seriesByTechnology(filter);
    const head = TECH_ORDER.slice(0, MAX_BANDS - 1).map((k) => all.find((s) => s.key === k) as Series);
    const rest = all.filter((s) => !head.includes(s));
    if (rest.length === 0) return head;
    const other = PATENT_YEARS.map((_, i) => rest.reduce((sum, s) => sum + (s.values[i] ?? 0), 0));
    return [...head, { key: "other", label: `Other (${rest.length})`, values: other }];
}

export function bandsFor(scope: LandscapeScope, by: StackBy, filter: StreamFilter = "all"): Series[] {
    return by === "technology" ? techBands(filter) : seriesByCountry(scope, MAX_BANDS - 1, filter);
}

export const colorOf = (s: { key: string }, i: number) => (s.key === "other" ? OTHER : (BAND_COLORS[i] ?? OTHER));

// The colour a country takes in the scope's stream (grey outside its bands),
// so the scatter and the stream agree.
export function countryColor(scope: LandscapeScope, country: string): string {
    const i = seriesByCountry(scope, MAX_BANDS - 1).findIndex((s) => s.key === country);
    return i < 0 ? OTHER : (BAND_COLORS[i] ?? OTHER);
}

const n = (v: number) => v.toLocaleString("en-US");
const share = (v: number) => `${Math.round(v * 100)}%`;

// "8,814 of 26,167 families 2010-24 (34%) · China 11%"
export function filterLine(scope: LandscapeScope, filter: StreamFilter): string {
    const s = filterSummary(scope, filter);
    const span = `${PATENT_YEARS[0]}-${String(COMPLETE_THROUGH).slice(2)}`;
    const head = filter === "all" ? `${n(s.of)} families ${span}` : `${n(s.families)} of ${n(s.of)} families ${span} (${share(s.share)})`;
    return `${head} · China ${share(s.china)}`;
}
const nameOf = (s: Series, by: StackBy) => (by === "country" && s.key !== "other" ? countryName(s.key) : s.label);

export function Stream({ scope, by, filter = "all" }: { scope: LandscapeScope; by: StackBy; filter?: StreamFilter }) {
    const [ref, width] = useWidth(720);
    const [hover, setHover] = useState<number | null>(null);
    const [focus, setFocus] = useState<string | null>(null);
    const bands = useMemo(() => bandsFor(scope, by, filter), [scope, by, filter]);
    const years = PATENT_YEARS;
    const lifted = by === "technology" && scope !== "all" ? scope : focus;
    const totals = years.map((_, i) => bands.reduce((s, b) => s + (b.values[i] ?? 0), 0));
    // The y axis stays at the unfiltered maximum, so a filter shows as shrinkage.
    const max = useMemo(() => {
        const all = bandsFor(scope, by);
        return Math.max(1, ...years.map((_, i) => all.reduce((s, b) => s + (b.values[i] ?? 0), 0)));
    }, [scope, by, years]);
    const label = STREAM_FILTERS.find((x) => x.id === filter)?.long ?? "all families";
    const height = width < 480 ? 220 : 280;
    const x0 = years[0] ?? 2010;
    const x1 = years.at(-1) ?? COMPLETE_THROUGH;
    const f = frame({ width, height, x0, x1, y0: 0, y1: max, log: false });
    // Cumulative tops per band, bottom band first.
    const stacks = bands.map((_, b) => years.map((__, i) => bands.slice(0, b + 1).reduce((s, x) => s + (x.values[i] ?? 0), 0)));
    const path = (b: number) => {
        const top = years.map((y, i) => `${f.x(y)},${f.y.at(stacks[b]?.[i] ?? 0)}`);
        const bottom = years.map((y, i) => `${f.x(y)},${f.y.at(b === 0 ? 0 : (stacks[b - 1]?.[i] ?? 0))}`).reverse();
        return `M${top.join("L")}L${bottom.join("L")}Z`;
    };
    // Cutoff at the last complete year: bands left of it in colour, right of
    // it greyed out.
    const showLag = x1 > COMPLETE_THROUGH;
    const lagX = f.x(COMPLETE_THROUGH);
    const top = f.pad.t;
    const bottom = f.h - f.pad.b;
    const clipId = useId();
    const pick = (clientX: number, el: SVGSVGElement) => {
        const px = clientX - el.getBoundingClientRect().left;
        let best = 0;
        for (const [i, y] of years.entries()) if (Math.abs(f.x(y) - px) < Math.abs(f.x(years[best] ?? 0) - px)) best = i;
        setHover(best);
    };
    const hy = hover === null ? undefined : years[hover];
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
            <svg width={f.w} height={f.h} role="img" aria-label={`Patent families per priority year, ${label}, stacked by ${by}`}
                onPointerMove={(e) => pick(e.clientX, e.currentTarget)} onPointerLeave={() => setHover(null)}>
                <defs>
                    <clipPath id={`${clipId}-done`}><rect x={0} y={0} width={lagX} height={f.h} /></clipPath>
                    <clipPath id={`${clipId}-tbd`}><rect x={lagX} y={0} width={Math.max(0, f.w - lagX)} height={f.h} /></clipPath>
                </defs>
                <Axes f={f} />
                <g clipPath={showLag ? `url(#${clipId}-done)` : undefined}>
                    {bands.map((s, b) => <path key={s.key} d={path(b)} fill={colorOf(s, b)} className={`pt-band tr-series${lifted && lifted !== s.key ? " is-dim" : ""}`} />)}
                </g>
                {showLag ? <>
                    <g clipPath={`url(#${clipId}-tbd)`} className="pt-tbd">
                        {bands.map((s, b) => <path key={s.key} d={path(b)} className="pt-band pt-band-tbd" />)}
                    </g>
                    <line className="pt-cutoff" x1={lagX} x2={lagX} y1={top} y2={bottom} />
                    <text className="pt-cutoff-text" x={lagX - 6} y={top + 12} textAnchor="end">complete through {COMPLETE_THROUGH}</text>
                    <text className="pt-cutoff-text pt-cutoff-tbd" x={lagX + 6} y={top + 12}>TBD</text>
                </> : null}
                {hy !== undefined ? <line className="pt-cross" x1={f.x(hy)} x2={f.x(hy)} y1={f.pad.t} y2={f.h - f.pad.b} /> : null}
            </svg>
            {hover !== null && hy !== undefined ? <div className="pt-tip" style={{ left: `${Math.min(f.x(hy), f.w - 170)}px` }}>
                <b>{hy}{hy > COMPLETE_THROUGH ? " (still publishing)" : ""}</b>
                <span className="pt-tip-total">{totals[hover]?.toLocaleString("en-US")} families</span>
                {[...bands].reverse().filter((s) => (s.values[hover] ?? 0) > 0).map((s) => <span key={s.key}>
                    <i className="pt-swatch" style={{ background: colorOf(s, bands.indexOf(s)) }} aria-hidden="true" />{nameOf(s, by)}<em>{s.values[hover]}</em>
                </span>)}
            </div> : null}
        </div>
        <p className="pt-filter-line" aria-live="polite">{filterLine(scope, filter)}</p>
        <div className="sr-only"><table>
            <caption>Families per priority year by {by}, {label}</caption>
            <thead><tr><th scope="col">Year</th>{bands.map((s) => <th key={s.key} scope="col">{nameOf(s, by)}</th>)}</tr></thead>
            <tbody>{years.map((y, i) => <tr key={y}><th scope="row">{y}</th>{bands.map((s) => <td key={s.key}>{s.values[i]}</td>)}</tr>)}</tbody>
        </table></div>
    </div>;
}
