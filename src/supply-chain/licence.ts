import {
    HUMANOIDS,
    REE_METAL_PRICE,
    TYPICAL_DRIVE,
    humanoidTotals,
} from "../humanoids";
import { MAGNET_SOURCES } from "../humanoids/build";
import { restOfRobotCost } from "../humanoids/robot-bom";
import {
    HUMANOID_FACTS_ALLOWLIST,
    SOURCES as HUMANOID_SOURCES,
} from "../humanoids/sources";
import { FACTS_MAX_RECORDS, RESTRICTED_MAX_RECORDS, SOURCE_REUSE } from "./reuse";

// Licence rules over a source registry: every source says how its data may
// be reused, a restricted source backs only a few records, and a facts
// source backing many records (a copied table) needs an allowlist entry.

export const LICENCE_GUIDE = 'See AGENTS.md "Data sourcing and licences".';

// One record and the source ids it cites.
export type Citation = readonly [where: string, ids: readonly string[]];

export interface LicenceRegistry {
    name: string;
    // File holding the sources and their allowlist, named in error messages.
    file: string;
    sources: readonly { id: string; reuse?: unknown }[];
    citations: readonly Citation[];
    allowlist: Readonly<Record<string, string | undefined>>;
}

// Distinct records citing each source id.
function recordCounts(citations: readonly Citation[]): Map<string, number> {
    const records = new Map<string, Set<string>>();
    for (const [where, ids] of citations)
        for (const id of ids) {
            const set = records.get(id) ?? new Set<string>();
            set.add(where);
            records.set(id, set);
        }
    return new Map([...records].map(([id, set]) => [id, set.size]));
}

function allowlistErrors(
    r: LicenceRegistry,
    byId: Map<string, { reuse?: unknown }>,
    counts: Map<string, number>,
): string[] {
    const errors: string[] = [];
    for (const [id, reason] of Object.entries(r.allowlist)) {
        const where = `${r.name} allowlist entry "${id}"`;
        const s = byId.get(id);
        if (!s) errors.push(`${where}: no such source; remove it from ${r.file}.`);
        else if (s.reuse !== "facts")
            errors.push(
                `${where}: only facts sources can be allowlisted, this one is ${String(s.reuse)}; remove it from ${r.file}.`,
            );
        else if ((counts.get(id) ?? 0) <= FACTS_MAX_RECORDS)
            errors.push(
                `${where}: backs ${counts.get(id) ?? 0} records, within the limit of ${FACTS_MAX_RECORDS}; remove it from ${r.file}.`,
            );
        if (!reason?.trim())
            errors.push(`${where}: needs a one-line reason. ${LICENCE_GUIDE}`);
    }
    return errors;
}

export function licenceErrors(r: LicenceRegistry): string[] {
    const errors: string[] = [];
    const byId = new Map(r.sources.map((s) => [s.id, s]));
    for (const s of r.sources)
        if (!(SOURCE_REUSE as readonly unknown[]).includes(s.reuse))
            errors.push(
                `${r.name} source "${s.id}": reuse is ${JSON.stringify(s.reuse)}; set it to one of ${SOURCE_REUSE.join(", ")} in ${r.file} (use "facts" when unsure). ${LICENCE_GUIDE}`,
            );
    const counts = recordCounts(r.citations);
    for (const [id, n] of counts) {
        const reuse = byId.get(id)?.reuse;
        if (reuse === "restricted" && n > RESTRICTED_MAX_RECORDS)
            errors.push(
                `${r.name} source "${id}" is restricted but backs ${n} records (limit ${RESTRICTED_MAX_RECORDS}). Its data must not be redistributed: back the extra records with an open or facts source. ${LICENCE_GUIDE}`,
            );
        if (reuse === "facts" && n > FACTS_MAX_RECORDS && !r.allowlist[id])
            errors.push(
                `${r.name} source "${id}" backs ${n} records (limit ${FACTS_MAX_RECORDS}), which reads as copying its table. Cite other sources for some of them, or add "${id}" with a one-line reason to the allowlist in ${r.file}. ${LICENCE_GUIDE}`,
            );
    }
    return [...errors, ...allowlistErrors(r, byId, counts)];
}

// Humanoid records: each robot (its own, joint, cost and BOM citations), plus
// the shared method inputs once each, so a method constant reused by every
// robot counts as one record.
export function humanoidCitations(): Citation[] {
    const robots = HUMANOIDS.map((h): Citation => {
        const ids = [
            ...h.sources,
            ...h.joints.flatMap((j) => [
                ...j.sources,
                ...(j.unitCostUsd?.sources ?? []),
            ]),
            ...restOfRobotCost(h, 0).flatMap((p) => p.value.sources),
        ];
        return [`humanoid ${h.id}`, [...new Set(ids)]];
    });
    const drives = Object.entries(TYPICAL_DRIVE).map(
        ([type, d]): Citation => [
            `drive ${type}`,
            [...d.ratioSources, ...d.efficiencySources],
        ],
    );
    const prices = Object.entries(REE_METAL_PRICE).map(
        ([el, p]): Citation => [`metal price ${el}`, p.sources],
    );
    const first = HUMANOIDS[0];
    const totals: Citation[] = first
        ? [["rare-earth split", humanoidTotals(first).magnetMassKg.sources]]
        : [];
    return [
        ...robots,
        ["magnet method", MAGNET_SOURCES],
        ...drives,
        ...prices,
        ...totals,
    ];
}

export function humanoidLicenceErrors(): string[] {
    return licenceErrors({
        name: "humanoids",
        file: "src/humanoids/sources.ts",
        sources: Object.entries(HUMANOID_SOURCES).map(([id, s]) => ({ id, ...s })),
        citations: humanoidCitations(),
        allowlist: HUMANOID_FACTS_ALLOWLIST,
    });
}
