import evidenceRaw from "./data/sdk-evidence.json";
import scoresRaw from "./data/sdk-scores.json";
import { CHECKS, type CheckDef, DIMENSIONS, PRESETS, type Preset } from "./rubric";
import {
    type BrandScore,
    DIMENSION_IDS,
    type DimensionId,
    type Evidence,
    type EvidenceFile,
    type ScoresFile,
} from "./types";

// /sdk: which actuators have the best SDK. Data comes from the committed
// pipeline snapshot (scripts/sdk-signals); this module only reads it.

export const SDK_PATH = "/sdk";
export const SDK_EVIDENCE = evidenceRaw as unknown as EvidenceFile;
export const SDK_SCORES = scoresRaw as unknown as ScoresFile;

export * from "./rubric";
export * from "./types";

const BY_ID = new Map(SDK_EVIDENCE.evidence.map((e) => [e.id, e]));
const CHECK_BY_ID = new Map(CHECKS.map((c) => [c.id, c]));

export const evidenceById = (id: string): Evidence | undefined => BY_ID.get(id);
export const checkDef = (id: string): CheckDef | undefined => CHECK_BY_ID.get(id);
export const dimensionDef = (id: DimensionId) => DIMENSIONS.find((d) => d.id === id);

export function presetById(id: string | null | undefined): Preset {
    return PRESETS.find((p) => p.id === id) ?? (PRESETS[0] as Preset);
}

export interface Overall {
    score: number | null;
    // Share of the preset's weight that sits on scored dimensions, 0..1.
    coverage: number;
}

// Weighted mean of the scored dimensions; unscored ones drop out and lower
// the coverage instead of counting as zero.
export function overall(b: BrandScore, preset: Preset = presetById(null)): Overall {
    let sum = 0;
    let weight = 0;
    let total = 0;
    for (const d of DIMENSION_IDS) {
        const w = preset.weights[d];
        total += w;
        const s = b.dimensions[d].score;
        if (s === null) continue;
        sum += s * w;
        weight += w;
    }
    return {
        score: weight > 0 ? Math.round((sum / weight) * 10) / 10 : null,
        coverage: total > 0 ? Math.round((weight / total) * 100) / 100 : 0,
    };
}

export const scoredBrands = (): BrandScore[] =>
    SDK_SCORES.brands.filter((b) => b.applicable);
export const unscoredBrands = (): BrandScore[] =>
    SDK_SCORES.brands.filter((b) => !b.applicable);

export interface LeaderRow {
    rank: number;
    brand: BrandScore;
    overall: Overall;
}

export function leaderboard(preset: Preset = presetById(null)): LeaderRow[] {
    return scoredBrands()
        .map((brand) => ({ brand, overall: overall(brand, preset) }))
        .sort(
            (a, b) =>
                (b.overall.score ?? -1) - (a.overall.score ?? -1) ||
                b.brand.evidenceCount - a.brand.evidenceCount ||
                a.brand.name.localeCompare(b.brand.name),
        )
        .map((row, i) => ({ ...row, rank: i + 1 }));
}

export const brandScore = (brand: string): BrandScore | undefined =>
    SDK_SCORES.brands.find((b) => b.brand === brand);

export const evidenceFor = (brand: string): Evidence[] =>
    SDK_EVIDENCE.evidence.filter((e) => e.brand === brand);

export const forumPosts = (brand?: string): Evidence[] =>
    SDK_EVIDENCE.evidence.filter(
        (e) => e.signal === "forum-mention" && (!brand || e.brand === brand),
    );

export interface ActuatorSdk {
    brand: string;
    name: string;
    score: number | null;
    rank: number;
    of: number;
    url: string;
}

// The SDK badge on an actuator page: its brand's balanced score and rank.
// Null for actuators the catalog lists without a command interface.
export function sdkForActuator(
    actuatorId: string,
    commandable: boolean,
): ActuatorSdk | null {
    if (!commandable) return null;
    const rows = leaderboard();
    const row = rows.find((r) => r.brand.actuatorIds.includes(actuatorId));
    if (!row) return null;
    return {
        brand: row.brand.brand,
        name: row.brand.name,
        score: row.overall.score,
        rank: row.rank,
        of: rows.length,
        url: `${SDK_PATH}?brand=${row.brand.brand}`,
    };
}

// Monthly forum post counts, oldest first, for the posts of one brand (or all).
export function mentionTimeline(brand?: string): { month: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const e of forumPosts(brand)) {
        const m = e.date?.slice(0, 7);
        if (m) counts.set(m, (counts.get(m) ?? 0) + 1);
    }
    return [...counts.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({ month, count }));
}

export interface ThemeCluster {
    dimension: DimensionId;
    count: number;
    examples: Evidence[];
}

// Forum posts per brand grouped by the SDK theme they were tagged with,
// largest first, with the newest three posts as examples.
export function themeClusters(brand: string): ThemeCluster[] {
    const posts = forumPosts(brand);
    return DIMENSION_IDS.map((dimension) => {
        const hits = posts
            .filter((p) => p.dimensions?.includes(dimension))
            .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
        return { dimension, count: hits.length, examples: hits.slice(0, 3) };
    })
        .filter((c) => c.count > 0)
        .sort((a, b) => b.count - a.count);
}
