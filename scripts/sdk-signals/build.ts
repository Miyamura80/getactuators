import { createHash } from "node:crypto";
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

function toEvidence(post: RawPost, labels: Label[]): SdkEvidence[] {
    const seen = new Set<string>();
    const out: SdkEvidence[] = [];
    for (const l of labels) {
        const k = `${l.brand}|${l.dimension}`;
        if (seen.has(k)) continue;
        seen.add(k);
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

function gate(agreement: ClassifierAgreement[], goldItems: number): void {
    if (goldItems < GOLD_SIZE)
        throw new Error(
            `gold set has ${goldItems} labelled posts, needs ${GOLD_SIZE}; run with --gold-sample and label ${GOLD_PATH}`,
        );
    const low = agreement.filter((a) => a.agreement < MIN_AGREEMENT);
    for (const a of agreement)
        console.log(
            `  ${a.dimension}: agreement ${a.agreement}, overlap ${a.overlap}, gold ${a.goldItems}`,
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
    gate(
        agreement,
        readJson<GoldFile>(GOLD_PATH, { labelledBy: "", items: [] }).items.length,
    );
    const asOf = new Date().toISOString().slice(0, 10);
    const evidence = matched
        .flatMap(({ post }) => toEvidence(post, labels.get(post.key) ?? []))
        .sort((a, b) => a.brand.localeCompare(b.brand) || b.date.localeCompare(a.date));
    const github = readJson<{ asOf: string; repos: RepoStats[] }>(
        join(DATA, "sdk-github.json"),
        { asOf, repos: [] },
    );
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
    const gold = readJson<GoldFile>(GOLD_PATH, { labelledBy: "", items: [] });
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
            gold: { items: gold.items.length, labelledBy: gold.labelledBy, agreement },
        },
        brands,
        timeline: timeline(evidence),
    });
    console.log(
        `  wrote ${evidence.length} evidence items for ${brands.length} brands`,
    );
}
