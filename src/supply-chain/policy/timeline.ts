import { type MeasureStatus, type PolicyMeasure, startDate } from "./index";

// Geometry for the /policy swimlanes, kept free of React so it can be tested:
// where on the time axis a measure starts, the status segments of its bar and
// which row (track) its marker takes inside its lane so markers never touch.
// Bars are drawn only for the measure in focus, so packing is by marker.

// "2025-04" -> fraction of the year, as a number of years since 0 AD.
export function yearOf(date: string): number {
    const [y = 0, m = 1, d = 1] = date.split("-").map(Number);
    return y + (m - 1) / 12 + (d - 1) / 365;
}

export interface Segment {
    from: number;
    to: number;
    status: MeasureStatus;
}

// One bar segment per status change, each running to the next change, the
// expiry or today. Expired ends the bar; nothing is drawn after it.
export function segments(m: PolicyMeasure, today: string): Segment[] {
    const now = yearOf(today);
    const end = m.expires && m.expires < today ? yearOf(m.expires) : now;
    const out: Segment[] = [];
    for (const [i, c] of m.statusHistory.entries()) {
        if (c.status === "expired") break;
        const next = m.statusHistory[i + 1];
        const from = yearOf(c.date);
        const to = Math.min(next ? yearOf(next.date) : end, end);
        const last = out.at(-1);
        if (last && last.status === c.status && last.to >= from)
            last.to = Math.max(last.to, to);
        else if (to > from) out.push({ from, to, status: c.status });
    }
    return out;
}

export interface Placed {
    measure: PolicyMeasure;
    start: number;
    end: number;
    track: number;
    segments: Segment[];
}

// Greedy packing: each marker takes the first track whose last marker sits
// at least `gap` years earlier.
export function placeLane(
    measures: readonly PolicyMeasure[],
    today: string,
    gap = 0.3,
): { placed: Placed[]; tracks: number } {
    const last: number[] = [];
    const placed = [...measures]
        .sort(
            (a, b) =>
                startDate(a).localeCompare(startDate(b)) || a.id.localeCompare(b.id),
        )
        .map((measure) => {
            const segs = segments(measure, today);
            const start = yearOf(startDate(measure));
            const end = Math.max(start, segs.at(-1)?.to ?? start);
            let track = last.findIndex((x) => x + gap <= start);
            if (track < 0) track = last.push(start) - 1;
            else last[track] = start;
            return { measure, start, end, track, segments: segs };
        });
    return { placed, tracks: Math.max(1, last.length) };
}
