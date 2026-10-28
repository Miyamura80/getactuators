import { priced } from "../../../../src/prices/history";
import {
    MIN_CORRELATION_MONTHS,
    MIN_FIT_DAYS,
    MIN_FIT_POINTS,
    type NmPoint,
    lagCorrelation,
    learningCurve,
    ndprByMonth,
    priceIndex,
} from "../../../../src/prices/trends";
import type { PriceObservation } from "../../../../src/prices/types";
import { CLASSES } from "./shared";

// Which trend views the history can support yet. Each gate opens on the same
// test the analysis uses to decline (learningCurve, lagCorrelation), so the
// page never shows a chart the numbers behind it would refuse.

export type GateId = "curve" | "history" | "metals";

export interface Gate {
    id: GateId;
    label: string;
    have: number;
    need: number;
    unit: string;
    open: boolean;
    note?: string;
}

// A step chart of one actuator's price says something from this many
// readings on distinct dates (four weekly snapshots, about a month).
export const MIN_HISTORY_READINGS = MIN_FIT_POINTS;

export function gates(nm: readonly NmPoint[], points: readonly PriceObservation[]): Gate[] {
    const fits = CLASSES.map((c) => learningCurve(nm.filter((p) => p.category === c.slug), "time"));
    const index = priceIndex(points);
    const corr = lagCorrelation(index, ndprByMonth(index.map((p) => p.month)));
    const dates = new Map<string, Set<string>>();
    for (const p of priced(points)) dates.set(p.actuatorId, (dates.get(p.actuatorId) ?? new Set()).add(p.date));
    const readings = Math.max(0, ...[...dates.values()].map((s) => s.size));
    const paired = Math.max(0, ...corr.map((c) => c.n));
    return [
        {
            id: "curve",
            label: "Learning curve",
            have: Math.max(0, ...fits.map((f) => f.status === "fit" ? MIN_FIT_DAYS : f.days)),
            need: MIN_FIT_DAYS,
            unit: "days",
            open: fits.some((f) => f.status === "fit"),
        },
        {
            id: "history",
            label: "Per-actuator history",
            have: readings,
            need: MIN_HISTORY_READINGS,
            unit: "readings",
            open: readings >= MIN_HISTORY_READINGS,
        },
        {
            id: "metals",
            label: "Price vs NdPr metals",
            have: paired,
            need: MIN_CORRELATION_MONTHS,
            unit: "paired months",
            open: corr.some((c) => c.r !== null),
            // Enough months but no r: one series did not move, so there is
            // nothing to correlate yet.
            ...(paired >= MIN_CORRELATION_MONTHS ? { note: "waiting for NdPr to move" } : {}),
        },
    ];
}
