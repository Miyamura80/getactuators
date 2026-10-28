import type { CollectorRun, Evidence } from "@/sdk/types";
import { TARGETS } from "./targets";

// GitHub, angle 2: issue response times through the REST API, for official
// repos only. Uses GITHUB_TOKEN when set (60 requests an hour without one).
// Reads the last 30 issues per repo (pull requests excluded) and the first
// comment by someone other than the author; the median of those delays in
// hours becomes one evidence item per repo. Logins are compared in memory
// and never written out.

const API = "https://api.github.com";

interface Issue {
    number: number;
    created_at: string;
    comments: number;
    pull_request?: unknown;
    user: { login: string } | null;
    html_url: string;
}

interface Comment {
    created_at: string;
    user: { login: string } | null;
}

async function api<T>(path: string): Promise<T> {
    const headers: Record<string, string> = {
        Accept: "application/vnd.github+json",
        "User-Agent": "actuatorlist-sdk-signals",
    };
    if (process.env.GITHUB_TOKEN)
        headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const r = await fetch(`${API}${path}`, {
        headers,
        signal: AbortSignal.timeout(30_000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status} for ${path}`);
    return (await r.json()) as T;
}

const median = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? (s[m] ?? 0) : ((s[m - 1] ?? 0) + (s[m] ?? 0)) / 2;
};

async function responseHours(
    slug: string,
): Promise<{ hours: number; n: number } | null> {
    const issues = (await api<Issue[]>(`/repos/${slug}/issues?state=all&per_page=50`))
        .filter((i) => !i.pull_request)
        .slice(0, 30);
    const delays: number[] = [];
    for (const issue of issues) {
        if (issue.comments === 0) continue;
        const comments = await api<Comment[]>(
            `/repos/${slug}/issues/${issue.number}/comments?per_page=10`,
        );
        const first = comments.find((c) => c.user?.login !== issue.user?.login);
        if (first)
            delays.push(
                (Date.parse(first.created_at) - Date.parse(issue.created_at)) / 3.6e6,
            );
    }
    return delays.length >= 3 ? { hours: median(delays), n: delays.length } : null;
}

export async function collectGithubRest(): Promise<{
    run: CollectorRun;
    evidence: Evidence[];
}> {
    const evidence: Evidence[] = [];
    const label = "GitHub issues (REST API)";
    try {
        for (const t of TARGETS)
            for (const repo of t.repos.filter((r) => r.official)) {
                const r = await responseHours(repo.slug);
                if (!r) continue;
                evidence.push({
                    id: `gh:${t.brand}:${repo.slug}:issue-response`,
                    brand: t.brand,
                    signal: "issue-response",
                    source: "github",
                    url: `https://github.com/${repo.slug}/issues`,
                    title: `Median first response ${Math.round(r.hours)} h over ${r.n} recent issues`,
                    repo: repo.slug,
                    official: true,
                    value: Math.round(r.hours * 10) / 10,
                });
            }
    } catch (e) {
        return {
            run: {
                id: "github-rest",
                label,
                status: "blocked",
                detail: `Unreachable from the collector: ${(e as Error).message}`,
                items: 0,
            },
            evidence: [],
        };
    }
    return {
        run: {
            id: "github-rest",
            label,
            status: "ok",
            detail: `${evidence.length} official repos with 3+ answered issues`,
            items: evidence.length,
        },
        evidence,
    };
}
