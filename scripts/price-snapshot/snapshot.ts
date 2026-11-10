#!/usr/bin/env bun
import { type FxTable, fetchFx } from "./currency";
import { readPage } from "./extract";
import { PoliteFetcher, RobotsDenied } from "./fetch";
import { lastPrices, mergePoints, readHistory, writeHistory } from "./history-file";
import { toOutcome } from "./record";
import { type RunReport, renderReport } from "./report";
import { type Target, targets } from "./targets";

// Weekly price snapshot (.github/workflows/price-snapshot.yaml): reads every
// catalog actuator's product page, appends one point per actuator to
// data/prices/history.json and writes the PR body (added, needs review,
// failures, skipped) to --report.
//
//   bun run scripts/price-snapshot/snapshot.ts [--only=id,id] [--limit=N]
//       [--dry-run] [--report=path]

export interface CliArgs {
    only?: string[];
    limit?: number;
    dryRun: boolean;
    report: string;
}

export const argOf = (argv: string[], k: string) =>
    argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);

// --limit as a count; anything else is an error, not a run of nothing.
export function limitArg(argv: string[]): number | undefined {
    const v = argOf(argv, "limit");
    if (v === undefined) return undefined;
    if (!/^\d+$/.test(v)) throw new Error(`--limit must be a whole number, got "${v}"`);
    return Number(v);
}

export function parseArgs(argv: string[]): CliArgs {
    const get = (k: string) => argOf(argv, k);
    const only = get("only")?.split(",").filter(Boolean);
    return {
        only: only?.length ? only : undefined,
        limit: limitArg(argv),
        dryRun: argv.includes("--dry-run"),
        report: get("report") ?? "price-snapshot-report.md",
    };
}

async function readTarget(
    fetcher: PoliteFetcher,
    t: Target,
    fx: FxTable,
    date: string,
    reference: number | null,
) {
    try {
        const read = await readPage(fetcher, t.url, t.override.selector);
        return toOutcome({
            target: t,
            ...read,
            fx,
            date,
            url: t.url,
            referenceUsd: reference,
        });
    } catch (e) {
        const reason =
            e instanceof RobotsDenied ? "robots.txt disallows the page" : String(e);
        return { kind: "failure" as const, reason };
    }
}

export async function runSnapshot(
    args: CliArgs,
    fetcher = new PoliteFetcher(),
    // Rates for the run; fetched from the ECB feed when not given (tests).
    rates?: FxTable,
): Promise<RunReport> {
    const date = new Date().toISOString().slice(0, 10);
    const history = await readHistory();
    const refs = lastPrices(history);
    const fx = rates ?? (await fetchFx("latest"));
    const report: RunReport = {
        title: "Weekly price snapshot",
        date,
        added: [],
        review: [],
        failures: [],
        skipped: [],
    };
    for (const t of targets(args.only).slice(0, args.limit)) {
        if (t.override.skip) {
            report.skipped.push({ actuatorId: t.actuatorId, reason: t.override.skip });
            continue;
        }
        const out = await readTarget(
            fetcher,
            t,
            fx,
            date,
            refs.get(t.actuatorId) ?? t.catalogUsd,
        );
        if (out.kind === "point") report.added.push(out.record);
        else if (out.kind === "review") report.review.push(out);
        else
            report.failures.push({
                actuatorId: t.actuatorId,
                url: t.url,
                reason: out.reason,
            });
    }
    if (!args.dryRun) await writeHistory(mergePoints(history, report.added));
    return report;
}

if (import.meta.main) {
    const args = parseArgs(process.argv.slice(2));
    const report = await runSnapshot(args);
    await Bun.write(args.report, renderReport(report));
    console.log(
        `${report.added.length} added, ${report.review.length} for review, ${report.failures.length} failed. Report: ${args.report}`,
    );
}
