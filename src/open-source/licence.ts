import { type Citation, licenceErrors } from "../supply-chain/licence";
import { EXCLUDED_ROBOTS } from "./excluded";
import { BODIES } from "./fleet-bodies";
import { MANIPULATORS } from "./fleet-manipulators";
import { OPEN_SOURCE_FACTS_ALLOWLIST, SOURCES } from "./sources";

// Citation audit for /open-source: every record cites known sources, and the
// sources' reuse rules hold (see src/supply-chain/licence.ts).

export function openSourceCitations(): Citation[] {
    const robots = [...MANIPULATORS, ...BODIES].map((r): Citation => {
        const ids = [
            ...r.sources,
            ...r.joints.flatMap((j) => j.sources),
            ...(r.bomCostUsd?.sources ?? []),
            ...(r.payloadKg?.sources ?? []),
        ];
        return [`open robot ${r.id}`, [...new Set(ids)]];
    });
    const excluded = EXCLUDED_ROBOTS.map(
        (r): Citation => [`excluded robot ${r.name}`, r.sources],
    );
    return [...robots, ...excluded];
}

// Every joint group and every sourced figure must cite its own source, so a
// robot-level source cannot hide an unsourced value. The reuse audit below
// still counts one record per robot.
function missingCitations(): string[] {
    return [...MANIPULATORS, ...BODIES].flatMap((r) => [
        ...(r.sources.length === 0 ? [`open robot ${r.id}: no sources`] : []),
        ...r.joints
            .filter((j) => j.sources.length === 0)
            .map((j) => `open robot ${r.id}, joint "${j.role}": no sources`),
        ...(r.bomCostUsd && r.bomCostUsd.sources.length === 0
            ? [`open robot ${r.id}, cost: no sources`]
            : []),
        ...(r.payloadKg && r.payloadKg.sources.length === 0
            ? [`open robot ${r.id}, payload: no sources`]
            : []),
    ]);
}

export function openSourceLicenceErrors(): string[] {
    const citations = openSourceCitations();
    const unknown = citations.flatMap(([where, ids]) => [
        ...(ids.length === 0 ? [`${where}: no sources`] : []),
        ...ids
            .filter((id) => !Object.hasOwn(SOURCES, id))
            .map(
                (id) =>
                    `${where}: unknown source "${id}"; add it to src/open-source/sources.ts`,
            ),
    ]);
    return [
        ...missingCitations(),
        ...unknown,
        ...licenceErrors({
            name: "open-source",
            file: "src/open-source/sources.ts",
            sources: Object.entries(SOURCES).map(([id, s]) => ({ id, ...s })),
            citations,
            allowlist: OPEN_SOURCE_FACTS_ALLOWLIST,
        }),
    ];
}
