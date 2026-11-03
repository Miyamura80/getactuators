import { OPEN_ROBOTS } from "@/open-source";
import type { RepoStat } from "@/open-source/types";

// Refresh the /open-source stars and last-commit snapshot from the GitHub API
// and commit the result (src/open-source/repo-stats.json). Set GITHUB_TOKEN to
// avoid the anonymous rate limit. A repo the API cannot answer for keeps its
// previous figures, so a partial run never blanks the page; asOf only moves
// when every repo refreshed, so it never dates figures older than it says.
//
//   bun run scripts/open-robot-stats.ts

const FILE = "src/open-source/repo-stats.json";

interface Snapshot {
    asOf: string;
    method: string;
    repos: Record<string, RepoStat>;
}

// Stars as GitHub shows them: exact below 1,000, else rounded to 0.1k.
function roundStars(n: number): number {
    return n < 1000 ? n : Math.round(n / 100) * 100;
}

async function getJson<T>(
    url: string,
    headers: Record<string, string>,
): Promise<T | null> {
    const res = await fetch(url, { headers });
    return res.ok ? ((await res.json()) as T) : null;
}

async function fetchStat(repo: string, token?: string): Promise<RepoStat | null> {
    const headers: Record<string, string> = {
        accept: "application/vnd.github+json",
        "user-agent": "actuatorlist-open-robot-stats",
    };
    if (token) headers.authorization = `Bearer ${token}`;
    const api = `https://api.github.com/repos/${repo}`;
    const body = await getJson<{ stargazers_count?: number; default_branch?: string }>(
        api,
        headers,
    );
    if (!body?.default_branch) return null;
    // pushed_at moves on a push to any branch; read the default branch's head.
    const branch = await getJson<{
        commit?: { commit?: { committer?: { date?: string } } };
    }>(`${api}/branches/${encodeURIComponent(body.default_branch)}`, headers);
    const date = branch?.commit?.commit?.committer?.date;
    if (!date) return null;
    return {
        stars: body.stargazers_count == null ? null : roundStars(body.stargazers_count),
        lastCommit: date.slice(0, 10),
    };
}

const previous = (await Bun.file(FILE).json()) as Snapshot;
const repos = [...new Set(OPEN_ROBOTS.flatMap((r) => (r.repo ? [r.repo] : [])))].sort();
const next: Record<string, RepoStat> = {};
let fresh = 0;
for (const repo of repos) {
    const stat = await fetchStat(repo, process.env.GITHUB_TOKEN).catch(() => null);
    if (stat) fresh++;
    else console.log(`kept previous figures for ${repo}`);
    next[repo] = stat ?? previous.repos[repo] ?? { stars: null, lastCommit: null };
}
const snapshot: Snapshot = {
    asOf:
        fresh === repos.length ? new Date().toISOString().slice(0, 10) : previous.asOf,
    method: previous.method,
    repos: next,
};
await Bun.write(FILE, `${JSON.stringify(snapshot, null, 4)}\n`);
console.log(
    `${fresh}/${repos.length} repos refreshed; wrote ${FILE}${fresh < repos.length ? ` (asOf kept at ${previous.asOf})` : ""}`,
);
