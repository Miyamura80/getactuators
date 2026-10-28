// One-off back-fill from the Internet Archive: list each product_url's
// snapshots (and the URLs the catalog used before) with the CDX API, keep at
// most one per month, and read each archived page with the same extractors.
// Points are method "wayback"; doubtful ones also go to the review list.
//
//   bun run scripts/price-snapshot/wayback.ts [--since 2022] [--only ids] [--report out.md] [--dry-run]

import { readFileSync, writeFileSync } from "node:fs";
import type { PriceReviewItem, PricedActuator } from "../../src/prices/types";
import { type FetchText, politeFetcher } from "./fetcher";
import { fxRates } from "./fx";
import { CATALOG_PATH, appendHistory, cliArgs, today } from "./history-file";
import { type FxLookup, type Outcome, readArchivedHtml, toObservation } from "./read";
import { reportMarkdown } from "./report";
import { pastProductUrls } from "./seed-catalog";

const CDX = "https://web.archive.org/cdx/search/cdx";

export interface Snapshot {
    timestamp: string;
    original: string;
}

// CDX JSON: a header row, then [timestamp, original, statuscode] rows.
export function parseCdx(text: string): Snapshot[] {
    let rows: unknown;
    try {
        rows = JSON.parse(text);
    } catch {
        return [];
    }
    if (!Array.isArray(rows)) return [];
    return rows
        .slice(1)
        .filter(
            (r): r is string[] =>
                Array.isArray(r) &&
                typeof r[0] === "string" &&
                typeof r[1] === "string",
        )
        .filter((r) => !r[2] || r[2] === "200")
        .map((r) => ({ timestamp: r[0] ?? "", original: r[1] ?? "" }));
}

// First snapshot of each calendar month, oldest first.
export function monthly(snaps: Snapshot[]): Snapshot[] {
    const seen = new Set<string>();
    return [...snaps]
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
        .filter((s) => {
            const m = s.timestamp.slice(0, 6);
            if (seen.has(m)) return false;
            seen.add(m);
            return true;
        });
}

export const snapshotDate = (ts: string) =>
    `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}`;
export const archiveUrl = (s: Snapshot, raw = false) =>
    `https://web.archive.org/web/${s.timestamp}${raw ? "id_" : ""}/${s.original}`;

// A wayback reading needs a person when an extractor doubted it or it is far
// from today's catalog price (another variant, a bundle, a typo).
export function reviewReason(
    doubts: string[],
    priceUsd: number | null,
    catalogUsd: number | null,
): string | null {
    const reasons = [...doubts];
    if (priceUsd !== null && catalogUsd) {
        const ratio = priceUsd / catalogUsd;
        if (ratio > 3 || ratio < 1 / 3)
            reasons.push(`${ratio.toFixed(2)}x today's catalog price`);
    }
    return reasons.length ? reasons.join("; ") : null;
}

const failure = (a: PricedActuator, url: string, reason: string): Outcome => ({
    kind: "failure",
    actuatorId: a.id,
    url,
    reason,
});

async function listSnapshots(
    a: PricedActuator,
    urls: string[],
    since: string,
    fetchText: FetchText,
): Promise<{ snaps: Snapshot[]; failures: Outcome[] }> {
    const snaps: Snapshot[] = [];
    const failures: Outcome[] = [];
    for (const url of urls) {
        const q = `${CDX}?url=${encodeURIComponent(url)}&output=json&fl=timestamp,original,statuscode&filter=statuscode:200&from=${since}`;
        const res = await fetchText(q, "application/json");
        if (res?.status === 200) snaps.push(...parseCdx(res.text));
        else
            failures.push(
                failure(a, url, `CDX lookup failed (${res?.status ?? "network"})`),
            );
    }
    return { snaps, failures };
}

async function readSnapshot(
    a: PricedActuator,
    s: Snapshot,
    fetchText: FetchText,
    fx: FxLookup,
): Promise<Outcome> {
    const url = archiveUrl(s);
    const page = await fetchText(archiveUrl(s, true));
    if (page?.status !== 200)
        return failure(a, url, `snapshot unreadable (${page?.status ?? "network"})`);
    const reading = await readArchivedHtml(a, page.text);
    if (!reading) return failure(a, url, "no price on the archived page");
    return toObservation(a, reading, snapshotDate(s.timestamp), url, fx, true);
}

export async function backfillOne(
    a: PricedActuator,
    urls: string[],
    since: string,
    fetchText: FetchText,
    fx: FxLookup,
): Promise<{ outcomes: Outcome[]; review: PriceReviewItem[] }> {
    const { snaps, failures } = await listSnapshots(a, urls, since, fetchText);
    const outcomes: Outcome[] = [...failures];
    const review: PriceReviewItem[] = [];
    for (const s of monthly(snaps)) {
        const o = await readSnapshot(a, s, fetchText, fx);
        outcomes.push(o);
        if (o.kind !== "price") continue;
        const reason = reviewReason(o.doubts, o.point.priceUsd, a.price_usd);
        if (reason)
            review.push({
                actuatorId: a.id,
                date: o.point.date,
                url: o.point.url,
                reason,
            });
    }
    return { outcomes, review };
}

if (import.meta.main) {
    const { only, report, dryRun } = cliArgs(process.argv);
    const sinceIdx = process.argv.indexOf("--since");
    const since =
        sinceIdx >= 0
            ? (process.argv[sinceIdx + 1] ?? "2022")
            : String(new Date().getUTCFullYear() - 4);
    const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8")) as PricedActuator[];
    const past = pastProductUrls();
    const fetchText = politeFetcher();
    const fx = fxRates(fetchText);
    const outcomes: Outcome[] = [];
    const review: PriceReviewItem[] = [];
    for (const a of catalog) {
        if (!a.product_url || (only && !only.has(a.id))) continue;
        const urls = [...new Set([a.product_url, ...(past.get(a.id) ?? [])])];
        const r = await backfillOne(a, urls, since, fetchText, fx);
        console.log(
            `${a.id}: ${r.outcomes.filter((o) => o.kind === "price").length} points`,
        );
        outcomes.push(...r.outcomes);
        review.push(...r.review);
    }
    const body = reportMarkdown(
        `Wayback back-fill since ${since}`,
        outcomes,
        new Map(),
        review,
    );
    if (report) writeFileSync(report, body);
    else console.log(body);
    const points = outcomes.flatMap((o) => (o.kind === "price" ? [o.point] : []));
    if (!dryRun) appendHistory(points, review, today());
}
