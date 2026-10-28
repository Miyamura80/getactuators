import { z } from "zod";
import { absoluteUrl } from "../server/site";
import {
    CAPABILITY_IDS,
    DIMENSIONS,
    DIMENSION_IDS,
    PRESETS,
    type Preset,
    SDK_EVIDENCE,
    SDK_PATH,
    SDK_SCORES,
    brandScore,
    checkDef,
    evidenceById,
    forumPosts,
    leaderboard,
    overall,
    presetById,
    sdkForActuator,
    unscoredBrands,
} from "./index";
import type { BrandScore, Evidence } from "./types";

// Wire shapes shared by REST (/api/v1/sdk) and MCP (get_sdk_score).

export const PRESET_IDS = PRESETS.map((p) => p.id) as [string, ...string[]];

const dimScores = z
    .record(z.string(), z.number().nullable())
    .describe("Dimension id to score 0-10, null when nothing could be scored.");
const provenance = z.enum(["official", "community"]).nullable();

const leaderOut = z.object({
    rank: z.number(),
    brand: z.string(),
    name: z.string(),
    overall: z.number().nullable(),
    coverage: z
        .number()
        .describe("Share of the preset weight that could be scored, 0-1."),
    dimensions: dimScores,
    capabilities: z.record(z.string(), provenance),
    evidence_count: z.number(),
    median_price_per_nm: z.number().nullable(),
    actuator_ids: z.array(z.string()),
    url: z.string(),
});

export const sdkListOut = z.object({
    as_of: z.string(),
    preset: z.string(),
    presets: z.array(
        z.object({
            id: z.string(),
            label: z.string(),
            weights: z.record(z.string(), z.number()),
        }),
    ),
    dimensions: z.array(
        z.object({ id: z.string(), label: z.string(), question: z.string() }),
    ),
    leaderboard: z.array(leaderOut),
    not_scored: z.array(z.object({ brand: z.string(), name: z.string() })),
    collectors: z.array(
        z.object({
            id: z.string(),
            label: z.string(),
            status: z.string(),
            detail: z.string(),
            items: z.number(),
        }),
    ),
    classifier: z.object({
        status: z.string(),
        detail: z.string(),
        gold_set_size: z.number(),
        agreement: z.record(z.string(), z.number()).nullable(),
    }),
    url: z.string(),
});

const evidenceOut = z.object({
    id: z.string(),
    title: z.string(),
    url: z.string(),
    source: z.string(),
    official: z.boolean().nullable(),
    date: z.string().nullable(),
    quote: z.string().nullable(),
});

export const sdkBrandOut = z.object({
    brand: z.string(),
    name: z.string(),
    applicable: z.boolean(),
    as_of: z.string(),
    rank: z.number().nullable(),
    overall: z
        .record(z.string(), z.number().nullable())
        .describe("Preset id to overall score."),
    dimensions: z.array(
        z.object({
            id: z.string(),
            label: z.string(),
            score: z.number().nullable(),
            checks: z.array(
                z.object({
                    id: z.string(),
                    label: z.string(),
                    status: z.enum(["pass", "partial", "fail", "unknown"]),
                    points: z.number(),
                    max: z.number(),
                    evidence: z.array(evidenceOut),
                }),
            ),
        }),
    ),
    capabilities: z.record(z.string(), provenance),
    forum_posts: z.array(evidenceOut),
    actuator_ids: z.array(z.string()),
    url: z.string(),
});

export const sdkRefOut = z
    .object({
        brand: z.string(),
        name: z.string(),
        score: z.number().nullable(),
        rank: z.number(),
        of: z.number(),
        url: z.string(),
    })
    .nullable()
    .describe(
        "The brand's balanced SDK score and rank from /sdk; null without a command interface.",
    );

const brandUrl = (b: BrandScore) => absoluteUrl(`${SDK_PATH}?brand=${b.brand}`);

export function sdkListView(
    preset: Preset = presetById(null),
): z.infer<typeof sdkListOut> {
    const c = SDK_EVIDENCE.classifier;
    return {
        as_of: SDK_SCORES.asOf,
        preset: preset.id,
        presets: PRESETS.map((p) => ({
            id: p.id,
            label: p.label,
            weights: { ...p.weights },
        })),
        dimensions: DIMENSIONS.map((d) => ({
            id: d.id,
            label: d.label,
            question: d.question,
        })),
        leaderboard: leaderboard(preset).map((r) => ({
            rank: r.rank,
            brand: r.brand.brand,
            name: r.brand.name,
            overall: r.overall.score,
            coverage: r.overall.coverage,
            dimensions: Object.fromEntries(
                DIMENSION_IDS.map((d) => [d, r.brand.dimensions[d].score]),
            ),
            capabilities: Object.fromEntries(
                CAPABILITY_IDS.map((k) => [k, r.brand.capabilities[k]]),
            ),
            evidence_count: r.brand.evidenceCount,
            median_price_per_nm: r.brand.medianPricePerNm,
            actuator_ids: r.brand.actuatorIds,
            url: brandUrl(r.brand),
        })),
        not_scored: unscoredBrands().map((b) => ({ brand: b.brand, name: b.name })),
        collectors: SDK_EVIDENCE.collectors.map((r) => ({ ...r })),
        classifier: {
            status: c.status,
            detail: c.detail,
            gold_set_size: c.goldSetSize,
            agreement: c.agreement as Record<string, number> | null,
        },
        url: absoluteUrl(SDK_PATH),
    };
}

const evidenceView = (e: Evidence): z.infer<typeof evidenceOut> => ({
    id: e.id,
    title: e.title,
    url: e.url,
    source: e.source,
    official: e.official ?? null,
    date: e.date ?? null,
    quote: e.quote ?? null,
});

export function sdkBrandView(b: BrandScore): z.infer<typeof sdkBrandOut> {
    const rank = leaderboard().find((r) => r.brand.brand === b.brand)?.rank ?? null;
    return {
        brand: b.brand,
        name: b.name,
        applicable: b.applicable,
        as_of: SDK_SCORES.asOf,
        rank,
        overall: Object.fromEntries(PRESETS.map((p) => [p.id, overall(b, p).score])),
        dimensions: DIMENSIONS.map((d) => ({
            id: d.id,
            label: d.label,
            score: b.dimensions[d.id].score,
            checks: b.dimensions[d.id].checks.map((c) => ({
                id: c.id,
                label: checkDef(c.id)?.label ?? c.id,
                status: c.status,
                points: c.points,
                max: c.max,
                evidence: c.evidence
                    .map(evidenceById)
                    .filter((e): e is Evidence => !!e)
                    .map(evidenceView),
            })),
        })),
        capabilities: Object.fromEntries(
            CAPABILITY_IDS.map((k) => [k, b.capabilities[k]]),
        ),
        forum_posts: forumPosts(b.brand)
            .sort((x, y) => (y.date ?? "").localeCompare(x.date ?? ""))
            .slice(0, 10)
            .map(evidenceView),
        actuator_ids: b.actuatorIds,
        url: brandUrl(b),
    };
}

// Brand by id, or the brand of an actuator id.
export function findSdkBrand(key: string): BrandScore | undefined {
    return (
        brandScore(key) ?? SDK_SCORES.brands.find((b) => b.actuatorIds.includes(key))
    );
}

export function sdkRef(actuatorId: string, commandable: boolean) {
    const ref = sdkForActuator(actuatorId, commandable);
    return ref ? { ...ref, url: absoluteUrl(ref.url) } : null;
}
