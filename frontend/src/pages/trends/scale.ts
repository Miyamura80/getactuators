// Axis helpers for the /trends charts: linear or log scales with readable ticks.

export interface Scale {
    at: (v: number) => number;
    ticks: number[];
}

// Series colours: the site's bright-on-black data palette.
export const SERIES_COLORS = ["#4dabf7", "#51cf66", "#ffb547", "#9775fa", "#ff6b9a", "#66d9e8", "#ff922b", "#ffe066"];

export function colorAt(i: number): string {
    return SERIES_COLORS[i % SERIES_COLORS.length] as string;
}

// Maps [lo, hi] onto [p0, p1]; log scales tick at 1, 2 and 5 per decade, or
// every decade when the range spans many.
export function makeScale(lo: number, hi: number, p0: number, p1: number, log: boolean): Scale {
    if (log) {
        // Candidate 1-2-5 (or decade) ticks, trimmed to the nearest ticks
        // around the data so the axis does not run a decade past it.
        const d0 = Math.floor(Math.log10(lo));
        const d1 = Math.ceil(Math.log10(hi));
        const steps = d1 - d0 > 3 ? [1] : [1, 2, 5];
        const all: number[] = [];
        for (let d = d0; d <= d1; d++) for (const s of steps) all.push(s * 10 ** d);
        const bottom = [...all].reverse().find((t) => t <= lo) ?? all[0]!;
        const top = all.find((t) => t >= hi) ?? all[all.length - 1]!;
        const span = Math.log10(top) - Math.log10(bottom) || 1;
        const at = (v: number) => p0 + ((Math.log10(v) - Math.log10(bottom)) / span) * (p1 - p0);
        return { at, ticks: all.filter((t) => t >= bottom && t <= top) };
    }
    const step = niceStep((hi - lo) / 4);
    const top = Math.ceil(hi / step) * step;
    const bottom = Math.min(0, Math.floor(lo / step) * step);
    const at = (v: number) => p0 + ((v - bottom) / (top - bottom || 1)) * (p1 - p0);
    const ticks: number[] = [];
    for (let t = bottom; t <= top + step / 2; t += step) ticks.push(Math.round(t * 1000) / 1000);
    return { at, ticks };
}

function niceStep(raw: number): number {
    const mag = 10 ** Math.floor(Math.log10(raw || 1));
    const f = raw / mag;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * mag;
}

// Year ticks: every year for short spans, else every 2 or 5.
export function yearTicks(y0: number, y1: number): number[] {
    const span = y1 - y0;
    const step = span <= 5 ? 1 : span <= 12 ? 2 : 5;
    const out: number[] = [];
    for (let y = Math.ceil(y0 / step) * step; y <= y1; y += step) out.push(y);
    return out;
}

export function tickLabel(v: number): string {
    if (v >= 1000) return `${v / 1000}k`;
    return String(v);
}
