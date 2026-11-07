import { getCompany } from "../registry";
import { materialLabel, materialPrice } from "./commodities";
import type { BomCase, BomKind, BomNode } from "./types";

// Pure metrics over a BOM tree. Every cost is US$ for one unit of the node
// unless a name says `total` (all units in one actuator).
//
//   rawContentCost  material cost below a node (leaves: grams x US$/kg)
//   idiotIndex      unit cost / raw content: Musk's ratio, cumulative
//   stepMultiplier  unit cost / what its inputs cost: the markup of one step
//   marginCapture   each tier's gross profit on its slice, over the price
//   toSankey        nodes and links for the value-added Sankey

// US$/kg of a material series in a month, or null when unknown.
export type PriceFn = (seriesId: string, month: string) => number | null;

export const defaultPrice: PriceFn = (id, month) =>
    materialPrice(id, month)?.price.value ?? null;

export const qtyOf = (n: BomNode): number => n.qty ?? 1;

// Cost of one material leaf: its grams at the month's price.
export function leafCost(
    node: BomNode,
    month: string,
    price: PriceFn = defaultPrice,
): number {
    if (!node.material) return 0;
    const perKg = price(node.material.seriesId, month) ?? 0;
    return (node.material.massG.value / 1000) * perKg;
}

// Sum of leaf material costs below a node, for one unit of it.
export function rawContentCost(
    node: BomNode,
    month: string,
    price: PriceFn = defaultPrice,
): number {
    if (node.kind === "material") return leafCost(node, month, price);
    return (node.children ?? []).reduce(
        (s, c) => s + rawContentCost(c, month, price) * qtyOf(c),
        0,
    );
}

// What the next tier pays for one unit: the cited cost, or for a material its
// raw cost. Null when a part or assembly has no public cost.
export function nodeCost(
    node: BomNode,
    month: string,
    price: PriceFn = defaultPrice,
): number | null {
    if (node.unitCost) return node.unitCost.value;
    if (node.kind === "material") return leafCost(node, month, price);
    return null;
}

// Unit cost over raw-material content. Null without a cost or raw content.
export function idiotIndex(
    node: BomNode,
    month: string,
    price: PriceFn = defaultPrice,
): number | null {
    if (node.kind === "material" || !node.unitCost) return null;
    const raw = rawContentCost(node, month, price);
    return raw > 0 ? node.unitCost.value / raw : null;
}

// Unit cost over the cost of its inputs (children x qty). Null unless every
// input has a cost.
export function stepMultiplier(
    node: BomNode,
    month: string,
    price: PriceFn = defaultPrice,
): number | null {
    const kids = node.children ?? [];
    if (!node.unitCost || kids.length === 0) return null;
    let inputs = 0;
    for (const c of kids) {
        const cost = nodeCost(c, month, price);
        if (cost === null) return null;
        inputs += cost * qtyOf(c);
    }
    return inputs > 0 ? node.unitCost.value / inputs : null;
}

export interface Placed {
    node: BomNode;
    parent: BomNode | null;
    depth: number;
    // Units of this node in one actuator (product of qty down the path).
    count: number;
}

// Every node, parents before children, with its place in the tree.
export function flatten(root: BomNode): Placed[] {
    const out: Placed[] = [];
    const visit = (
        node: BomNode,
        parent: BomNode | null,
        depth: number,
        count: number,
    ) => {
        out.push({ node, parent, depth, count });
        for (const c of node.children ?? [])
            visit(c, node, depth + 1, count * qtyOf(c));
    };
    visit(root, null, 0, 1);
    return out;
}

export function findNode(root: BomNode, id: string): BomNode | undefined {
    return flatten(root).find((p) => p.node.id === id)?.node;
}

export interface NodeMetrics {
    id: string;
    count: number;
    raw: number;
    cost: number | null;
    idiot: number | null;
    step: number | null;
}

export function nodeMetrics(
    c: BomCase,
    price: PriceFn = defaultPrice,
): Map<string, NodeMetrics> {
    return new Map(
        flatten(c.root).map(({ node, count }) => [
            node.id,
            {
                id: node.id,
                count,
                raw: rawContentCost(node, c.month, price),
                cost: nodeCost(node, c.month, price),
                idiot: idiotIndex(node, c.month, price),
                step: stepMultiplier(node, c.month, price),
            },
        ]),
    );
}

// ---- Margin capture ---------------------------------------------------

export interface MarginTier {
    nodeId: string;
    companyId: string;
    // US$ of this actuator the company sells (its part x units).
    revenue: number;
    grossMargin: number;
    grossProfit: number;
    // Gross profit over the case price.
    share: number;
    // A typical maker of this tier stands in for an undisclosed supplier.
    representative: boolean;
    isMaterial: boolean;
}

export interface MarginCapture {
    price: number;
    tiers: MarginTier[];
    // All raw material in the actuator at the case month.
    raw: number;
    // Price left after part makers' gross profit and raw material: their
    // costs (labour, energy, machines) and margins we cannot attribute.
    other: number;
}

export type MarginFn = (companyId: string) => number | undefined;

export const defaultMargin: MarginFn = (id) => getCompany(id)?.grossMargin?.value;

// The maker whose margin a node's slice earns: a named maker, else the
// representative one, else none.
export function marginMaker(
    node: BomNode,
): { companyId: string; representative: boolean } | null {
    const named = node.makerIds?.[0];
    if (named)
        return { companyId: named, representative: node.makerConfidence === "modeled" };
    return null;
}

// For each tier with a maker and a known gross margin: revenue in this
// actuator x gross margin, over the price. A sub-part made by the same
// company as an ancestor is in-house and counted once, at the top.
export function marginCapture(
    c: BomCase,
    price: PriceFn = defaultPrice,
    margin: MarginFn = defaultMargin,
): MarginCapture {
    const total = c.price.value;
    const tiers: MarginTier[] = [];
    const makerAbove = new Map<string, Set<string>>();
    const tierOf = (
        node: BomNode,
        count: number,
        above: Set<string>,
    ): MarginTier | null => {
        const m = marginMaker(node);
        const cost = node.id === c.root.id ? total : nodeCost(node, c.month, price);
        const gm = m && !above.has(m.companyId) ? margin(m.companyId) : undefined;
        if (!m || cost === null || gm === undefined) return null;
        const revenue = cost * count;
        return {
            nodeId: node.id,
            companyId: m.companyId,
            revenue,
            grossMargin: gm,
            grossProfit: revenue * gm,
            share: total > 0 ? (revenue * gm) / total : 0,
            representative: m.representative,
            isMaterial: node.kind === "material",
        };
    };
    for (const { node, parent, count } of flatten(c.root)) {
        const above = new Set(parent ? (makerAbove.get(parent.id) ?? []) : []);
        const tier = tierOf(node, count, above);
        if (tier) tiers.push(tier);
        const maker = marginMaker(node);
        if (maker) above.add(maker.companyId);
        makerAbove.set(node.id, above);
    }
    const raw = rawContentCost(c.root, c.month, price);
    const parts = tiers
        .filter((t) => !t.isMaterial)
        .reduce((s, t) => s + t.grossProfit, 0);
    return { price: total, tiers, raw, other: Math.max(0, total - parts - raw) };
}

// ---- Sankey -----------------------------------------------------------

export interface SankeyNodeOut {
    id: string;
    label: string;
    kind: BomKind | "sale";
    // Material nodes stand for every leaf of that series.
    seriesId?: string;
}

export interface SankeyLinkOut {
    source: string;
    target: string;
    value: number;
}

export interface SankeyOut {
    nodes: SankeyNodeOut[];
    links: SankeyLinkOut[];
}

export const SALE_ID = "sale";
export const materialNodeId = (seriesId: string): string => `m-${seriesId}`;

// The value-added Sankey: every BOM part and assembly once (all its units),
// raw materials merged by series on the left. A link carries what flows from
// child to parent: its cost (or raw cost when unpriced) in "cost" mode, its
// raw-material content in "raw" mode. Value added at a node is what leaves
// it beyond what came in; the price leaves the root through a "Price" sink
// when the root's inputs fall short of it.
export function toSankey(
    c: BomCase,
    mode: "cost" | "raw" = "cost",
    price: PriceFn = defaultPrice,
): SankeyOut {
    const nodes: SankeyNodeOut[] = [];
    const seen = new Set<string>();
    const add = (n: SankeyNodeOut) => {
        if (!seen.has(n.id)) {
            seen.add(n.id);
            nodes.push(n);
        }
    };
    const links = new Map<string, SankeyLinkOut>();
    const flow = (source: string, target: string, value: number) => {
        if (value <= 0) return;
        const key = `${source}->${target}`;
        const l = links.get(key);
        if (l) l.value += value;
        else links.set(key, { source, target, value });
    };
    for (const { node, parent, count } of flatten(c.root)) {
        const material = node.kind === "material" && node.material;
        const id = material ? materialNodeId(material.seriesId) : node.id;
        add(
            material
                ? {
                      id,
                      label: materialLabel(material.seriesId),
                      kind: "material",
                      seriesId: material.seriesId,
                  }
                : { id, label: node.label, kind: node.kind },
        );
        if (!parent) continue;
        const raw = rawContentCost(node, c.month, price);
        const unit = mode === "raw" ? raw : (nodeCost(node, c.month, price) ?? raw);
        flow(id, parent.id, unit * count);
    }
    if (mode === "cost") {
        const inflow = [...links.values()]
            .filter((l) => l.target === c.root.id)
            .reduce((s, l) => s + l.value, 0);
        if (c.price.value - inflow > c.price.value * 0.005) {
            add({ id: SALE_ID, label: "Price", kind: "sale" });
            flow(c.root.id, SALE_ID, c.price.value);
        }
    }
    return { nodes, links: [...links.values()] };
}

// Grams and cost of each material series in one actuator.
export function materialTotals(
    c: BomCase,
    price: PriceFn = defaultPrice,
): { seriesId: string; grams: number; cost: number; nodeIds: string[] }[] {
    const by = new Map<
        string,
        { seriesId: string; grams: number; cost: number; nodeIds: string[] }
    >();
    for (const { node, count, parent } of flatten(c.root)) {
        if (!node.material) continue;
        const t = by.get(node.material.seriesId) ?? {
            seriesId: node.material.seriesId,
            grams: 0,
            cost: 0,
            nodeIds: [],
        };
        t.grams += node.material.massG.value * count;
        t.cost += leafCost(node, c.month, price) * count;
        if (parent) t.nodeIds.push(parent.id);
        by.set(node.material.seriesId, t);
    }
    return [...by.values()].sort((a, b) => b.cost - a.cost);
}
