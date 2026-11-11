import { type Citation, licenceErrors } from "../supply-chain/licence";
import { FAMILIES } from "./index";
import { PATENT_FACTS_ALLOWLIST, PATENT_SOURCES } from "./sources";
import { TECHNOLOGY_LIST } from "./technologies";

// Citation audit for /patents: each technology's counts and each listed
// family cite the BigQuery dataset. The CPC scheme backs the code sets as one
// shared method record (how codes were chosen, in our own words), so a new
// technology does not add a record to it. The reuse rules in
// src/supply-chain/licence.ts then apply. Every CPC rule also needs its
// one-line rationale.

const DATASET = "google-patents-public-data";

export function patentCitations(): Citation[] {
    return [
        ["patents CPC code sets", ["cpc-scheme"]],
        ...TECHNOLOGY_LIST.map(
            (t): Citation => [`patents technology ${t.id}`, [DATASET]],
        ),
        ...FAMILIES.map((f): Citation => [`patent family ${f.id}`, [DATASET]]),
    ];
}

export function patentsLicenceErrors(): string[] {
    const citations = patentCitations();
    const used = new Set(citations.flatMap(([, ids]) => ids));
    const orphans = Object.keys(PATENT_SOURCES)
        .filter((id) => !used.has(id))
        .map(
            (id) =>
                `patents source "${id}" is not cited; remove it from src/patents/sources.ts`,
        );
    const rationale = TECHNOLOGY_LIST.flatMap((t) =>
        t.codes
            .filter((c) => !c.why.trim())
            .map((c) => `patents technology ${t.id}: CPC ${c.code} needs a rationale`),
    );
    return [
        ...orphans,
        ...rationale,
        ...licenceErrors({
            name: "patents",
            file: "src/patents/sources.ts",
            sources: Object.entries(PATENT_SOURCES).map(([id, s]) => ({ id, ...s })),
            citations,
            allowlist: PATENT_FACTS_ALLOWLIST,
        }),
    ];
}
