// Refresh src/open-source/repo-stats.json: GitHub stars and the date of the
// last commit on the default branch for every open robot's repository.
//
//   GITHUB_TOKEN=... bun scripts/open-robot-stats.ts
//
// Uses the REST API (exact star counts, so starsRounded becomes false). A
// repository the API cannot read keeps its previous entry. Commit the JSON.
import { OPEN_ROBOTS, REPO_STATS, type RepoStat } from "../src/open-source";

const OUT = "src/open-source/repo-stats.json";
const API = "https://api.github.com/repos";

const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "actuatorlist-open-robot-stats",
};
if (process.env.GITHUB_TOKEN)
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

async function getJson(url: string): Promise<unknown> {
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return res.json();
}

async function fetchStat(repo: string): Promise<RepoStat> {
    const meta = (await getJson(`${API}/${repo}`)) as {
        stargazers_count: number;
        default_branch: string;
    };
    const commits = (await getJson(
        `${API}/${repo}/commits?sha=${encodeURIComponent(meta.default_branch)}&per_page=1`,
    )) as { commit: { committer: { date: string } } }[];
    const date = commits[0]?.commit.committer.date ?? "";
    return {
        stars: meta.stargazers_count,
        starsRounded: false,
        lastCommit: date.slice(0, 10),
    };
}

const repos = [...new Set(OPEN_ROBOTS.flatMap((r) => (r.repo ? [r.repo] : [])))];
const next: Record<string, RepoStat> = {};
let failed = 0;
for (const repo of repos) {
    try {
        next[repo] = await fetchStat(repo);
        console.log(
            `${repo}: ${next[repo].stars} stars, last commit ${next[repo].lastCommit}`,
        );
    } catch (err) {
        failed += 1;
        const prev = REPO_STATS.repos[repo];
        if (prev) next[repo] = prev;
        console.warn(`${repo}: kept previous entry (${(err as Error).message})`);
    }
}

if (failed === repos.length) {
    console.error("No repository could be read; snapshot left unchanged.");
    process.exit(1);
}

await Bun.write(
    OUT,
    `${JSON.stringify(
        {
            asOf: new Date().toISOString().slice(0, 10),
            method: "GitHub REST API: stargazers_count and the newest commit on the default branch. Refresh with: GITHUB_TOKEN=... bun scripts/open-robot-stats.ts",
            repos: next,
        },
        null,
        4,
    )}\n`,
);
console.log(`Wrote ${OUT} (${repos.length - failed} fetched, ${failed} kept)`);
