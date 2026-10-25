// Every number in the supply-chain registry is a Sourced value: the figure
// plus where it came from, when it was true and how much to trust it.
//
//   reported   a figure the source publishes (filing, statistic, release)
//   estimated  the source's own estimate, or a conversion of a reported figure
//   modeled    computed here from sourced inputs; `note` says how

export const CONFIDENCES = ["reported", "estimated", "modeled"] as const;
export type Confidence = (typeof CONFIDENCES)[number];

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
    reported: "Reported",
    estimated: "Estimate",
    modeled: "Model",
};

export type SourceId = string;

export interface Sourced<T> {
    value: T;
    // "t", "t/yr", "USD", "fraction", "year", "HHI"
    unit?: string;
    sources: SourceId[];
    // ISO date or "YYYY" / "YYYY-MM"
    asOf: string;
    confidence: Confidence;
    note?: string;
    range?: [T, T];
}

// True for anything shaped like a Sourced record. The citation audit and the
// footnote collectors use it to find values inside arbitrary records.
export function isSourced(x: unknown): x is Sourced<unknown> {
    return (
        typeof x === "object" &&
        x !== null &&
        "value" in x &&
        "sources" in x &&
        "confidence" in x &&
        "asOf" in x
    );
}
