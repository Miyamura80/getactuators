import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { select } from "d3-selection";
import "d3-transition";
import { type ZoomBehavior, zoom, zoomIdentity, zoomTransform } from "d3-zoom";
import { type Box, MapContext, type MapContextValue, type ZoomState, reducedMotion, zoomForBox } from "./map-context";
import type { MapView } from "./projection";
import "./maps.css";

const IDENTITY: ZoomState = { k: 1, x: 0, y: 0 };
const MAX_K = 16;

type Behavior = ZoomBehavior<SVGSVGElement, unknown>;

// Wheel zooms with Ctrl / Cmd held (a trackpad pinch sends that too), so the
// page still scrolls past the map. One-finger touch scrolls the page until
// the map is zoomed in; two fingers pinch.
function allowGesture(svg: SVGSVGElement) {
    return (e: Event): boolean => {
        if (e.type === "wheel") return (e as WheelEvent).ctrlKey || (e as WheelEvent).metaKey;
        if (e.type.startsWith("touch")) return (e as TouchEvent).touches.length > 1 || zoomTransform(svg).k > 1;
        return !(e as MouseEvent).button;
    };
}

function useZoom(width: number, height: number) {
    const svgRef = useRef<SVGSVGElement>(null);
    const behavior = useRef<Behavior | null>(null);
    const [state, setState] = useState<ZoomState>(IDENTITY);
    const [hint, setHint] = useState(false);
    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;
        const b = zoom<SVGSVGElement, unknown>()
            .scaleExtent([1, MAX_K])
            .extent([[0, 0], [width, height]])
            .translateExtent([[0, 0], [width, height]])
            .filter(allowGesture(svg))
            .on("zoom", (e: { transform: ZoomState }) => setState({ k: e.transform.k, x: e.transform.x, y: e.transform.y }));
        const sel = select(svg).call(b);
        behavior.current = b;
        let timer = 0;
        const onWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) return;
            setHint(true);
            window.clearTimeout(timer);
            timer = window.setTimeout(() => setHint(false), 1200);
        };
        svg.addEventListener("wheel", onWheel, { passive: true });
        return () => {
            sel.on(".zoom", null);
            svg.removeEventListener("wheel", onWheel);
            window.clearTimeout(timer);
        };
    }, [width, height]);
    const apply = useCallback((s: ZoomState) => {
        const svg = svgRef.current;
        const b = behavior.current;
        if (!svg || !b) return;
        const t = zoomIdentity.translate(s.x, s.y).scale(s.k);
        if (reducedMotion()) select(svg).call(b.transform, t);
        else select(svg).transition().duration(550).call(b.transform, t);
    }, []);
    const scaleBy = useCallback((f: number) => {
        const svg = svgRef.current;
        const b = behavior.current;
        if (svg && b) select(svg).transition().duration(reducedMotion() ? 0 : 250).call(b.scaleBy, f);
    }, []);
    return { svgRef, state, apply, scaleBy, hint };
}

export interface MapFrameProps {
    view: MapView;
    // Accessible name of the map.
    label: string;
    // Geography, drawn in base coordinates inside the zoom group.
    base: ReactNode;
    // Overlays (Pins, Arcs, ClusterZoom) and any HTML on top of the map.
    children?: ReactNode;
    // Top-left slot, e.g. a stage toggle.
    toggle?: ReactNode;
    // Top-right instrument readout for the hovered or focused feature.
    readout?: ReactNode;
    legend?: ReactNode;
    // Visually hidden table equivalent of the base layer.
    table?: ReactNode;
    className?: string;
}

// The frame every map shares: SVG stage, d3-zoom (wheel, pinch, drag, double
// click, +/- and fit buttons), overlay layers and the hidden tables.
export function MapFrame({ view, label, base, children, toggle, readout, legend, table, className }: MapFrameProps) {
    const { width, height, projection } = view;
    const { svgRef, state, apply, scaleBy, hint } = useZoom(width, height);
    const [svgLayer, setSvgLayer] = useState<SVGGElement | null>(null);
    const [tableLayer, setTableLayer] = useState<HTMLDivElement | null>(null);
    const [belowLayer, setBelowLayer] = useState<HTMLDivElement | null>(null);
    const [stageWidth, setStageWidth] = useState(width);
    const stageRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = stageRef.current;
        if (!el || typeof ResizeObserver === "undefined") return;
        const ro = new ResizeObserver(([e]) => { if (e && e.contentRect.width > 0) setStageWidth(e.contentRect.width); });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    const ctx = useMemo<MapContextValue>(() => ({
        width,
        height,
        project: (lon, lat) => projection([lon, lat]) ?? null,
        zoom: state,
        zoomTo: (box: Box, maxK?: number) => apply(zoomForBox(box, width, height, maxK)),
        reset: () => apply(IDENTITY),
        scale: stageWidth / width,
        svgLayer,
        tableLayer,
        belowLayer,
    }), [width, height, projection, state, apply, stageWidth, svgLayer, tableLayer, belowLayer]);
    const zoomed = state.k > 1.01;
    return <figure className={`mk-map${className ? ` ${className}` : ""}`}>
        <MapContext.Provider value={ctx}>
            {toggle ? <div className="mk-slot">{toggle}</div> : null}
            <div ref={stageRef} className={`mk-stage${zoomed ? " is-zoomed" : ""}`} style={{ aspectRatio: `${width} / ${height}` }}>
                <svg ref={svgRef} className="mk-svg" viewBox={`0 0 ${width} ${height}`} role="group" aria-label={label}>
                    <g className="mk-base" transform={`translate(${state.x},${state.y}) scale(${state.k})`}>{base}</g>
                    <g className="mk-overlay" ref={setSvgLayer} />
                </svg>
                <div className="mk-html">{children}</div>
                {readout ? <div className="mk-readout" aria-live="polite">{readout}</div> : null}
                <div className="mk-controls">
                    <button type="button" aria-label="Zoom in" title="Zoom in" onClick={() => scaleBy(1.6)}>
                        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" /></svg>
                    </button>
                    <button type="button" aria-label="Zoom out" title="Zoom out" disabled={!zoomed} onClick={() => scaleBy(1 / 1.6)}>
                        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10" /></svg>
                    </button>
                    <button type="button" aria-label="Fit map" title="Fit map" disabled={!zoomed} onClick={ctx.reset}>
                        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" /></svg>
                    </button>
                </div>
                <p className={`mk-hint${hint ? " is-on" : ""}`} aria-hidden="true">Ctrl + scroll to zoom</p>
            </div>
            <div className="mk-below" ref={setBelowLayer} />
            {legend}
            <div className="mk-sr" ref={setTableLayer}>{table}</div>
        </MapContext.Provider>
    </figure>;
}
