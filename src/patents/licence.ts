import { type Citation, licenceErrors } from "../supply-chain/licence";
import { FAMILIES } from "./index";
import { PATENT_FACTS_ALLOWLIST, PATENT_SOURCES } from "./sources";
import { TECHNOLOGIES } from "./technologies";

// Citation audit for /patents: each technology's code set cites the BigQuery
// dataset and the CPC scheme, and each listed family cites the dataset. The
// reuse rules in src/supply-chain/licence.ts then apply. Every CPC rule also
// needs its one-line rationale.

const DATASET = "google-patents-public-data";

export function patentCitations(): Citation[] {
    return [
        ...TECHNOLOGIES.map(
            (t): Citation => [`patents technology ${t.id}`, [DATASET, "cpc-scheme"]],
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
    const rationale = TECHNOLOGIES.flatMap((t) =>
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
