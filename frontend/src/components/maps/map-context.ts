import { createContext, useContext } from "react";

// What a map frame hands its overlays (Pins, Arcs, ClusterZoom). Base
// coordinates are projected viewBox units at zoom 1; screen coordinates are
// viewBox units after the current zoom, which is where overlays draw so that
// markers keep their size while the geography scales.

export type Point = [number, number];
export type Box = [Point, Point];

export interface ZoomState {
    k: number;
    x: number;
    y: number;
}

export interface MapContextValue {
    width: number;
    height: number;
    project: (lon: number, lat: number) => Point | null;
    zoom: ZoomState;
    zoomTo: (box: Box, maxK?: number) => void;
    reset: () => void;
    // Rendered CSS pixels per viewBox unit (markers are sized in pixels).
    scale: number;
    // Where overlays portal their SVG marks, their hidden tables and any
    // controls that sit under the map.
    svgLayer: SVGGElement | null;
    tableLayer: HTMLElement | null;
    belowLayer: HTMLElement | null;
}

export const MapContext = createContext<MapContextValue | null>(null);

export function useMap(): MapContextValue {
    const m = useContext(MapContext);
    if (!m) throw new Error("map overlays must sit inside <WorldMap> or <CountryMap>");
    return m;
}

export function toScreen(p: Point, z: ZoomState): Point {
    return [z.x + p[0] * z.k, z.y + p[1] * z.k];
}

export function inView(p: Point, width: number, height: number, margin = 0): boolean {
    return p[0] >= -margin && p[0] <= width + margin && p[1] >= -margin && p[1] <= height + margin;
}

// The zoom that fits `box` (base units) into the frame with padding, capped
// at `maxK` so a single-point box does not zoom to infinity.
export function zoomForBox(box: Box, width: number, height: number, maxK = 8, pad = 0.12): ZoomState {
    const [[x0, y0], [x1, y1]] = box;
    const bw = Math.max(x1 - x0, 1);
    const bh = Math.max(y1 - y0, 1);
    const k = Math.max(1, Math.min(maxK, (1 - 2 * pad) * Math.min(width / bw, height / bh)));
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    return { k, x: width / 2 - cx * k, y: height / 2 - cy * k };
}

// Percent position inside the stage for an HTML overlay element.
export function pct(p: Point, width: number, height: number): { left: string; top: string } {
    return { left: `${(p[0] / width) * 100}%`, top: `${(p[1] / height) * 100}%` };
}

export function reducedMotion(): boolean {
    return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}
