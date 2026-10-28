import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { mergePoints, serializeHistory } from "../../src/prices/merge";
import type {
    PriceHistoryFile,
    PriceObservation,
    PriceReviewItem,
} from "../../src/prices/types";

export const HISTORY_PATH = "data/prices/history.json";
export const CATALOG_PATH = "frontend/src/data/actuators.json";

export function readHistory(path = HISTORY_PATH): PriceHistoryFile {
    if (!existsSync(path)) return { schema: 1, updated: "", points: [], review: [] };
    return JSON.parse(readFileSync(path, "utf8")) as PriceHistoryFile;
}

export function appendHistory(
    added: PriceObservation[],
    review: PriceReviewItem[],
    updated: string,
    path = HISTORY_PATH,
): PriceHistoryFile {
    const next = mergePoints(readHistory(path), added, review, updated);
    writeFileSync(path, serializeHistory(next));
    return next;
}

export const today = () => new Date().toISOString().slice(0, 10);

// Flags shared by the CLIs: --only id1,id2 and --report path.md.
export function cliArgs(argv: string[]): {
    only: Set<string> | null;
    report: string | null;
    dryRun: boolean;
} {
    const value = (flag: string) => {
        const i = argv.indexOf(flag);
        return i >= 0 ? (argv[i + 1] ?? null) : null;
    };
    const only = value("--only");
    return {
        only: only ? new Set(only.split(",")) : null,
        report: value("--report"),
        dryRun: argv.includes("--dry-run"),
    };
}
