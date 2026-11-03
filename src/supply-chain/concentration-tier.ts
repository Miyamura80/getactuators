import { type Concentration, type Shares, concentration } from "./concentration";

// A one-word reading of a stage's country shares, for badges on clusters,
// process steps and BOM tiers: how much of it one country holds.
//
//   monopolized   the top country holds 80% or more
//   concentrated  the top country holds 50% to 80%
//   distributed   no country holds half

export const CONCENTRATION_TIERS = [
    "monopolized",
    "concentrated",
    "distributed",
] as const;
export type ConcentrationTier = (typeof CONCENTRATION_TIERS)[number];

export const TIER_LABEL: Record<ConcentrationTier, string> = {
    monopolized: "Monopolized",
    concentrated: "Concentrated",
    distributed: "Distributed",
};

export const MONOPOLY_SHARE = 0.8;
export const CONCENTRATED_SHARE = 0.5;

export function tierOf(top: number): ConcentrationTier {
    if (top >= MONOPOLY_SHARE) return "monopolized";
    if (top >= CONCENTRATED_SHARE) return "concentrated";
    return "distributed";
}

export function concentrationTier(
    shares: Shares,
): (Concentration & { tier: ConcentrationTier }) | null {
    const c = concentration(shares);
    return c ? { ...c, tier: tierOf(c.top.share) } : null;
}
