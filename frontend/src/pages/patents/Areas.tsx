import { useState } from "react";
import {
    APPLICATION_AREAS,
    type ApplicationAreaId,
    LANDSCAPE,
    type LandscapeScope,
    PATENT_YEARS,
    TECHNOLOGIES,
    type TechnologyId,
    areaCells,
    areaShift,
    landscapeOf,
} from "../../../../src/patents";
import { useWidth } from "../prices/chart";

// Where it ends up: technology -> application area, by CPC
// co-classification. Flow draws ribbons (a ranked bar list on a phone);
// Grid shows each technology's share per area and which way it moved.

export type AreasView = "flow" | "grid";

// Links under this many families are not drawn.
export const MIN_RIBBON = 15;

const SPAN = `${PATENT_YEARS[0]}-${String(LANDSCAPE.completeThrough).slice(2)}`;
const W = LANDSCAPE.areaWindows;
const windowLabel = ([a, b]: [number, number]) => `${a}-${String(b).slice(2)}`;
const n = (v: number) => v.toLocaleString("en-US");
const cellPct = (v: number) => (v < 0.001 ? "·" : `${(v * 100).toFixed(v < 0.1 ? 1 : 0)}%`);

export interface Ribbon {
    tech: TechnologyId;
    area: ApplicationAreaId;
    families: number;
}

// Technology x area links (complete years) at or above MIN_RIBBON, and the
// families in the links left out.
export function ribbons(): { shown: Ribbon[]; hidden: number } {
    const all = TECHNOLOGIES.flatMap((t) =>
        APPLICATION_AREAS.map((a) => ({ tech: t.id as TechnologyId, area: a.id as ApplicationAreaId, families: landscapeOf(t.id).areas.counts[a.id][0] })),
    );
    const shown = all.filter((r) => r.families >= MIN_RIBBON);
    return { shown, hidden: all.filter((r) => r.families > 0 && r.families < MIN_RIBBON).reduce((s, r) => s + r.families, 0) };
}

// Label centres pushed apart to at least `gap`, kept inside [lo, hi].
function spread(ys: number[], gap: number, lo: number, hi: number): number[] {
    const out = [...ys];
    for (let i = 1; i < out.length; i++) out[i] = Math.max(out[i] ?? 0, (out[i - 1] ?? 0) + gap);
    const over = (out.at(-1) ?? 0) - hi;
    if (over > 0) for (let i = out.length - 1; i >= 0; i--) out[i] = Math.min(out[i] ?? 0, hi - (out.length - 1 - i) * gap);
    if ((out[0] ?? 0) < lo) for (let i = 0; i < out.length; i++) out[i] = Math.max(out[i] ?? 0, lo + i * gap);
    return out;
}

type Hl = { kind: "tech"; id: TechnologyId } | { kind: "area"; id: ApplicationAreaId } | null;

function Flow({ scope, width }: { scope: LandscapeScope; width: number }) {
    const [hl, setHl] = useState<Hl>(null);
    const { shown, hidden } = ribbons();
    const selected = scope === "all" ? null : scope;
    const H = 460;
    const top = 6;
    // Mono 11px: ~6.6px a glyph, plus the gap to the node bar.
    const lw = Math.max(...TECHNOLOGIES.map((t) => t.short.length)) * 6.6 + 22;
    const rw = 220;
    const xl = lw;
    const xr = width - rw;
    const techs = TECHNOLOGIES.map((t) => t.id as TechnologyId);
    const areaTotal = (a: ApplicationAreaId) => shown.filter((r) => r.area === a).reduce((s, r) => s + r.families, 0);
    const areas = APPLICATION_AREAS.map((a) => a.id as ApplicationAreaId).sort((a, b) => areaTotal(b) - areaTotal(a));
    const techTotal = (t: TechnologyId) => shown.filter((r) => r.tech === t).reduce((s, r) => s + r.families, 0);
    const total = shown.reduce((s, r) => s + r.families, 0);
    const gap = 6;
    const k = Math.min((H - 2 * top - gap * (techs.length - 1)) / total, (H - 2 * top - gap * (areas.length - 1)) / total);
    const leftY = new Map<string, number>();
    let yy = top;
    for (const t of techs) {
        leftY.set(t, yy);
        yy += techTotal(t) * k + gap;
    }
    const rightGap = (H - 2 * top - total * k) / Math.max(1, areas.length - 1);
    const rightY = new Map<string, number>();
    yy = top;
    for (const a of areas) {
        rightY.set(a, yy);
        yy += areaTotal(a) * k + rightGap;
    }
    // Ribbons leave each technology in area order and enter each area in
    // technology order, so they cross as little as the order allows.
    const offL = new Map(leftY);
    const offR = new Map(rightY);
    const ordered = [...shown].sort((a, b) => techs.indexOf(a.tech) - techs.indexOf(b.tech) || areas.indexOf(a.area) - areas.indexOf(b.area));
    const paths = new Map<Ribbon, { y0: number; y1: number; h: number }>();
    for (const r of ordered) {
        const h = r.families * k;
        paths.set(r, { y0: offL.get(r.tech) ?? 0, y1: 0, h });
        offL.set(r.tech, (offL.get(r.tech) ?? 0) + h);
    }
    for (const r of [...shown].sort((a, b) => areas.indexOf(a.area) - areas.indexOf(b.area) || techs.indexOf(a.tech) - techs.indexOf(b.tech))) {
        const p = paths.get(r);
        if (!p) continue;
        p.y1 = offR.get(r.area) ?? 0;
        offR.set(r.area, p.y1 + p.h);
    }
    const mid = (xl + xr) / 2;
    const ribbonPath = ({ y0, y1, h }: { y0: number; y1: number; h: number }) =>
        `M${xl},${y0}C${mid},${y0} ${mid},${y1} ${xr},${y1}L${xr},${y1 + h}C${mid},${y1 + h} ${mid},${y0 + h} ${xl},${y0 + h}Z`;
    const lit = (r: Ribbon) =>
        selected ? r.tech === selected : hl ? (hl.kind === "tech" ? r.tech === hl.id : r.area === hl.id) : null;
    const leftLabels = spread(techs.map((t) => (leftY.get(t) ?? 0) + (techTotal(t) * k) / 2), 13, top + 5, H - top - 5);
    const rightLabels = spread(areas.map((a) => (rightY.get(a) ?? 0) + (areaTotal(a) * k) / 2), 13, top + 5, H - top - 5);
    // Right-hand labels: distinct families in the area (the scope's, or all).
    const selCount = (a: ApplicationAreaId) => landscapeOf(selected ?? "all").areas.counts[a][0];
    const nodeProps = (h: Exclude<Hl, null>, label: string) => ({
        tabIndex: 0,
        role: "button" as const,
        "aria-label": label,
        onPointerEnter: () => setHl(h),
        onPointerLeave: () => setHl(null),
        onFocus: () => setHl(h),
        onBlur: () => setHl(null),
    });
    const techLabel = (t: TechnologyId) => TECHNOLOGIES.find((x) => x.id === t)?.short ?? t;
    const areaLabel = (a: ApplicationAreaId) => APPLICATION_AREAS.find((x) => x.id === a)?.label ?? a;
    const dimTech = (t: TechnologyId) => (selected ? t !== selected : hl?.kind === "tech" ? hl.id !== t : false);
    const dimArea = (a: ApplicationAreaId) =>
        selected ? landscapeOf(selected).areas.counts[a][0] < MIN_RIBBON : hl?.kind === "area" ? hl.id !== a : hl?.kind === "tech" ? !shown.some((r) => r.tech === hl.id && r.area === a) : false;
    return <>
        <svg className="pt-flow" width={width} height={H} role="img" aria-label="Families per technology and application area">
            <g>{ordered.map((r) => {
                const p = paths.get(r);
                const on = lit(r);
                return p ? <path key={`${r.tech}-${r.area}`} d={ribbonPath(p)} className={`pt-ribbon${on === true ? " is-on" : on === false ? " is-off" : ""}`} /> : null;
            })}</g>
            {techs.map((t, i) => {
                const y0 = leftY.get(t) ?? 0;
                const h = Math.max(1, techTotal(t) * k);
                return <g key={t} className={`pt-node${dimTech(t) ? " is-dim" : ""}`} {...nodeProps({ kind: "tech", id: t }, `${techLabel(t)}: ${n(techTotal(t))} family-area links`)}>
                    <rect x={xl - 8} y={y0} width={8} height={h} className={selected === t ? "pt-node-on" : "pt-node-bar"} />
                    <rect x={0} y={Math.min(y0, (leftLabels[i] ?? 0) - 7)} width={xl} height={Math.max(h, 14)} fill="transparent" />
                    <text x={xl - 14} y={(leftLabels[i] ?? 0) + 4} textAnchor="end">{techLabel(t)}</text>
                </g>;
            })}
            {areas.map((a, i) => {
                const y0 = rightY.get(a) ?? 0;
                const h = Math.max(1, areaTotal(a) * k);
                return <g key={a} className={`pt-node${dimArea(a) ? " is-dim" : ""}`} {...nodeProps({ kind: "area", id: a }, `${areaLabel(a)}: ${n(selCount(a))} families`)}>
                    <rect x={xr} y={y0} width={8} height={h} className="pt-node-bar" />
                    <rect x={xr} y={Math.min(y0, (rightLabels[i] ?? 0) - 7)} width={rw} height={Math.max(h, 14)} fill="transparent" />
                    <text x={xr + 14} y={(rightLabels[i] ?? 0) + 4}>{areaLabel(a)}<tspan className="pt-node-n" dx={8}>{n(selCount(a))}</tspan></text>
                </g>;
            })}
        </svg>
        <p className="pt-note">Links under {MIN_RIBBON} families not drawn ({n(hidden)} families). {selected ? "" : "Hover or focus a technology or area to trace it."}</p>
    </>;
}

// Phone fallback for the flow: the scope's areas ranked by families.
function AreaBars({ scope }: { scope: LandscapeScope }) {
    const cells = areaCells(scope).sort((a, b) => b.families - a.families);
    const max = Math.max(0.0001, ...cells.map((c) => c.share));
    return <ol className="pt-area-bars">
        {cells.map((c) => <li key={c.area}>
            <span className="pt-area-name">{c.label}</span>
            <span className="pt-area-bar" aria-hidden="true"><i style={{ width: `${(c.share / max) * 100}%` }} /></span>
            <span className="pt-area-n">{n(c.families)} · {cellPct(c.share)}</span>
        </li>)}
    </ol>;
}

function Grid({ scope }: { scope: LandscapeScope }) {
    const rows = TECHNOLOGIES.map((t) => ({ id: t.id as TechnologyId, label: t.short, cells: areaCells(t.id) }));
    const max = Math.max(0.0001, ...rows.flatMap((r) => r.cells.map((c) => c.share)));
    return <div className="pt-grid-wrap" tabIndex={0} role="region" aria-label="Application share by technology">
        <table className="pt-grid">
            <caption className="sr-only">Share of each technology's families ({SPAN}) in each application area, with the change from {windowLabel(W.early)} to {windowLabel(W.late)}</caption>
            <thead><tr><th scope="col"><span className="sr-only">Technology</span></th>{APPLICATION_AREAS.map((a) => <th key={a.id} scope="col">{a.label}</th>)}</tr></thead>
            <tbody>{rows.map((r) => <tr key={r.id} className={scope === r.id ? "is-on" : scope !== "all" ? "is-dim" : undefined}>
                <th scope="row">{r.label}</th>
                {r.cells.map((c) => {
                    const t = Math.sqrt(c.share / max);
                    const shift = areaShift(c);
                    return <td key={c.area} style={{ background: `color-mix(in oklab, var(--cyan) ${Math.round(4 + t * 62)}%, transparent)` }}
                        className={t > 0.62 ? "is-dark" : undefined}
                        title={`${r.label} in ${c.label}: ${cellPct(c.share)} (${windowLabel(W.early)} ${cellPct(c.early)}, ${windowLabel(W.late)} ${cellPct(c.late)})`}>
                        {cellPct(c.share)}
                        {shift ? <><span className="pt-shift" aria-hidden="true">{shift === "up" ? "▲" : "▼"}</span><span className="sr-only">{shift === "up" ? " rising" : " falling"}</span></> : null}
                    </td>;
                })}
            </tr>)}</tbody>
        </table>
    </div>;
}

export function Areas({ scope, view }: { scope: LandscapeScope; view: AreasView }) {
    const [ref, width] = useWidth(720);
    const narrow = width < 560;
    const cells = areaCells(scope);
    return <div className="pt-areas">
        <div ref={ref} className="pt-chart">
            {view === "grid" ? <Grid scope={scope} /> : narrow ? <AreaBars scope={scope} /> : <Flow scope={scope} width={width} />}
        </div>
        <p className="pt-note">
            {view === "grid" ? `Cell: share of the technology's families in the area, ${SPAN}. ▲▼ moved 1+ point from ${windowLabel(W.early)} to ${windowLabel(W.late)}. ` : `Families ${SPAN}; a family can sit in several areas. `}
            CPC co-classification, a proxy for use until citation data is added.
        </p>
        <div className="sr-only"><table>
            <caption>Families per application area, {scope === "all" ? "all technologies" : scope}, {SPAN}</caption>
            <thead><tr><th scope="col">Area</th><th scope="col">Families</th><th scope="col">Share</th><th scope="col">{windowLabel(W.early)}</th><th scope="col">{windowLabel(W.late)}</th></tr></thead>
            <tbody>{cells.map((c) => <tr key={c.area}><th scope="row">{c.label}</th><td>{c.families}</td><td>{cellPct(c.share)}</td><td>{cellPct(c.early)}</td><td>{cellPct(c.late)}</td></tr>)}</tbody>
        </table></div>
    </div>;
}
