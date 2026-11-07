import { type Citation, licenceErrors } from "../supply-chain/licence";
import { ROBOTS } from "./index";
import {
    REGISTERED_KINDS,
    ROBOT_FACTS_ALLOWLIST,
    ROBOT_SOURCES,
    type RobotSource,
} from "./robot-sources";

// Citation audit for the robots catalog: every robot of a registered kind
// cites at least one source, every one of its source URLs is in
// src/catalog/robot-sources.ts, and the reuse rules hold
// (src/supply-chain/licence.ts).

const FILE = "src/catalog/robot-sources.ts";

const entries = Object.entries(ROBOT_SOURCES) as [string, RobotSource][];
const idByUrl = new Map(entries.map(([id, s]) => [s.url, id]));

const registered = () =>
    ROBOTS.filter((r) => (REGISTERED_KINDS as readonly string[]).includes(r.kind));

export function robotCitations(): Citation[] {
    return registered().map(
        (r): Citation => [
            `robot ${r.id}`,
            [...new Set(r.sources.flatMap((u) => idByUrl.get(u) ?? []))],
        ],
    );
}

export function robotLicenceErrors(): string[] {
    const missing = registered().flatMap((r) => [
        ...(r.sources.length === 0 ? [`robot ${r.id}: no sources`] : []),
        ...r.sources
            .filter((u) => !idByUrl.has(u))
            .map(
                (u) =>
                    `robot ${r.id}: source ${u} is not in ${FILE}; add it with a reuse value`,
            ),
    ]);
    const dupes = entries
        .filter(([id, s]) => idByUrl.get(s.url) !== id)
        .map(([id]) => `robot source "${id}": URL listed twice in ${FILE}`);
    return [
        ...missing,
        ...dupes,
        ...licenceErrors({
            name: "robots",
            file: FILE,
            sources: entries.map(([id, s]) => ({ id, ...s })),
            citations: robotCitations(),
            allowlist: ROBOT_FACTS_ALLOWLIST,
        }),
    ];
}
