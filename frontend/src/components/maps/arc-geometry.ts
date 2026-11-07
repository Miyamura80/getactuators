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

// A chip to keep clear of the others: its centre and size, in CSS pixels.
export interface EdgeChip {
    key: string;
    at: Point;
    w: number;
    h: number;
}

type Edge = "top" | "bottom" | "left" | "right";
const CHIP_GAP = 4;

// Chips sit where their arcs leave the frame, so several bound for nearby
// countries land on top of each other. Each chip keeps to its edge and
// slides along it, in order, until it clears its neighbours; chips on the
// left and right edges also drop below (or rise above) any top or bottom
// chip in their column. Returns each chip's new centre.
export function spreadChips(chips: readonly EdgeChip[], width: number, height: number, reserved: readonly [number, number, number, number][] = []): Map<string, Point> {
    const out = new Map<string, Point>();
    const clamp = (c: EdgeChip): Point => [
        Math.min(width - c.w / 2 - 2, Math.max(c.w / 2 + 2, c.at[0])),
        Math.min(height - c.h / 2 - 2, Math.max(c.h / 2 + 2, c.at[1])),
    ];
    const edgeOf = ([x, y]: Point): Edge => {
        const d: [Edge, number][] = [["top", y], ["bottom", height - y], ["left", x], ["right", width - x]];
        return d.reduce((a, b) => (b[1] < a[1] ? b : a))[0];
    };
    // The edge is the one the arc leaves by (the exit point), not the one
    // the clamped centre happens to sit nearest.
    const placed = chips.map((c) => ({ c, at: clamp(c), edge: edgeOf(c.at) }));
    // Slide one edge's chips along `axis` (0 = x, 1 = y) within [lo(c), hi].
    // When they do not fit in one row, every other chip (every third, ...)
    // steps inward into a further row, so each row still spans the edge.
    const sweep = (edge: typeof placed, axis: 0 | 1, inward: 1 | -1, lo: (c: EdgeChip) => number, hi: number) => {
        const size = (c: EdgeChip) => (axis === 0 ? c.w : c.h);
        const across = (c: EdgeChip) => (axis === 0 ? c.h : c.w);
        edge.sort((a, b) => a.at[axis] - b.at[axis]);
        const need = (row: typeof edge) => row.reduce((n, p) => n + size(p.c) + CHIP_GAP, 0);
        const room = Math.max(1, hi - Math.min(...edge.map((p) => lo(p.c)), hi));
        // Enough rows that every round-robin row fits, chips being of
        // unequal widths.
        let rows = Math.max(1, Math.ceil(need(edge) / room));
        while (rows < edge.length && Array.from({ length: rows }, (_, r) => need(edge.filter((_, i) => i % rows === r))).some((n) => n > room)) rows += 1;
        const step = Math.max(0, ...edge.map((p) => across(p.c))) + CHIP_GAP;
        for (let r = 0; r < rows; r++) {
            const row = edge.filter((_, i) => i % rows === r);
            for (const p of row) p.at[1 - axis] += inward * r * step;
            let prev = -Infinity;
            for (const p of row) {
                const min = Math.max(lo(p.c), prev + CHIP_GAP) + size(p.c) / 2;
                p.at[axis] = Math.max(p.at[axis], min);
                prev = p.at[axis] + size(p.c) / 2;
            }
            let next = Infinity;
            for (const p of [...row].reverse()) {
                const max = Math.min(hi, next - CHIP_GAP) - size(p.c) / 2;
                if (p.at[axis] > max) p.at[axis] = max;
                next = p.at[axis] - size(p.c) / 2;
            }
        }
    };
    const on = (e: Edge) => placed.filter((p) => p.edge === e);
    // HUD boxes in a corner shorten the edges they touch: [lo, hi] along
    // the edge that chips may use.
    const NEAR = 12;
    const span = (touches: (r: (typeof reserved)[number]) => boolean, a: 0 | 1, len: number): [number, number] => {
        let lo = 2;
        let hi = len - 2;
        for (const r of reserved.filter(touches)) {
            if (r[a] + r[a + 2] < len) lo = Math.max(lo, r[a + 2] + CHIP_GAP);
            else hi = Math.min(hi, r[a] - CHIP_GAP);
        }
        return [lo, hi];
    };
    const [topLo, topHi] = span((r) => r[1] < NEAR, 0, width);
    const [bottomLo, bottomHi] = span((r) => r[3] > height - NEAR, 0, width);
    const [leftLo, leftHi] = span((r) => r[0] < NEAR, 1, height);
    const [rightLo, rightHi] = span((r) => r[2] > width - NEAR, 1, height);
    sweep(on("top"), 0, 1, () => topLo, topHi);
    sweep(on("bottom"), 0, -1, () => bottomLo, bottomHi);
    // A side chip starts below the lowest top chip it would touch.
    const across = (side: (typeof placed)[number], other: (typeof placed)[number]) =>
        Math.abs(side.at[0] - other.at[0]) < (side.c.w + other.c.w) / 2 + CHIP_GAP;
    for (const e of ["left", "right"] as const) {
        const row = on(e);
        const below = (c: EdgeChip) => {
            const p = row.find((r) => r.c === c);
            const tops = p ? on("top").filter((t) => across(p, t)) : [];
            return Math.max(e === "left" ? leftLo : rightLo, ...tops.map((t) => t.at[1] + t.c.h / 2 + CHIP_GAP));
        };
        const bottoms = row.flatMap((p) => on("bottom").filter((b) => across(p, b)));
        sweep(row, 1, e === "left" ? 1 : -1, below, Math.min(e === "left" ? leftHi : rightHi, ...bottoms.map((b) => b.at[1] - b.c.h / 2 - CHIP_GAP)));
    }
    for (const p of placed) out.set(p.c.key, p.at);
    return out;
}
