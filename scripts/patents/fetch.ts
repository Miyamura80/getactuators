// Collects the /patents snapshot from Google Patents Public Datasets on
// BigQuery and writes src/patents/data/landscape.json (aggregates only; the
// family rows are never committed).
//
//   bun scripts/patents/fetch.ts --write-queries   regenerate queries/landscape.sql
//   bun scripts/patents/fetch.ts --dry-run         bytes the query would scan
//   bun scripts/patents/fetch.ts                   run it and write the snapshot
//   bun scripts/patents/fetch.ts --from-file rows.json
//       aggregate rows exported from the BigQuery console (JSON array or
//       newline-delimited JSON) instead of calling the API; pass
//       --collected-at YYYY-MM-DD for the day the query ran
//
// Credentials come from the environment: PATENTS_GCP_PROJECT is the billing
// project (the public dataset itself is free to read; queries count against
// the project's BigQuery quota), and GCP_ACCESS_TOKEN an OAuth token with the
// bigquery scope. Without GCP_ACCESS_TOKEN the script asks
// `gcloud auth print-access-token`.
//
// Sample cross-checks against Lens.org go in scripts/patents/cross-checks.json
// and are copied into the snapshot; see docs/patents.md.

import { type FamilyRow, aggregate } from "./aggregate";
import { buildLandscapeSql } from "./sql";

const ROOT = `${import.meta.dir}/../..`;
const QUERY_FILE = `${import.meta.dir}/queries/landscape.sql`;
const SNAPSHOT_FILE = `${ROOT}/src/patents/data/landscape.json`;
const CROSS_CHECKS_FILE = `${import.meta.dir}/cross-checks.json`;
const API = "https://bigquery.googleapis.com/bigquery/v2";

interface BqField {
    name: string;
}
interface BqResponse {
    jobComplete?: boolean;
    jobReference?: { jobId: string; location?: string };
    pageToken?: string;
    totalBytesProcessed?: string;
    schema?: { fields: BqField[] };
    rows?: { f: { v: string | null }[] }[];
    error?: { message: string };
}

function env(name: string): string {
    const v = process.env[name];
    if (!v)
        throw new Error(`Set ${name} (see the header of scripts/patents/fetch.ts).`);
    return v;
}

async function accessToken(): Promise<string> {
    if (process.env.GCP_ACCESS_TOKEN) return process.env.GCP_ACCESS_TOKEN;
    const proc = Bun.spawn(["gcloud", "auth", "print-access-token"], {
        stdout: "pipe",
    });
    const token = (await new Response(proc.stdout).text()).trim();
    if (!token) throw new Error("No GCP_ACCESS_TOKEN and gcloud returned no token.");
    return token;
}

async function call(token: string, url: string, body?: unknown): Promise<BqResponse> {
    const res = await fetch(url, {
        method: body ? "POST" : "GET",
        headers: {
            authorization: `Bearer ${token}`,
            "content-type": "application/json",
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const json = (await res.json()) as BqResponse;
    if (!res.ok || json.error)
        throw new Error(`BigQuery: ${json.error?.message ?? res.status}`);
    return json;
}

function toRows(r: BqResponse): FamilyRow[] {
    const names = r.schema?.fields.map((f) => f.name) ?? [];
    return (r.rows ?? []).map(
        (row) =>
            Object.fromEntries(
                row.f.map((cell, i) => [names[i], cell.v]),
            ) as unknown as FamilyRow,
    );
}

async function runQuery(sql: string, dryRun: boolean): Promise<FamilyRow[]> {
    const project = env("PATENTS_GCP_PROJECT");
    const token = await accessToken();
    const first = await call(token, `${API}/projects/${project}/queries`, {
        query: sql,
        useLegacySql: false,
        dryRun,
        timeoutMs: 600000,
        maxResults: 20000,
    });
    if (dryRun) {
        const gb = Number(first.totalBytesProcessed ?? 0) / 1e9;
        console.log(`Dry run: the query would scan ${gb.toFixed(1)} GB.`);
        return [];
    }
    const job = first.jobReference;
    if (!job) throw new Error("BigQuery returned no job reference.");
    let page = first;
    const location = job.location ? `&location=${job.location}` : "";
    while (!page.jobComplete) {
        page = await call(
            token,
            `${API}/projects/${project}/queries/${job.jobId}?maxResults=20000${location}`,
        );
    }
    const rows = toRows(page);
    while (page.pageToken) {
        page = await call(
            token,
            `${API}/projects/${project}/queries/${job.jobId}?maxResults=20000&pageToken=${encodeURIComponent(page.pageToken)}${location}`,
        );
        rows.push(...toRows(page));
        console.log(`  ${rows.length} families`);
    }
    return rows;
}

async function readRows(path: string): Promise<FamilyRow[]> {
    const text = await Bun.file(path).text();
    const trimmed = text.trim();
    if (trimmed.startsWith("[")) return JSON.parse(trimmed) as FamilyRow[];
    return trimmed
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line) as FamilyRow);
}

async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const sql = buildLandscapeSql();
    if (args.includes("--write-queries")) {
        await Bun.write(QUERY_FILE, sql);
        console.log(`Wrote ${QUERY_FILE}`);
        return;
    }
    const fromFile = args[args.indexOf("--from-file") + 1];
    const rows =
        args.includes("--from-file") && fromFile
            ? await readRows(fromFile)
            : await runQuery(sql, args.includes("--dry-run"));
    if (args.includes("--dry-run")) return;
    const crossChecks = (await Bun.file(CROSS_CHECKS_FILE).exists())
        ? await Bun.file(CROSS_CHECKS_FILE).json()
        : [];
    const at = args[args.indexOf("--collected-at") + 1];
    const collectedAt =
        args.includes("--collected-at") && at && /^\d{4}-\d{2}-\d{2}$/.test(at)
            ? at
            : new Date().toISOString().slice(0, 10);
    const snapshot = aggregate(rows, collectedAt, crossChecks);
    await Bun.write(SNAPSHOT_FILE, `${JSON.stringify(snapshot, null, 4)}\n`);
    console.log(
        `Wrote ${SNAPSHOT_FILE}: ${rows.length} families, collected ${collectedAt}.`,
    );
}

if (import.meta.main) await main();
