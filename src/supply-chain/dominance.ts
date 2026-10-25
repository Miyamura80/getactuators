// Plain readings of a share map for the "how dominant is the leader" visuals:
// who leads, how many players it takes to reach 90%, and shares as whole
// counts out of ten. No derived units.

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

// The named players that together reach `target`, and how many players it
// takes at least. When the named ones fall short, every unnamed player is at
// most as big as the smallest named one, which bounds the extra count.
export function playersToReach(
    values: Record<string, number>,
    target = 0.9,
): { players: RankedShare[]; count: number; reached: boolean } {
    const { named } = rankShares(values);
    const players: RankedShare[] = [];
    let sum = 0;
    for (const n of named) {
        players.push(n);
        sum += n.share;
        if (sum >= target - 1e-9)
            return { players, count: players.length, reached: true };
    }
    const smallest = named.at(-1)?.share ?? 0;
    const extra = smallest > 0 ? Math.ceil((target - sum) / smallest - 1e-9) : 0;
    return { players, count: players.length + extra, reached: false };
}

// Shares as whole counts out of `n` (largest remainder), named players first
// and `other` last.
export function outOf(
    values: Record<string, number>,
    n = 10,
): { key: string; count: number; share: number }[] {
    const { named, other } = rankShares(values);
    const parts = [...named, ...(other > 0.0005 ? [{ key: OTHER, share: other }] : [])];
    const raw = parts.map((p) => ({
        ...p,
        count: Math.floor(p.share * n),
        rest: (p.share * n) % 1,
    }));
    let left = n - raw.reduce((t, p) => t + p.count, 0);
    for (const p of [...raw].sort((a, b) => b.rest - a.rest)) {
        if (left <= 0) break;
        p.count += 1;
        left -= 1;
    }
    return raw
        .filter((p) => p.count > 0)
        .map(({ key, count, share }) => ({ key, count, share }));
}
