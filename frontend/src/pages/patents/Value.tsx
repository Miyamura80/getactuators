import { useState } from "react";
import { countryName } from "../../../../src/country-flag";
import {
    COMPLETE_THROUGH,
    FIRST_YEAR,
    type LandscapeScope,
    type ValueRow,
    intlShares,
    pctText,
    valueRows,
} from "../../../../src/patents";
import { useWidth } from "../prices/chart";
import { LABEL_H, type Rect, placeLabels } from "./label-layout";
import { BAND_COLORS, OTHER_COLOR, countryColor } from "./palette";

// Value vs volume: the scope's TOP_VALUE largest first assignees (complete years).
// x = families (log), y = share filed in 2+ offices, bubble area = granted
// families, colour = HQ country in the stream's colours.

const pct = (v: number) => pctText(v, 0);
const SPAN = `${FIRST_YEAR} to ${COMPLETE_THROUGH}`;
const LABEL_MAX = 22;
// Mono 11px glyphs are ~6.6px wide.
const CHAR_W = 6.6;
const short = (name: string, max = LABEL_MAX) =>
    name.length > max ? `${name.slice(0, max - 1)}…` : name;

function logTicks(lo: number, hi: number): number[] {
    const out: number[] = [];
    for (let e = Math.floor(Math.log10(lo)); e <= Math.ceil(Math.log10(hi)); e++)
        for (const m of [1, 2, 5]) {
            const v = m * 10 ** e;
            if (v >= lo && v <= hi) out.push(v);
        }
    return out;
}

export function Value({ scope }: { scope: LandscapeScope }) {
    const [ref, width] = useWidth(720);
    const [active, setActive] = useState<string | null>(null);
    const rows = valueRows(scope);
    const shares = intlShares(scope);
    const narrow = width < 560;
    const height = narrow ? 340 : 420;
    const pad = { l: 40, r: narrow ? 10 : 16, t: 12, b: 28 };
    const ns = rows.map((r) => r.families);
    const lo = Math.max(1, Math.min(...ns) * 0.85);
    const hi = Math.max(...ns) * 1.15;
    const x = (v: number) =>
        pad.l +
        ((Math.log10(v) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo) || 1)) *
            (width - pad.l - pad.r);
    const y = (v: number) => pad.t + (1 - v) * (height - pad.t - pad.b);
    const gmax = Math.max(1, ...rows.map((r) => r.granted));
    const rMax = narrow ? 11 : 17;
    const radius = (r: ValueRow) => 3 + Math.sqrt(r.granted / gmax) * rMax;
    const dots = rows.map((r) => ({
        row: r,
        x: x(r.families),
        y: y(r.families ? r.intl / r.families : 0),
        r: radius(r),
        color: countryColor(scope, r.country),
    }));
    // Big bubbles behind small ones.
    const drawn = [...dots].sort((a, b) => b.r - a.r);
    const labelled = dots.slice(0, narrow ? 6 : 12);
    const labelMax = narrow ? 16 : LABEL_MAX;
    const ABOVE = "protects abroad ↑";
    const BELOW = "home market only ↓";
    const halfW = (t: string) => t.length * CHAR_W;
    const reserved: Rect[] = [
        {
            x: width - pad.r - halfW(ABOVE),
            y: y(0.5) - 4 - LABEL_H,
            w: halfW(ABOVE),
            h: LABEL_H,
        },
        { x: width - pad.r - halfW(BELOW), y: y(0.5) + 4, w: halfW(BELOW), h: LABEL_H },
    ];
    const labels = placeLabels(
        labelled.map((d) => ({
            cx: d.x,
            cy: d.y,
            r: d.r,
            w: short(d.row.name, labelMax).length * CHAR_W,
        })),
        dots,
        {
            x: pad.l + 2,
            y: pad.t,
            w: width - pad.l - pad.r - 2,
            h: height - pad.t - pad.b,
        },
        reserved,
    );
    // Legend: one entry per colour, the scope's bands first, "Other" last.
    const rank = (c: string) => (c === OTHER_COLOR ? 99 : BAND_COLORS.indexOf(c));
    const legend = [
        ...new Map(dots.map((d) => [d.color, d.row.country])).entries(),
    ].sort((a, b) => rank(a[0]) - rank(b[0]));
    const hit = dots.find((d) => d.row.key === active);
    // Beside the bubble, on whichever side has room, never over it.
    const TIP_W = 190;
    const tipLeft = !hit
        ? 0
        : hit.x + hit.r + 8 + TIP_W <= width
          ? hit.x + hit.r + 8
          : Math.max(0, hit.x - hit.r - 8 - TIP_W);
    const tipTop = hit ? Math.max(0, hit.y - 70) : 0;
    return (
        <div className="pt-value">
            <div className="pt-headline">
                <div>
                    <b>{pct(shares.rest)}</b>
                    <span>of non-Chinese families filed in 2+ offices</span>
                </div>
                <div>
                    <b>{pct(shares.cn)}</b>
                    <span>of Chinese families filed in 2+ offices</span>
                </div>
            </div>
            <div ref={ref} className="pt-chart pt-scatter">
                <svg
                    width={width}
                    height={height}
                    role="img"
                    aria-label={`Top ${rows.length} assignees: families against share filed in 2+ offices, ${SPAN}`}
                    onPointerLeave={() => setActive(null)}
                >
                    {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                        <g key={t}>
                            <line
                                className="tr-grid"
                                x1={pad.l}
                                x2={width - pad.r}
                                y1={y(t)}
                                y2={y(t)}
                            />
                            <text
                                className="tr-axis"
                                x={pad.l - 6}
                                y={y(t) + 3}
                                textAnchor="end"
                            >
                                {pct(t)}
                            </text>
                        </g>
                    ))}
                    {logTicks(lo, hi)
                        .filter(
                            (t, i, a) =>
                                x(t) < width - pad.r - 72 &&
                                (!narrow || a.length < 5 || i % 2 === 0),
                        )
                        .map((t) => (
                            <text
                                key={t}
                                className="tr-axis"
                                x={x(t)}
                                y={height - 8}
                                textAnchor="middle"
                            >
                                {t}
                            </text>
                        ))}
                    <text
                        className="tr-axis"
                        x={width - pad.r}
                        y={height - 8}
                        textAnchor="end"
                    >
                        families →
                    </text>
                    <line
                        className="pt-half"
                        x1={pad.l}
                        x2={width - pad.r}
                        y1={y(0.5)}
                        y2={y(0.5)}
                    />
                    <text
                        className="pt-half-text"
                        x={width - pad.r}
                        y={y(0.5) - 7}
                        textAnchor="end"
                    >
                        {ABOVE}
                    </text>
                    <text
                        className="pt-half-text"
                        x={width - pad.r}
                        y={y(0.5) + 4 + LABEL_H - 3}
                        textAnchor="end"
                    >
                        {BELOW}
                    </text>
                    {drawn.map((d) => (
                        <circle
                            key={d.row.key}
                            className={`pt-dot${active && active !== d.row.key ? " is-dim" : ""}`}
                            cx={d.x}
                            cy={d.y}
                            r={d.r}
                            fill={d.color}
                            stroke={d.color}
                            tabIndex={0}
                            role="button"
                            aria-label={`${d.row.name}: ${d.row.families} families, ${pct(d.row.intl / d.row.families)} in 2+ offices, ${d.row.granted} granted`}
                            onPointerEnter={() => setActive(d.row.key)}
                            onFocus={() => setActive(d.row.key)}
                            onBlur={() => setActive(null)}
                            onClick={() =>
                                setActive(active === d.row.key ? null : d.row.key)
                            }
                        />
                    ))}
                    {labels.map((l, i) => {
                        const d = labelled[i];
                        if (!d) return null;
                        // Leader from the bubble's rim to the label's nearest edge.
                        const ex = Math.max(l.x, Math.min(l.cx, l.x + l.w));
                        const ey = Math.max(l.y, Math.min(l.cy, l.y + l.h));
                        const len = Math.hypot(ex - l.cx, ey - l.cy) || 1;
                        const sx = l.cx + ((ex - l.cx) / len) * d.r;
                        const sy = l.cy + ((ey - l.cy) / len) * d.r;
                        return (
                            <g key={d.row.key} className="pt-label" aria-hidden="true">
                                {l.leader && len - d.r > 3 ? (
                                    <line x1={sx} y1={sy} x2={ex} y2={ey} />
                                ) : null}
                                <text x={l.x} y={l.y + LABEL_H - 3}>
                                    {short(d.row.name, labelMax)}
                                </text>
                            </g>
                        );
                    })}
                </svg>
                {hit ? (
                    <div
                        className="pt-tip pt-dot-tip"
                        style={{ left: `${tipLeft}px`, top: `${tipTop}px` }}
                    >
                        <b>{hit.row.name}</b>
                        <span>{hit.row.families} families</span>
                        <span>
                            {pct(hit.row.intl / hit.row.families)} filed in 2+ offices
                        </span>
                        <span>{hit.row.granted} granted</span>
                    </div>
                ) : null}
            </div>
            <ul className="tr-legend pt-dot-legend" aria-label="HQ country">
                {legend.map(([color, c]) => (
                    <li key={color}>
                        <i
                            className="pt-swatch"
                            style={{ background: color }}
                            aria-hidden="true"
                        />
                        {color === OTHER_COLOR ? "Other" : countryName(c)}
                    </li>
                ))}
            </ul>
            <p className="pt-note">
                Top {rows.length} first assignees, priority {SPAN}. Bubble area: granted
                families.
            </p>
            <div className="sr-only">
                <table>
                    <caption>
                        Top {rows.length} assignees by families, {SPAN}
                    </caption>
                    <thead>
                        <tr>
                            <th scope="col">Assignee</th>
                            <th scope="col">Country</th>
                            <th scope="col">Families</th>
                            <th scope="col">Filed in 2+ offices</th>
                            <th scope="col">Granted</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r) => (
                            <tr key={r.key}>
                                <th scope="row">{r.name}</th>
                                <td>{r.country}</td>
                                <td>{r.families}</td>
                                <td>{pct(r.intl / r.families)}</td>
                                <td>{r.granted}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
