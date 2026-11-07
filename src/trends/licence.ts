import { type Citation, licenceErrors } from "../supply-chain/licence";
import { TREND_CHARTS } from "./index";
import { SOURCES, TRENDS_FACTS_ALLOWLIST, isOwnSource } from "./sources";

// Citation audit for /trends: every point cites a known source (or
// actuatorlist's own data), and the reuse rules in src/supply-chain/licence.ts
// hold. One record per point.

export function trendsCitations(): Citation[] {
    return TREND_CHARTS.flatMap((c) =>
        c.series.flatMap((s) =>
            s.points.map(
                (p): Citation => [`trend ${c.id}/${s.id}@${p.date}`, p.sources],
            ),
        ),
    );
}

export function trendsLicenceErrors(): string[] {
    const citations = trendsCitations();
    const unknown = citations.flatMap(([where, ids]) => [
        ...(ids.length === 0 ? [`${where}: no sources`] : []),
        ...ids
            .filter((id) => !isOwnSource(id) && !Object.hasOwn(SOURCES, id))
            .map(
                (id) =>
                    `${where}: unknown source "${id}"; add it to src/trends/sources.ts`,
            ),
    ]);
    const used = new Set(citations.flatMap(([, ids]) => ids));
    const orphans = Object.keys(SOURCES)
        .filter((id) => !used.has(id))
        .map(
            (id) =>
                `trends source "${id}" is not cited; remove it from src/trends/sources.ts`,
        );
    return [
        ...unknown,
        ...orphans,
        ...licenceErrors({
            name: "trends",
            file: "src/trends/sources.ts",
            sources: Object.entries(SOURCES).map(([id, s]) => ({ id, ...s })),
            citations: citations.map(([where, ids]) => [
                where,
                ids.filter((id) => !isOwnSource(id)),
            ]),
            allowlist: TRENDS_FACTS_ALLOWLIST,
        }),
    ];
}
