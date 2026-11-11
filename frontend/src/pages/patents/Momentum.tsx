import { useId, useMemo, useState } from "react";
import {
    type Applicants,
    COMPLETE_THROUGH,
    FIRST_YEAR,
    type LandscapeScope,
    MOMENTUM_EARLY,
    MOMENTUM_LATE,
    type MomentumRow,
    PATENT_YEARS,
    TECHNOLOGY_LIST,
    type TechnologyId,
    momentum,
    signedPct,
    yearSpan,
} from "../../../../src/patents";
import { Axes, frame, useWidth } from "../prices/chart";
import { spreadLabels } from "./label-layout";
import { techColor } from "./palette";

// Momentum: how interest in each technology moved over the years. Tiles are
// small multiples on their own scale (shape); Indexed puts every technology
// on one axis with its early-window yearly average at 100 (pace).

export type MomentumView = "tiles" | "index";

const span = (w: readonly [number, number]) => yearSpan(w, { short: true });
export const WINDOWS = `${span(MOMENTUM_EARLY)} → ${span(MOMENTUM_LATE)}`;

export const changeText = (c: number | null) => (c === null ? "new" : signedPct(c));
const tone = (c: number | null) => (c === null || c >= 0.05 ? "is-up" : c <= -0.05 ? "is-down" : "is-flat");

const lastComplete = PATENT_YEARS.indexOf(COMPLETE_THROUGH);

// Each technology indexed to its early-window yearly average = 100, complete
// years only (later years would read as a collapse).
export function indexed(row: MomentumRow): number[] {
    const base = row.early / (MOMENTUM_EARLY[1] - MOMENTUM_EARLY[0] + 1);
    return row.values.slice(0, lastComplete + 1).map((v) => (base ? (v / base) * 100 : 0));
}

function Tile({ row, on, onPick }: { row: MomentumRow; on: boolean; onPick: () => void }) {
    const w = 168;
    const h = 46;
    const max = Math.max(1, ...row.values);
    const x = (i: number) => (i / (PATENT_YEARS.length - 1)) * w;
    const y = (v: number) => h - 2 - (v / max) * (h - 4);
    const pts = (from: number, to: number) => row.values.slice(from, to + 1).map((v, j) => `${x(from + j)},${y(v)}`).join("L");
    const area = (from: number, to: number) => `M${x(from)},${h}L${pts(from, to)}L${x(to)},${h}Z`;
    const end = PATENT_YEARS.length - 1;
    const lateFrom = PATENT_YEARS.indexOf(MOMENTUM_LATE[0]);
    return <li>
        <button type="button" className={`pt-tile${on ? " is-on" : ""}`} aria-pressed={on} onClick={onPick} style={{ "--tc": techColor(row.id) } as React.CSSProperties}
            aria-label={`${row.label}: ${row.early} families ${span(MOMENTUM_EARLY)}, ${row.late} in ${span(MOMENTUM_LATE)}, ${changeText(row.change)}`}>
            <span className="pt-tile-head"><b>{row.label}</b><em className={tone(row.change)}>{changeText(row.change)}</em></span>
            <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
                <rect className="pt-tile-late" x={x(lateFrom)} y={0} width={x(lastComplete) - x(lateFrom)} height={h} />
                <path className="pt-tile-area" d={area(0, lastComplete)} />
                <path className="pt-tile-line" d={`M${pts(0, lastComplete)}`} />
                <path className="pt-tile-tbd" d={`M${pts(lastComplete, end)}`} />
            </svg>
            <span className="pt-tile-foot"><span>{row.early.toLocaleString("en-US")} → {row.late.toLocaleString("en-US")}</span><span>peak {Math.max(...row.values.slice(0, lastComplete + 1)).toLocaleString("en-US")}/yr</span></span>
        </button>
    </li>;
}

function IndexChart({ rows, scope, onPick }: { rows: MomentumRow[]; scope: LandscapeScope; onPick: (s: LandscapeScope) => void }) {
    const [ref, width] = useWidth(720);
    const [hover, setHover] = useState<string | null>(null);
    const series = useMemo(() => rows.map((r) => ({ row: r, v: indexed(r) })), [rows]);
    const years = PATENT_YEARS.slice(0, lastComplete + 1);
    const narrow = width < 480;
    const max = Math.max(150, ...series.flatMap((s) => s.v));
    const height = narrow ? 260 : 320;
    // Room on the right for direct labels.
    const labelRoom = narrow ? 32 : 176;
    const f = frame({ width: width - labelRoom, height, x0: years[0] ?? FIRST_YEAR, x1: COMPLETE_THROUGH, y0: 0, y1: max, log: false });
    const lit = hover ?? (scope === "all" ? null : scope);
    const line = (v: number[]) => `M${v.map((y, i) => `${f.x(years[i] ?? 0)},${f.y.at(y)}`).join("L")}`;
    const endX = f.x(COMPLETE_THROUGH);
    const labelYs = spreadLabels(series.map((s) => f.y.at(s.v.at(-1) ?? 0)), 13, f.pad.t + 4, f.h - f.pad.b);
    const clip = useId();
    const earlyX = [f.x(MOMENTUM_EARLY[0]), f.x(MOMENTUM_EARLY[1])];
    return <div ref={ref} className="pt-chart pt-index">
        <svg width={width} height={f.h} role="img" aria-label={`Patent families per priority year, each technology indexed to its ${span(MOMENTUM_EARLY)} average`}>
            <defs><clipPath id={clip}><rect x={0} y={0} width={endX + 2} height={f.h} /></clipPath></defs>
            <rect className="pt-index-base" x={earlyX[0]} y={f.pad.t} width={(earlyX[1] ?? 0) - (earlyX[0] ?? 0)} height={f.h - f.pad.t - f.pad.b} />
            <Axes f={f} />
            <line className="pt-index-100" x1={f.pad.l} x2={endX} y1={f.y.at(100)} y2={f.y.at(100)} />
            <text className="pt-cutoff-text pt-index-note" x={((earlyX[0] ?? 0) + (earlyX[1] ?? 0)) / 2} y={f.pad.t + 12} textAnchor="middle">{span(MOMENTUM_EARLY)} avg = 100</text>
            <g clipPath={`url(#${clip})`}>
                {series.map(({ row, v }) => <path key={row.id} d={line(v)}
                    stroke={techColor(row.id)} className={`pt-index-line${lit === row.id ? " is-on" : lit ? " is-dim" : ""}`} />)}
            </g>
            {series.map(({ row, v }, i) => {
                const show = !narrow || lit === row.id;
                return <g key={row.id} style={{ "--tc": techColor(row.id) } as React.CSSProperties} className={`pt-index-label${lit === row.id ? " is-on" : lit ? " is-dim" : ""}`}
                    tabIndex={0} role="button" aria-pressed={scope === row.id} aria-label={`${row.label}, ${Math.round(v.at(-1) ?? 0)} in ${COMPLETE_THROUGH}`}
                    onPointerEnter={() => setHover(row.id)} onPointerLeave={() => setHover(null)}
                    onFocus={() => setHover(row.id)} onBlur={() => setHover(null)}
                    onClick={() => onPick(scope === row.id ? "all" : row.id)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onPick(scope === row.id ? "all" : row.id);
                        }
                    }}>
                    <path d={line(v)} className="pt-index-hit" />
                    <circle cx={endX} cy={f.y.at(v.at(-1) ?? 0)} r={2.5} />
                    {show ? <text x={endX + 8} y={(labelYs[i] ?? 0) + 3}>{narrow ? Math.round(v.at(-1) ?? 0) : `${row.label} ${Math.round(v.at(-1) ?? 0)}`}</text> : null}
                </g>;
            })}
        </svg>
    </div>;
}

// Show or hide technologies, folded under an Advanced disclosure: a chip per
// technology in its colour, plus Show all / Hide all.
function Picker({ hidden, onHidden }: { hidden: readonly TechnologyId[]; onHidden: (h: TechnologyId[]) => void }) {
    const toggle = (id: TechnologyId) => onHidden(hidden.includes(id) ? hidden.filter((h) => h !== id) : [...hidden, id]);
    const shown = TECHNOLOGY_LIST.length - hidden.length;
    return <details className="pt-adv">
        <summary>Advanced: pick technologies <span>{shown} of {TECHNOLOGY_LIST.length} shown</span></summary>
        <div className="pt-pick" role="group" aria-label="Show technologies">
        {TECHNOLOGY_LIST.map((t) => {
            const on = !hidden.includes(t.id);
            return <button key={t.id} type="button" aria-pressed={on} onClick={() => toggle(t.id)} style={{ "--tc": techColor(t.id) } as React.CSSProperties}>
                <i aria-hidden="true" />{t.short}
            </button>;
        })}
        <button type="button" className="pt-pick-all" onClick={() => onHidden(hidden.length ? [] : TECHNOLOGY_LIST.map((t) => t.id))}>{hidden.length ? "Show all" : "Hide all"}</button>
        </div>
    </details>;
}

export function Momentum({ scope, view, applicants, hidden = [], onHidden = () => {}, onPick }: {
    scope: LandscapeScope;
    view: MomentumView;
    applicants: Applicants;
    hidden?: readonly TechnologyId[];
    onHidden?: (h: TechnologyId[]) => void;
    onPick: (s: LandscapeScope) => void;
}) {
    const all = useMemo(() => momentum(applicants), [applicants]);
    const rows = useMemo(() => all.filter((r) => !hidden.includes(r.id)), [all, hidden]);
    const total = (k: "early" | "late") => rows.reduce((s, r) => s + r[k], 0);
    const up = rows.filter((r) => r.change !== null && r.change >= 0.05).length;
    return <div className="pt-momentum">
        <Picker hidden={hidden} onHidden={onHidden} />
        {rows.length === 0
            ? <p className="pt-empty">Every technology is hidden. Pick one above.</p>
            : view === "tiles"
            ? <ul className="pt-tiles" aria-label="Technologies by change">
                {rows.map((r) => <Tile key={r.id} row={r} on={scope === r.id} onPick={() => onPick(scope === r.id ? "all" : r.id)} />)}
            </ul>
            : <IndexChart rows={rows} scope={scope} onPick={onPick} />}
        <p className="pt-filter-line" aria-live="polite">
            {WINDOWS}: {up} of {rows.length} technologies up 5% or more{applicants === "ex-cn" ? " outside China" : ""} · families counted per technology {total("early").toLocaleString("en-US")} → {total("late").toLocaleString("en-US")}
        </p>
        <div className="sr-only"><table>
            <caption>Families per technology, {span(MOMENTUM_EARLY)} and {span(MOMENTUM_LATE)}{applicants === "ex-cn" ? ", applicants outside China" : ""}</caption>
            <thead><tr><th scope="col">Technology</th><th scope="col">{span(MOMENTUM_EARLY)}</th><th scope="col">{span(MOMENTUM_LATE)}</th><th scope="col">Change</th></tr></thead>
            <tbody>{rows.map((r) => <tr key={r.id}><th scope="row">{r.label}</th><td>{r.early}</td><td>{r.late}</td><td>{changeText(r.change)}</td></tr>)}</tbody>
        </table></div>
    </div>;
}
