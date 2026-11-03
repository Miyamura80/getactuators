import { ACTUATORS } from "../catalog";
import {
    SCORED_BRANDS,
    SDK_BRANDS,
    type SdkBrand,
    getSdkBrand,
    sdkBrandForCatalogBrand,
} from "./brands";
import { SDK_CAPABILITIES, SDK_CHECKS, type SdkCheck } from "./checks";
import githubJson from "./data/sdk-github.json";
import scoresJson from "./data/sdk-scores.json";
import { type RepoStats, repoChecks, weightedOverall } from "./score";
import { SDK_SOURCES } from "./sources";
import {
    type BrandScore,
    CAPABILITIES,
    type CapabilityState,
    type ClassifierAgreement,
    type MonthCount,
    type SdkPreset,
} from "./types";

export * from "./types";
export { SDK_BRANDS, SCORED_BRANDS, getSdkBrand, type SdkBrand } from "./brands";
export type { SdkCheck } from "./checks";

// The /sdk dataset: committed output of scripts/sdk-signals/ (scores and
// repository stats) joined with the curated checks. Shared by the page, its
// markdown twin, REST, MCP and the actuator pages' SDK badge. The evidence
// items live in ./evidence so the badge does not ship them.

export const SDK_PATH = "/sdk";

interface ScoresFile {
    asOf: string;
    method: {
        labelledBy: string;
        guideVersion: string;
        postsScanned: number;
        postsMatched: number;
        gold: { items: number; labelledBy: string; agreement: ClassifierAgreement[] };
    };
    brands: BrandScore[];
    timeline: Record<string, MonthCount[]>;
}

const scores = scoresJson as unknown as ScoresFile;
const github = githubJson as unknown as { asOf: string; repos: RepoStats[] };

export const SDK_AS_OF = scores.asOf;
export const SDK_METHOD = scores.method;
export const SDK_REPOS: readonly RepoStats[] = github.repos;

const scoreById = new Map(scores.brands.map((b) => [b.brand, b]));

export type Confidence = "high" | "medium" | "low";

export function confidenceOf(evidenceCount: number): Confidence {
    return evidenceCount >= 40 ? "high" : evidenceCount >= 15 ? "medium" : "low";
}

export interface BrandSummary {
    brand: SdkBrand;
    score: BrandScore;
    rank: number;
    confidence: Confidence;
    actuatorIds: string[];
    // Median catalog price per N.m across the brand's actuators, when known.
    pricePerNm: number | null;
    capabilities: Record<(typeof CAPABILITIES)[number], CapabilityState>;
}

function median(xs: number[]): number | null {
    const s = [...xs].sort((a, b) => a - b);
    if (!s.length) return null;
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? (s[m] ?? null) : ((s[m - 1] ?? 0) + (s[m] ?? 0)) / 2;
}

// A bare motor or reducer: no drive of its own and no communication
// interface, so the brand's SDK does not apply to it (a maxon frameless motor
// needs a separately bought EPOS or any other controller).
export function isBareHardware(a: {
    integrated_driver: boolean | null;
    comm: string[] | null;
}) {
    return a.integrated_driver !== true && (a.comm ?? []).length === 0;
}

// The brand's catalog actuators that its SDK actually drives.
export function actuatorsOfBrand(b: SdkBrand) {
    return ACTUATORS.filter(
        (a) => b.catalogBrands.includes(a.brand) && !isBareHardware(a),
    );
}

function capabilitiesOf(id: string): BrandSummary["capabilities"] {
    const caps = SDK_CAPABILITIES[id] ?? {};
    return Object.fromEntries(
        CAPABILITIES.map((c) => [c, caps[c] ?? "none"]),
    ) as BrandSummary["capabilities"];
}

// Scored brands ranked under a preset (balanced by default), best first.
export function sdkLeaderboard(preset: SdkPreset = "balanced"): BrandSummary[] {
    const rows = SCORED_BRANDS.flatMap((brand) => {
        const score = scoreById.get(brand.id);
        if (!score) return [];
        const actuators = actuatorsOfBrand(brand);
        return [
            {
                brand,
                score: { ...score, overall: weightedOverall(score.dimensions, preset) },
                rank: 0,
                confidence: confidenceOf(score.evidenceCount),
                actuatorIds: actuators.map((a) => a.id),
                pricePerNm: median(
                    actuators
                        .map((a) => a.price_per_nm)
                        .filter((p): p is number => typeof p === "number"),
                ),
                capabilities: capabilitiesOf(brand.id),
            },
        ];
    });
    rows.sort((a, b) => b.score.overall - a.score.overall);
    return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

const BALANCED = sdkLeaderboard();
const summaryById = new Map(BALANCED.map((s) => [s.brand.id, s]));

export function brandSummary(id: string): BrandSummary | undefined {
    return summaryById.get(id);
}

// Checks behind a brand's objective scores, the repository ones included.
export function checksFor(id: string): SdkCheck[] {
    const b = getSdkBrand(id);
    if (!b) return [];
    const sourceFor = (repo: string) =>
        SDK_SOURCES.find(
            (s) => s.url.toLowerCase() === `https://github.com/${repo}`.toLowerCase(),
        )?.id;
    const repos = SDK_REPOS.filter((r) => b.repos.some((x) => x.repo === r.repo));
    return [...(SDK_CHECKS[id] ?? []), ...repoChecks(repos, sourceFor, SDK_AS_OF)];
}

export function timelineFor(brand: string): MonthCount[] {
    return scores.timeline[brand] ?? [];
}

export interface SdkLookup {
    brandId: string;
    brandName: string;
    overall: number;
    rank: number;
    of: number;
    confidence: Confidence;
    url: string;
}

function lookupFor(b: SdkBrand | undefined): SdkLookup | null {
    const s = b && summaryById.get(b.id);
    if (!b || !s) return null;
    return {
        brandId: b.id,
        brandName: b.name,
        overall: s.score.overall,
        rank: s.rank,
        of: BALANCED.length,
        confidence: s.confidence,
        url: `${SDK_PATH}#brand=${b.id}`,
    };
}

// SDK score for a catalog actuator id, null for reducers and bare motors
// (including a bare motor from a brand whose drives are scored).
export function sdkScoreForActuator(actuatorId: string): SdkLookup | null {
    const a = ACTUATORS.find((x) => x.id === actuatorId);
    return a && !isBareHardware(a) ? lookupFor(sdkBrandForCatalogBrand(a.brand)) : null;
}

// Why a key has no SDK score: a brand or catalog actuator with nothing to
// score (reducer, bare motor), or a key that names neither.
export function noSdkScoreReason(key: string): "unscored" | "unknown" {
    return getSdkBrand(key) || ACTUATORS.some((a) => a.id === key)
        ? "unscored"
        : "unknown";
}

// SDK score for an SDK brand id ("odrive") or a catalog brand string
// ("ODrive Robotics").
export function sdkScoreForBrand(brand: string): SdkLookup | null {
    return lookupFor(getSdkBrand(brand) ?? sdkBrandForCatalogBrand(brand));
}

// Every catalog actuator id mapped to its brand's SDK score (for /open-source
// and other pages that want a one-line SDK verdict).
export function sdkScoreLookup(): Record<string, SdkLookup> {
    const out: Record<string, SdkLookup> = {};
    for (const a of ACTUATORS) {
        const s = sdkScoreForActuator(a.id);
        if (s) out[a.id] = s;
    }
    return out;
}

export const UNSCORED_BRANDS = SDK_BRANDS.filter((b) => b.kind === "none");

// A brand's summary under a preset, from an SDK brand id ("odrive") or a
// catalog actuator id ("odrive-s1"); undefined for unknown or unscored keys.
export function resolveSdkBrand(
    key: string,
    preset: SdkPreset = "balanced",
): BrandSummary | undefined {
    const id = getSdkBrand(key)?.id ?? sdkScoreForActuator(key)?.brandId;
    if (!id) return undefined;
    return preset === "balanced"
        ? brandSummary(id)
        : sdkLeaderboard(preset).find((s) => s.brand.id === id);
}
