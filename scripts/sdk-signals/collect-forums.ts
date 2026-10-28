import type { CollectorRun, Evidence } from "@/sdk/types";
import { excerpt, matchBrands, plainText, tagDimensions } from "./matcher";
import { TARGETS } from "./targets";

// Community angle: forum posts that name a brand and touch an SDK theme.
// Only the URL, date, forum, score, a <=300 character excerpt and the tags
// are kept; never usernames. Each source respects its public API limits.

interface Post {
    id: string;
    url: string;
    date: string;
    forum: string;
    score?: number;
    text: string;
}

const UA = "actuatorlist-sdk-signals/1 (+https://actuatorlist.com/sdk)";

function toEvidence(source: Evidence["source"], posts: Post[]): Evidence[] {
    const out = new Map<string, Evidence>();
    for (const p of posts) {
        const dimensions = tagDimensions(p.text);
        if (dimensions.length === 0) continue;
        for (const brand of matchBrands(p.text)) {
            const id = `${source}:${brand}:${p.id}`;
            if (out.has(id)) continue;
            out.set(id, {
                id,
                brand,
                signal: "forum-mention",
                source,
                url: p.url,
                title: `${p.forum} post`,
                date: p.date,
                forum: p.forum,
                score: p.score,
                quote: excerpt(brand, p.text),
                dimensions,
                polarity: null,
            });
        }
    }
    return [...out.values()];
}

const aliases = () => [...new Set(TARGETS.flatMap((t) => t.aliases))];

async function getJson(url: string, init: RequestInit = {}): Promise<unknown> {
    const r = await fetch(url, {
        ...init,
        headers: { "User-Agent": UA, ...(init.headers ?? {}) },
        signal: AbortSignal.timeout(30_000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status} from ${new URL(url).host}`);
    return r.json();
}

interface HnHit {
    objectID: string;
    created_at: string;
    title?: string | null;
    story_text?: string | null;
    comment_text?: string | null;
    story_title?: string | null;
    points?: number | null;
}

// Hacker News through the Algolia search API (exact phrase, no typos).
async function hackerNews(): Promise<Post[]> {
    const posts: Post[] = [];
    for (const alias of aliases()) {
        const q = new URLSearchParams({
            query: `"${alias}"`,
            tags: "(story,comment)",
            hitsPerPage: "200",
            typoTolerance: "false",
            advancedSyntax: "true",
        });
        const j = (await getJson(`https://hn.algolia.com/api/v1/search?${q}`)) as {
            hits: HnHit[];
        };
        for (const h of j.hits) {
            const text = plainText(
                [h.title, h.story_text, h.comment_text].filter(Boolean).join(" "),
            );
            posts.push({
                id: h.objectID,
                url: `https://news.ycombinator.com/item?id=${h.objectID}`,
                date: h.created_at.slice(0, 10),
                forum: "Hacker News",
                score: h.points ?? undefined,
                text,
            });
        }
        await Bun.sleep(300);
    }
    return posts;
}

const SUBREDDITS = [
    "robotics",
    "ROS",
    "diyrobotics",
    "robotdogs",
    "AskRobotics",
    "embedded",
];

// Reddit through the official API (app-only OAuth). Needs REDDIT_CLIENT_ID
// and REDDIT_CLIENT_SECRET in the environment; nothing is committed.
async function reddit(): Promise<Post[]> {
    const id = process.env.REDDIT_CLIENT_ID;
    const secret = process.env.REDDIT_CLIENT_SECRET;
    if (!id || !secret) {
        const reachable = await fetch("https://www.reddit.com/robots.txt", {
            signal: AbortSignal.timeout(15_000),
        }).then(
            (r) => r.ok,
            () => false,
        );
        throw new SkipError(
            `REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET not set${reachable ? "" : "; www.reddit.com was also unreachable from the collector's network"}`,
        );
    }
    const token = (await getJson("https://www.reddit.com/api/v1/access_token", {
        method: "POST",
        headers: {
            Authorization: `Basic ${btoa(`${id}:${secret}`)}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
    })) as { access_token: string };
    const posts: Post[] = [];
    for (const sub of SUBREDDITS)
        for (const alias of aliases()) {
            const q = new URLSearchParams({
                q: `"${alias}"`,
                restrict_sr: "1",
                limit: "100",
                sort: "relevance",
                t: "all",
            });
            const j = (await getJson(`https://oauth.reddit.com/r/${sub}/search?${q}`, {
                headers: { Authorization: `Bearer ${token.access_token}` },
            })) as {
                data: {
                    children: {
                        data: {
                            id: string;
                            permalink: string;
                            created_utc: number;
                            title: string;
                            selftext: string;
                            score: number;
                        };
                    }[];
                };
            };
            for (const { data: d } of j.data.children)
                posts.push({
                    id: d.id,
                    url: `https://www.reddit.com${d.permalink}`,
                    date: new Date(d.created_utc * 1000).toISOString().slice(0, 10),
                    forum: `r/${sub}`,
                    score: d.score,
                    text: plainText(`${d.title} ${d.selftext}`),
                });
            await Bun.sleep(1100);
        }
    return posts;
}

// ROS Discourse through its public search endpoint.
async function rosDiscourse(): Promise<Post[]> {
    const posts: Post[] = [];
    for (const alias of aliases()) {
        const j = (await getJson(
            `https://discourse.ros.org/search.json?q=${encodeURIComponent(`"${alias}"`)}`,
        )) as {
            posts?: {
                id: number;
                topic_id: number;
                post_number: number;
                created_at: string;
                blurb: string;
                like_count?: number;
            }[];
        };
        for (const p of j.posts ?? [])
            posts.push({
                id: String(p.id),
                url: `https://discourse.ros.org/t/${p.topic_id}/${p.post_number}`,
                date: p.created_at.slice(0, 10),
                forum: "ROS Discourse",
                score: p.like_count,
                text: plainText(p.blurb),
            });
        await Bun.sleep(1000);
    }
    return posts;
}

class SkipError extends Error {}

const SOURCES: [
    CollectorRun["id"],
    Evidence["source"],
    string,
    () => Promise<Post[]>,
][] = [
    ["hn", "hn", "Hacker News (Algolia API)", hackerNews],
    ["reddit", "reddit", "Reddit (official API)", reddit],
    ["ros-discourse", "ros-discourse", "ROS Discourse (search API)", rosDiscourse],
];

export async function collectForums(): Promise<{
    runs: CollectorRun[];
    evidence: Evidence[];
}> {
    const runs: CollectorRun[] = [];
    const evidence: Evidence[] = [];
    for (const [id, source, label, fn] of SOURCES) {
        try {
            const items = toEvidence(source, await fn());
            evidence.push(...items);
            runs.push({
                id,
                label,
                status: "ok",
                detail: `${items.length} SDK-related posts matched a brand`,
                items: items.length,
            });
        } catch (e) {
            const msg = (e as Error).message;
            const status = e instanceof SkipError ? "skipped" : "blocked";
            runs.push({
                id,
                label,
                status,
                detail:
                    status === "skipped"
                        ? msg
                        : `Unreachable from the collector: ${msg}`,
                items: 0,
            });
        }
        console.log(`  ${label}: ${runs.at(-1)?.status} (${runs.at(-1)?.items})`);
    }
    return { runs, evidence };
}
