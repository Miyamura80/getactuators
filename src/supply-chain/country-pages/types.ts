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
}
