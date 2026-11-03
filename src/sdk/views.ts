import { z } from "zod";
import { absoluteUrl } from "../server/site";
import { refs, sourceRefOut } from "../supply-chain/views";
import { evidenceFor, painPoints } from "./evidence";
import {
    type BrandSummary,
    CAPABILITIES,
    DIMENSION_LABEL,
    FORUMS,
    PRESET_WEIGHTS,
    SDK_AS_OF,
    SDK_DIMENSIONS,
    SDK_METHOD,
    SDK_PATH,
    SDK_PRESETS,
    type SdkEvidence,
    type SdkPreset,
    UNSCORED_BRANDS,
    checksFor,
    sdkLeaderboard,
    sdkScoreForActuator,
} from "./index";

// Wire shape of /sdk for REST and MCP: snake_case, nulls for unknowns,
// sources inline. Server side only (zod).

const dimensionOut = z.object({
    dimension: z.enum(SDK_DIMENSIONS),
    label: z.string(),
    score: z
        .number()
        .describe("0 to 100: objective checks blended with community posts."),
    objective: z.number().nullable().describe("Share of checks passed, 0 to 100."),
    community: z
        .number()
        .nullable()
        .describe("Recency-weighted share of positive posts."),
    positive: z.number(),
    negative: z.number(),
});

const capabilityState = z.enum(["official", "community", "none"]);

const checkOut = z.object({
    dimension: z.enum(SDK_DIMENSIONS),
    label: z.string(),
    value: z.number().describe("1 pass, 0.5 partly, 0 not found."),
    sources: z.array(sourceRefOut),
});

export const evidenceOut = z.object({
    id: z.string(),
    dimension: z.enum(SDK_DIMENSIONS),
    polarity: z.enum(["positive", "negative"]),
    claim: z.string().describe("Our one-sentence summary of the post (not a quote)."),
    theme: z.string(),
    url: z.string().describe("The public post the claim comes from."),
    forum: z.enum(FORUMS),
    venue: z.string(),
    date: z.string(),
});

const painOut = z.object({
    dimension: z.enum(SDK_DIMENSIONS),
    theme: z.string(),
    count: z.number(),
    example_urls: z.array(z.string()),
});

export const sdkBrandOut = z.object({
    id: z.string(),
    name: z.string(),
    url: z.string().describe("Deep link to the brand on /sdk."),
    rank: z.number(),
    overall: z.number().describe("Preset-weighted mean of the dimension scores."),
    confidence: z.enum(["high", "medium", "low"]),
    evidence_count: z.number(),
    catalog_brands: z.array(z.string()),
    actuator_ids: z.array(z.string()),
    price_per_nm_median: z.number().nullable(),
    dimensions: z.array(dimensionOut),
    capabilities: z.object(
        Object.fromEntries(CAPABILITIES.map((c) => [c, capabilityState])) as Record<
            (typeof CAPABILITIES)[number],
            typeof capabilityState
        >,
    ),
    checks: z.array(checkOut),
    pain_points: z.array(painOut),
    evidence: z.array(evidenceOut).describe("Newest first; capped in list views."),
});

export const sdkListOut = z.object({
    as_of: z.string(),
    preset: z.enum(SDK_PRESETS),
    weights: z.record(z.string(), z.number()),
    method: z.object({
        labelled_by: z
            .string()
            .describe(
                "Who read the posts and labelled their claims; no model API is called.",
            ),
        posts_scanned: z.number(),
        posts_matched: z.number(),
        gold_items: z.number(),
        agreement: z.array(
            z.object({
                dimension: z.enum(SDK_DIMENSIONS),
                agreement: z.number(),
                overlap: z.number(),
            }),
        ),
    }),
    total: z.number(),
    results: z.array(sdkBrandOut),
    unscored: z.array(
        z.object({ id: z.string(), name: z.string(), reason: z.string() }),
    ),
});

function evidenceView(e: SdkEvidence): z.input<typeof evidenceOut> {
    return {
        id: e.id,
        dimension: e.dimension,
        polarity: e.polarity,
        claim: e.claim,
        theme: e.theme,
        url: e.url,
        forum: e.forum,
        venue: e.venue,
        date: e.date,
    };
}

export function sdkBrandView(
    s: BrandSummary,
    evidenceLimit = Number.POSITIVE_INFINITY,
): z.input<typeof sdkBrandOut> {
    const id = s.brand.id;
    return {
        id,
        name: s.brand.name,
        url: absoluteUrl(`${SDK_PATH}#brand=${id}`),
        rank: s.rank,
        overall: s.score.overall,
        confidence: s.confidence,
        evidence_count: s.score.evidenceCount,
        catalog_brands: s.brand.catalogBrands,
        actuator_ids: s.actuatorIds,
        price_per_nm_median: s.pricePerNm,
        dimensions: SDK_DIMENSIONS.flatMap((d) => {
            const v = s.score.dimensions[d];
            return v ? [{ dimension: d, label: DIMENSION_LABEL[d], ...v }] : [];
        }),
        capabilities: s.capabilities,
        checks: checksFor(id).map((c) => ({
            dimension: c.dimension,
            label: c.label,
            value: c.value,
            sources: refs(c.sources),
        })),
        pain_points: painPoints(id).map((p) => ({
            dimension: p.dimension,
            theme: p.theme,
            count: p.count,
            example_urls: p.examples.map((e) => e.url),
        })),
        evidence: evidenceFor(id).slice(0, evidenceLimit).map(evidenceView),
    };
}

// The one-line SDK verdict attached to an actuator (REST detail, get_actuator).
export const sdkLookupOut = z
    .object({
        brand_id: z.string(),
        brand_name: z.string(),
        overall: z.number().describe("0 to 100, balanced preset."),
        rank: z.number(),
        of: z.number().describe("Number of scored brands."),
        confidence: z.enum(["high", "medium", "low"]),
        url: z.string(),
    })
    .nullable()
    .describe("The brand's SDK score from /sdk; null for reducers and bare motors.");

export function sdkLookupView(actuatorId: string): z.input<typeof sdkLookupOut> {
    const s = sdkScoreForActuator(actuatorId);
    return s
        ? {
              brand_id: s.brandId,
              brand_name: s.brandName,
              overall: s.overall,
              rank: s.rank,
              of: s.of,
              confidence: s.confidence,
              url: absoluteUrl(s.url),
          }
        : null;
}

export function sdkListView(
    preset: SdkPreset = "balanced",
): z.input<typeof sdkListOut> {
    const rows = sdkLeaderboard(preset);
    return {
        as_of: SDK_AS_OF,
        preset,
        weights: PRESET_WEIGHTS[preset],
        method: {
            labelled_by: SDK_METHOD.labelledBy,
            posts_scanned: SDK_METHOD.postsScanned,
            posts_matched: SDK_METHOD.postsMatched,
            gold_items: SDK_METHOD.gold.items,
            agreement: SDK_METHOD.gold.agreement.map((a) => ({
                dimension: a.dimension,
                agreement: a.agreement,
                overlap: a.overlap,
            })),
        },
        total: rows.length,
        results: rows.map((s) => sdkBrandView(s, 5)),
        unscored: UNSCORED_BRANDS.map((b) => ({
            id: b.id,
            name: b.name,
            reason: b.noneReason ?? "",
        })),
    };
}
