import { CHECKS, type CheckDef, type CheckRule, OSI, RUBRIC_VERSION } from "./rubric";
import {
    type BrandScore,
    CAPABILITY_IDS,
    type CapabilityId,
    type CheckResult,
    DIMENSION_IDS,
    type DimensionId,
    type DimensionScore,
    type Evidence,
    type EvidenceFile,
    type Provenance,
    type ScoresFile,
    type Signal,
} from "./types";

// Applies the rubric to an evidence snapshot. Pure: the pipeline calls it to
// write sdk-scores.json and a test calls it to prove the committed scores
// still follow from the committed evidence.

export interface CatalogEntry {
    id: string;
    brand: string;
    name: string;
    commandable: boolean;
    pricePerNm: number | null;
}

const FORUM_SOURCES = new Set<Evidence["source"]>(["hn", "reddit", "ros-discourse"]);

interface Ctx {
    items: Evidence[];
    file: EvidenceFile;
}

const ok = (file: EvidenceFile, id: string) =>
    file.collectors.some((c) => c.id === id && c.status === "ok");

function collectorRan(ctx: Ctx, signals: Signal[]): boolean {
    if (signals.includes("forum-mention"))
        return ctx.file.collectors.some(
            (c) => FORUM_SOURCES.has(c.id as Evidence["source"]) && c.status === "ok",
        );
    return ok(ctx.file, "github-git");
}

const result = (
    def: CheckDef,
    share: number | null,
    evidence: Evidence[],
): CheckResult => ({
    id: def.id,
    status:
        share === null
            ? "unknown"
            : share >= 1
              ? "pass"
              : share > 0
                ? "partial"
                : "fail",
    points: share === null ? 0 : Math.round(def.max * share * 100) / 100,
    max: def.max,
    evidence: evidence.map((e) => e.id),
});

const tierShare = (total: number, tiers: [number, number][], lowerIsBetter = false) =>
    tiers.find(([bound]) => (lowerIsBetter ? total <= bound : total >= bound))?.[1] ??
    0;

const median = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? (s[m] ?? 0) : ((s[m - 1] ?? 0) + (s[m] ?? 0)) / 2;
};

type Rule<K extends CheckRule["kind"]> = Extract<CheckRule, { kind: K }>;

function presence(def: CheckDef, rule: Rule<"presence">, ctx: Ctx): CheckResult {
    const hits = ctx.items.filter(
        (e) =>
            rule.signals.includes(e.signal) &&
            (!rule.osiOnly || (e.spdx !== undefined && OSI.has(e.spdx))),
    );
    const official = hits.filter((e) => e.official !== false);
    if (official.length > 0) return result(def, 1, official);
    if (hits.length > 0) return result(def, rule.communityFull ? 1 : 0.5, hits);
    return result(def, collectorRan(ctx, rule.signals) ? 0 : null, []);
}

function tiers(def: CheckDef, rule: Rule<"tiers">, ctx: Ctx): CheckResult {
    const hits = ctx.items.filter(
        (e) => rule.signals.includes(e.signal) && (!rule.officialOnly || e.official),
    );
    if (!collectorRan(ctx, rule.signals)) return result(def, null, hits);
    const total = hits.reduce((sum, e) => sum + (e.value ?? 1), 0);
    const counted = hits.filter((e) => (e.value ?? 1) > 0);
    return result(def, tierShare(total, rule.tiers), counted);
}

function response(def: CheckDef, rule: Rule<"response">, ctx: Ctx): CheckResult {
    if (!ok(ctx.file, "github-rest")) return result(def, null, []);
    const hits = ctx.items.filter((e) => e.signal === "issue-response");
    if (hits.length === 0) return result(def, 0, []);
    const hours = median(hits.map((e) => e.value ?? 0));
    return result(def, tierShare(hours, rule.tiers, true), hits);
}

function classified(def: CheckDef, rule: Rule<"classified">, ctx: Ctx): CheckResult {
    if (ctx.file.classifier.status !== "ok") return result(def, null, []);
    const posts = ctx.items.filter(
        (e) => e.dimensions?.includes(rule.dimension) && e.polarity,
    );
    if (posts.length < rule.minPosts) return result(def, null, posts);
    const negative = posts.filter((e) => e.polarity === "negative").length;
    return result(def, 1 - negative / posts.length, posts);
}

function evaluate(def: CheckDef, ctx: Ctx): CheckResult {
    const rule = def.rule;
    switch (rule.kind) {
        case "presence":
            return presence(def, rule, ctx);
        case "tiers":
            return tiers(def, rule, ctx);
        case "community-repos": {
            const repos = ctx.items.filter(
                (e) => e.signal === "repo" && e.official === false,
            );
            if (!ok(ctx.file, "github-git")) return result(def, null, repos);
            return result(def, tierShare(repos.length, rule.tiers), repos);
        }
        case "response":
            return response(def, rule, ctx);
        case "classified":
            return classified(def, rule, ctx);
    }
}

function dimension(id: DimensionId, ctx: Ctx | null): DimensionScore {
    if (!ctx) return { score: null, checks: [] };
    const checks = CHECKS.filter((c) => c.dimension === id).map((c) =>
        evaluate(c, ctx),
    );
    const known = checks.filter((c) => c.status !== "unknown");
    const max = known.reduce((s, c) => s + c.max, 0);
    const pts = known.reduce((s, c) => s + c.points, 0);
    return { score: max > 0 ? Math.round((pts / max) * 100) / 10 : null, checks };
}

const CAPABILITY_SIGNAL: Record<CapabilityId, Signal> = {
    python: "lang:python",
    cpp: "lang:cpp",
    rust: "lang:rust",
    ros2: "ros2-package",
    ros2_control: "ros2-control",
    urdf: "urdf",
    mjcf: "mjcf",
    open_firmware: "firmware-source",
    documented_protocol: "protocol-doc",
};

function capabilities(items: Evidence[]): Record<CapabilityId, Provenance | null> {
    const out = {} as Record<CapabilityId, Provenance | null>;
    for (const cap of CAPABILITY_IDS) {
        const hits = items.filter((e) => e.signal === CAPABILITY_SIGNAL[cap]);
        out[cap] = hits.some((e) => e.official !== false)
            ? "official"
            : hits.length > 0
              ? "community"
              : null;
    }
    return out;
}

export function scoreSnapshot(
    file: EvidenceFile,
    catalog: readonly CatalogEntry[],
): ScoresFile {
    const brands = [...new Set(catalog.map((a) => a.brand))];
    const scores: BrandScore[] = brands.map((brand) => {
        const entries = catalog.filter((a) => a.brand === brand);
        const applicable = entries.some((a) => a.commandable);
        const items = file.evidence.filter((e) => e.brand === brand);
        const ctx = applicable ? { items, file } : null;
        const prices = entries
            .filter((a) => a.commandable && a.pricePerNm !== null)
            .map((a) => a.pricePerNm as number);
        return {
            brand,
            name: entries[0]?.name ?? brand,
            applicable,
            actuatorIds: entries.map((a) => a.id),
            dimensions: Object.fromEntries(
                DIMENSION_IDS.map((d) => [d, dimension(d, ctx)]),
            ) as Record<DimensionId, DimensionScore>,
            capabilities: capabilities(items),
            evidenceCount: items.length,
            medianPricePerNm: prices.length
                ? Math.round(median(prices) * 100) / 100
                : null,
        };
    });
    return { asOf: file.asOf, rubricVersion: RUBRIC_VERSION, brands: scores };
}
