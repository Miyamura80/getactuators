import type { CountryCode } from "./countries";

// "Is this stage monopolized?" One rule for the whole site, from country
// shares of a stage (production, capacity or sales).
//
//   monopolized   top country holds >= 70%
//   concentrated  HHI >= 2500
//   moderate      1500 <= HHI < 2500
//   distributed   HHI < 1500
//
// Shares may be fractions (summing to at most 1) or raw amounts such as
// tonnes; amounts are normalised by their total. The "other" key, and any
// shortfall below 1, is volume not attributed to a country: it counts toward
// the total but not toward the HHI, so the HHI is a lower bound.

export type ShareKey = CountryCode | "other";
export type Shares = Partial<Record<ShareKey, number>>;

export const LEVELS = [
    "monopolized",
    "concentrated",
    "moderate",
    "distributed",
] as const;
export type ConcentrationLevel = (typeof LEVELS)[number];

export interface Concentration {
    top: { country: CountryCode; share: number };
    hhi: number;
    level: ConcentrationLevel;
}

export const MONOPOLY_SHARE = 0.7;
export const CONCENTRATED_HHI = 2500;
export const MODERATE_HHI = 1500;

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

export function levelFor(topShare: number, hhi: number): ConcentrationLevel {
    if (topShare >= MONOPOLY_SHARE) return "monopolized";
    if (hhi >= CONCENTRATED_HHI) return "concentrated";
    if (hhi >= MODERATE_HHI) return "moderate";
    return "distributed";
}

// Null when no country holds a positive share.
export function concentration(shares: Shares): Concentration | null {
    const { countries } = normalizeShares(shares);
    const top = countries[0];
    if (!top) return null;
    const hhi = Math.round(countries.reduce((s, c) => s + (c.share * 100) ** 2, 0));
    return { top, hhi, level: levelFor(top.share, hhi) };
}

export const LEVEL_LABEL: Record<ConcentrationLevel, string> = {
    monopolized: "Monopolized",
    concentrated: "Concentrated",
    moderate: "Moderate",
    distributed: "Distributed",
};
