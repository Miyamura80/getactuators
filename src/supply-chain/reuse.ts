// How a cited source's data may be reused, shared by the supply-chain and
// humanoid source registries. The dataset is published under CC BY 4.0
// (`LICENSE-DATA`), so every source says what we may take from it:
//   open: public domain or openly licensed (government statistics,
//     CC-licensed papers, our own catalog).
//   facts: copyrighted page we take individual facts from (news, datasheets,
//     vendor sites, blogs). Never its prose or a whole table.
//   restricted: may be cited, but its data must not be redistributed
//     (paywalled reports, licensed price feeds).
// Rules live in ./licence.ts; the guide is AGENTS.md "Data sourcing and licences".

export const SOURCE_REUSE = ["open", "facts", "restricted"] as const;

export type SourceReuse = (typeof SOURCE_REUSE)[number];

// Facts sources allowed to back more than FACTS_MAX_RECORDS records, each with
// a one-line reason why that is not bulk copying.
export type ReuseAllowlist<Id extends string> = Partial<Record<Id, string>>;

// A restricted source may back at most this many records.
export const RESTRICTED_MAX_RECORDS = 3;

// A facts source backing more records than this needs an allowlist entry.
export const FACTS_MAX_RECORDS = 10;
