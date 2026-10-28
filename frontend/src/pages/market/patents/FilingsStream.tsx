import { countryName } from "../../../../../src/country-flag";
import {
    type LandscapeSnapshot,
    type StreamSeries,
    firstIncompleteYear,
    streamByCountry,
    streamByTechnology,
    years,
} from "../../../../../src/patents/landscape";
import { TECHNOLOGIES, getTechnology } from "../../../../../src/patents/technologies";
import { COUNTRY_COLOR, COUNTRY_FALLBACK, OTHER_COLOR } from "../../../components/supply-chain/country-colors";
import type { Stack } from "./url-state";

// 02. Families per priority year as a stacked area, by applicant country
// for the picked technology or by technology across all of them. Years
// still filling in (publication lag) are shaded.

const W = 720;
const H = 240;
const PAD = { l: 44, r: 8, t: 8, b: 22 };
const TECH_COLORS = ["#4dabf7", "#f783ac", "#ff922b", "#9775fa", "#ffd43b", "#38d9a9", "#a9e34b", "#e599f7", "#66d9e8"];

function color(stack: Stack, key: string): string {
    if (stack === "technology") {
        const i = TECHNOLOGIES.findIndex((t) => t.id === key);
        return TECH_COLORS[i % TECH_COLORS.length] ?? COUNTRY_FALLBACK;
    }
    if (key === "other") return OTHER_COLOR;
    return COUNTRY_COLOR[key as keyof typeof COUNTRY_COLOR] ?? COUNTRY_FALLBACK;
}

function label(stack: Stack, key: string): string {
    if (stack === "technology") return getTechnology(key)?.short ?? key;
    return key === "other" ? "Other" : countryName(key);
}

function niceMax(v: number): number {
    if (v <= 0) return 1;
    const p = 10 ** Math.floor(Math.log10(v));
    return Math.ceil(v / p) * p;
}

export function FilingsStream({ tech, stack, snapshot, onStack }: {
    tech: string;
    stack: Stack;
    snapshot: LandscapeSnapshot;
    onStack: (s: Stack) => void;
}) {
    const ys = years(snapshot);
    const series: StreamSeries[] = stack === "technology" ? streamByTechnology(snapshot) : streamByCountry([tech], snapshot);
    const totals = ys.map((_, i) => series.reduce((s, x) => s + (x.values[i] ?? 0), 0));
    const max = niceMax(Math.max(0, ...totals));
    const x = (i: number) => PAD.l + (ys.length <= 1 ? 0 : (i / (ys.length - 1)) * (W - PAD.l - PAD.r));
    const y = (v: number) => H - PAD.b - (v / max) * (H - PAD.t - PAD.b);
    const base = ys.map(() => 0);
    const areas = series.map((s) => {
        const lower = [...base];
        const upper = lower.map((v, i) => v + (s.values[i] ?? 0));
        upper.forEach((v, i) => { base[i] = v; });
        const top = upper.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
        const bottom = lower.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).reverse();
        return { key: s.key, d: `M${top.join("L")}L${bottom.join("L")}Z` };
    });
    const lag = firstIncompleteYear(snapshot);
    const lagIndex = lag === null ? -1 : ys.indexOf(lag);
    const summary = `${stack === "technology" ? "All technologies" : getTechnology(tech)?.label}: ${totals.reduce((a, b) => a + b, 0).toLocaleString("en-US")} families, ${ys[0]} to ${ys.at(-1)}`;
    return <div className="pt-stream">
        <div className="pt-controls">
            <span className="pt-seg" role="group" aria-label="Stack by">
                {(["country", "technology"] as const).map((s) => <button key={s} type="button" aria-pressed={s === stack}
                    className={s === stack ? "is-on" : undefined} onClick={() => onStack(s)}>
                    {s === "country" ? "By country" : "By technology"}
                </button>)}
            </span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary} className="pt-stream-svg">
            {[0, 0.5, 1].map((f) => <g key={f}>
                <line x1={PAD.l} x2={W - PAD.r} y1={y(max * f)} y2={y(max * f)} className="pt-grid" />
                <text x={PAD.l - 6} y={y(max * f) + 4} textAnchor="end" className="pt-axis">{(max * f).toLocaleString("en-US")}</text>
            </g>)}
            {areas.map((a) => <path key={a.key} d={a.d} fill={color(stack, a.key)} data-key={a.key} className="pt-area" />)}
            {lagIndex >= 0 ? <g className="pt-lag" data-from={lag ?? undefined}>
                <rect x={x(Math.max(0, lagIndex - 0.5))} y={PAD.t} width={W - PAD.r - x(Math.max(0, lagIndex - 0.5))} height={H - PAD.t - PAD.b} />
                <text x={W - PAD.r - 4} y={PAD.t + 12} textAnchor="end">incomplete</text>
            </g> : null}
            {ys.map((yr, i) => i % 2 === 0 || i === ys.length - 1
                ? <text key={yr} x={x(i)} y={H - 6} textAnchor="middle" className="pt-axis">{yr}</text>
                : null)}
        </svg>
        <ul className="pt-legend">
            {series.map((s) => <li key={s.key} data-key={s.key}><i style={{ background: color(stack, s.key) }} />{label(stack, s.key)}</li>)}
        </ul>
        {stack === "technology" ? <p className="pt-note">A family in two technologies counts in each.</p> : null}
    </div>;
}
