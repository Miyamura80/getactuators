import type { HistoryFile, PriceRecord } from "../../src/prices/types";

// data/prices/history.json: read, merge new points (one per actuator, day and
// method; a re-run on the same day replaces its own point), sort, write.

export const HISTORY_PATH = "data/prices/history.json";

export async function readHistory(path = HISTORY_PATH): Promise<HistoryFile> {
    const f = Bun.file(path);
    return (await f.exists()) ? ((await f.json()) as HistoryFile) : { points: [] };
}

const key = (r: PriceRecord) => `${r.actuatorId}@${r.date}/${r.method}`;

export function mergePoints(file: HistoryFile, added: PriceRecord[]): HistoryFile {
    const byKey = new Map(file.points.map((r) => [key(r), r]));
    for (const r of added) byKey.set(key(r), r);
    const points = [...byKey.values()].sort(
        (a, b) =>
            a.actuatorId.localeCompare(b.actuatorId) ||
            a.date.localeCompare(b.date) ||
            a.method.localeCompare(b.method),
    );
    return { points };
}

// Last recorded price per actuator, the reference for variant picks and the
// review check.
export function lastPrices(file: HistoryFile): Map<string, number> {
    const out = new Map<string, number>();
    for (const r of [...file.points].sort((a, b) => a.date.localeCompare(b.date)))
        if (!r.outOfStock) out.set(r.actuatorId, r.priceUsd);
    return out;
}

export async function writeHistory(
    file: HistoryFile,
    path = HISTORY_PATH,
): Promise<void> {
    await Bun.write(path, `${JSON.stringify(file, null, 4)}\n`);
}
