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
//   costStack       a priced node's cost split: raw material, what the tiers
//                   below added, this step's conversion, its maker's profit
//   massOf          modeled grams in one unit (sum of leaves)
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

// Modeled grams in one unit of a node: its material leaves times quantity.
export function massOf(node: BomNode): number {
    if (node.kind === "material") return node.material?.massG.value ?? 0;
    return (node.children ?? []).reduce((s, c) => s + massOf(c) * qtyOf(c), 0);
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
    // Modeled grams in one unit.
    mass: number;
    stack: CostStack | null;
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
                mass: massOf(node),
                stack: costStack(node, c.month, price),
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

// ---- Cost stack ------------------------------------------------------

// One priced node's unit cost in four bands that add up to it:
//   raw         raw material inside (miners' and mills' margins included)
//   below       what the tiers below added on top of their raw material
//   conversion  this step's labour, energy, machines and overhead, plus any
//               margin we cannot attribute
//   profit      this node's maker's gross profit (company margin x cost)
// `short` is true when the inputs as modeled cost more than the node, so
// the bands are clipped at zero and do not add up.
export interface CostStack {
    total: number;
    raw: number;
    below: number;
    conversion: number;
    profit: number;
    short: boolean;
}

// What one unit of a node is known to cost: its cited cost, else what its
// inputs are known to cost (so a priced chip on an unpriced board still
// counts), down to raw material at the leaves.
export function knownCost(
    node: BomNode,
    month: string,
    price: PriceFn = defaultPrice,
): number {
    return nodeCost(node, month, price) ?? inputsCost(node, month, price);
}

// What one unit of a node's inputs is known to cost.
export function inputsCost(
    node: BomNode,
    month: string,
    price: PriceFn = defaultPrice,
): number {
    return (node.children ?? []).reduce(
        (s, c) => s + knownCost(c, month, price) * qtyOf(c),
        0,
    );
}

export function costStack(
    node: BomNode,
    month: string,
    price: PriceFn = defaultPrice,
    margin: MarginFn = defaultMargin,
): CostStack | null {
    if (node.kind === "material" || !node.unitCost) return null;
    const total = node.unitCost.value;
    const raw = rawContentCost(node, month, price);
    const inputs = inputsCost(node, month, price);
    const added = total - inputs;
    const maker = marginMaker(node);
    const gm = maker ? (margin(maker.companyId) ?? 0) : 0;
    const profit = Math.max(0, Math.min(added, gm * total));
    return {
        total,
        raw,
        below: Math.max(0, inputs - raw),
        conversion: Math.max(0, added - profit),
        profit,
        short: added < -total * 0.005,
    };
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
    // "value": the merged labour-and-overhead and gross-profit sources.
    kind: BomKind | "sale" | "value";
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
export const CONVERSION_ID = "conversion";
export const PROFIT_ID = "gross-profit";
export const materialNodeId = (seriesId: string): string => `m-${seriesId}`;

// The value-added Sankey: every BOM part and assembly once (all its units),
// raw materials merged by series on the left. A link carries what flows from
// child to parent: its known cost (see knownCost) in "cost" mode, its
// raw-material content in "raw" mode. In "cost" mode the value a priced node
// adds over its inputs enters it from two merged sources on the left, so no
// step is a bare jump: labour, energy and overhead, and its maker's gross
// profit (see costStack). The price leaves the root through a "Price" sink
// when what flows into the root still falls short of it.
const VALUE_NODES = {
    conversion: { id: CONVERSION_ID, label: "Labour and overhead", kind: "value" },
    profit: { id: PROFIT_ID, label: "Gross profit", kind: "value" },
} as const satisfies Record<string, SankeyNodeOut>;

// A Sankey under construction: nodes once each, links summed by pair.
function sankeyBuilder() {
    const nodes: SankeyNodeOut[] = [];
    const seen = new Set<string>();
    const links = new Map<string, SankeyLinkOut>();
    return {
        add(n: SankeyNodeOut) {
            if (seen.has(n.id)) return;
            seen.add(n.id);
            nodes.push(n);
        },
        flow(source: string, target: string, value: number) {
            if (value <= 0) return;
            const key = `${source}->${target}`;
            const l = links.get(key);
            if (l) l.value += value;
            else links.set(key, { source, target, value });
        },
        inflow: (id: string) =>
            [...links.values()]
                .filter((l) => l.target === id)
                .reduce((s, l) => s + l.value, 0),
        out: (): SankeyOut => ({ nodes, links: [...links.values()] }),
    };
}

function sankeyNode(node: BomNode): SankeyNodeOut {
    const m = node.kind === "material" ? node.material : undefined;
    return m
        ? {
              id: materialNodeId(m.seriesId),
              label: materialLabel(m.seriesId),
              kind: "material",
              seriesId: m.seriesId,
          }
        : { id: node.id, label: node.label, kind: node.kind };
}

export function toSankey(
    c: BomCase,
    mode: "cost" | "raw" = "cost",
    price: PriceFn = defaultPrice,
    margin: MarginFn = defaultMargin,
): SankeyOut {
    const b = sankeyBuilder();
    for (const { node, parent, count } of flatten(c.root)) {
        const sn = sankeyNode(node);
        b.add(sn);
        const st = mode === "cost" ? costStack(node, c.month, price, margin) : null;
        for (const band of ["conversion", "profit"] as const) {
            if (!st || st[band] <= 0) continue;
            b.add(VALUE_NODES[band]);
            b.flow(VALUE_NODES[band].id, sn.id, st[band] * count);
        }
        if (!parent) continue;
        const unit =
            mode === "raw"
                ? rawContentCost(node, c.month, price)
                : knownCost(node, c.month, price);
        b.flow(sn.id, parent.id, unit * count);
    }
    if (
        mode === "cost" &&
        c.price.value - b.inflow(c.root.id) > c.price.value * 0.005
    ) {
        b.add({ id: SALE_ID, label: "Price", kind: "sale" });
        b.flow(c.root.id, SALE_ID, c.price.value);
    }
    return b.out();
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
