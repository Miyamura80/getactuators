import { join } from "node:path";
import {
    type ClassifierAgreement,
    SDK_DIMENSIONS,
    type SdkDimension,
} from "@/sdk/types";
import { CACHE, ROOT, type RawPost, readJson, writeJson } from "./common";
import type { Label } from "./labels";

// Gold-set evaluation. scripts/sdk-signals/gold-labels.json holds hand labels
// for a fixed sample of posts (by key; the text stays in the cache). For each
// dimension, agreement = share of (post, brand) pairs where the label's
// verdict (positive, negative or no claim) matches the check-set one; overlap is
// the stricter share of (post, brand) pairs where both raters made a claim with
// the same polarity, among pairs where either made a claim. Scores are
// committed only when every dimension reaches MIN_AGREEMENT, compared before
// rounding.

export const GOLD_PATH = join(ROOT, "scripts", "sdk-signals", "gold-labels.json");
export const GOLD_SIZE = 150;
export const MIN_AGREEMENT = 0.8;

type GoldLabel = Omit<Label, "theme" | "claim">;

export interface GoldFile {
    labelledBy: string;
    items: { key: string; brands: string[]; labels: GoldLabel[] }[];
}

// A brand- and forum-stratified, deterministic sample of matched posts to
// label: round robin over (brand, forum) buckets, newest first within each.
// Written to the cache with text for labelling; only keys and labels are
// committed.
export function goldSample(posts: { post: RawPost; brands: string[] }[]): void {
    const buckets = new Map<string, RawPost[]>();
    for (const { post, brands } of posts)
        for (const b of brands) {
            const k = `${b}|${post.forum}`;
            buckets.set(k, [...(buckets.get(k) ?? []), post]);
        }
    for (const list of buckets.values())
        list.sort((a, b) => b.date.localeCompare(a.date));
    const picked = new Map<string, RawPost>();
    for (let round = 0; picked.size < GOLD_SIZE && round < 200; round++)
        for (const list of buckets.values()) {
            const p = list[round];
            if (p && picked.size < GOLD_SIZE) picked.set(p.key, p);
        }
    const brandsOf = new Map(posts.map((p) => [p.post.key, p.brands]));
    writeJson(
        join(CACHE, "gold-sample.json"),
        [...picked.values()].map((p) => ({
            key: p.key,
            brands: brandsOf.get(p.key),
            title: p.title,
            text: p.text,
        })),
    );
    console.log(`  wrote ${picked.size} posts to label in ${CACHE}/gold-sample.json`);
}

type Verdict = "positive" | "negative" | "none";

// One rater's verdict per brand on one dimension. A rater giving both
// polarities on one dimension counts as negative (the complaint wins).
function verdicts(labels: readonly GoldLabel[], dimension: SdkDimension) {
    const out = new Map<string, Verdict>();
    for (const l of labels)
        if (l.dimension === dimension && out.get(l.brand) !== "negative")
            out.set(l.brand, l.polarity);
    return out;
}

export const r2 = (x: number) => Math.round(x * 100) / 100;

// Every (gold verdict, committed-label verdict) pair on one dimension.
function pairs(
    gold: GoldFile,
    labels: Map<string, Label[]>,
    dimension: SdkDimension,
): [Verdict, Verdict][] {
    return gold.items.flatMap((item) => {
        const g = verdicts(item.labels, dimension);
        const c = verdicts(labels.get(item.key) ?? [], dimension);
        const brands = new Set([...item.brands, ...g.keys(), ...c.keys()]);
        return [...brands].map((b): [Verdict, Verdict] => [
            g.get(b) ?? "none",
            c.get(b) ?? "none",
        ]);
    });
}

// Unrounded agreement and overlap per dimension; round with r2 for display.
export function evaluate(labels: Map<string, Label[]>): ClassifierAgreement[] {
    const gold = readJson<GoldFile>(GOLD_PATH, { labelledBy: "", items: [] });
    return SDK_DIMENSIONS.map((dimension) => {
        const ps = pairs(gold, labels, dimension);
        const same = ps.filter(([g, c]) => g === c).length;
        const either = ps.filter(([g, c]) => g !== "none" || c !== "none").length;
        const both = ps.filter(([g, c]) => g !== "none" && g === c).length;
        return {
            dimension,
            agreement: ps.length === 0 ? 0 : same / ps.length,
            overlap: either === 0 ? 1 : both / either,
            goldItems: ps.filter(([g]) => g !== "none").length,
        };
    });
}
