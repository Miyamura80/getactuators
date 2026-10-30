import type { CountryCode } from "../countries";
import type { MetalId } from "../metals/elements";
import type { SourceId, Sourced } from "../sourced";
import type { Stage } from "../stages";

// One government or standards-body measure that touches the actuator chain.
// Ids are stable and used in URLs (/policy#measure=<id>), so never rename one.

export const MEASURE_TYPES = [
    "export-control",
    "tariff",
    "subsidy",
    "standard",
] as const;
export type MeasureType = (typeof MEASURE_TYPES)[number];

export const MEASURE_TYPE_LABEL: Record<MeasureType, string> = {
    "export-control": "Export control",
    tariff: "Tariff and trade",
    subsidy: "Subsidy and programme",
    standard: "Standard and safety",
};

export const MEASURE_STATUSES = [
    "draft",
    "announced",
    "in-force",
    "suspended",
    "expired",
] as const;
export type MeasureStatus = (typeof MEASURE_STATUSES)[number];

export const MEASURE_STATUS_LABEL: Record<MeasureStatus, string> = {
    draft: "Draft",
    announced: "Announced",
    "in-force": "In force",
    suspended: "Suspended",
    expired: "Expired",
};

// How much of the chain one measure reaches: a named product or company, a
// whole sector, or every import or export of a country.
export const MEASURE_SCOPES = ["product", "sector", "economy"] as const;
export type MeasureScope = (typeof MEASURE_SCOPES)[number];

export type Jurisdiction = CountryCode | "EU" | "INTL";

export interface StatusChange {
    // YYYY, YYYY-MM or YYYY-MM-DD, oldest first.
    date: string;
    status: MeasureStatus;
    note?: string;
    sources: SourceId[];
}

// A measure that also pins an event on the /metals price chart.
export interface MetalsLink {
    // Stable /metals event id (?event=<id>).
    eventId: string;
    // Short pin title on the price chart.
    title: string;
    // A price floor pins as "floor", everything else as "policy".
    kind: "policy" | "floor";
    elements: MetalId[];
    // The status change the pin marks; the latest one when unset.
    date?: string;
}

export interface PolicyMeasure {
    id: string;
    jurisdiction: Jurisdiction;
    type: MeasureType;
    title: string;
    // At most 60 words.
    summary: string;
    issuer: string;
    announced?: string;
    effective?: string;
    expires?: string;
    status: MeasureStatus;
    statusHistory: StatusChange[];
    stages: Stage[];
    scope: MeasureScope;
    hsCodes?: string[];
    elements?: string[];
    companiesAffected?: string[];
    amountUsd?: Sourced<number>;
    // At least one is a government or standards-body document.
    sources: SourceId[];
    metals?: MetalsLink;
}
