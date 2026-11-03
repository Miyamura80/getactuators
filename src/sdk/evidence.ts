import evidenceJson from "./data/sdk-evidence.json";
import type { SdkDimension, SdkEvidence } from "./types";

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
