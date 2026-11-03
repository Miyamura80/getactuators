import { join } from "node:path";
import { SDK_BRANDS } from "@/sdk/brands";
import type { RepoStats } from "@/sdk/score";
import { SDK_SOURCES } from "@/sdk/sources";
import { CACHE, DATA, USER_AGENT, getJson, readJson, sleep, writeJson } from "./common";

// Objective checks that can be read off the web rather than judged:
//   - every repository in the SDK registry: does it exist, licence, language,
//     last push, and the median time to close its 30 newest closed issues
//   - every SDK source URL still resolves
// Writes src/sdk/data/sdk-github.json. Uses GitHub's search API only (repo
// and issue search), which works without per-repository access; set
// GITHUB_TOKEN for a higher rate limit.

const API = "https://api.github.com";
const repoCache = join(CACHE, "repos.json");

const headers = (): Record<string, string> => ({
    accept: "application/vnd.github+json",
    ...(process.env.GITHUB_TOKEN
        ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
        : {}),
});

interface RepoHit {
    full_name: string;
    pushed_at: string;
    stargazers_count: number;
    license: { spdx_id: string } | null;
    language: string | null;
    archived: boolean;
}

interface ClosedIssue {
    created_at: string;
    closed_at: string | null;
}

function median(xs: number[]): number | null {
    const s = [...xs].sort((a, b) => a - b);
    if (s.length === 0) return null;
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? (s[m] ?? null) : ((s[m - 1] ?? 0) + (s[m] ?? 0)) / 2;
}

async function closeHours(repo: string): Promise<number | null> {
    const q = encodeURIComponent(`repo:${repo} is:issue is:closed`);
    const res = await getJson<{ items: ClosedIssue[] }>(
        `${API}/search/issues?q=${q}&sort=created&order=desc&per_page=30`,
        headers(),
    );
    const hours = (res?.items ?? [])
        .filter((i) => i.closed_at)
        .map((i) => (Date.parse(i.closed_at ?? "") - Date.parse(i.created_at)) / 3.6e6);
    const m = median(hours);
    return m === null ? null : Math.round(m * 10) / 10;
}

async function repoStats(repo: string, official: boolean): Promise<RepoStats> {
    const q = encodeURIComponent(`repo:${repo}`);
    const res = await getJson<{ items: RepoHit[] }>(
        `${API}/search/repositories?q=${q}`,
        headers(),
    );
    const hit = res?.items.find(
        (r) => r.full_name.toLowerCase() === repo.toLowerCase(),
    );
    await sleep(2500);
    if (!hit)
        return {
            repo,
            official,
            exists: false,
            pushedAt: null,
            stars: null,
            license: null,
            language: null,
            archived: false,
            medianCloseHours: null,
        };
    const medianCloseHours = await closeHours(repo);
    await sleep(2500);
    return {
        repo,
        official,
        exists: true,
        pushedAt: hit.pushed_at.slice(0, 10),
        stars: hit.stargazers_count,
        license: hit.license?.spdx_id ?? null,
        language: hit.language,
        archived: hit.archived,
        medianCloseHours,
    };
}

async function status(url: string): Promise<number> {
    try {
        const res = await fetch(url, { headers: { "user-agent": USER_AGENT } });
        return res.status;
    } catch {
        return 0;
    }
}

export async function objectiveChecks(refresh = false): Promise<void> {
    const cache = refresh ? {} : readJson<Record<string, RepoStats>>(repoCache, {});
    for (const b of SDK_BRANDS)
        for (const r of b.repos) {
            if (cache[r.repo]) continue;
            console.log(`  repo ${r.repo}`);
            cache[r.repo] = await repoStats(r.repo, r.official);
            writeJson(repoCache, cache);
        }
    const repos = SDK_BRANDS.flatMap((b) => b.repos.map((r) => cache[r.repo]))
        .filter((r): r is RepoStats => r !== undefined)
        .sort((a, b) => a.repo.localeCompare(b.repo));
    for (const r of repos)
        if (!r.exists) console.warn(`  repository not found: ${r.repo}`);
    for (const s of SDK_SOURCES) {
        const code = await status(s.url);
        if (code === 0 || code >= 400)
            console.warn(`  source ${s.id}: HTTP ${code} ${s.url}`);
    }
    writeJson(join(DATA, "sdk-github.json"), {
        asOf: new Date().toISOString().slice(0, 10),
        repos,
    });
}
