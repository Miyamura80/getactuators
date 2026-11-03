import { SDK_CHECKS, type SdkCheck } from "./checks";
import {
    type BrandScore,
    type DimensionScore,
    PRESET_WEIGHTS,
    SDK_DIMENSIONS,
    type SdkDimension,
    type SdkEvidence,
    type SdkPreset,
} from "./types";

// The /sdk scoring model, shared by the seeding pipeline (which writes
// data/sdk-scores.json) and the tests (which recompute it).
//
//   objective  mean of the dimension's checks (0..1)
//   community  Laplace-smoothed share of positive claims, each weighted by
//              recency: a claim loses half its weight every 24 months, and a
//              GitHub issue counts 0.35 of a discussion post
//   blend      objective weight 0.6, community weight 0.4 * n / (n + 3) where
//              n is the recency-weighted claim count, so a handful of posts
//              cannot outvote the facts
//              plus a 0.15 weight on a neutral 50, so one check cannot pin a
//              dimension to 0 or 100
//   overall    preset-weighted mean over all seven dimensions; one with no
//              checks and no posts counts as a neutral 50

export interface RepoStats {
    repo: string;
    official: boolean;
    exists: boolean;
    pushedAt: string | null;
    stars: number | null;
    license: string | null;
    language: string | null;
    archived: boolean;
    // Median hours from opening to closing, over the 30 newest closed issues.
    medianCloseHours: number | null;
}

export const HALF_LIFE_MONTHS = 24;
// Issue trackers collect bug reports by design, so an issue counts for less
// than a discussion post; otherwise the most used SDKs would score worst.
export const ISSUE_WEIGHT = 0.35;
const OBJECTIVE_WEIGHT = 0.6;
const COMMUNITY_WEIGHT = 0.4;
const PRIOR = 3;
// A small neutral pull so a dimension resting on one check never reads 0 or 100.
const NEUTRAL_WEIGHT = 0.15;
// What a dimension with no checks and no posts counts as in the overall.
const MISSING = 50;

function monthsBetween(from: string, to: string): number {
    return Math.max(0, (Date.parse(to) - Date.parse(from)) / (30.44 * 24 * 3.6e6));
}

export const recencyWeight = (date: string, asOf: string) =>
    0.5 ** (monthsBetween(date, asOf) / HALF_LIFE_MONTHS);

// Support checks read off the maker's own repositories.
export function repoChecks(
    repos: readonly RepoStats[],
    sourceFor: (repo: string) => string | undefined,
    asOf: string,
): SdkCheck[] {
    const official = repos.filter((r) => r.official && r.exists);
    const sources = official
        .map((r) => sourceFor(r.repo))
        .filter((s) => s !== undefined);
    if (official.length === 0 || sources.length === 0) return [];
    const active = official.some(
        (r) => !r.archived && r.pushedAt && monthsBetween(r.pushedAt, asOf) <= 12,
    );
    const closes = official
        .map((r) => r.medianCloseHours)
        .filter((h): h is number => h !== null);
    const best = closes.length ? Math.min(...closes) : null;
    const checks: SdkCheck[] = [
        {
            dimension: "support",
            label: "Maker repository updated in the last 12 months",
            value: active ? 1 : 0,
            sources,
        },
    ];
    if (best !== null)
        checks.push({
            dimension: "support",
            label: `Median time to close recent issues: ${formatHours(best)}`,
            value: best <= 24 * 7 ? 1 : best <= 24 * 60 ? 0.5 : 0,
            sources,
        });
    return checks;
}

export function formatHours(h: number): string {
    if (h < 48) return `${Math.round(h)} h`;
    return `${Math.round(h / 24)} days`;
}

const round = (x: number) => Math.round(x * 10) / 10;

function dimensionScore(
    checks: readonly SdkCheck[],
    evidence: readonly SdkEvidence[],
    asOf: string,
): DimensionScore | null {
    const objective = checks.length
        ? checks.reduce((s, c) => s + c.value, 0) / checks.length
        : null;
    let pos = 0;
    let neg = 0;
    for (const e of evidence) {
        const w =
            recencyWeight(e.date, asOf) * (e.forum === "github" ? ISSUE_WEIGHT : 1);
        if (e.polarity === "positive") pos += w;
        else neg += w;
    }
    const n = pos + neg;
    if (objective === null && n === 0) return null;
    const community = (pos + 1) / (n + 2);
    const wo = objective === null ? 0 : OBJECTIVE_WEIGHT;
    const wc = COMMUNITY_WEIGHT * (n / (n + PRIOR));
    const blended =
        ((objective ?? 0) * wo + community * wc + 0.5 * NEUTRAL_WEIGHT) /
        (wo + wc + NEUTRAL_WEIGHT);
    return {
        score: round(blended * 100),
        objective: objective === null ? null : round(objective * 100),
        community: n === 0 ? null : round(community * 100),
        positive: evidence.filter((e) => e.polarity === "positive").length,
        negative: evidence.filter((e) => e.polarity === "negative").length,
    };
}

export type Dimensions = Partial<Record<SdkDimension, DimensionScore>>;

export function weightedOverall(
    dims: Dimensions,
    preset: SdkPreset = "balanced",
): number {
    const w = PRESET_WEIGHTS[preset];
    let sum = 0;
    for (const d of SDK_DIMENSIONS) sum += (dims[d]?.score ?? MISSING) * w[d];
    return round(sum);
}

export function scoreBrand(
    brand: string,
    evidence: readonly SdkEvidence[],
    extraChecks: readonly SdkCheck[],
    asOf: string,
): BrandScore {
    const checks = [...(SDK_CHECKS[brand] ?? []), ...extraChecks];
    const dims: Dimensions = {};
    for (const d of SDK_DIMENSIONS) {
        const s = dimensionScore(
            checks.filter((c) => c.dimension === d),
            evidence.filter((e) => e.dimension === d),
            asOf,
        );
        if (s) dims[d] = s;
    }
    return {
        brand,
        dimensions: dims,
        overall: weightedOverall(dims),
        evidenceCount: evidence.length,
    };
}
