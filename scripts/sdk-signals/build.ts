import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { SCORED_BRANDS } from "@/sdk/brands";
import { type RepoStats, repoChecks, scoreBrand } from "@/sdk/score";
import { SDK_SOURCES } from "@/sdk/sources";
import {
    type ClassifierAgreement,
    FORUMS,
    type MonthCount,
    type SdkEvidence,
} from "@/sdk/types";
import { DATA, type RawPost, rawPath, readJson, writeJson } from "./common";
import {
    GOLD_PATH,
    GOLD_SIZE,
    type GoldFile,
    MIN_AGREEMENT,
    evaluate,
    goldSample,
    r2,
} from "./gold";
import {
    GUIDE_VERSION,
    LABELLED_BY,
    type Label,
    THEMES,
    exportUnlabelled,
    labelsFor,
} from "./labels";
import { matchBrands } from "./match";

// Score step: raw posts -> matched brands -> committed labels -> evidence,
// per-brand scores, monthly sentiment and the gold-set agreement, written to
// src/sdk/data/sdk-evidence.json and sdk-scores.json.

const EM_DASH = String.fromCharCode(0x2014);
const EARLIEST = "2012-01-01";
// Our own issue tracker discusses this page, not the brands.
const SELF = "Miyamura80/getactuators";

export function matchedPosts(): { post: RawPost; brands: string[] }[] {
    const posts = FORUMS.flatMap((f) => readJson<RawPost[]>(rawPath(f), []));
    const seenUrl = new Set<string>();
    const out: { post: RawPost; brands: string[] }[] = [];
    for (const post of posts) {
        if (seenUrl.has(post.url) || post.date < EARLIEST || post.venue === SELF)
            continue;
        seenUrl.add(post.url);
        const brands = matchBrands(post);
        if (brands.length) out.push({ post, brands });
    }
    return out;
}

// Paraphrases are ours; still strip characters the repo's prose checks reject.
const tidy = (s: string) =>
    s.replaceAll(EM_DASH, ", ").replace(/\s+/g, " ").trim().slice(0, 220);

// One evidence item per (post, brand, dimension). When a post carries several
// labels for the same pair, the polarity follows the gold evaluator's rule
// (a complaint wins) and the claim comes from the first label of that polarity.
function toEvidence(post: RawPost, labels: Label[]): SdkEvidence[] {
    const pick = new Map<string, Label>();
    for (const l of labels) {
        const k = `${l.brand}|${l.dimension}`;
        const prev = pick.get(k);
        if (!prev || (prev.polarity === "positive" && l.polarity === "negative"))
            pick.set(k, l);
    }
    const out: SdkEvidence[] = [];
    for (const [k, l] of pick) {
        const theme = THEMES[l.dimension].includes(l.theme) ? l.theme : "other";
        out.push({
            id: createHash("sha1")
                .update(`${post.key}|${k}`)
                .digest("hex")
                .slice(0, 12),
            brand: l.brand,
            dimension: l.dimension,
            polarity: l.polarity,
            claim: tidy(l.claim),
            theme,
            url: post.url,
            forum: post.forum,
            venue: post.venue,
            date: post.date,
            score: post.score,
        });
    }
    return out;
}

function timeline(evidence: readonly SdkEvidence[]): Record<string, MonthCount[]> {
    const out: Record<string, MonthCount[]> = {};
    for (const b of SCORED_BRANDS) {
        const months = new Map<string, MonthCount>();
        for (const e of evidence) {
            if (e.brand !== b.id) continue;
            const month = e.date.slice(0, 7);
            const m = months.get(month) ?? { month, positive: 0, negative: 0 };
            m[e.polarity]++;
            months.set(month, m);
        }
        out[b.id] = [...months.values()].sort((x, y) => x.month.localeCompare(y.month));
    }
    return out;
}

// Refuse to write scores from an empty or partial cache: every gold post must
// still be among the matched posts, or the agreement would be measured on
// posts the build no longer reads.
function gate(
    agreement: ClassifierAgreement[],
    gold: GoldFile,
    matched: readonly { post: RawPost }[],
): void {
    if (matched.length === 0)
        throw new Error("no cached post mentions a scored brand; run --steps=collect");
    if (gold.items.length < GOLD_SIZE)
        throw new Error(
            `gold set has ${gold.items.length} labelled posts, needs ${GOLD_SIZE}; run with --gold-sample and label ${GOLD_PATH}`,
        );
    const keys = new Set(matched.map((m) => m.post.key));
    const absent = gold.items.filter((i) => !keys.has(i.key)).map((i) => i.key);
    if (absent.length)
        throw new Error(
            `${absent.length} gold posts are not among the matched posts in the cache (${absent.slice(0, 5).join(", ")}); restore the raw cache or relabel the gold set`,
        );
    const low = agreement.filter((a) => a.agreement < MIN_AGREEMENT);
    for (const a of agreement)
        console.log(
            `  ${a.dimension}: agreement ${r2(a.agreement)}, overlap ${r2(a.overlap)}, gold ${a.goldItems}`,
        );
    if (low.length)
        throw new Error(
            `label agreement below ${MIN_AGREEMENT} on ${low.map((a) => a.dimension).join(", ")}; not writing scores`,
        );
}

export async function build(
    opts: { sample?: boolean; export?: boolean } = {},
): Promise<void> {
    const matched = matchedPosts();
    console.log(`  ${matched.length} posts mention a scored brand`);
    if (opts.sample) return goldSample(matched);
    if (opts.export) return exportUnlabelled(matched);
    const labels = labelsFor(matched);
    const agreement = evaluate(labels);
    const gold = readJson<GoldFile>(GOLD_PATH, { labelledBy: "", items: [] });
    gate(agreement, gold, matched);
    // The objective snapshot is required, and its date is the dataset's as-of
    // date, so a build-only rerun reproduces the same scores.
    const githubPath = join(DATA, "sdk-github.json");
    if (!existsSync(githubPath))
        throw new Error(`${githubPath} is missing; run --steps=objective first`);
    const github = readJson<{ asOf: string; repos: RepoStats[] }>(githubPath, {
        asOf: "",
        repos: [],
    });
    const asOf = github.asOf;
    const evidence = matched
        .flatMap(({ post }) => toEvidence(post, labels.get(post.key) ?? []))
        .sort((a, b) => a.brand.localeCompare(b.brand) || b.date.localeCompare(a.date));
    const sourceFor = (repo: string) =>
        SDK_SOURCES.find(
            (s) => s.url.toLowerCase() === `https://github.com/${repo}`.toLowerCase(),
        )?.id;
    const brands = SCORED_BRANDS.map((b) =>
        scoreBrand(
            b.id,
            evidence.filter((e) => e.brand === b.id),
            repoChecks(
                github.repos.filter((r) => b.repos.some((x) => x.repo === r.repo)),
                sourceFor,
                asOf,
            ),
            asOf,
        ),
    );
    writeJson(join(DATA, "sdk-evidence.json"), { asOf, items: evidence });
    writeJson(join(DATA, "sdk-scores.json"), {
        asOf,
        method: {
            labelledBy: LABELLED_BY,
            guideVersion: GUIDE_VERSION,
            postsScanned: FORUMS.reduce(
                (n, f) => n + readJson<RawPost[]>(rawPath(f), []).length,
                0,
            ),
            postsMatched: matched.length,
            gold: {
                items: gold.items.length,
                labelledBy: gold.labelledBy,
                agreement: agreement.map((a) => ({
                    ...a,
                    agreement: r2(a.agreement),
                    overlap: r2(a.overlap),
                })),
            },
        },
        brands,
        timeline: timeline(evidence),
    });
    console.log(
        `  wrote ${evidence.length} evidence items for ${brands.length} brands`,
    );
}
