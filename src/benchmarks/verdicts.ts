// Verdicts of a measurement against its datasheet value. Only independent
// runs get one (see docs/benchmarks/protocol.md, "Independence"). Relative
// imports only: the browser bundle reuses this module.

import type { BenchmarkIndependence, ClaimBound } from "./types";

// Typical claims: below datasheet, matches or beats. Upper limits ("max"):
// within spec or over limit, never beats.
export const VERDICTS = [
    "below-datasheet",
    "matches",
    "beats",
    "within-spec",
    "over-limit",
] as const;
export type Verdict = (typeof VERDICTS)[number];

export const VERDICT_LABEL: Record<Verdict, string> = {
    "below-datasheet": "Below datasheet",
    matches: "Matches",
    beats: "Beats",
    "within-spec": "Within spec",
    "over-limit": "Over limit",
};

// Shown in place of a verdict for a run that is not independent.
export const UNRATED_LABEL: Record<
    Exclude<BenchmarkIndependence, "independent">,
    string
> = {
    vendor: "Maker-reported",
    "vendor-affiliated": "Affiliated test",
};

// Good, even or bad, for colouring a verdict.
export const VERDICT_TONE: Record<Verdict, "good" | "even" | "bad"> = {
    "below-datasheet": "bad",
    matches: "even",
    beats: "good",
    "within-spec": "good",
    "over-limit": "bad",
};

// Within 10% of a typical claim counts as a match.
export const MATCH_TOLERANCE = 0.1;

// ratio is measured over datasheet.
export function verdictFor(
    ratio: number,
    better: "higher" | "lower",
    bound: ClaimBound = "typical",
): Verdict {
    if (bound === "max") return ratio <= 1 ? "within-spec" : "over-limit";
    const t = MATCH_TOLERANCE;
    const worse = better === "higher" ? ratio < 1 - t : ratio > 1 + t;
    const nicer = better === "higher" ? ratio > 1 + t : ratio < 1 - t;
    if (worse) return "below-datasheet";
    return nicer ? "beats" : "matches";
}

// The verdict for an independent run, null for any other.
export function verdictForRun(
    independence: BenchmarkIndependence,
    ratio: number,
    better: "higher" | "lower",
    bound: ClaimBound,
): Verdict | null {
    return independence === "independent" ? verdictFor(ratio, better, bound) : null;
}

// Display text: the verdict, or why there is none.
export function statusLabel(
    independence: BenchmarkIndependence,
    verdict: Verdict | null,
): string {
    if (verdict) return VERDICT_LABEL[verdict];
    return independence === "independent" ? "No verdict" : UNRATED_LABEL[independence];
}
