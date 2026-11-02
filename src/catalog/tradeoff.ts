import { parseRatio } from "../humanoids/drive";
import { APPLICATION_GROUPS, applicationsOf } from "./gallery";
import type { Actuator } from "./types";

// The compliance vs precision trade-off. Reduction ratio is the axis it
// lives on: a low ratio (direct drive, QDD) keeps the joint backdrivable and
// force-transparent, so it suits contact and learned control; a high ratio
// (harmonic, servo) buys stiffness and fine positioning, but the motor can
// no longer feel the load. Backlash and the backdrivable flag are the
// published evidence on each side.

export type Backdrive = "yes" | "no" | "unknown";

export interface TradeoffRow {
    id: string;
    name: string;
    category: Actuator["category"];
    // Application group keys from the gallery (legged, humanoid, ...).
    applications: string[];
    price: number;
    ratio: number;
    backlash: number | null;
    backdrive: Backdrive;
    verified: boolean;
}

type TradeoffSource = Pick<
    Actuator,
    | "id"
    | "name"
    | "category"
    | "use_cases"
    | "price_usd"
    | "gear_ratio"
    | "backlash_arcmin"
    | "backdrivable"
    | "verified"
>;

// "1:1" (direct drive) counts as ratio 1; anything else uses the shared
// parser, which takes the first n:1 figure of a range.
export function reductionRatio(text: string | null | undefined): number | null {
    if (text && /^\s*1\s*:\s*1\b/.test(text)) return 1;
    return parseRatio(text);
}

// Priced actuators with a published reduction ratio.
export function tradeoffRows(list: readonly TradeoffSource[]): TradeoffRow[] {
    const rows: TradeoffRow[] = [];
    for (const a of list) {
        const ratio = reductionRatio(a.gear_ratio);
        if (a.price_usd == null || a.price_usd <= 0 || ratio == null) continue;
        rows.push({
            id: a.id,
            name: a.name,
            category: a.category,
            applications: applicationsOf({ use_cases: a.use_cases ?? [] }),
            price: a.price_usd,
            ratio,
            backlash: a.backlash_arcmin ?? null,
            backdrive:
                a.backdrivable == null ? "unknown" : a.backdrivable ? "yes" : "no",
            verified: a.verified,
        });
    }
    return rows;
}

// Application filters worth offering, in gallery order: groups shared by at
// least `min` plotted rows.
export function tradeoffApplications(
    rows: readonly TradeoffRow[],
    min = 4,
): { key: string; label: string; count: number }[] {
    return APPLICATION_GROUPS.map((g) => ({
        key: g.key,
        label: g.label,
        count: rows.filter((r) => r.applications.includes(g.key)).length,
    })).filter((g) => g.count >= min);
}
