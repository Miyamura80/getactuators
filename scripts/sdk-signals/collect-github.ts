import type { CollectorRun, Evidence } from "@/sdk/types";
import { cloneRepo } from "./git";
import { repoSignals } from "./repo-signals";
import { TARGETS } from "./targets";

// GitHub, angle 1 (works offline from the API): partial git clones of each
// target repo. Repo metadata that needs the REST API (stars, issue response
// times) is in ./collect-github-rest.

export async function collectGithub(
    since: string,
    only?: string,
): Promise<{ run: CollectorRun; evidence: Evidence[] }> {
    const evidence: Evidence[] = [];
    const failed: string[] = [];
    let repos = 0;
    for (const t of TARGETS) {
        if (only && t.brand !== only) continue;
        for (const repo of t.repos) {
            const clone = await cloneRepo(repo.slug, since);
            if (!clone) {
                failed.push(repo.slug);
                continue;
            }
            repos++;
            const ignore = repo.ignore ?? [];
            clone.files = clone.files.filter(
                (f) => !ignore.some((prefix) => f.startsWith(`${prefix}/`)),
            );
            const items = await repoSignals({ brand: t.brand, target: repo, clone });
            console.log(`  ${t.brand} ${repo.slug}: ${items.length} items`);
            evidence.push(...items);
        }
    }
    const status = repos === 0 ? "blocked" : failed.length > 0 ? "error" : "ok";
    return {
        run: {
            id: "github-git",
            label: "GitHub repositories (git clone)",
            status,
            detail:
                failed.length > 0
                    ? `${repos} repos read; could not clone ${failed.join(", ")}`
                    : `${repos} repos read with partial clones (trees, last 12 months of commits, selected files)`,
            items: evidence.length,
        },
        evidence,
    };
}
