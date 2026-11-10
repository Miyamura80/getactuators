import type { Offer } from "./extract/types";

// Pick the offer that matches a catalog entry when a page lists several
// (driver board or not, KV rating, cable length). Order: an explicit variant
// hint from targets.ts, then the most catalog-name tokens in the offer
// title, then the price closest to the reference price (last recorded or
// catalog). A tie on tokens between differently priced offers is flagged, and
// so is a variant hint that matches no offer.

export interface PricedOffer extends Offer {
    priceUsd: number;
}

export interface Pick {
    offer: PricedOffer;
    ambiguous: boolean;
}

// Lowercase words, trailing dots dropped; a hyphenated model ("ak80-9")
// counts whole and as its parts, so "GIM6010-8-Motor" still has "gim6010".
export function tokens(s: string): string[] {
    const words = s
        .toLowerCase()
        .split(/[^a-z0-9.-]+/)
        .map((w) => w.replace(/^[.-]+|[.-]+$/g, ""));
    return [
        ...new Set(words.flatMap((w) => [w, ...(w.includes("-") ? w.split("-") : [])])),
    ].filter((t) => t.length >= 2);
}

export function pickOffer(
    offers: PricedOffer[],
    target: { name: string; referenceUsd: number | null; variant?: string },
): Pick | null {
    if (offers.length === 0) return null;
    const hint = target.variant?.toLowerCase();
    const pool = hint
        ? offers.filter((o) => o.title?.toLowerCase().includes(hint))
        : [];
    const candidates = pool.length ? pool : offers;
    const want = tokens(target.name);
    const score = (o: PricedOffer) => {
        const have = new Set(tokens(o.title ?? ""));
        return want.filter((t) => have.has(t)).length;
    };
    const distance = (o: PricedOffer) =>
        target.referenceUsd ? Math.abs(Math.log(o.priceUsd / target.referenceUsd)) : 0;
    const ranked = [...candidates].sort(
        (a, b) =>
            score(b) - score(a) || distance(a) - distance(b) || a.priceUsd - b.priceUsd,
    );
    const best = ranked[0] as PricedOffer;
    const tied = ranked.filter(
        (o) =>
            score(o) === score(best) && Math.abs(o.priceUsd / best.priceUsd - 1) > 0.05,
    );
    return {
        offer: best,
        ambiguous: (hint !== undefined && !pool.length) || tied.length > 0,
    };
}
