import { hierarchy, treemap, treemapSquarify } from "d3-hierarchy";
import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import { ALT_TECHS, MARKET_SLICES, type MarketSlice, getAltTech, getSlice } from "../../../../../src/supply-chain/alts";
import {
    GROUPINGS,
    GROUPING_LABEL,
    type Grouping,
    type TreemapGroup,
    groupSlices,
} from "../../../../../src/supply-chain/alts/treemap";
import { formatSourced } from "../../../../../src/supply-chain/format";
import { SourcedValue } from "../../../components/supply-chain/SourcedValue";

// Market tiles: area = published market size, colour = forecast growth on a
// diverging scale (amber below the median, cyan above). Regrouping moves the
// same tiles, so they glide to their new places.

const CAGRS = MARKET_SLICES.map((s) => s.cagr.value).sort((a, b) => a - b);
const LOW = CAGRS[0] ?? 0;
const HIGH = CAGRS[CAGRS.length - 1] ?? 1;
const MID = CAGRS[Math.floor(CAGRS.length / 2)] ?? (LOW + HIGH) / 2;

type Rgb = [number, number, number];
const NEUTRAL: Rgb = [40, 46, 48];
const SLOW: Rgb = [255, 179, 107];
const FAST: Rgb = [125, 230, 226];

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
];

// -1 (slowest) .. 0 (median) .. 1 (fastest).
export function growthPosition(cagr: number): number {
    if (cagr >= MID) return HIGH > MID ? Math.min(1, (cagr - MID) / (HIGH - MID)) : 0;
    return MID > LOW ? -Math.min(1, (MID - cagr) / (MID - LOW)) : 0;
}

export function growthColor(cagr: number): { fill: string; ink: string } {
    const t = growthPosition(cagr);
    const c = t >= 0 ? mix(NEUTRAL, FAST, t) : mix(NEUTRAL, SLOW, -t);
    const lum = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    return { fill: `rgb(${c.join(",")})`, ink: lum > 140 ? "#000" : "#f9f9f9" };
}

export function useWidth(): [RefObject<HTMLDivElement | null>, number] {
    const ref = useRef<HTMLDivElement>(null);
    const [w, setW] = useState(960);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const check = () => setW(el.clientWidth || 960);
        check();
        if (typeof ResizeObserver !== "function") return;
        const ro = new ResizeObserver(check);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    return [ref, w];
}

interface Tile {
    key: string;
    slice: MarketSlice;
    group: TreemapGroup;
    share: number;
    x: number;
    y: number;
    w: number;
    h: number;
}

interface Frame {
    id: string;
    label: string;
    x: number;
    y: number;
    w: number;
    h: number;
}

const HEAD = 20;

function layout(groups: TreemapGroup[], width: number, height: number): { tiles: Tile[]; frames: Frame[] } {
    type Node = { id: string; value?: number; group?: TreemapGroup; slice?: MarketSlice; share?: number; children?: Node[] };
    const seen = new Map<string, number>();
    const root: Node = {
        id: "root",
        children: groups.map((g) => ({
            id: g.id,
            group: g,
            children: g.leaves.map((l) => {
                const n = seen.get(l.sliceId) ?? 0;
                seen.set(l.sliceId, n + 1);
                return { id: `${l.sliceId}#${n}`, value: l.value, group: g, slice: getSlice(l.sliceId), share: l.share };
            }),
        })),
    };
    const h = hierarchy<Node>(root, (d) => d.children)
        .sum((d) => d.value ?? 0)
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    const laid = treemap<Node>().tile(treemapSquarify).size([width, height]).paddingOuter(2).paddingTop((n) => (n.depth === 1 ? HEAD : 2)).paddingInner(2).round(true)(h);
    const frames: Frame[] = (laid.children ?? []).map((c) => ({
        id: c.data.id,
        label: c.data.group?.label ?? c.data.id,
        x: c.x0,
        y: c.y0,
        w: c.x1 - c.x0,
        h: c.y1 - c.y0,
    }));
    const tiles: Tile[] = laid.leaves().flatMap((l) =>
        l.data.slice && l.data.group
            ? [{ key: l.data.id, slice: l.data.slice, group: l.data.group, share: l.data.share ?? 1, x: l.x0, y: l.y0, w: l.x1 - l.x0, h: l.y1 - l.y0 }]
            : [],
    );
    return { tiles, frames };
}

const pct = (n: number, of: number) => `${(n / of) * 100}%`;

const UNSIZED = ALT_TECHS.filter((t) => !MARKET_SLICES.some((s) => s.techIds.includes(t.id)));

export function Treemap({ group, onGroup, tech, onTech }: {
    group: Grouping;
    onGroup: (g: Grouping) => void;
    tech: string | null;
    onTech: (id: string) => void;
}) {
    const [ref, width] = useWidth();
    const height = width < 600 ? 460 : 440;
    const groups = useMemo(() => groupSlices(MARKET_SLICES, group, ALT_TECHS), [group]);
    const { tiles, frames } = useMemo(() => layout(groups, width, height), [groups, width, height]);
    const split = group === "company-type" || group === "country";
    return <div className="al-tm">
        <div className="al-controls">
            <span className="al-label" id="al-group-label">Group by</span>
            <div className="al-seg" role="radiogroup" aria-labelledby="al-group-label">
                {GROUPINGS.map((g) => <button key={g} type="button" role="radio" aria-checked={g === group} onClick={() => onGroup(g)}>{GROUPING_LABEL[g]}</button>)}
            </div>
            <GrowthLegend />
        </div>
        <div ref={ref} className="al-tm-stage" style={{ height }} data-group={group}>
            {frames.map((f) => <div key={`f-${f.id}`} className="al-tm-frame" style={{ left: pct(f.x, width), top: pct(f.y, height), width: pct(f.w, width), height: pct(f.h, height) }}>
                <span>{f.label}</span>
            </div>)}
            {tiles.map((t) => {
                const c = growthColor(t.slice.cagr.value);
                const on = tech !== null && t.slice.techIds.includes(tech);
                const big = t.w > 92 && t.h > 46;
                const modeled = split && t.share < 1;
                const size = formatSourced({ ...t.slice.revenueUsd, value: t.slice.revenueUsd.value * t.share });
                const first = t.slice.techIds[0] ?? "";
                return <button
                    key={t.key}
                    type="button"
                    className={`al-tile${on ? " is-on" : ""}${modeled ? " is-modeled" : ""}`}
                    style={{ left: pct(t.x, width), top: pct(t.y, height), width: pct(t.w, width), height: pct(t.h, height), background: c.fill, color: c.ink }}
                    aria-pressed={on}
                    aria-label={`${t.slice.label}: about ${size}${modeled ? " (our even split)" : ""}, growing about ${formatSourced(t.slice.cagr)} a year. ${t.group.label}.`}
                    onClick={() => onTech(first)}
                >
                    {big ? <>
                        <b>{t.slice.label}</b>
                        <span>~{size}{modeled ? <i> split</i> : null}</span>
                        <span>{formatSourced(t.slice.cagr)}/yr</span>
                    </> : t.w > 34 && t.h > 18 ? <b className="is-small">{t.slice.label.split(" ")[0]}</b> : null}
                </button>;
            })}
        </div>
        {split ? <p className="al-note">Dashed tiles are split evenly across the {group === "country" ? "home countries" : "types"} of the companies listed for each technology: our model, not a measured share.</p> : null}
        <p className="al-note">No published market size: {UNSIZED.map((t, i) => <span key={t.id}>{i > 0 ? ", " : ""}<button type="button" className="al-link" onClick={() => onTech(t.id)}>{t.short}</button></span>)}.</p>
        <details className="al-more">
            <summary>Market sizes and sources</summary>
            <table className="al-table">
                <thead><tr><th>Market</th><th>Size</th><th>Growth a year</th><th>Technologies</th></tr></thead>
                <tbody>
                    {[...MARKET_SLICES].sort((a, b) => b.revenueUsd.value - a.revenueUsd.value).map((s) => <tr key={s.id}>
                        <th scope="row">{s.label}</th>
                        <td><SourcedValue value={s.revenueUsd} /></td>
                        <td><SourcedValue value={s.cagr} /></td>
                        <td>{s.techIds.map((id) => getAltTech(id)?.short ?? id).join(", ")}</td>
                    </tr>)}
                </tbody>
            </table>
        </details>
    </div>;
}

function GrowthLegend() {
    const stops = [LOW, MID, HIGH];
    return <div className="al-legend" aria-label={`Colour is forecast growth a year, from ${formatPct(LOW)} (amber) through ${formatPct(MID)} (grey) to ${formatPct(HIGH)} (cyan)`}>
        <span className="al-label">Growth</span>
        <span className="al-ramp" aria-hidden="true" style={{ background: `linear-gradient(90deg, ${growthColor(LOW).fill}, ${growthColor(MID).fill}, ${growthColor(HIGH).fill})` }} />
        <span className="al-ramp-ticks" aria-hidden="true">{stops.map((s) => <span key={s}>{formatPct(s)}</span>)}</span>
    </div>;
}

const formatPct = (v: number) => `${Number((v * 100).toFixed(1))}%`;
