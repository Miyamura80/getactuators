import type { CountryCode } from "./countries";

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
    const entries = Object.entries(shares) as [ShareKey, number][];
    const total = entries.reduce((s, [, v]) => s + clean(v), 0);
    const denom = total > 1 + 1e-9 ? total : 1;
    const countries = entries
        .filter(([k, v]) => k !== "other" && clean(v) > 0)
        .map(([k, v]) => ({ country: k as CountryCode, share: clean(v) / denom }))
        .sort((a, b) => b.share - a.share || a.country.localeCompare(b.country));
    const named = countries.reduce((s, c) => s + c.share, 0);
    return { countries, other: Math.max(0, 1 - named) };
}

// Null when no country holds a positive share.
export function concentration(shares: Shares): Concentration | null {
    const { countries } = normalizeShares(shares);
    const top = countries[0];
    if (!top) return null;
    const hhi = Math.round(countries.reduce((s, c) => s + (c.share * 100) ** 2, 0));
    return { top, hhi };
}
