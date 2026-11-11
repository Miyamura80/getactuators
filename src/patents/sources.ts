import type { ReuseAllowlist, SourceReuse } from "../supply-chain/reuse";

// Every source behind /patents. Counts, assignees and family titles come from
// Google Patents Public Datasets on BigQuery (CC BY 4.0, so "open"); the CPC
// scheme only backs which codes each technology uses, in our own words.
// Relative imports only: the browser bundle reuses this module.

export interface PatentSource {
    title: string;
    url: string;
    reuse: SourceReuse;
}

export const PATENT_SOURCES = {
    "google-patents-public-data": {
        title: "Google Patents Public Datasets on BigQuery (patents-public-data.patents.publications), CC BY 4.0",
        url: "https://console.cloud.google.com/marketplace/product/google_patents_public_datasets/google-patents-public-data",
        reuse: "open",
    },
    "cpc-scheme": {
        title: "Cooperative Patent Classification (EPO and USPTO): scheme and definitions",
        url: "https://www.cooperativepatentclassification.org/cpcSchemeAndDefinitions",
        reuse: "facts",
    },
} as const satisfies Record<string, PatentSource>;

export type PatentSourceId = keyof typeof PATENT_SOURCES;

// Facts sources allowed past the per-source record limit, with a reason.
export const PATENT_FACTS_ALLOWLIST: ReuseAllowlist<PatentSourceId> = {};
