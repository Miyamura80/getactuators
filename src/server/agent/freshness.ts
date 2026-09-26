import { statSync } from "node:fs";
import { join } from "node:path";

// When the catalog data last changed, as a W3C datetime. Drives sitemap
// lastmod and the markdown `last-updated` frontmatter.
//
// Resolution order: CATALOG_UPDATED_AT (set at deploy time), the last git
// commit touching the dataset (dev and CI checkouts), then the dataset file's
// mtime (the Docker image has no .git). Resolved once per process.

const REPO_ROOT = join(import.meta.dir, "..", "..", "..");
const DATA_DIR = "frontend/src/data";

function fromEnv(): string | null {
    const raw = process.env.CATALOG_UPDATED_AT?.trim();
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function fromGit(): string | null {
    try {
        const out = Bun.spawnSync(
            ["git", "log", "-1", "--format=%cI", "--", DATA_DIR],
            {
                cwd: REPO_ROOT,
                stderr: "ignore",
            },
        );
        const text = out.stdout.toString().trim();
        if (out.exitCode !== 0 || !text) return null;
        return new Date(text).toISOString();
    } catch {
        return null;
    }
}

function fromMtime(): string | null {
    try {
        return statSync(
            join(REPO_ROOT, DATA_DIR, "actuators.json"),
        ).mtime.toISOString();
    } catch {
        return null;
    }
}

export const CATALOG_UPDATED_AT: string =
    fromEnv() ?? fromGit() ?? fromMtime() ?? new Date().toISOString();

// Date-only form (YYYY-MM-DD) for human-facing copy.
export const CATALOG_UPDATED_DATE = CATALOG_UPDATED_AT.slice(0, 10);
