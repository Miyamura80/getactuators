import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Forum } from "@/sdk/types";

// Shared plumbing for the /sdk seeding pipeline. Raw posts and review
// output stay in node_modules/.cache/sdk-signals/ (never committed): only the derived,
// paraphrased dataset in src/sdk/data/ is committed.

export const ROOT = join(import.meta.dir, "..", "..");
export const CACHE = join(ROOT, "node_modules", ".cache", "sdk-signals");
export const DATA = join(ROOT, "src", "sdk", "data");
export const USER_AGENT =
    "actuatorlist-sdk-signals/1.0 (+https://actuatorlist.com/sdk)";

// One public post or issue as collected. `text` never leaves the cache.
export interface RawPost {
    key: string;
    forum: Forum;
    url: string;
    venue: string;
    date: string;
    score: number | null;
    title: string;
    text: string;
    // Search term that found it; the matcher decides which brands it is about.
    query: string;
}

export function readJson<T>(path: string, fallback: T): T {
    if (!existsSync(path)) return fallback;
    return JSON.parse(readFileSync(path, "utf8")) as T;
}

export function writeJson(path: string, data: unknown): void {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${JSON.stringify(data, null, 4)}\n`);
}

export const rawPath = (forum: Forum) => join(CACHE, "raw", `${forum}.json`);

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// GET a JSON document, retrying on 429 / 5xx with backoff. Returns null on a
// hard failure so one blocked source does not stop the run.
export async function getJson<T>(
    url: string,
    headers: Record<string, string> = {},
    tries = 4,
): Promise<T | null> {
    for (let attempt = 0; attempt < tries; attempt++) {
        try {
            const res = await fetch(url, {
                headers: {
                    "user-agent": USER_AGENT,
                    accept: "application/json",
                    ...headers,
                },
            });
            if (res.ok) return (await res.json()) as T;
            if (res.status === 429 || res.status >= 500) {
                const wait = Number(res.headers.get("retry-after") ?? 0) * 1000;
                await sleep(Math.max(wait, 2000 * 2 ** attempt));
                continue;
            }
            console.warn(`  ${res.status} ${url}`);
            return null;
        } catch (e) {
            console.warn(`  fetch failed ${url}: ${(e as Error).message}`);
            await sleep(1000 * 2 ** attempt);
        }
    }
    return null;
}

// Strip markup and collapse whitespace; posts are cut to keep prompts small.
export function plain(html: string, max = 1500): string {
    return html
        .replace(/<[^>]+>/g, " ")
        .replace(/&#x27;|&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&gt;/g, ">")
        .replace(/&lt;/g, "<")
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, max);
}

export const isoDate = (d: string | number) =>
    new Date(typeof d === "number" ? d * 1000 : d).toISOString().slice(0, 10);

// Merge new posts into the cached set for a forum, keyed by `key`.
export function mergeRaw(forum: Forum, posts: RawPost[]): number {
    const path = rawPath(forum);
    const byKey = new Map(readJson<RawPost[]>(path, []).map((p) => [p.key, p]));
    for (const p of posts) byKey.set(p.key, p);
    writeJson(path, [...byKey.values()]);
    return byKey.size;
}
