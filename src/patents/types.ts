import type { TechnologyId } from "./technologies";

// Shapes of the committed /patents data (data/patents/*.json), written by
// scripts/patents/build-landscape.ts from the BigQuery extract.

// ISO alpha-2 applicant country, or "XX" when neither the assignee nor any
// national publication in the family gives one.
export type ApplicantCountry = string;

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

export interface TechLandscape {
    families: number;
    // Distinct normalised first assignees.
    assignees: number;
    // Families per applicant country per priority year (aligned with years).
    counts: Record<ApplicantCountry, number[]>;
    top: AssigneeRow[];
}

export interface LandscapeFile {
    asOf: string;
    years: number[];
    // Last priority year with every month published (18 months before asOf).
    completeThrough: number;
    // Priority dates from here on are still being published.
    incompleteFrom: string;
    extract: { publications: number; families: number; matched: number };
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
