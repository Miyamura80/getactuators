import { useState } from "react";
import { countryName } from "../../../../src/country-flag";
import {
    LANDSCAPE,
    type LandscapeScope,
    PATENT_YEARS,
    type ValueRow,
    intlShares,
    valueRows,
} from "../../../../src/patents";
import { useWidth } from "../prices/chart";
import { BAND_COLORS, OTHER_COLOR, countryColor } from "./Stream";

// Value vs volume: the scope's 40 largest first assignees (complete years).
// x = families (log), y = share filed in 2+ offices, bubble area = granted
// families, colour = HQ country in the stream's colours.

const pct = (v: number) => `${Math.round(v * 100)}%`;
const SPAN = `${PATENT_YEARS[0]} to ${LANDSCAPE.completeThrough}`;
const LABEL_MAX = 22;
// Mono 11px glyphs are ~6.6px wide.
const CHAR_W = 6.6;
const LABEL_H = 13;

export interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface Placed extends Rect {
    // Anchor (bubble centre) and whether the label needs a leader line.
    cx: number;
    cy: number;
    leader: boolean;
}

const overlaps = (a: Rect, b: Rect, gap = 2) =>
    a.x < b.x + b.w + gap &&
    b.x < a.x + a.w + gap &&
    a.y < b.y + b.h + gap &&
    b.y < a.y + a.h + gap;

const hitsCircle = (r: Rect, c: { x: number; y: number; r: number }) => {
    const nx = Math.max(r.x, Math.min(c.x, r.x + r.w));
    const ny = Math.max(r.y, Math.min(c.y, r.y + r.h));
    return (nx - c.x) ** 2 + (ny - c.y) ** 2 < c.r ** 2;
};

// Greedy label placement that never drops a label and never lets two
// overlap: each label tries rings of positions around its bubble, scored by
// distance plus bubbles covered, and falls back to a scan of the whole plot.
export function placeLabels(
    items: { cx: number; cy: number; r: number; w: number }[],
    bubbles: { x: number; y: number; r: number }[],
    box: Rect,
    reserved: readonly Rect[] = [],
): Placed[] {
    const placed: Placed[] = [];
    const inBox = (r: Rect) =>
        r.x >= box.x &&
        r.y >= box.y &&
        r.x + r.w <= box.x + box.w &&
        r.y + r.h <= box.y + box.h;
    for (const it of items) {
        const free = (r: Rect) =>
            inBox(r) &&
            !placed.some((p) => overlaps(p, r)) &&
            !reserved.some((p) => overlaps(p, r));
        // A leader that crosses a placed label reads as pointing at it.
        const crosses = (r: Rect) => {
            const tx = r.x + r.w / 2;
            const ty = r.y + r.h / 2;
            return placed.some((p) =>
                Array.from({ length: 12 }, (_, k) => k / 12).some((t) => {
                    const px = it.cx + (tx - it.cx) * t;
                    const py = it.cy + (ty - it.cy) * t;
                    return px > p.x && px < p.x + p.w && py > p.y && py < p.y + p.h;
                }),
            );
        };
        // ...and a label sitting on an earlier leader hides it.
        const onLeader = (r: Rect) =>
            placed.some(
                (p) =>
                    p.leader &&
                    Array.from({ length: 12 }, (_, k) => k / 12).some((t) => {
                        const px = p.cx + (p.x + p.w / 2 - p.cx) * t;
                        const py = p.cy + (p.y + p.h / 2 - p.cy) * t;
                        return px > r.x && px < r.x + r.w && py > r.y && py < r.y + r.h;
                    }),
            );
        const cost = (r: Rect, d: number) =>
            d +
            40 * bubbles.filter((b) => hitsCircle(r, b)).length +
            (crosses(r) || onLeader(r) ? 200 : 0);
        let best: { r: Rect; c: number; d: number } | null = null;
        for (const ring of [2, 8, 16, 28, 44, 64, 90]) {
            const gap = it.r + ring;
            const cands: Rect[] = [
                { x: it.cx + gap, y: it.cy - LABEL_H / 2, w: it.w, h: LABEL_H },
                { x: it.cx - gap - it.w, y: it.cy - LABEL_H / 2, w: it.w, h: LABEL_H },
                { x: it.cx - it.w / 2, y: it.cy - gap - LABEL_H, w: it.w, h: LABEL_H },
                { x: it.cx - it.w / 2, y: it.cy + gap, w: it.w, h: LABEL_H },
                {
                    x: it.cx + gap * 0.7,
                    y: it.cy - gap * 0.7 - LABEL_H,
                    w: it.w,
                    h: LABEL_H,
                },
                { x: it.cx + gap * 0.7, y: it.cy + gap * 0.7, w: it.w, h: LABEL_H },
                {
                    x: it.cx - gap * 0.7 - it.w,
                    y: it.cy - gap * 0.7 - LABEL_H,
                    w: it.w,
                    h: LABEL_H,
                },
                {
                    x: it.cx - gap * 0.7 - it.w,
                    y: it.cy + gap * 0.7,
                    w: it.w,
                    h: LABEL_H,
                },
            ];
            for (const cand of cands) {
                // Nudge a candidate that pokes out of the plot back inside.
                const r = {
                    ...cand,
                    x: Math.min(Math.max(cand.x, box.x), box.x + box.w - cand.w),
                    y: Math.min(Math.max(cand.y, box.y), box.y + box.h - cand.h),
                };
                if (!free(r)) continue;
                const c = cost(r, ring);
                if (!best || c < best.c) best = { r, c, d: ring };
            }
        }
        if (!best || best.c >= 200) {
            // Scan the plot for the nearest free slot.
            for (let y = box.y; y + LABEL_H <= box.y + box.h; y += 4)
                for (let x = box.x; x + it.w <= box.x + box.w; x += 6) {
                    const r = { x, y, w: it.w, h: LABEL_H };
                    if (!free(r)) continue;
                    const d = Math.hypot(x + it.w / 2 - it.cx, y + LABEL_H / 2 - it.cy);
                    const c = cost(r, d);
                    if (!best || c < best.c) best = { r, c, d };
                }
        }
        // A plot too small for every label: stack below the last one.
        const r = best?.r ?? {
            x: box.x,
            y: Math.max(box.y, ...placed.map((p) => p.y + p.h + 2)),
            w: it.w,
            h: LABEL_H,
        };
        placed.push({ ...r, cx: it.cx, cy: it.cy, leader: (best?.d ?? 99) > 2 });
    }
    return placed;
}

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
