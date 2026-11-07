import type { NodeBadgeProps } from "../../../components/flows/NodeBadge";
import type { FlowNode } from "../../../components/flows/ValueSankey";
import type { GraphEdge, GraphNode } from "../../../components/flows/SupplyGraph";
import {
    type BomCase,
    type BomNode,
    SALE_ID,
    flatten,
    materialNodeId,
    nodeMetrics,
    toSankey,
} from "../../../../../src/supply-chain/bom";
import type { NodeMetrics } from "../../../../../src/supply-chain/bom/metrics";
import type { Shares } from "../../../../../src/supply-chain/concentration";
import { getChain, chainOfStep, sharesOf } from "../../../../../src/supply-chain/processes";
import { getCompany } from "../../../../../src/supply-chain/registry";
import type { Sourced } from "../../../../../src/supply-chain/sourced";

// Pure view models for /bom: the Sankey's nodes and badges, the company
// chain graph, and the lookups the selection sync needs.

export interface CaseModel {
    c: BomCase;
    metrics: Map<string, NodeMetrics>;
    byId: Map<string, BomNode>;
    parentOf: Map<string, string | null>;
    // Every id the selection may hold: BOM nodes and merged material nodes.
    known: Set<string>;
}

export function caseModel(c: BomCase): CaseModel {
    const placed = flatten(c.root);
    const known = new Set<string>();
    for (const { node } of placed) {
        known.add(node.id);
        if (node.material) known.add(materialNodeId(node.material.seriesId));
    }
    return {
        c,
        metrics: nodeMetrics(c),
        byId: new Map(placed.map((p) => [p.node.id, p.node])),
        parentOf: new Map(placed.map((p) => [p.node.id, p.parent?.id ?? null])),
        known,
    };
}

// The maker whose card a node lights in the graph: its own, else its
// nearest ancestor's.
export function makerOf(m: CaseModel, id: string): string | null {
    let cur: string | null = id;
    while (cur) {
        const n = m.byId.get(cur);
        const maker = n?.makerIds?.[0];
        if (maker) return maker;
        cur = m.parentOf.get(cur) ?? null;
    }
    return null;
}

// Leaves of a merged material node.
export function materialLeaves(m: CaseModel, seriesId: string): BomNode[] {
    return [...m.byId.values()].filter((n) => n.material?.seriesId === seriesId);
}

function badges(m: CaseModel, node: BomNode | undefined): NodeBadgeProps[] {
    if (!node) return [];
    const out: NodeBadgeProps[] = [];
    const idiot = m.metrics.get(node.id)?.idiot;
    if (idiot) out.push({ kind: "idiot-index", value: idiot, cite: false });
    const gm = node.makerIds?.[0] ? getCompany(node.makerIds[0])?.grossMargin : undefined;
    if (gm && node.kind !== "material") out.push({ kind: "margin", value: gm, cite: false });
    return out;
}

export interface SankeyModel {
    nodes: FlowNode[];
    links: { source: string; target: string; value: number }[];
}

// Badges only on nodes wide enough to carry them (3% of the price), so the
// thin raw-material end of the chart keeps one label line per node. Nodes
// with no flow at all (a few milligrams of silicon) are left out.
export function sankeyModel(m: CaseModel, mode: "cost" | "raw"): SankeyModel {
    const s = toSankey(m.c, mode);
    const linked = new Set(s.links.flatMap((l) => [l.source, l.target]));
    const flowOf = (id: string) => Math.max(...s.links.filter((l) => l.source === id || l.target === id).map((l) => l.value), 0);
    const wide = (id: string) => flowOf(id) >= m.c.price.value * 0.03;
    return {
        nodes: s.nodes
            .filter((n) => linked.has(n.id))
            .map((n) => ({
                id: n.id,
                label: n.id === SALE_ID ? "Price" : n.label,
                badges: mode === "cost" && n.kind !== "material" && wide(n.id) ? badges(m, m.byId.get(n.id)) : [],
            })),
        links: s.links,
    };
}

export const SMALL_PARTS_ID = "small-parts";

// The top tier only: each part the actuator is built from, the actuator and
// its price, for comparing cases at one scale. Parts under 3% of the price
// merge into one node, so a column of slivers cannot squeeze the chart.
export function topSankey(m: CaseModel): SankeyModel {
    const full = sankeyModel(m, "cost");
    const rootId = m.c.root.id;
    const kids = new Set((m.c.root.children ?? []).map((k) => k.id));
    const small = full.links.filter((l) => kids.has(l.source) && l.target === rootId && l.value < m.c.price.value * 0.03);
    const smallIds = new Set(small.map((l) => l.source));
    const links = full.links.filter((l) => (kids.has(l.source) && !smallIds.has(l.source) && l.target === rootId) || l.target === SALE_ID);
    const merged = small.reduce((s, l) => s + l.value, 0);
    if (merged > 0) links.push({ source: SMALL_PARTS_ID, target: rootId, value: merged });
    const keep = new Set(links.flatMap((l) => [l.source, l.target]));
    const nodes = full.nodes.filter((n) => keep.has(n.id)).map((n) => ({ ...n, badges: [] }));
    if (merged > 0) nodes.unshift({ id: SMALL_PARTS_ID, label: links.some((l) => kids.has(l.source)) ? "Smaller parts" : "All parts (raw material)", badges: [] });
    return { nodes, links };
}

// Company chain: each named maker once, an edge from a node's maker to the
// maker of its nearest ancestor with one. Tiers with no public maker are
// skipped, so an edge can span them.
export function graphModel(m: CaseModel): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const nodes = new Map<string, GraphNode>();
    const edges = new Map<string, GraphEdge>();
    for (const n of m.byId.values()) {
        const maker = n.makerIds?.[0];
        if (!maker) continue;
        const co = getCompany(maker);
        if (!co) continue;
        if (!nodes.has(maker))
            nodes.set(maker, {
                id: maker,
                name: co.name,
                country: co.hqCountry,
                stage: co.stages[0],
                badges: co.grossMargin ? [{ kind: "margin", value: co.grossMargin, cite: false }] : [],
            });
        const parent = m.parentOf.get(n.id);
        const buyer = parent ? makerOf(m, parent) : null;
        if (!buyer || buyer === maker) continue;
        const key = `${maker}->${buyer}`;
        const prev = edges.get(key);
        const confidence = n.makerConfidence === "reported" ? "reported" : "estimated";
        if (prev) {
            prev.label = prev.label?.includes(n.label) ? prev.label : `${prev.label}, ${n.label}`;
            if (confidence === "reported") prev.confidence = "reported";
        } else edges.set(key, { from: maker, to: buyer, label: n.label, confidence });
    }
    return { nodes: [...nodes.values()], edges: [...edges.values()] };
}

// Country shares of the stage that finishes a node, from its last
// /manufacturing step with shares (magnet making for magnets, metal and
// alloy for NdPr).
export function stageSharesFor(node: BomNode): Sourced<Shares> | undefined {
    for (const id of [...(node.processStepIds ?? [])].reverse()) {
        const chain = chainOfStep(id);
        const step = chain?.steps.find((s) => s.id === id);
        const cluster = chain && step ? getChain(chain.id)?.clusters.find((k) => k.id === step.cluster) : undefined;
        const shares = sharesOf(step?.shares ?? cluster?.shares);
        if (shares) return shares;
    }
    return undefined;
}
