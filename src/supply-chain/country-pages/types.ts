import type { Admin1Country, NamedCluster } from "../map";
import type { SourceId, Sourced } from "../sourced";
import type { Stage } from "../stages";

// What a country page holds beyond the registry: its stage shares, named
// industrial clusters and a line of context. Companies, sites and links come
// from the shared registry, filtered by country (see ./index.ts).

// The country's share of world output at one stage, or a gap in words when
// no public source splits the stage by country.
export interface CountryStage {
    stage: Stage;
    // What the share is a share of, e.g. "world NdFeB magnet output".
    of: string;
    share?: Sourced<number>;
    gap?: { text: string; sources: SourceId[] };
}

// A named cluster the map can zoom to, with one line on what it is.
export interface CountryCluster extends NamedCluster {
    blurb: string;
}

export interface CountryContent {
    code: Admin1Country;
    // Page heading and title, e.g. "Japan".
    name: string;
    // One sentence under the heading.
    lede: string;
    stages: CountryStage[];
    clusters: CountryCluster[];
    // The counts this country must reach to go live, when its data issue sets
    // a lower bar than the shared COVERAGE_TARGET.
    gate?: { companies: number; sites: number; links: number; supplyLinks: number };
    // Admin-1 regions the map can zoom to (?region=TX), when the page offers it.
    regions?: CountryRegions;
    // Hubs a busy map collapses to while zoomed out.
    hubs?: CountryHub[];
}

// One admin-1 region: its code in the URL ("TX", the ISO 3166-2 code
// without the country) and its name as sites record it ("Texas").
export interface CountryRegion {
    code: string;
    name: string;
}

export interface CountryRegions {
    // What a region is called on this page: "state" / "states".
    word: string;
    plural: string;
    list: CountryRegion[];
}

// A regional hub on the zoomed-out map: every site in these regions (by
// name), drawn as one marker that zooms to them.
export interface CountryHub {
    id: string;
    label: string;
    regions: string[];
}
