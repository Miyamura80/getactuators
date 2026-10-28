// Back-fill price history from the catalog's own git history: every commit
// that touched actuators.json records the USD list price the catalog showed
// that day. One point per actuator when a price first appears and whenever it
// changes, dated by the commit's author date, method "manual". Needs the full
// git history (git fetch --unshallow on a shallow clone).
//
//   bun run scripts/price-snapshot/seed-catalog.ts [--dry-run]

import type { PriceObservation } from "../../src/prices/types";
import { CATALOG_PATH, appendHistory, cliArgs, today } from "./history-file";

interface CatalogRow {
    id: string;
    price_usd: number | null;
    product_url: string | null;
}

function git(args: string[]): string {
    const out = Bun.spawnSync(["git", ...args], { stdout: "pipe", stderr: "pipe" });
    if (out.exitCode !== 0)
        throw new Error(`git ${args.join(" ")}: ${out.stderr.toString()}`);
    return out.stdout.toString();
}

// [sha, author date, path at that commit], oldest first.
function catalogCommits(): [string, string, string][] {
    const log = git([
        "log",
        "--reverse",
        "--format=@%H %aI",
        "--name-only",
        "--follow",
        "--",
        CATALOG_PATH,
    ]);
    return log
        .split("@")
        .filter(Boolean)
        .map((block) => {
            const [head = "", ...files] = block.trim().split("\n").filter(Boolean);
            const [sha = "", date = ""] = head.split(" ");
            return [sha, date, files.at(-1) ?? CATALOG_PATH];
        });
}

export function seedPoints(
    snapshots: { sha: string; date: string; rows: CatalogRow[] }[],
    keep: ReadonlySet<string>,
): PriceObservation[] {
    const last = new Map<string, number>();
    const out: PriceObservation[] = [];
    for (const { sha, date, rows } of snapshots) {
        for (const a of rows) {
            if (!keep.has(a.id)) continue;
            if (typeof a.price_usd !== "number" || !a.product_url) continue;
            if (last.get(a.id) === a.price_usd) continue;
            last.set(a.id, a.price_usd);
            out.push({
                actuatorId: a.id,
                date,
                priceUsd: a.price_usd,
                currency: "USD",
                originalPrice: a.price_usd,
                fxRate: 1,
                url: a.product_url,
                method: "manual",
                note: `catalog commit ${sha.slice(0, 7)}`,
            });
        }
    }
    return out;
}

function catalogSnapshots(): { sha: string; date: string; rows: CatalogRow[] }[] {
    return catalogCommits().map(([sha, iso, path]) => ({
        sha,
        // Author date in UTC.
        date: new Date(iso).toISOString().slice(0, 10),
        rows: JSON.parse(git(["show", `${sha}:${path}`])) as CatalogRow[],
    }));
}

// Every product_url the catalog has used for an id, for the Wayback lookup.
export function pastProductUrls(): Map<string, string[]> {
    const out = new Map<string, Set<string>>();
    for (const s of catalogSnapshots())
        for (const a of s.rows) {
            if (!a.product_url) continue;
            const set = out.get(a.id) ?? new Set<string>();
            set.add(a.product_url);
            out.set(a.id, set);
        }
    return new Map([...out].map(([id, urls]) => [id, [...urls]]));
}

if (import.meta.main) {
    const { dryRun } = cliArgs(process.argv);
    const snapshots = catalogSnapshots();
    // Only ids still in the catalog (renamed or dropped entries are skipped).
    const current = snapshots.at(-1)?.rows ?? [];
    const points = seedPoints(snapshots, new Set(current.map((a) => a.id)));
    console.log(
        `${snapshots.length} catalog commits, ${points.length} price points for ${new Set(points.map((p) => p.actuatorId)).size} actuators`,
    );
    if (!dryRun) appendHistory(points, [], today());
}
