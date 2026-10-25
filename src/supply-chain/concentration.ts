import type { CountryCode } from "./countries";
import { rankShares } from "./dominance";

// Country shares of one supply-chain stage (production, capacity or sales):
// normalised shares for the stacked bars, and the top country plus the
// Herfindahl-Hirschman index for the markdown twins and modeled values.
//
// Shares may be fractions (summing to at most 1) or raw amounts such as
// tonnes; amounts are normalised by their total. The "other" key, and any
// shortfall below 1, is volume not attributed to a country: it counts toward
// the total but not toward the HHI, so the HHI is a lower bound.

export type ShareKey = CountryCode | "other";
export type Shares = Partial<Record<ShareKey, number>>;

export interface Concentration {
    top: { country: CountryCode; share: number };
    // 0..10000
    hhi: number;
}

function clean(v: number | undefined): number {
    return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : 0;
}

// Country shares as fractions of the whole, largest first, plus the
// unattributed remainder.
export function normalizeShares(shares: Shares): {
    countries: { country: CountryCode; share: number }[];
    other: number;
} {
    const { named, other } = rankShares(shares as Record<string, number>);
    return {
        countries: named.map((n) => ({
            country: n.key as CountryCode,
            share: n.share,
        })),
        other,
    };
}

// Herfindahl-Hirschman index (0..10000) of shares given as fractions.
export function hhi(fractions: readonly number[]): number {
    return Math.round(fractions.reduce((s, f) => s + (clean(f) * 100) ** 2, 0));
}

// Null when no country holds a positive share.
export function concentration(shares: Shares): Concentration | null {
    const { countries } = normalizeShares(shares);
    const top = countries[0];
    if (!top) return null;
    return { top, hhi: hhi(countries.map((c) => c.share)) };
}
