import type { SourceId, Sourced } from "../sourced";
import type { Milestone, MilestoneKind } from "./types";

// Builders for the /alts records, so every figure states its sources, date
// and confidence in one line.

export const ALTS_DATA_AS_OF = "2026-11";

export function reported(
    value: number,
    unit: string,
    sources: SourceId[],
    asOf: string,
    note?: string,
): Sourced<number> {
    return {
        value,
        unit,
        sources,
        asOf,
        confidence: "reported",
        ...(note ? { note } : {}),
    };
}

// A publisher's own estimate (a market report, a company claim).
export function estimated(
    value: number,
    unit: string,
    sources: SourceId[],
    asOf: string,
    note: string,
): Sourced<number> {
    return { value, unit, sources, asOf, confidence: "estimated", note };
}

// Technology readiness 1..9 is our reading of the evidence in `sources`.
export function trl(value: number, sources: SourceId[], note: string): Sourced<number> {
    return { value, sources, asOf: ALTS_DATA_AS_OF, confidence: "modeled", note };
}

export function milestone(
    kind: MilestoneKind,
    year: number,
    label: string,
    sources: SourceId[],
    opts: { announced?: boolean; note?: string } = {},
): Milestone {
    const announced = opts.announced ?? false;
    return {
        kind,
        label,
        announced,
        year: {
            value: year,
            unit: "year",
            sources,
            asOf: ALTS_DATA_AS_OF,
            confidence: announced ? "estimated" : "reported",
            ...(opts.note
                ? { note: opts.note }
                : announced
                  ? { note: "Announced target, not yet shipped." }
                  : {}),
        },
    };
}

// Zero rare earth because the source says the design uses none.
export function noRareEarth(
    sources: SourceId[],
    asOf: string,
    note: string,
): Sourced<number> {
    return { value: 0, unit: "kg/kW", sources, asOf, confidence: "reported", note };
}
