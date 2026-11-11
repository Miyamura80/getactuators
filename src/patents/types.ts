import type { ApplicationAreaId } from "./application-areas";
import type { TechnologyId } from "./technologies";

// Shapes of the committed /patents data (data/patents/*.json), written by
// scripts/patents/build-landscape.ts from the BigQuery extract.

// ISO alpha-2 applicant country, or UNKNOWN_COUNTRY ("XX") when neither the assignee nor any
// national publication in the family gives one.
export type ApplicantCountry = string;

export const UNKNOWN_COUNTRY: ApplicantCountry = "XX";

const total = (v: readonly number[]) => v.reduce((s, x) => s + x, 0);

// Order of a counts record's countries: most families first, then by code.
// The pipeline writes counts in this order and readers sort by it again.
export const byCountryTotal = (
    [a, x]: readonly [string, readonly number[]],
    [b, y]: readonly [string, readonly number[]],
): number => total(y) - total(x) || a.localeCompare(b);

export interface AssigneeRow {
    // Grouping key: a supply-chain company id, "alias:<name>" or the cleaned name.
    key: string;
    name: string;
    company?: string;
    // Most common applicant country across the assignee's families.
    country: ApplicantCountry;
    families: number;
    // Families per priority year, aligned with LandscapeFile.years.
    years: number[];
}

// Quality filters on the filings stream. granted: some publication is a
// grant (kind B or C, never a utility model). intl: published by two or more
// offices other than WO. triadic: published by US, EP and JP.
export type QualityFilter = "granted" | "intl" | "triadic";

// Families in the complete years (FIRST_YEAR to completeThrough) and how
// many of them were filed in 2+ offices.
export interface IntlSplit {
    families: number;
    intl: number;
}

export interface ValueRow {
    key: string;
    name: string;
    company?: string;
    // HQ for registry companies, else the main applicant country.
    country: ApplicantCountry;
    // Families with a priority year from FIRST_YEAR to completeThrough.
    families: number;
    // Of those: filed in 2+ offices, granted, triadic.
    intl: number;
    granted: number;
    triadic: number;
}

export interface TechValue {
    // Applicant country CN against every other (and unknown) country.
    cn: IntlSplit;
    rest: IntlSplit;
    // Largest first assignees by families in the complete years.
    assignees: ValueRow[];
}

// Families per application area: [complete years, early window, late window].
export interface TechAreas {
    // Denominators: families in the complete years, early and late windows.
    families: number;
    early: number;
    late: number;
    counts: Record<ApplicationAreaId, [number, number, number]>;
}

export interface TechLandscape {
    families: number;
    // Distinct normalised first assignees.
    assignees: number;
    // Families per applicant country per priority year (aligned with years).
    counts: Record<ApplicantCountry, number[]>;
    // counts restricted to each quality filter; countries with none left out.
    quality: Record<QualityFilter, Record<ApplicantCountry, number[]>>;
    top: AssigneeRow[];
    value: TechValue;
    areas: TechAreas;
}

export interface LandscapeFile {
    asOf: string;
    years: number[];
    // Last priority year with every month published (18 months before asOf).
    completeThrough: number;
    // Priority dates from here on are still being published.
    incompleteFrom: string;
    extract: { publications: number; families: number; matched: number };
    // Priority-year windows the application-area shift compares.
    areaWindows: { early: [number, number]; late: [number, number] };
    // Priority-year windows the momentum view compares (MOMENTUM_SPAN years
    // each, the late one ending at completeThrough).
    momentumWindows: { early: [number, number]; late: [number, number] };
    technologies: Record<TechnologyId, TechLandscape>;
    // Every matched family once, whatever its technologies.
    all: TechLandscape;
}

export interface FamilyRow {
    id: string;
    // Representative publication, e.g. "US-9876543-B2".
    pub: string;
    title: string;
    assignee: string;
    company?: string;
    country: ApplicantCountry;
    // Earliest priority date in the family, YYYY-MM-DD.
    priority: string;
    // Distinct publishing authorities (countries, EP, WO).
    jurisdictions: number;
    techs: TechnologyId[];
}

export interface FamiliesFile {
    asOf: string;
    // Families kept per technology, ranked by jurisdictions.
    perTechnology: number;
    families: FamilyRow[];
}
