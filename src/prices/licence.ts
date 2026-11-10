import { getActuator } from "../catalog";
import { type Citation, licenceErrors } from "../supply-chain/licence";
import { HISTORY_RECORDS } from "./history";
import { PRICE_METHODS, type PriceRecord, pointKey } from "./types";

// Audit of data/prices/history.json (the /trends seed points are audited with
// /trends). Every record names a catalog actuator, a known method, a past
// day, a USD price that equals the listed price times the stored FX rate,
// and the page it was read from. Each product page is a "facts" source: one
// price per product per date, never the page's prose or tables. A page's
// points about one actuator are one record (a price series of one product),
// so the licence rules apply to pages reused across many actuators.

const DAY = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

// A real calendar day: the pattern, and no 2026-02-31.
const isDay = (d: string) =>
    DAY.test(d) && new Date(`${d}T00:00:00Z`).toISOString().slice(0, 10) === d;

// The page behind a record: an archived copy counts as the original page.
export function pageOf(url: unknown): string {
    if (typeof url !== "string") return "";
    const original = /^https?:\/\/web\.archive\.org\/web\/\d+[a-z_]*\/(.+)$/.exec(
        url,
    )?.[1];
    return (original ?? url).replace(/^https?:\/\/(www\.)?/, "").replace(/[?#].*$/, "");
}

function recordErrors(r: PriceRecord, i: number, today: string): string[] {
    const where = `data/prices/history.json #${i} (${r.actuatorId}@${r.date})`;
    const errors: string[] = [];
    if (!getActuator(r.actuatorId)) errors.push(`${where}: no catalog actuator`);
    if (!(PRICE_METHODS as readonly string[]).includes(r.method))
        errors.push(`${where}: unknown method "${r.method}"`);
    if (typeof r.date !== "string" || !isDay(r.date))
        errors.push(`${where}: date must be YYYY-MM-DD`);
    else if (r.date > today) errors.push(`${where}: dated after ${today}`);
    if (!/^[A-Z]{3}$/.test(r.currency)) errors.push(`${where}: bad currency`);
    if (!(r.fxRate > 0)) errors.push(`${where}: fxRate must be positive`);
    if (!(r.priceUsd > 0 && r.originalPrice > 0))
        errors.push(`${where}: prices must be positive`);
    else if (
        Math.abs(r.priceUsd - r.originalPrice * r.fxRate) >
        0.01 + r.priceUsd * 0.001
    )
        errors.push(`${where}: priceUsd is not originalPrice x fxRate`);
    if (r.currency === "USD" && r.fxRate !== 1)
        errors.push(`${where}: USD fxRate must be 1`);
    if (typeof r.url !== "string" || !/^https?:\/\//.test(r.url))
        errors.push(`${where}: url must be http(s)`);
    return errors;
}

export function pricesLicenceErrors(
    today = new Date().toISOString().slice(0, 10),
    records: readonly PriceRecord[] = HISTORY_RECORDS,
): string[] {
    const seen = new Set<string>();
    const dupes = records.flatMap((r) => {
        const key = pointKey(r);
        if (seen.has(key)) return [`data/prices/history.json: duplicate point ${key}`];
        seen.add(key);
        return [];
    });
    const pages = [...new Set(records.map((r) => pageOf(r.url)))];
    const pairs = new Map<string, Citation>();
    for (const r of records) {
        const page = pageOf(r.url);
        pairs.set(JSON.stringify([r.actuatorId, page]), [
            `price ${r.actuatorId} from ${page}`,
            [page],
        ]);
    }
    const citations = [...pairs.values()];
    return [
        ...records.flatMap((r, i) => recordErrors(r, i, today)),
        ...dupes,
        ...licenceErrors({
            name: "prices",
            file: "src/prices/licence.ts",
            sources: pages.map((id) => ({ id, reuse: "facts" as const })),
            citations,
            allowlist: {},
        }),
    ];
}
