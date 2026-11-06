import type { DirectoryOrgId } from "./orgs";
import type { LinkKind } from "./types";

// The /people directory: researched leading voices in actuators and the
// rare-earth magnet chain. Professional facts only, each with a source from
// ./sources.ts (ids without the "people-" prefix are added by `src`). Roles
// were confirmed from search results on PEOPLE_AS_OF, not page by page;
// records marked "To verify" need a second look. Anyone listed can ask to be
// changed or removed through /contact. The records live in ./records/, one
// file per domain, joined in ./records/index.ts.

export const PEOPLE_PATH = "/people";
export const PEOPLE_AS_OF = "2026-11-03";

export const PEOPLE_DOMAINS = ["research", "industry", "magnets", "policy"] as const;
export type PeopleDomain = (typeof PEOPLE_DOMAINS)[number];

export const DOMAIN_LABEL: Record<PeopleDomain, string> = {
    research: "Actuator research",
    industry: "Actuators and robots",
    magnets: "REE and magnets",
    policy: "Analysts and policy",
};

// Inclusion criteria, printed on the page. Each person meets at least one,
// backed by a public source.
export const CRITERIA = {
    invented:
        "Invented or co-invented an actuator or magnet technology that is in use or under serious development (a highly cited paper, patent family or product).",
    leads: "Leads (CEO, CTO, founder or head of actuators) an organisation in the supply-chain registry, the catalog or the humanoid map, or one building actuator, magnet or rare-earth capacity.",
    cited: "Is widely cited as an expert on rare earth or magnet supply by reputable press or government.",
    programme: "Leads a government programme on critical minerals or robot actuation.",
} as const;
export type Criterion = keyof typeof CRITERIA;

export const EXCLUSIONS =
    "Not listed: private individuals, people known only from social media, and anyone who asks to be removed. Only professional information is shown.";

export const KEY_WORK_KINDS = [
    "paper",
    "patent",
    "product",
    "company",
    "report",
    "award",
    "role",
] as const;
export type KeyWorkKind = (typeof KEY_WORK_KINDS)[number];

export interface KeyWork {
    title: string;
    // Omitted when no source we checked dates it.
    year?: number;
    url: string;
    kind: KeyWorkKind;
}

export interface DirectoryRecord {
    id: string;
    name: string;
    // Name in the person's own script, when commonly used.
    localName?: string;
    role: string;
    orgId: DirectoryOrgId;
    // Earlier or secondary affiliations, drawn as extra edges in the network.
    alsoOrgIds?: DirectoryOrgId[];
    domain: PeopleDomain;
    criterion: Criterion;
    // At most 20 words, in our own words.
    whyTheyMatter: string;
    keyWorks: KeyWork[];
    // Source ids (in ./sources.ts) for the role, affiliation and criterion.
    sources: string[];
    links: { kind: LinkKind; url: string }[];
}
