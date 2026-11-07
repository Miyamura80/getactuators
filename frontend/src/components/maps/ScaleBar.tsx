import { geoDistance, type GeoProjection } from "d3-geo";
import type { ZoomState } from "./map-context";

const EARTH_KM = 6371;
const STEPS = [1, 2, 5];

// Kilometres per CSS pixel at the centre of the current view, or null where
// the projection cannot invert (off the map).
export function kmPerPixel(projection: GeoProjection, width: number, height: number, zoom: ZoomState, scale: number): number | null {
    const invert = projection.invert;
    if (!invert) return null;
    const cx = (width / 2 - zoom.x) / zoom.k;
    const cy = (height / 2 - zoom.y) / zoom.k;
    const a = invert([cx - 5, cy]);
    const b = invert([cx + 5, cy]);
    if (!a || !b || a.some((n) => !Number.isFinite(n)) || b.some((n) => !Number.isFinite(n))) return null;
    const km = geoDistance(a, b) * EARTH_KM;
    return km > 0 ? km / (10 * zoom.k * scale) : null;
}

// The round distance (1, 2 or 5 x 10^n km) whose bar is closest to `target` px.
export function niceScale(kmPx: number, target = 72): { km: number; px: number } {
    const raw = kmPx * target;
    const p = 10 ** Math.floor(Math.log10(raw));
    const km = STEPS.map((s) => s * p).concat(10 * p).reduce((best, v) => (Math.abs(v - raw) < Math.abs(best - raw) ? v : best));
    return { km, px: km / kmPx };
}

// A bottom-left scale bar that follows the zoom.
export function ScaleBar({ projection, width, height, zoom, scale }: {
    projection: GeoProjection;
    width: number;
    height: number;
    zoom: ZoomState;
    scale: number;
}) {
    const kmPx = kmPerPixel(projection, width, height, zoom, scale);
    if (!kmPx) return null;
    const { km, px } = niceScale(kmPx);
    const text = `${km.toLocaleString("en-US")} km`;
    return <div className="mk-scale" role="img" aria-label={`Scale: bar is ${text}`}>
        <i style={{ width: `${Math.round(px)}px` }} />
        <span>{text}</span>
    </div>;
}
