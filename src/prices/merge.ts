import type { PriceHistoryFile, PriceObservation, PriceReviewItem } from "./types";

// Appending to data/prices/history.json: one point per actuator, date and
// method (a re-run on the same day replaces its own point), sorted so diffs
// stay small and reviewable.

const key = (p: PriceObservation) => `${p.actuatorId}|${p.date}|${p.method}`;

export function sortPoints(points: PriceObservation[]): PriceObservation[] {
    return [...points].sort(
        (a, b) =>
            a.actuatorId.localeCompare(b.actuatorId) ||
            a.date.localeCompare(b.date) ||
            a.method.localeCompare(b.method),
    );
}

export function mergePoints(
    file: PriceHistoryFile,
    added: PriceObservation[],
    review: PriceReviewItem[] = [],
    updated: string = file.updated,
): PriceHistoryFile {
    const byKey = new Map(file.points.map((p) => [key(p), p]));
    for (const p of added) byKey.set(key(p), p);
    const reviewKey = (r: PriceReviewItem) => `${r.actuatorId}|${r.date}|${r.url}`;
    const reviews = new Map(file.review.map((r) => [reviewKey(r), r]));
    for (const r of review) reviews.set(reviewKey(r), r);
    return {
        schema: 1,
        updated: updated > file.updated ? updated : file.updated,
        points: sortPoints([...byKey.values()]),
        review: [...reviews.values()].sort(
            (a, b) =>
                a.actuatorId.localeCompare(b.actuatorId) ||
                a.date.localeCompare(b.date),
        ),
    };
}

export function serializeHistory(file: PriceHistoryFile): string {
    return `${JSON.stringify(file, null, 2)}\n`;
}
