#!/usr/bin/env bun
import { historyFor, yearFraction } from "../../src/prices/history";
import type { PriceRecord } from "../../src/prices/types";
import { type FxTable, fetchFx } from "./currency";
import { extractFromHtml } from "./extract";
import { shopifyCurrency } from "./extract/shopify";
import { PoliteFetcher } from "./fetch";
import { mergePoints, readHistory, writeHistory } from "./history-file";
import { toOutcome } from "./record";
import { type RunReport, renderReport } from "./report";
import { argOf, limitArg } from "./snapshot";
import { type Target, targets } from "./targets";

// One-off Wayback Machine back-fill: lists archived copies of each product
// URL (and its old URLs) with the CDX API, keeps at most one per month, runs
// the HTML extractors on each and appends method "wayback" points with that
// day's FX rate. Points that need a person go to the review list. Each
// capture is checked against the known price nearest its date, not today's,
// and history.json is written after every actuator, so a killed run keeps
// what it read.
//
//   bun run scripts/price-snapshot/wayback.ts [--only=id,id] [--since=2018]
//       [--limit=N] [--dry-run] [--report=path]

export interface CdxRow {
    timestamp: string;
    original: string;
}

export function cdxUrl(pageUrl: string, since: string): string {
    const bare = pageUrl.replace(/^https?:\/\//, "");
    const q = new URLSearchParams({
        url: bare,
        output: "json",
        fl: "timestamp,original,statuscode",
        filter: "statuscode:200",
        collapse: "timestamp:6",
        from: since.replace(/-/g, ""),
    });
    return `https://web.archive.org/cdx/search/cdx?${q.toString()}`;
}

// CDX JSON: a header row, then one row per capture.
export function parseCdx(rows: string[][]): CdxRow[] {
    const [head, ...data] = rows;
    if (!head) return [];
    const ti = head.indexOf("timestamp");
    const oi = head.indexOf("original");
    return data.map((r) => ({ timestamp: r[ti] ?? "", original: r[oi] ?? "" }));
}

// At most one capture per calendar month (the first), oldest first.
export function monthly(rows: CdxRow[]): CdxRow[] {
    const seen = new Set<string>();
    return [...rows]
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
        .filter((r) => {
            const m = r.timestamp.slice(0, 6);
            if (seen.has(m) || m.length < 6) return false;
            seen.add(m);
            return true;
        });
}

export const archivedUrl = (r: CdxRow) =>
    `https://web.archive.org/web/${r.timestamp}/${r.original}`;
// id_ asks for the page as captured, without the Wayback toolbar.
export const rawArchivedUrl = (r: CdxRow) =>
    `https://web.archive.org/web/${r.timestamp}id_/${r.original}`;
export const captureDate = (ts: string) =>
    `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}`;

async function captures(
    fetcher: PoliteFetcher,
    t: Target,
    since: string,
): Promise<CdxRow[]> {
    const rows: CdxRow[] = [];
    for (const url of [t.url, ...(t.override.oldUrls ?? [])]) {
        const res = await fetcher.get(cdxUrl(url, since), "application/json");
        if (!res.ok) throw new Error(`CDX lookup for ${url}: HTTP ${res.status}`);
        rows.push(...parseCdx((await res.json()) as string[][]));
    }
    return monthly(rows);
}

async function fxOn(cache: Map<string, FxTable>, date: string): Promise<FxTable> {
    let fx = cache.get(date);
    if (!fx) {
        fx = await fetchFx(date);
        cache.set(date, fx);
    }
    return fx;
}

// The priced point nearest a date (curated, snapshot, catalog or read earlier
// in this run): the reference for the review check on an old capture.
export function referenceAt(
    t: Target,
    date: string,
    added: readonly PriceRecord[],
): number | null {
    const at = yearFraction(date);
    const known = [...historyFor(t.actuatorId), ...added]
        .filter((p) => p.actuatorId === t.actuatorId && !p.outOfStock)
        .sort(
            (a, b) =>
                Math.abs(yearFraction(a.date) - at) -
                Math.abs(yearFraction(b.date) - at),
        );
    return known[0]?.priceUsd ?? t.catalogUsd;
}

async function readCapture(
    fetcher: PoliteFetcher,
    t: Target,
    row: CdxRow,
    fxCache: Map<string, FxTable>,
    report: RunReport,
): Promise<void> {
    const date = captureDate(row.timestamp);
    const res = await fetcher.get(rawArchivedUrl(row));
    const html = res.ok ? await res.text() : "";
    const out = toOutcome({
        target: t,
        extraction: html ? extractFromHtml(html, t.override.selector) : null,
        pageCurrency: html ? shopifyCurrency(html) : null,
        error: res.ok ? "no price in the capture" : `capture HTTP ${res.status}`,
        fx: await fxOn(fxCache, date),
        date,
        url: archivedUrl(row),
        method: "wayback",
        referenceUsd: referenceAt(t, date, report.added),
    });
    if (out.kind === "point") report.added.push(out.record);
    else if (out.kind === "review") report.review.push(out);
    else
        report.failures.push({
            actuatorId: t.actuatorId,
            url: archivedUrl(row),
            reason: out.reason,
        });
}

async function backfillTarget(
    fetcher: PoliteFetcher,
    t: Target,
    since: string,
    have: Set<string>,
    fxCache: Map<string, FxTable>,
    report: RunReport,
): Promise<void> {
    const rows = (await captures(fetcher, t, since)).filter(
        (r) =>
            !have.has(
                `${t.actuatorId}@${r.timestamp.slice(0, 4)}-${r.timestamp.slice(4, 6)}`,
            ),
    );
    if (rows.length === 0)
        report.failures.push({
            actuatorId: t.actuatorId,
            url: t.url,
            reason: "no new monthly captures",
        });
    // One capture failing (Wayback timeouts are common) skips only that one.
    for (const row of rows) {
        try {
            await readCapture(fetcher, t, row, fxCache, report);
        } catch (e) {
            report.failures.push({
                actuatorId: t.actuatorId,
                url: archivedUrl(row),
                reason: String(e),
            });
        }
    }
}

export async function runBackfill(
    argv: string[],
    fetcher = new PoliteFetcher({ delayMs: 3000 }),
): Promise<RunReport> {
    const get = (k: string) => argOf(argv, k);
    const since = get("since") ?? "2018";
    const limit = limitArg(argv);
    const only = get("only")?.split(",").filter(Boolean);
    const list = targets(only?.length ? only : undefined).slice(0, limit);
    let history = await readHistory();
    const have = new Set(
        history.points.map((p: PriceRecord) => `${p.actuatorId}@${p.date.slice(0, 7)}`),
    );
    const report: RunReport = {
        title: "Wayback price back-fill",
        date: new Date().toISOString().slice(0, 10),
        added: [],
        review: [],
        failures: [],
        skipped: [],
    };
    const fxCache = new Map<string, FxTable>();
    for (const t of list) {
        if (t.override.skip) {
            report.skipped.push({ actuatorId: t.actuatorId, reason: t.override.skip });
            continue;
        }
        const before = report.added.length;
        try {
            await backfillTarget(fetcher, t, since, have, fxCache, report);
        } catch (e) {
            report.failures.push({
                actuatorId: t.actuatorId,
                url: t.url,
                reason: String(e),
            });
        }
        if (!argv.includes("--dry-run") && report.added.length > before) {
            history = mergePoints(history, report.added.slice(before));
            await writeHistory(history);
        }
    }
    return report;
}

if (import.meta.main) {
    const argv = process.argv.slice(2);
    const report = await runBackfill(argv);
    const path = argOf(argv, "report") ?? "price-backfill-report.md";
    await Bun.write(path, renderReport(report));
    console.log(
        `${report.added.length} added, ${report.review.length} for review. Report: ${path}`,
    );
}
