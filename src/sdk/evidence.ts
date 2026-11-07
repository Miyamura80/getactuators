import evidenceJson from "./data/sdk-evidence.json";
import {
    REDDIT_SEED_DATE,
    REDDIT_SUBREDDITS,
    type SdkDimension,
    type SdkEvidence,
} from "./types";

// Community evidence behind /sdk: one paraphrased claim per post, brand and
// dimension, newest first within a brand. Kept apart from ./index so pages
// that only need a score (the actuator SDK badge) do not ship it.

export const SDK_EVIDENCE: readonly SdkEvidence[] = (
    evidenceJson as unknown as { items: SdkEvidence[] }
).items;

export function evidenceFor(brand: string, dimension?: SdkDimension): SdkEvidence[] {
    return SDK_EVIDENCE.filter(
        (e) =>
            e.brand === brand && (dimension === undefined || e.dimension === dimension),
    );
}

const SUBREDDITS = new Set(REDDIT_SUBREDDITS.map((s) => `r/${s.toLowerCase()}`));

// A Reddit claim the free collector cannot find again: a comment (its
// permalink has a sixth path segment) or a post outside REDDIT_SUBREDDITS.
export function redditSeedOnly(e: SdkEvidence): boolean {
    if (e.forum !== "reddit") return false;
    const comment = new URL(e.url).pathname.split("/").filter(Boolean).length >= 6;
    return comment || !SUBREDDITS.has(e.venue.toLowerCase());
}

// One sentence on where the Reddit evidence came from, for the page and twin.
export function redditSeedNote(): string {
    const reddit = SDK_EVIDENCE.filter((e) => e.forum === "reddit");
    const seed = reddit.filter(redditSeedOnly).length;
    return `The Reddit posts are a one-off seed collected on ${REDDIT_SEED_DATE} that also searched comments and subreddits beyond the ${REDDIT_SUBREDDITS.length} the free collector covers (${REDDIT_SUBREDDITS.map((s) => `r/${s}`).join(", ")}, posts only); ${seed} of the ${reddit.length} Reddit claims come from those extra venues or comments, and a fresh collection will not find them again.`;
}

export interface PainPoint {
    dimension: SdkDimension;
    theme: string;
    count: number;
    examples: SdkEvidence[];
}

// Top recurring complaints for a brand, grouped by theme, newest examples first.
export function painPoints(brand: string, limit = 4): PainPoint[] {
    const groups = new Map<string, PainPoint>();
    for (const e of evidenceFor(brand)) {
        if (e.polarity !== "negative" || e.theme === "other") continue;
        const k = `${e.dimension}|${e.theme}`;
        const g = groups.get(k) ?? {
            dimension: e.dimension,
            theme: e.theme,
            count: 0,
            examples: [],
        };
        g.count++;
        if (g.examples.length < 3) g.examples.push(e);
        groups.set(k, g);
    }
    return [...groups.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}
