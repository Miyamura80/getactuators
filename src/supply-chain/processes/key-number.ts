import type { Sourced } from "../sourced";
import type { KeyNumber } from "./types";

// Builders for a step's headline numbers, shared by every chain. A value is
// reported unless `extra` says otherwise.

export function num(
    label: string,
    value: number,
    unit: string,
    sources: string[],
    asOf: string,
    extra: Partial<Sourced<number>> = {},
): KeyNumber {
    return {
        label,
        value: {
            value,
            ...(unit ? { unit } : {}),
            sources,
            asOf,
            confidence: "reported",
            ...extra,
        },
    };
}

// A range is the spread one source gives; the value drawn is its top. A
// string `extra` is the note.
export function range(
    label: string,
    lo: number,
    hi: number,
    unit: string,
    sources: string[],
    asOf: string,
    extra: string | Partial<Sourced<number>> = {},
): KeyNumber {
    const more = typeof extra === "string" ? { note: extra } : extra;
    return num(label, hi, unit, sources, asOf, { range: [lo, hi], ...more });
}
