import { join } from "node:path";
import { SDK_BRANDS } from "@/sdk/brands";
import type { RepoStats } from "@/sdk/score";
import { SDK_SOURCES } from "@/sdk/sources";
import {
    CACHE,
    DATA,
    REQUEST_TIMEOUT_MS,
    USER_AGENT,
    getJson,
    readJson,
    sleep,
    writeJson,
} from "./common";

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

// Median close time in hours (null when the repository has no closed issues),
// or undefined when the issue search itself failed.
async function closeHours(repo: string): Promise<number | null | undefined> {
    const q = encodeURIComponent(`repo:${repo} is:issue is:closed`);
    const res = await getJson<{ items: ClosedIssue[] }>(
        `${API}/search/issues?q=${q}&sort=created&order=desc&per_page=30`,
        headers(),
    );
    if (!res) return undefined;
    const hours = res.items
        .filter((i) => i.closed_at)
        .map((i) => (Date.parse(i.closed_at ?? "") - Date.parse(i.created_at)) / 3.6e6);
    const m = median(hours);
    return m === null ? null : Math.round(m * 10) / 10;
}

// Stats for one repository, or null when either search failed (rate limit,
// outage): only a successful search with no hit records exists: false, and a
// failed issue lookup never replaces a cached close time with null.
async function repoStats(repo: string, official: boolean): Promise<RepoStats | null> {
    const q = encodeURIComponent(`repo:${repo}`);
    const res = await getJson<{ items: RepoHit[] }>(
        `${API}/search/repositories?q=${q}`,
        headers(),
    );
    if (!res) return null;
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
    if (medianCloseHours === undefined) return null;
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
        const res = await fetch(url, {
            headers: { "user-agent": USER_AGENT },
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        return res.status;
    } catch {
        return 0;
    }
}

// Fresh stats for one repository, or its cached record when the search fails;
// with neither, the run stops rather than record a live repository as missing.
async function statsOrCached(
    repo: string,
    official: boolean,
    kept: RepoStats | undefined,
): Promise<RepoStats> {
    const stats = await repoStats(repo, official);
    if (stats) return stats;
    if (!kept)
        throw new Error(
            `GitHub search failed for ${repo} and nothing is cached; set GITHUB_TOKEN or retry later`,
        );
    console.warn(`  search failed for ${repo}; keeping the cached record`);
    return kept;
}

export async function objectiveChecks(refresh = false): Promise<void> {
    const prior = readJson<Record<string, RepoStats>>(repoCache, {});
    const cache: Record<string, RepoStats> = refresh ? {} : { ...prior };
    for (const r of SDK_BRANDS.flatMap((b) => b.repos)) {
        if (cache[r.repo]) continue;
        console.log(`  repo ${r.repo}`);
        cache[r.repo] = await statsOrCached(r.repo, r.official, prior[r.repo]);
        writeJson(repoCache, { ...prior, ...cache });
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
