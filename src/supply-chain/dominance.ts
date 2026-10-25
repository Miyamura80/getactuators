// Plain readings of a share map for the "how dominant is the leader" visuals:
// who leads and by how much. No derived units.

export interface RankedShare {
    key: string;
    share: number;
}

const OTHER = "other";

function clean(v: number | undefined): number {
    return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : 0;
}

// Named players as fractions of the whole, largest first; amounts are
// normalised by their total, and anything unnamed becomes `other`.
export function rankShares(values: Record<string, number>): {
    named: RankedShare[];
    other: number;
} {
    const entries = Object.entries(values);
    const total = entries.reduce((t, [, v]) => t + clean(v), 0);
    const denom = total > 1 + 1e-9 ? total : 1;
    const named = entries
        .filter(([k, v]) => k !== OTHER && clean(v) > 0)
        .map(([key, v]) => ({ key, share: clean(v) / denom }))
        .sort((a, b) => b.share - a.share || a.key.localeCompare(b.key));
    const sum = named.reduce((t, n) => t + n.share, 0);
    return { named, other: Math.max(0, 1 - sum) };
}

export function leaderOf(values: Record<string, number>): RankedShare | null {
    return rankShares(values).named[0] ?? null;
}
