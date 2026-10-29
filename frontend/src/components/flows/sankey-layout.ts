import { sankey, sankeyJustify } from "d3-sankey";

// Pure layout behind <ValueSankey>: d3-sankey positions, a top-to-bottom
// variant for narrow screens (laid out left to right, then transposed) and
// the upstream + downstream path of a node for hover highlighting.

export interface FlowLink {
    source: string;
    target: string;
    // US$ (or the chart's unit) flowing along the link.
    value: number;
}

export interface LaidNode {
    id: string;
    x0: number;
    x1: number;
    y0: number;
    y1: number;
    value: number;
    inflow: number;
    outflow: number;
    depth: number;
}

export interface LaidLink {
    key: string;
    source: string;
    target: string;
    value: number;
    width: number;
    d: string;
}

export interface SankeyLayout {
    nodes: LaidNode[];
    links: LaidLink[];
    width: number;
    height: number;
}

export interface LayoutOptions {
    width: number;
    height: number;
    vertical?: boolean;
    nodeWidth?: number;
    nodePadding?: number;
    // Fix the value scale (the column total that fills the chart), so several
    // Sankeys compare at one scale. Defaults to the chart's own largest column.
    valueMax?: number;
}

export const linkKey = (l: { source: string; target: string }) => `${l.source}->${l.target}`;

interface SNode { id: string; x0?: number; x1?: number; y0?: number; y1?: number; value?: number; depth?: number }
interface SLink { source: string | SNode; target: string | SNode; value: number; width?: number; y0?: number; y1?: number }

function run(ids: readonly string[], links: readonly FlowLink[], length: number, breadth: number, nodeWidth: number, nodePadding: number) {
    return sankey<SNode, SLink>()
        .nodeId((n) => n.id)
        .nodeAlign(sankeyJustify)
        .nodeWidth(nodeWidth)
        .nodePadding(nodePadding)
        .extent([[0, 0], [length, breadth]])({
            nodes: ids.map((id) => ({ id })),
            links: links.map((l) => ({ ...l })),
        });
}

function curve(x0: number, y0: number, x1: number, y1: number, vertical: boolean): string {
    const m = (x0 + x1) / 2;
    const f = (n: number) => n.toFixed(1);
    return vertical
        ? `M${f(y0)},${f(x0)}C${f(y0)},${f(m)} ${f(y1)},${f(m)} ${f(y1)},${f(x1)}`
        : `M${f(x0)},${f(y0)}C${f(m)},${f(y0)} ${f(m)},${f(y1)} ${f(x1)},${f(y1)}`;
}

// Columns' totals and node counts, to scale a fixed-value chart.
function densest(nodes: SNode[]): { total: number; count: number } {
    const cols = new Map<number, { total: number; count: number }>();
    for (const n of nodes) {
        const c = cols.get(n.depth ?? 0) ?? { total: 0, count: 0 };
        c.total += n.value ?? 0;
        c.count += 1;
        cols.set(n.depth ?? 0, c);
    }
    return [...cols.values()].sort((a, b) => b.total - a.total)[0] ?? { total: 0, count: 0 };
}

export function layoutSankey(ids: readonly string[], links: readonly FlowLink[], opts: LayoutOptions): SankeyLayout {
    const { width, height, vertical = false, nodeWidth = 10, nodePadding = 14, valueMax } = opts;
    const length = vertical ? height : width;
    let breadth = vertical ? width : height;
    const usable = links.filter((l) => l.value > 0 && ids.includes(l.source) && ids.includes(l.target));
    let g: ReturnType<typeof run>;
    try {
        g = run(ids, usable, length, breadth, nodeWidth, nodePadding);
        if (valueMax && valueMax > 0) {
            const { total, count } = densest(g.nodes);
            const pad = nodePadding * Math.max(0, count - 1);
            breadth = pad + (breadth - pad) * Math.min(1, total / valueMax);
            g = run(ids, usable, length, breadth, nodeWidth, nodePadding);
        }
    } catch {
        // A circular link has no Sankey layout.
        return { nodes: [], links: [], width, height };
    }
    const nodes = g.nodes.map((n) => {
        const [a0, a1, b0, b1] = [n.x0 ?? 0, n.x1 ?? 0, n.y0 ?? 0, n.y1 ?? 0];
        const inflow = usable.filter((l) => l.target === n.id).reduce((s, l) => s + l.value, 0);
        const outflow = usable.filter((l) => l.source === n.id).reduce((s, l) => s + l.value, 0);
        const box = vertical ? { x0: b0, x1: b1, y0: a0, y1: a1 } : { x0: a0, x1: a1, y0: b0, y1: b1 };
        return { id: n.id, ...box, value: n.value ?? 0, inflow, outflow, depth: n.depth ?? 0 };
    });
    const out = g.links.map((l) => {
        const s = l.source as SNode;
        const t = l.target as SNode;
        return {
            key: linkKey({ source: s.id, target: t.id }),
            source: s.id,
            target: t.id,
            value: l.value,
            width: l.width ?? 0,
            d: curve(s.x1 ?? 0, l.y0 ?? 0, t.x0 ?? 0, l.y1 ?? 0, vertical),
        };
    });
    return { nodes, links: out, width, height };
}

// Every node and link upstream and downstream of `id`.
export function flowPath(links: readonly FlowLink[], id: string): { nodes: Set<string>; links: Set<string> } {
    const nodes = new Set([id]);
    const keys = new Set<string>();
    const walk = (from: string, dir: "up" | "down") => {
        for (const l of links) {
            const [near, far] = dir === "down" ? [l.source, l.target] : [l.target, l.source];
            if (near !== from || keys.has(linkKey(l))) continue;
            keys.add(linkKey(l));
            nodes.add(far);
            walk(far, dir);
        }
    };
    walk(id, "up");
    walk(id, "down");
    return { nodes, links: keys };
}

// Value a node adds: what leaves it beyond what came in (a source adds all
// of it; a final product adds its own value over its inputs).
export function valueAdded(n: Pick<LaidNode, "inflow" | "outflow" | "value">): number {
    return n.inflow === 0 ? n.value : Math.max(0, (n.outflow || n.value) - n.inflow);
}
