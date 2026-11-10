import { type HistoryFile, type PriceMethod, pointKey } from "../../src/prices/types";

// data/prices/history.json: read, merge new points (one per actuator, day and
// method; a re-run on the same day replaces its own point), sort, write.

export const HISTORY_PATH = "data/prices/history.json";

export async function readHistory(path = HISTORY_PATH): Promise<HistoryFile> {
    const f = Bun.file(path);
    return (await f.exists()) ? ((await f.json()) as HistoryFile) : { points: [] };
}

export function mergePoints(
    file: HistoryFile,
    added: HistoryFile["points"],
): HistoryFile {
    const byKey = new Map(file.points.map((r) => [pointKey(r), r]));
    for (const r of added) byKey.set(pointKey(r), r);
    const points = [...byKey.values()].sort(
        (a, b) =>
            a.actuatorId.localeCompare(b.actuatorId) ||
            a.date.localeCompare(b.date) ||
            a.method.localeCompare(b.method),
    );
    return { points };
}

// Same-day points from several methods: the later in this list wins, so a
// curated or shop-JSON price beats a page-element or archived one.
const TRUST: readonly PriceMethod[] = [
    "wayback",
    "selector",
    "jsonld",
    "woocommerce",
    "shopify",
    "manual",
];
const trust = (m: PriceMethod) => TRUST.indexOf(m);

// Last recorded price per actuator, the reference for variant picks and the
// review check.
export function lastPrices(file: HistoryFile): Map<string, number> {
    const out = new Map<string, number>();
    const sorted = [...file.points].sort(
        (a, b) => a.date.localeCompare(b.date) || trust(a.method) - trust(b.method),
    );
    for (const r of sorted) if (!r.outOfStock) out.set(r.actuatorId, r.priceUsd);
    return out;
}

export async function writeHistory(
    file: HistoryFile,
    path = HISTORY_PATH,
): Promise<void> {
    await Bun.write(path, `${JSON.stringify(file, null, 4)}\n`);
}
