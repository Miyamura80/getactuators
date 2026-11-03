import type { Shares } from "../concentration";
import {
    HREE_SEPARATION,
    METAL_ALLOY_2023,
    NDFEB_MAGNETS_2024,
    REE_MINING_2025,
    REE_SEPARATION_2024,
} from "../metals/stage-shares";
import type { Sourced } from "../sourced";
import { MAGNET_CHAIN } from "./magnet";
import type { ProcessChain, ProcessStep, ShareRef } from "./types";

// /manufacturing: how the parts of an actuator are made, one process graph
// per chain. Data only; zod wire shapes live in ./views (server side).

export { MANUFACTURING_PATH } from "./path";
export const MANUFACTURING_AS_OF = "November 2026";

export * from "./types";
export { MAGNET_CHAIN, MAGNET_STEP_IDS } from "./magnet";

// Every chain on the map; the switcher lists them in this order. Motor,
// gearing and precision chains (#83) append here.
export const PROCESS_CHAINS: readonly ProcessChain[] = [MAGNET_CHAIN];

export const DEFAULT_CHAIN = MAGNET_CHAIN.id;

export function getChain(id: string): ProcessChain | undefined {
    return PROCESS_CHAINS.find((c) => c.id === id);
}

export function getStep(chain: ProcessChain, id: string): ProcessStep | undefined {
    return chain.steps.find((s) => s.id === id);
}

// Every step id across chains: the contract /bom's processStepIds check.
export const PROCESS_STEP_IDS: ReadonlySet<string> = new Set(
    PROCESS_CHAINS.flatMap((c) => c.steps.map((s) => s.id)),
);

export function isProcessStepId(id: string): boolean {
    return PROCESS_STEP_IDS.has(id);
}

// The chain a step id belongs to (step ids are unique across chains).
export function chainOfStep(id: string): ProcessChain | undefined {
    return PROCESS_CHAINS.find((c) => c.steps.some((s) => s.id === id));
}

// Country shares behind a share key: the /metals stage shares, so each is
// cited once in the registry.
export const PROCESS_SHARES: Record<ShareRef, Sourced<Shares>> = {
    "ree-mining": REE_MINING_2025,
    "ree-separation": REE_SEPARATION_2024,
    "hree-separation": HREE_SEPARATION,
    "metal-alloy": METAL_ALLOY_2023,
    "ndfeb-magnets": NDFEB_MAGNETS_2024,
};

export function sharesOf(ref: ShareRef | undefined): Sourced<Shares> | undefined {
    return ref ? PROCESS_SHARES[ref] : undefined;
}

export function stepsIn(chain: ProcessChain, clusterId: string): ProcessStep[] {
    return chain.steps.filter((s) => s.cluster === clusterId);
}

// Steps directly upstream and downstream of a step, for keyboard moves.
export function neighbours(
    chain: ProcessChain,
    id: string,
): { prev: string[]; next: string[] } {
    return {
        prev: chain.edges.filter((e) => e.to === id).map((e) => e.from),
        next: chain.edges.filter((e) => e.from === id).map((e) => e.to),
    };
}

// Steps in reading order: cluster by cluster, each in the order listed.
export function orderedSteps(chain: ProcessChain): ProcessStep[] {
    return chain.clusters.flatMap((c) => stepsIn(chain, c.id));
}

export const MAX_LABEL_WORDS = 4;
export const MAX_CAPTION_WORDS = 12;

export const wordCount = (s: string): number =>
    s.trim().split(/\s+/).filter(Boolean).length;

// Integrity rules: short text, edges between known steps, unique ids, known
// clusters. The citation audit reports these.
function stepErrors(chain: ProcessChain, s: ProcessStep): string[] {
    const where = `process ${chain.id}/${s.id}`;
    const rules: [boolean, string][] = [
        [!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.id), "id is not kebab-case"],
        [
            !chain.clusters.some((k) => k.id === s.cluster),
            `unknown cluster "${s.cluster}"`,
        ],
        [
            wordCount(s.label) > MAX_LABEL_WORDS,
            `label "${s.label}" is over ${MAX_LABEL_WORDS} words`,
        ],
        [
            wordCount(s.caption) > MAX_CAPTION_WORDS,
            `caption is over ${MAX_CAPTION_WORDS} words`,
        ],
        [s.sources.length === 0, "no sources"],
    ];
    return rules.filter(([bad]) => bad).map(([, msg]) => `${where}: ${msg}`);
}

function edgeErrors(chain: ProcessChain): string[] {
    const ids = new Set(chain.steps.map((s) => s.id));
    return chain.edges.flatMap((e) =>
        [e.from, e.to]
            .filter((end) => !ids.has(end))
            .map(
                (end) =>
                    `process ${chain.id}: edge ${e.from} -> ${e.to} names unknown step "${end}"`,
            ),
    );
}

export function processErrors(
    chains: readonly ProcessChain[] = PROCESS_CHAINS,
): string[] {
    const all = chains.flatMap((c) => c.steps.map((s) => s.id));
    const dupes = [...new Set(all.filter((id, i) => all.indexOf(id) !== i))].map(
        (id) => `process step "${id}": duplicate step id across chains`,
    );
    return [
        ...dupes,
        ...chains.flatMap((c) => [
            ...c.steps.flatMap((s) => stepErrors(c, s)),
            ...edgeErrors(c),
        ]),
    ];
}
