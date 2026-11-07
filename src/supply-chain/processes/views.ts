import { z } from "zod";
import { normalizeShares } from "../concentration";
import { CONCENTRATION_TIERS, concentrationTier } from "../concentration-tier";
import { getCompany } from "../registry";
import { CONFIDENCES } from "../sourced";
import { STAGES } from "../stages";
import { refs, sourceRefOut, sourced, sourcedOut } from "../views";
import {
    MANUFACTURING_AS_OF,
    MANUFACTURING_PATH,
    PROCESS_CHAINS,
    type ProcessChain,
    type ProcessStep,
    STEP_BRANCHES,
    type ShareRef,
    orderedSteps,
    sharesOf,
} from "./index";

// Wire shape of /manufacturing for REST and MCP: snake_case, nulls for
// unknowns, sources inline. Server side only (zod).

const sharesOut = z
    .object({
        shares: z
            .array(z.object({ country: z.string(), share: z.number() }))
            .describe("Named countries as fractions of world output, largest first."),
        other_share: z.number().describe("Unattributed remainder."),
        top_country: z.string().nullable(),
        top_share: z.number().nullable(),
        tier: z
            .enum(CONCENTRATION_TIERS)
            .nullable()
            .describe(
                "monopolized (top country 80%+), concentrated (50-80%) or distributed.",
            ),
        hhi: z.number().nullable(),
        as_of: z.string(),
        confidence: z.enum(CONFIDENCES),
        note: z.string().nullable(),
        sources: z.array(sourceRefOut),
    })
    .describe("Country shares of the stage this step belongs to.");

const keyNumberOut = z.object({
    label: z.string(),
    value: sourcedOut,
});

const companyRefOut = z.object({
    id: z.string().describe("Supply-chain registry id (GET /api/v1/companies/{id})."),
    name: z.string(),
    country: z.string(),
});

export const processStepOut = z.object({
    id: z.string().describe("Stable step id; /bom nodes reference it."),
    url: z
        .string()
        .describe(
            "Deep link: /manufacturing#step={id}, or /manufacturing?chain={chain}#step={id} for a chain other than the first.",
        ),
    cluster: z.string(),
    stage: z.enum(STAGES),
    label: z.string(),
    caption: z.string(),
    inputs: z.array(z.string()),
    outputs: z.array(z.string()),
    key_numbers: z.array(keyNumberOut),
    companies: z.array(companyRefOut).describe("Companies known to run this step."),
    country_shares: sharesOut.nullable(),
    upstream: z.array(z.string()).describe("Step ids feeding this one."),
    downstream: z.array(z.string()).describe("Step ids this one feeds."),
    branch: z.enum(STEP_BRANCHES).nullable(),
    bom_node_ids: z.array(z.string()),
    element_ids: z
        .array(z.string())
        .describe("/metals elements (nd, pr, dy, tb); empty for the precision chain."),
    animation_id: z
        .string()
        .nullable()
        .describe("3D vignette id; poster at /posters/{id}.png."),
    sources: z.array(sourceRefOut),
});

const clusterOut = z.object({
    id: z.string(),
    label: z.string(),
    stage: z.enum(STAGES),
    step_ids: z.array(z.string()),
    country_shares: sharesOut.nullable(),
});

const edgeOut = z.object({
    from: z.string(),
    to: z.string(),
    kind: z.enum(["main", "branch", "loop"]),
    label: z.string().nullable(),
});

export const processChainOut = z.object({
    id: z.string(),
    title: z.string(),
    span: z.string().describe("Where the chain starts and ends."),
    product: z.string(),
    parallel: z
        .boolean()
        .describe(
            "True when clusters are side-by-side sub-chains that each feed the product, not stages in sequence.",
        ),
    url: z.string(),
    as_of: z.string(),
    clusters: z.array(clusterOut),
    steps: z.array(processStepOut).describe("In reading order, cluster by cluster."),
    edges: z.array(edgeOut),
});

export const processChainListOut = z.object({
    as_of: z.string(),
    results: z.array(
        z.object({
            id: z.string(),
            title: z.string(),
            product: z.string(),
            url: z.string(),
            step_count: z.number(),
        }),
    ),
});

export const processChainUrl = (chain: ProcessChain): string =>
    chain.id === PROCESS_CHAINS[0]?.id
        ? MANUFACTURING_PATH
        : `${MANUFACTURING_PATH}?chain=${chain.id}`;

export function stepUrl(chain: ProcessChain, id: string): string {
    return `${processChainUrl(chain)}#step=${id}`;
}

function sharesView(ref: ShareRef | undefined): z.input<typeof sharesOut> | null {
    const s = sharesOf(ref);
    if (!s) return null;
    const n = normalizeShares(s.value);
    const c = concentrationTier(s.value);
    return {
        shares: n.countries.map((x) => ({ country: x.country, share: x.share })),
        other_share: n.other,
        top_country: c?.top.country ?? null,
        top_share: c?.top.share ?? null,
        tier: c?.tier ?? null,
        hhi: c?.hhi ?? null,
        as_of: s.asOf,
        confidence: s.confidence,
        note: s.note ?? null,
        sources: refs(s.sources),
    };
}

export function processStepView(
    chain: ProcessChain,
    s: ProcessStep,
): z.input<typeof processStepOut> {
    const stage = chain.clusters.find((c) => c.id === s.cluster)?.stage ?? "magnet";
    return {
        id: s.id,
        url: stepUrl(chain, s.id),
        cluster: s.cluster,
        stage,
        label: s.label,
        caption: s.caption,
        inputs: s.inputs,
        outputs: s.outputs,
        key_numbers: s.keyNumbers.map((k) => ({
            label: k.label,
            value: sourced(k.value) as z.input<typeof sourcedOut>,
        })),
        companies: s.companyIds.flatMap((id) => {
            const c = getCompany(id);
            return c ? [{ id, name: c.name, country: c.hqCountry }] : [];
        }),
        country_shares: sharesView(s.shares),
        upstream: chain.edges.filter((e) => e.to === s.id).map((e) => e.from),
        downstream: chain.edges.filter((e) => e.from === s.id).map((e) => e.to),
        branch: s.branch ?? null,
        bom_node_ids: s.bomNodeIds,
        element_ids: s.elementIds,
        animation_id: s.animation?.id ?? null,
        sources: refs(s.sources),
    };
}

export function processChainView(chain: ProcessChain): z.input<typeof processChainOut> {
    return {
        id: chain.id,
        title: chain.title,
        span: chain.span,
        product: chain.product,
        parallel: chain.parallel ?? false,
        url: processChainUrl(chain),
        as_of: MANUFACTURING_AS_OF,
        clusters: chain.clusters.map((c) => ({
            id: c.id,
            label: c.label,
            stage: c.stage,
            step_ids: chain.steps.filter((s) => s.cluster === c.id).map((s) => s.id),
            country_shares: sharesView(c.shares),
        })),
        steps: orderedSteps(chain).map((s) => processStepView(chain, s)),
        edges: chain.edges.map((e) => ({
            from: e.from,
            to: e.to,
            kind: e.kind,
            label: e.label ?? null,
        })),
    };
}

export function processChainListView(): z.input<typeof processChainListOut> {
    return {
        as_of: MANUFACTURING_AS_OF,
        results: PROCESS_CHAINS.map((c) => ({
            id: c.id,
            title: c.title,
            product: c.product,
            url: processChainUrl(c),
            step_count: c.steps.length,
        })),
    };
}
