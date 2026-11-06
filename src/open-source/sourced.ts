import type { Confidence, Sourced } from "../humanoids/sourced";

// Month the /open-source records were checked.
export const OPEN_SOURCE_AS_OF = "November 2026";

export function fig(
    value: number,
    unit: string,
    sources: string[],
    confidence: Confidence = "reported",
    note?: string,
): Sourced<number> {
    return {
        value,
        unit,
        sources,
        asOf: OPEN_SOURCE_AS_OF,
        confidence,
        ...(note ? { note } : {}),
    };
}

export function cost(
    value: number,
    basis: "bom" | "kit",
    sources: string[],
    note?: string,
    confidence: Confidence = "reported",
): Sourced<number> & { basis: "bom" | "kit" } {
    return { ...fig(value, "USD", sources, confidence, note), basis };
}
