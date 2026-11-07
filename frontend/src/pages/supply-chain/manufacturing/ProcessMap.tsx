import { select } from "d3-selection";
import "d3-transition";
import { type ZoomBehavior, zoom, zoomIdentity, zoomTransform } from "d3-zoom";
import { type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TIER_LABEL, concentrationTier } from "../../../../../src/supply-chain/concentration-tier";
import { countryFlag } from "../../../../../src/country-flag";
import { percent } from "../../../../../src/supply-chain/format";
import {
    type ProcessChain,
    type ProcessStep,
    neighbours,
    sharesOf,
} from "../../../../../src/supply-chain/processes";
import {
    type Box,
    type ChainLayout,
    type ClusterFrame,
    PRODUCT_ID,
    type ZoomTransform,
    chainLayout,
    STEP_DETAIL_OVER_FIT,
    STEP_DETAIL_SCALE,
    detailFor,
    busPath,
    edgePath,
    fitTransform,
} from "../../../../../src/supply-chain/processes/layout";
import { PRODUCT_ICON_PATHS, PROCESS_ICON_PATHS, STAGE_ICON_PATHS } from "../../../components/flows/process-icons";
import type { Stage } from "../../../../../src/supply-chain/stages";

// Stage pictogram drawn inside the map's SVG at (x, y), `size` px square.
function StageGlyph({ stage, x, y, size }: { stage: Stage; x: number; y: number; size: number }) {
    return <g className="mf-stage-icon" transform={`translate(${x},${y}) scale(${size / 24})`}>
        {STAGE_ICON_PATHS[stage].map((d) => <path key={d} d={d} />)}
    </g>;
}

// Monospace advance (0.6em) plus the title's letter-spacing, used to centre
// icon + title as one unit without measuring the DOM.
const BIG_TITLE_PX = 40;
const ADVANCE_EM = 0.6 + 0.06;
const BIG_ICON_GAP = 16;
const BIG_PAD = 24;

// Icon and title laid out as one centred row inside a cluster box of width
// `boxW`. Long titles shrink the font (and the icon with it) to stay inside.
function bigTitleLayout(text: string, boxW: number) {
    const ideal = text.length * BIG_TITLE_PX * ADVANCE_EM + BIG_TITLE_PX * 1.1 + BIG_ICON_GAP;
    const scale = Math.min(1, (boxW - 2 * BIG_PAD) / ideal);
    const font = BIG_TITLE_PX * scale;
    const icon = font * 1.1;
    const gap = BIG_ICON_GAP * scale;
    const left = boxW / 2 - (icon + gap + text.length * font * ADVANCE_EM) / 2;
    return { font, icon, iconX: left, textX: left + icon + gap };
}
import { useReducedMotion } from "../../../three";
import { Minimap } from "./Minimap";

type Behavior = ZoomBehavior<SVGSVGElement, unknown>;

// One axis of a pan over content spanning [lo, hi] in map space at scale k:
// content larger than the view stays flush with both edges (less the pads);
// smaller content keeps the requested offset, kept inside the view.
function clampAxis(offset: number, view: number, lo: number, hi: number, k: number, padLo: number, padHi: number): number {
    const min = view - padHi - hi * k;
    const max = padLo - lo * k;
    if (min <= max) return Math.min(max, Math.max(min, offset));
    return Math.min(min, Math.max(max, offset));
}

// Room the zoom buttons take on the map's left edge.
const HUD_W = 52;
const EDGE_PAD = 16;

const MIN_K = 0.18;
const MAX_K = 3;
const FOCUS_K = 1.25;
// Width the step card covers on the right of the map (desktop).
export const CARD_W = 400;

// Wheel zooms with Ctrl / Cmd held (or a trackpad pinch), so the page keeps
// scrolling past the map; drag pans; two fingers pinch.
function allowGesture(e: Event): boolean {
    if (e.type === "wheel") return (e as WheelEvent).ctrlKey || (e as WheelEvent).metaKey;
    if (e.type.startsWith("touch")) return (e as TouchEvent).touches.length > 1;
    return !(e as MouseEvent).button;
}

// Two lines from a label of at most four words.
function lines(label: string): string[] {
    const w = label.split(" ");
    if (w.length < 2 || label.length <= 15) return [label];
    const cut = Math.ceil(w.length / 2);
    return [w.slice(0, cut).join(" "), w.slice(cut).join(" ")];
}

function tierText(step: { shares?: ProcessStep["shares"] }): { text: string; tier: string } | null {
    const s = sharesOf(step.shares);
    const c = s ? concentrationTier(s.value) : null;
    if (!s || !c) return null;
    const est = s.confidence === "reported" ? "" : "~";
    return { text: `${TIER_LABEL[c.tier].toUpperCase()} ${countryFlag(c.top.country)} ${est}${percent(c.top.share)}`, tier: c.tier };
}

export interface ProcessMapProps {
    chain: ProcessChain;
    focusId: string | null;
    onFocus: (id: string | null) => void;
    height?: number;
}

// The zoomable process map. Zoomed out it shows the four stage clusters with
// their concentration; zoomed in, every step and the arrows between them;
// focusing a step zooms to it and the page opens its card.
export function ProcessMap({ chain, focusId, onFocus, height = 600 }: ProcessMapProps) {
    const layout: ChainLayout = useMemo(() => chainLayout(chain), [chain]);
    const wrapRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const behavior = useRef<Behavior | null>(null);
    const nodeRefs = useRef(new Map<string, SVGGElement>());
    const [width, setWidth] = useState(1100);
    const [t, setT] = useState<ZoomTransform>({ k: 0.5, x: 0, y: 0 });
    const [hover, setHover] = useState<string | null>(null);
    const reduced = useReducedMotion();
    const whole: Box = useMemo(() => ({ x: 0, y: 0, w: layout.width, h: layout.height }), [layout]);
    // The overview fits right of the zoom buttons.
    const fitK = fitTransform(width - HUD_W, height, whole, 16).k;
    const detail = detailFor(t.k, fitK);

    useEffect(() => {
        const el = wrapRef.current;
        if (!el || typeof ResizeObserver === "undefined") return;
        const ro = new ResizeObserver(([e]) => {
            if (e && e.contentRect.width > 0) setWidth(Math.round(e.contentRect.width));
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;
        const b = zoom<SVGSVGElement, unknown>()
            .scaleExtent([MIN_K, MAX_K])
            .filter(allowGesture)
            .on("zoom", (e: { transform: ZoomTransform }) => setT({ k: e.transform.k, x: e.transform.x, y: e.transform.y }));
        const sel = select(svg).call(b);
        behavior.current = b;
        return () => {
            sel.on(".zoom", null);
        };
    }, []);

    const apply = useCallback(
        (next: ZoomTransform, animate = true) => {
            const svg = svgRef.current;
            const b = behavior.current;
            if (!svg || !b) return;
            const tr = zoomIdentity.translate(next.x, next.y).scale(next.k);
            if (!animate || reduced) select(svg).call(b.transform, tr);
            else select(svg).transition().duration(500).call(b.transform, tr);
        },
        [reduced],
    );
    const fit = useCallback(
        (animate = true) => {
            const f = fitTransform(width - HUD_W, height, whole, 16);
            apply({ ...f, x: f.x + HUD_W }, animate);
        },
        [apply, width, height, whole],
    );
    const cardOpen = focusId !== null && width > 760;
    const viewW = cardOpen ? width - CARD_W : width;

    // Keep the map filling the view: centring a step near an edge of the
    // map would otherwise leave an empty band of canvas beside it.
    const bounds = useMemo(() => {
        const boxes = [...layout.nodes.values(), ...layout.clusters];
        return {
            x0: Math.min(...boxes.map((b) => b.x)),
            y0: Math.min(...boxes.map((b) => b.y)),
            x1: Math.max(...boxes.map((b) => b.x + b.w)),
            y1: Math.max(...boxes.map((b) => b.y + b.h)),
        };
    }, [layout]);
    const clampT = useCallback(
        (next: ZoomTransform): ZoomTransform => ({
            k: next.k,
            x: clampAxis(next.x, viewW, bounds.x0, bounds.x1, next.k, HUD_W, EDGE_PAD),
            y: clampAxis(next.y, height, bounds.y0, bounds.y1, next.k, EDGE_PAD, EDGE_PAD),
        }),
        [bounds, viewW, height],
    );
    // Zoom to the focused step, centred between the zoom buttons and the card.
    const zoomTo = useCallback(
        (id: string, animate = true) => {
            const box = layout.nodes.get(id);
            if (!box) return;
            const k = Math.max(FOCUS_K, zoomTransform(svgRef.current as SVGSVGElement).k);
            let x = (HUD_W + viewW) / 2 - (box.x + box.w / 2) * k;
            // A neighbour in the same row cut by the zoom buttons slides
            // fully into view, while the focused step still fits.
            const cut = [...layout.nodes.values()].find((n) => n.y === box.y && n.x < box.x
                && n.x * k + x < HUD_W && (n.x + n.w) * k + x > 0);
            if (cut) {
                const shift = HUD_W + EDGE_PAD / 2 - (cut.x * k + x);
                if ((box.x + box.w) * k + x + shift <= viewW - EDGE_PAD) x += shift;
            }
            apply(clampT({ k, x, y: height / 2 - (box.y + box.h / 2) * k }), animate);
        },
        [layout, apply, clampT, viewW, height],
    );

    const first = useRef(true);
    useEffect(() => {
        if (focusId) zoomTo(focusId, !first.current);
        else if (first.current) fit(false);
        first.current = false;
    }, [focusId, zoomTo, fit]);
    // Refit on resize while nothing is focused.
    useEffect(() => {
        if (!focusId) fit(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [width, chain]);

    const scaleBy = (f: number) => {
        const svg = svgRef.current;
        const b = behavior.current;
        if (svg && b) select(svg).transition().duration(reduced ? 0 : 250).call(b.scaleBy, f);
    };
    const centerOn = (x: number, y: number) => {
        const k = t.k;
        apply(clampT({ k, x: viewW / 2 - x * k, y: height / 2 - y * k }));
    };

    // Zoom from the stage overview into one stage's steps. From the
    // keyboard, focus moves to the stage's first step once steps show.
    const pendingFocus = useRef<string | null>(null);
    const openCluster = (c: ClusterFrame, fromKey = false) => {
        if (fromKey) pendingFocus.current = chain.steps.find((s) => s.cluster === c.id)?.id ?? null;
        // Fit the whole stage between the zoom buttons and the right edge,
        // never so far out that the map drops back to the stage overview.
        const fitC = Math.min((viewW - HUD_W - EDGE_PAD) / c.w, (height - 2 * EDGE_PAD) / c.h);
        const k = Math.max(Math.max(STEP_DETAIL_SCALE, fitK * STEP_DETAIL_OVER_FIT) * 1.02, Math.min(1, fitC));
        apply(clampT({ k, x: (HUD_W + viewW - EDGE_PAD) / 2 - (c.x + c.w / 2) * k, y: height / 2 - (c.y + c.h / 2) * k }));
    };

    const lit = useMemo(() => {
        const id = hover ?? focusId;
        if (!id) return null;
        const set = new Set([id]);
        for (const e of layout.edges) {
            if (e.from === id) set.add(e.to);
            if (e.to === id) set.add(e.from);
        }
        return set;
    }, [hover, focusId, layout]);

    const move = (id: string, dir: "next" | "prev") => {
        const n = id === PRODUCT_ID ? { prev: [layout.edges.find((e) => e.to === PRODUCT_ID)?.from ?? ""], next: [] } : neighbours(chain, id);
        const list = dir === "next" ? [...n.next, ...layout.edges.filter((e) => e.from === id && e.to === PRODUCT_ID).map(() => PRODUCT_ID)] : n.prev;
        const target = list.filter(Boolean)[0];
        if (!target) return;
        nodeRefs.current.get(target)?.focus();
        if (focusId) onFocus(target);
        else {
            const box = layout.nodes.get(target);
            if (box && t.k >= 0.6) centerOn(box.x + box.w / 2, box.y + box.h / 2);
        }
    };
    const onKey = (id: string) => (e: KeyboardEvent<SVGGElement>) => {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); move(id, "next"); }
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); move(id, "prev"); }
        else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onFocus(id); }
    };

    // Stages in sequence get an arrow from each to the next; side-by-side
    // sub-chains each get one into the product, along a shared trunk.
    const clusterEdges = useMemo(() => {
        const out: { key: string; d: string }[] = [];
        const product = layout.nodes.get(PRODUCT_ID) as Box;
        if (chain.parallel) {
            const right = Math.max(...layout.clusters.map((c) => c.x + c.w));
            const trunk = right + (product.x - right) / 2;
            layout.clusters.forEach((c, i) => out.push({ key: `c${i}`, d: busPath(c, product, trunk).d }));
            return out;
        }
        for (let i = 1; i < layout.clusters.length; i++) {
            const a = layout.clusters[i - 1] as Box;
            const b = layout.clusters[i] as Box;
            out.push({ key: `c${i}`, d: edgePath(a, b).d });
        }
        return out;
    }, [layout, chain.parallel]);
    const showSteps = detail === "steps";
    useEffect(() => {
        if (!showSteps || !pendingFocus.current) return;
        nodeRefs.current.get(pendingFocus.current)?.focus();
        pendingFocus.current = null;
    }, [showSteps]);

    const node = (id: string, label: string, icon: string[], box: Box, extra?: { animated?: boolean; branch?: string }) => {
        const dim = lit !== null && !lit.has(id);
        const ls = lines(label);
        return <g key={id} ref={(el) => { if (el) nodeRefs.current.set(id, el); else nodeRefs.current.delete(id); }}
            className={`mf-node${focusId === id ? " is-focus" : ""}${dim ? " is-dim" : ""}${extra?.branch ? ` is-${extra.branch}` : ""}`}
            transform={`translate(${box.x},${box.y})`} role="button" tabIndex={showSteps ? 0 : -1}
            aria-label={`${label}${extra?.animated ? ", 3D animation" : ""}`} aria-pressed={focusId === id}
            data-step={id}
            onClick={() => onFocus(id)} onKeyDown={onKey(id)}
            onMouseEnter={() => setHover(id)} onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(id)} onBlur={() => setHover(null)}>
            <rect width={box.w} height={box.h} rx="2" />
            <g transform="translate(12,12) scale(1.05)" className="mf-node-icon">
                {icon.map((d) => <path key={d} d={d} />)}
            </g>
            {extra?.animated ? <path className="mf-node-3d" d={`M${box.w - 20} 10l6 3.5v7l-6 3.5-6-3.5v-7zM${box.w - 20} 17l6-3.5M${box.w - 20} 17l-6-3.5M${box.w - 20} 17v7`} /> : null}
            <text className="mf-node-label" x="12" y={ls.length > 1 ? 52 : 60}>
                {ls.map((l, i) => <tspan key={l} x="12" dy={i === 0 ? 0 : 15}>{l}</tspan>)}
            </text>
        </g>;
    };

    return <div className={`mf-map${cardOpen ? " has-card" : ""}`} ref={wrapRef} data-detail={detail} style={{ height }}>
        <svg ref={svgRef} className="mf-svg" width={width} height={height} role="group" aria-label={`${chain.title}: process map`}>
            <defs>
                <marker id="mf-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M0 0L8 4L0 8z" />
                </marker>
            </defs>
            <g transform={`translate(${t.x},${t.y}) scale(${t.k})`}>
                {layout.clusters.map((c) => {
                    const cl = chain.clusters.find((x) => x.id === c.id);
                    const tier = cl ? tierText(cl) : null;
                    return <g key={c.id} className={`mf-cluster${tier ? ` is-${tier.tier}` : ""}`} transform={`translate(${c.x},${c.y})`}>
                        <rect width={c.w} height={c.h} />
                        {showSteps ? <>
                            {cl ? <StageGlyph stage={cl.stage} x={14} y={9} size={18} /> : null}
                            <text className="mf-cluster-label" x={cl ? 38 : 14} y="22">{cl?.label.toUpperCase()}</text>
                            {tier ? <text className="mf-cluster-tier" x={c.w - 14} y="22" textAnchor="end">{tier.text}</text> : null}
                        </> : <g className="mf-cluster-big" role="button" tabIndex={0}
                            aria-label={`${cl?.label ?? c.id}: zoom in to its ${chain.steps.filter((s) => s.cluster === c.id).length} steps`}
                            onClick={() => openCluster(c)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openCluster(c, true); }
                            }}>
                            <rect className="mf-cluster-hit" width={c.w} height={c.h} />
                            {cl ? (() => {
                                const title = cl.label.toUpperCase();
                                const t = bigTitleLayout(title, c.w);
                                const baseline = c.h / 2 - 10;
                                return <>
                                    <StageGlyph stage={cl.stage} x={t.iconX} y={baseline - t.font * 0.86} size={t.icon} />
                                    <text x={t.textX} y={baseline} textAnchor="start" style={{ fontSize: t.font }}>{title}</text>
                                </>;
                            })() : null}
                            {tier ? <text className="mf-cluster-tier-big" x={c.w / 2} y={c.h / 2 + 30} textAnchor="middle">{tier.text}</text> : null}
                            <text className="mf-cluster-count" x={c.w / 2} y={c.h / 2 + 66} textAnchor="middle">{chain.steps.filter((s) => s.cluster === c.id).length} steps</text>
                        </g>}
                    </g>;
                })}
                {!showSteps ? clusterEdges.map((e) => <path key={e.key} className="mf-cluster-edge" d={e.d} markerEnd="url(#mf-arrow)" />) : null}
                {!showSteps && chain.parallel ? node(PRODUCT_ID, chain.productLabel, PRODUCT_ICON_PATHS, layout.nodes.get(PRODUCT_ID) as Box, { animated: Boolean(chain.productScene) }) : null}
                {showSteps ? <>
                    <g className="mf-edges">
                        {layout.edges.map((e) => {
                            const on = lit?.has(e.from) && lit?.has(e.to) && (e.from === (hover ?? focusId) || e.to === (hover ?? focusId));
                            return <path key={`${e.from}->${e.to}`} className={`mf-edge is-${e.kind}${on ? " is-lit" : ""}${lit && !on ? " is-dim" : ""}`} d={e.d} markerEnd="url(#mf-arrow)" />;
                        })}
                    </g>
                    {chain.steps.map((s) => node(s.id, s.label, PROCESS_ICON_PATHS[s.icon], layout.nodes.get(s.id) as Box, { animated: Boolean(s.animation), branch: s.branch }))}
                    {node(PRODUCT_ID, chain.productLabel, PRODUCT_ICON_PATHS, layout.nodes.get(PRODUCT_ID) as Box, { animated: Boolean(chain.productScene) })}
                    <g className="mf-edge-labels" aria-hidden="true">
                        {layout.edges.filter((e) => e.label && lit && (e.from === (hover ?? focusId) || e.to === (hover ?? focusId))).map((e) =>
                            <text key={`${e.from}->${e.to}`} x={e.label?.x} y={e.label?.y} textAnchor="middle">{e.label?.text}</text>)}
                    </g>
                </> : null}
            </g>
        </svg>
        <div className="mf-controls">
            <button type="button" aria-label="Fit map" title="Fit map" onClick={() => { onFocus(null); fit(); }}>
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" /></svg>
            </button>
            <button type="button" aria-label="Zoom out" title="Zoom out" disabled={t.k <= MIN_K + 0.001} onClick={() => scaleBy(1 / 1.5)}>
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10" /></svg>
            </button>
            <button type="button" aria-label="Zoom in" title="Zoom in" disabled={t.k >= MAX_K - 0.001} onClick={() => scaleBy(1.5)}>
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M8 3v10" /></svg>
            </button>
        </div>
        {focusId ? null : <p className="mf-level" aria-live="polite">{showSteps ? "Steps" : chain.parallel ? "Parts" : "Stages"}</p>}
        <Minimap layout={layout} transform={t} viewW={viewW} viewH={height} onCenter={centerOn} focusId={focusId} />
    </div>;
}
