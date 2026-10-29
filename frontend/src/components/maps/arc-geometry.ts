import { geoInterpolate } from "d3-geo";
import type { LonLat } from "../../../../src/supply-chain/map";
import { type Point, inView } from "./map-context";

// Pure geometry behind <Arcs>: a great circle sampled, projected, and cut to
// what is on screen. An arc whose far end is off the map stops at the edge,
// where <Arcs> puts a country chip.

export function sampleGreatCircle(a: LonLat, b: LonLat, n = 48): [number, number][] {
    const at = geoInterpolate([a.lon, a.lat], [b.lon, b.lat]);
    return Array.from({ length: n + 1 }, (_, i) => at(i / n));
}

// Where segment a -> b (a inside, b outside) crosses the frame.
export function edgePoint(a: Point, b: Point | null, width: number, height: number): Point {
    if (!b) return a;
    const [ax, ay] = a;
    const dx = b[0] - ax;
    const dy = b[1] - ay;
    let t = 1;
    if (dx > 0) t = Math.min(t, (width - ax) / dx);
    if (dx < 0) t = Math.min(t, -ax / dx);
    if (dy > 0) t = Math.min(t, (height - ay) / dy);
    if (dy < 0) t = Math.min(t, -ay / dy);
    t = Math.max(0, t);
    return [ax + dx * t, ay + dy * t];
}

export interface ClippedArc {
    // Visible polylines (screen units); more than one when the arc wraps.
    runs: Point[][];
    fromVisible: boolean;
    toVisible: boolean;
    // Where the arc leaves the frame towards a hidden end.
    exit?: { end: "from" | "to"; at: Point };
}

// Cut a projected polyline into visible runs. A null point (outside the
// projection's domain), a point off screen or a jump wider than a third of
// the frame (the antimeridian seam) ends a run; only runs that touch an end
// of the arc are kept.
export function clipArc(points: readonly (Point | null)[], width: number, height: number): ClippedArc {
    const vis = points.map((p) => p !== null && inView(p, width, height));
    const runs: { from: number; pts: Point[] }[] = [];
    let run: Point[] = [];
    let start = 0;
    const close = (end: number) => {
        // Keep only runs that reach an end of the arc: a stretch floating in
        // the middle is the curve crossing an inset or the far side of a
        // seam, not a link anyone drew.
        if (run.length > 1 && (start === 0 || end === points.length - 1)) runs.push({ from: start, pts: run });
        run = [];
    };
    points.forEach((p, i) => {
        const prev = run.at(-1);
        const jump = prev && p ? Math.abs(p[0] - prev[0]) > width / 3 : false;
        if (!vis[i] || jump) close(i - 1);
        if (vis[i] && p) {
            if (!run.length) start = i;
            run.push(p);
        }
    });
    close(points.length - 1);
    const fromVisible = vis[0] ?? false;
    const toVisible = vis.at(-1) ?? false;
    const out: ClippedArc = { runs: runs.map((r) => r.pts), fromVisible, toVisible };
    if (fromVisible && !toVisible) {
        const k = vis.indexOf(false);
        const a = points[k - 1] as Point;
        out.exit = { end: "to", at: edgePoint(a, points[k] ?? null, width, height) };
    } else if (toVisible && !fromVisible) {
        const k = vis.lastIndexOf(false);
        const a = points[k + 1] as Point;
        out.exit = { end: "from", at: edgePoint(a, points[k] ?? null, width, height) };
    }
    return out;
}

export function polyline(run: readonly Point[]): string {
    return run.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("");
}
