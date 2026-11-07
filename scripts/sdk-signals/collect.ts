import { SCORED_BRANDS } from "@/sdk/brands";
import { type Forum, REDDIT_SUBREDDITS } from "@/sdk/types";
import {
    REQUEST_TIMEOUT_MS,
    type RawPost,
    getJson,
    isoDate,
    mergeRaw,
    plain,
    sleep,
} from "./common";

// Collectors, one per forum. Each searches every scored brand's search terms,
// keeps URL, date, venue, score and the post text (cache only), and merges
// into node_modules/.cache/sdk-signals/raw/<forum>.json. Rate limits are respected with a
// pause between requests; credentials come from the environment only.

// Search terms plus every distinctive alias (four or more characters).
const terms = () => [
    ...new Set(
        SCORED_BRANDS.flatMap((b) => [
            ...b.searchTerms,
            ...b.aliases.filter((a) => a.length >= 4),
        ]),
    ),
];

// Hacker News through the public Algolia API (no key).
interface HnHit {
    objectID: string;
    created_at_i: number;
    points: number | null;
    title?: string | null;
    story_title?: string | null;
    story_text?: string | null;
    comment_text?: string | null;
}

async function collectHn(): Promise<RawPost[]> {
    const out: RawPost[] = [];
    for (const q of terms()) {
        const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(q)}&tags=(story,comment)&hitsPerPage=100`;
        const res = await getJson<{ hits: HnHit[] }>(url);
        for (const h of res?.hits ?? []) {
            const body = h.comment_text ?? h.story_text ?? "";
            out.push({
                key: `hn:${h.objectID}`,
                forum: "hn",
                url: `https://news.ycombinator.com/item?id=${h.objectID}`,
                venue: "Hacker News",
                date: isoDate(h.created_at_i),
                score: h.points ?? null,
                title: plain(h.title ?? h.story_title ?? "", 200),
                text: plain(body),
                query: q,
            });
        }
        await sleep(300);
    }
    return out;
}

// GitHub issues through the search API: a global issue search per term plus
// the brand's own repos. GITHUB_TOKEN raises the limit from 10 to 30 a minute.
interface GhIssue {
    number: number;
    html_url: string;
    title: string;
    body: string | null;
    created_at: string;
    repository_url: string;
    reactions?: { total_count: number };
}

const ghHeaders = (): Record<string, string> =>
    process.env.GITHUB_TOKEN
        ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
        : {};

function ghPost(i: GhIssue, query: string): RawPost {
    const repo = i.repository_url.replace("https://api.github.com/repos/", "");
    return {
        key: `github:${repo}#${i.number}`,
        forum: "github",
        url: i.html_url,
        venue: repo,
        date: isoDate(i.created_at),
        score: i.reactions?.total_count ?? null,
        title: plain(i.title, 200),
        text: plain(i.body ?? ""),
        query,
    };
}

async function collectGithub(): Promise<RawPost[]> {
    const out: RawPost[] = [];
    const pause = process.env.GITHUB_TOKEN ? 2500 : 7000;
    for (const q of terms()) {
        const url = `https://api.github.com/search/issues?q=${encodeURIComponent(`"${q}" is:issue`)}&per_page=100`;
        const res = await getJson<{ items: GhIssue[] }>(url, ghHeaders());
        for (const i of res?.items ?? []) out.push(ghPost(i, q));
        await sleep(pause);
    }
    // Issues filed in each brand's own repositories, most discussed first.
    for (const b of SCORED_BRANDS)
        for (const r of b.repos) {
            const q = encodeURIComponent(`repo:${r.repo} is:issue`);
            const url = `https://api.github.com/search/issues?q=${q}&sort=comments&per_page=60`;
            const res = await getJson<{ items: GhIssue[] }>(url, ghHeaders());
            for (const i of res?.items ?? [])
                out.push(ghPost(i, b.searchTerms[0] ?? b.id));
            await sleep(pause);
        }
    return out;
}

// Public Discourse forums through their search.json: ROS Discourse, and the
// maker forums where actuator firmware is discussed.
interface DiscoursePost {
    id: number;
    topic_id: number;
    post_number: number;
    created_at: string;
    blurb: string;
    like_count?: number;
}

interface DiscourseSearch {
    posts?: DiscoursePost[];
    topics?: { id: number; slug: string; title: string }[];
}

const DISCOURSE: Record<"ros-discourse" | "forum", { host: string; venue: string }[]> =
    {
        "ros-discourse": [{ host: "discourse.ros.org", venue: "ROS Discourse" }],
        forum: [
            { host: "community.simplefoc.com", venue: "SimpleFOC Community" },
            { host: "discourse.odriverobotics.com", venue: "ODrive Community" },
        ],
    };

// Requests in flight per host; each worker pauses between its requests and
// getJson backs off on 429, so a refresh stays polite but not serial.
const HOST_WORKERS = 4;

// GET many JSON URLs from one host with bounded concurrency; a host this
// network cannot reach is skipped with a warning.
async function fetchMany<T>(host: string, urls: string[]): Promise<Map<string, T>> {
    const out = new Map<string, T>();
    if (!(await getJson(`https://${host}/about.json`, {}, 1))) {
        console.warn(`  ${host} unreachable from this network; skipped`);
        return out;
    }
    const queue = [...urls];
    const worker = async () => {
        for (let u = queue.shift(); u !== undefined; u = queue.shift()) {
            const r = await getJson<T>(u);
            if (r) out.set(u, r);
            await sleep(1500);
        }
    };
    await Promise.all(Array.from({ length: HOST_WORKERS }, worker));
    return out;
}

// Search results carry only a blurb, so each hit's full post is fetched from
// /posts/<id>.json; the blurb is kept only when that fetch fails.
async function collectDiscourse(forum: "ros-discourse" | "forum"): Promise<RawPost[]> {
    const out: RawPost[] = [];
    for (const { host, venue } of DISCOURSE[forum]) {
        const byUrl = new Map(
            terms().map((q) => [
                `https://${host}/search.json?q=${encodeURIComponent(q)}`,
                q,
            ]),
        );
        const pages = await fetchMany<DiscourseSearch>(host, [...byUrl.keys()]);
        const postUrl = (id: number) => `https://${host}/posts/${id}.json`;
        const ids = new Set(
            [...pages.values()].flatMap((r) => (r.posts ?? []).map((p) => p.id)),
        );
        const full = await fetchMany<{ cooked?: string }>(host, [...ids].map(postUrl));
        for (const [url, res] of pages) {
            const topics = new Map((res.topics ?? []).map((t) => [t.id, t]));
            for (const p of res.posts ?? []) {
                const t = topics.get(p.topic_id);
                out.push({
                    key: `${host}:${p.id}`,
                    forum,
                    url: `https://${host}/t/${t?.slug ?? "topic"}/${p.topic_id}/${p.post_number}`,
                    venue,
                    date: isoDate(p.created_at),
                    score: p.like_count ?? null,
                    title: plain(t?.title ?? "", 200),
                    text: plain(full.get(postUrl(p.id))?.cooked ?? p.blurb),
                    query: byUrl.get(url) ?? "",
                });
            }
        }
        console.log(`  ${host}: ${pages.size} searches`);
    }
    return out;
}

// Reddit: the official API when REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET are
// set (free); skipped otherwise. No paid scraper.
//
// The committed Reddit evidence is NOT reproducible with this collector. It
// comes from a one-off seed collected on 2026-11-03 by a scraper since removed
// from the repo, which searched more subreddits than REDDIT_SUBREDDITS (r/PLC,
// r/Cubemars, r/unitree, r/esp32 and others) and also returned comments
// (t1_ keys). The official search below covers posts in those subreddits only;
// Reddit's API has no comment search. Those seed posts and their labels stay
// valid while the raw cache holds them; a fresh cache drops them from the
// scores. redditSeedNote() in src/sdk/evidence.ts states this on /sdk and its
// markdown twin.

// An app token, or null when credentials are unset or the auth request fails
// (DNS, TLS, refused), so Reddit is skipped like any unavailable source.
async function redditToken(): Promise<string | null> {
    const id = process.env.REDDIT_CLIENT_ID;
    const secret = process.env.REDDIT_CLIENT_SECRET;
    if (!id || !secret) return null;
    try {
        const res = await fetch("https://www.reddit.com/api/v1/access_token", {
            method: "POST",
            headers: {
                authorization: `Basic ${btoa(`${id}:${secret}`)}`,
                "content-type": "application/x-www-form-urlencoded",
            },
            body: "grant_type=client_credentials",
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        return res.ok
            ? ((await res.json()) as { access_token: string }).access_token
            : null;
    } catch (e) {
        console.warn(`  reddit auth failed: ${(e as Error).message}`);
        return null;
    }
}

interface RedditListing {
    data: {
        children: {
            data: {
                id: string;
                permalink: string;
                title: string;
                selftext: string;
                created_utc: number;
                score: number;
                subreddit: string;
            };
        }[];
    };
}

async function collectRedditApi(token: string): Promise<RawPost[]> {
    const out: RawPost[] = [];
    for (const q of terms())
        for (const sub of REDDIT_SUBREDDITS) {
            const url = `https://oauth.reddit.com/r/${sub}/search?q=${encodeURIComponent(q)}&restrict_sr=1&limit=50`;
            const res = await getJson<RedditListing>(url, {
                authorization: `Bearer ${token}`,
            });
            for (const { data: d } of res?.data.children ?? [])
                out.push({
                    key: `reddit:${d.id}`,
                    forum: "reddit",
                    url: `https://www.reddit.com${d.permalink}`,
                    venue: `r/${d.subreddit}`,
                    date: isoDate(d.created_utc),
                    score: d.score,
                    title: plain(d.title, 200),
                    text: plain(d.selftext),
                    query: q,
                });
            await sleep(1100);
        }
    return out;
}

async function collectReddit(): Promise<RawPost[]> {
    const token = await redditToken();
    if (token) return collectRedditApi(token);
    console.warn("  reddit: no token (set REDDIT_CLIENT_ID/SECRET); skipped");
    return [];
}

const COLLECTORS: Record<Forum, () => Promise<RawPost[]>> = {
    hn: collectHn,
    github: collectGithub,
    "ros-discourse": () => collectDiscourse("ros-discourse"),
    forum: () => collectDiscourse("forum"),
    reddit: collectReddit,
};

export async function collect(forums: readonly Forum[]): Promise<void> {
    for (const f of forums) {
        console.log(`collect ${f}`);
        const posts = await COLLECTORS[f]();
        console.log(`  ${posts.length} fetched, ${mergeRaw(f, posts)} cached`);
    }
}
