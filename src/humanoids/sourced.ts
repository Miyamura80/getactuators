// A value with its provenance. Local stand-in for the shared supply-chain type:
// it will be replaced by src/supply-chain/sourced.ts (#71) once that lands, and
// the shape below matches it field for field so the swap is an import change.

export type Confidence = "reported" | "estimated" | "modeled";

export interface Sourced<T> {
    value: T;
    unit?: string;
    // Source ids (keys of SOURCES in ./sources) or absolute URLs.
    sources: string[];
    // Month the value was checked, e.g. "October 2026".
    asOf: string;
    confidence: Confidence;
    note?: string;
    // Inclusive low and high bound when the value is uncertain.
    range?: readonly [low: T, high: T];
}
