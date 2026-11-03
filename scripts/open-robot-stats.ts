import { OPEN_ROBOTS } from "@/open-source";
import type { RepoStat } from "@/open-source/types";

// Refresh the /open-source stars and last-commit snapshot from the GitHub API
// and commit the result (src/open-source/repo-stats.json). Set GITHUB_TOKEN to
// avoid the anonymous rate limit. A repo the API cannot answer for keeps its
// previous figures, so a partial run never blanks the page.
//
//   bun run scripts/open-robot-stats.ts

const FILE = "src/open-source/repo-stats.json";

interface Snapshot {
    asOf: string;
    method: string;
    repos: Record<string, RepoStat>;
}

async function fetchStat(repo: string, token?: string): Promise<RepoStat | null> {
    const headers: Record<string, string> = {
        accept: "application/vnd.github+json",
        "user-agent": "actuatorlist-open-robot-stats",
    };
    if (token) headers.authorization = `Bearer ${token}`;
    const res = await fetch(`https://api.github.com/repos/${repo}`, { headers });
    if (!res.ok) return null;
    const body = (await res.json()) as {
        stargazers_count?: number;
        pushed_at?: string;
    };
    return {
        stars: body.stargazers_count ?? null,
        lastCommit: body.pushed_at ? body.pushed_at.slice(0, 10) : null,
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
    asOf: fresh > 0 ? new Date().toISOString().slice(0, 10) : previous.asOf,
    method: previous.method,
    repos: next,
};
await Bun.write(FILE, `${JSON.stringify(snapshot, null, 4)}\n`);
console.log(`${fresh}/${repos.length} repos refreshed; wrote ${FILE}`);
