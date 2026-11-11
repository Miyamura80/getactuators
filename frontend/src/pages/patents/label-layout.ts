// Label layout for the /patents charts: a 1-D spreader for stacked end
// labels (the indexed chart, the flow's node labels) and a 2-D placer for
// the value scatter's bubble labels.

// Height of one mono 11px label line.
export const LABEL_H = 13;

// Push label centres apart to at least `gap`, keeping them inside
// [top, bottom] and as close to their anchors as that allows: push down,
// then pull the tail back above `bottom`, then the head below `top`. The
// output is in input order; the input need not be sorted.
export function spreadLabels(ys: readonly number[], gap: number, top: number, bottom: number): number[] {
    const order = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
    const y = order.map((o) => o.y);
    const n = y.length;
    for (let k = 1; k < n; k++) y[k] = Math.max(y[k] ?? 0, (y[k - 1] ?? 0) + gap);
    for (let k = n - 1; k >= 0; k--) y[k] = Math.min(y[k] ?? 0, k === n - 1 ? bottom : (y[k + 1] ?? 0) - gap);
    for (let k = 0; k < n; k++) y[k] = Math.max(y[k] ?? 0, k === 0 ? top : (y[k - 1] ?? 0) + gap);
    const out = new Array<number>(n);
    for (const [k, o] of order.entries()) out[o.i] = y[k] ?? o.y;
    return out;
}

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

