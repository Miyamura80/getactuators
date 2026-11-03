import { PROCESS_CHAINS, getChain } from "@/supply-chain/processes";
import {
    processChainListOut,
    processChainListView,
    processChainOut,
    processChainView,
} from "@/supply-chain/processes/views";
import { z } from "zod";
import { type ApiContext, json } from "./http";
import { parseQuery } from "./params";
import { ApiError } from "./problem";
import { schemaRegistry } from "./schemas";

// /api/v1/processes: the /manufacturing process graphs over REST. Same wire
// shape as the MCP tool get_process.

function named<T extends z.ZodType>(id: string, schema: T): T {
    schemaRegistry.add(schema, { id });
    return schema;
}

export const ProcessChainListSchema = named("ProcessChainList", processChainListOut);
export const ProcessChainSchema = named("ProcessChain", processChainOut);

const stepId = z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    .max(64);

export const ProcessParams = z.object({
    step: stepId
        .optional()
        .describe(
            "One step id (e.g. jet-milling): return only that step, its cluster and the edges that touch it.",
        ),
});

export const PROCESS_CHAIN_IDS = PROCESS_CHAINS.map((c) => c.id);

type ProcessView = ReturnType<typeof processChainView>;

// A chain, or one step of it: that step, its cluster (listing only that
// step) and the edges that touch it.
export function processResult(
    chainId: string,
    step?: string,
): { view: ProcessView } | { error: string } {
    const chain = getChain(chainId);
    if (!chain)
        return {
            error: `No process chain "${chainId}". Chains: ${PROCESS_CHAIN_IDS.join(", ")}.`,
        };
    const view = processChainView(chain);
    if (!step) return { view };
    const steps = view.steps.filter((s) => s.id === step);
    if (steps.length === 0)
        return {
            error: `No step "${step}" in the ${chainId} chain. Step ids: ${view.steps.map((s) => s.id).join(", ")}.`,
        };
    return {
        view: {
            ...view,
            clusters: view.clusters
                .filter((c) => c.step_ids.includes(step))
                .map((c) => ({ ...c, step_ids: [step] })),
            steps,
            edges: view.edges.filter((e) => e.from === step || e.to === step),
        },
    };
}

export function listProcessesHandler(): Response {
    return json(processChainListView());
}

export function getProcessHandler({ params, url }: ApiContext): Response {
    const chain = params.chain ?? "";
    const { step } = parseQuery(ProcessParams, url);
    const r = processResult(chain, step);
    if ("error" in r)
        throw new ApiError("not_found", {
            detail: r.error,
            hint: "List chains with GET /api/v1/processes; step ids are in each chain's steps.",
        });
    return json(r.view);
}
