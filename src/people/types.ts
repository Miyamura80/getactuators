// Shared people registry: who appears on /contributors (and later /people),
// with a headshot and the logo of their main affiliation.

// Sources registry ids (#71). Plain strings until that registry lands.
export type SourceId = string;

export type Licence =
    | "consent"
    | "press-kit"
    | "cc-by"
    | "cc-by-sa"
    | "public-domain"
    | "own";

// A self-hosted image. `path` is the served URL; the file lives under
// frontend/public at the same path (frontend/public/people/<id>.webp,
// frontend/public/orgs/<id>.svg). Written by scripts/people-assets.ts.
export interface ImageAsset {
    path: string;
    sourceUrl: string;
    licence: Licence;
    credit?: string;
    // ISO date the source was fetched.
    retrieved: string;
}

export type LinkKind = "github" | "web" | "x" | "linkedin" | "scholar";

export type PersonList = "contributor-core" | "contributor" | "people";

export interface Person {
    id: string;
    name: string;
    localName?: string;
    role: string;
    affiliation: { orgId: string; title?: string };
    headshot?: ImageAsset;
    links: { kind: LinkKind; url: string }[];
    lists: PersonList[];
    // At most 40 words.
    bio?: string;
    // One line on what they contributed to actuatorlist.
    contribution?: string;
    // Extra commit emails, beyond the GitHub noreply address derived from a
    // github link, used to count their commits in git history.
    gitEmails?: string[];
    sources?: SourceId[];
}

export interface Org {
    id: string;
    name: string;
    url: string;
    logo?: ImageAsset;
    // Supply-chain Company registry id (#71), when the org has a record there.
    companyId?: string;
}

// Commit counts per person, snapshotted from git history by
// `bun scripts/people-assets.ts contributions`.
export interface Contribution {
    commits: number;
    // Squash-merged pull requests (subjects ending in "(#123)").
    pullRequests: number;
    first: string;
    last: string;
}
