import type { EdgeKind, GridPos, ProcessChain } from "./types";

// Map geometry for a process chain, shared by the React map and tests: node
// boxes from the committed grid positions, cluster frames around them, edge
// curves between ports, and the zoom level of detail. Pixels in map space.

export const CELL_W = 200;
export const CELL_H = 120;
export const NODE_W = 156;
export const NODE_H = 76;
const MARGIN = 48;
const CLUSTER_PAD = 18;
export const CLUSTER_HEAD = 30;

export const PRODUCT_ID = "product";

export interface Box {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface ClusterFrame extends Box {
    id: string;
}

export interface EdgeGeom {
    from: string;
    to: string;
    kind: EdgeKind;
    d: string;
    // Midpoint of the curve, for its label.
    mid: [number, number];
}

export interface ChainLayout {
    width: number;
    height: number;
    nodes: Map<string, Box>;
    clusters: ClusterFrame[];
    edges: EdgeGeom[];
}

export function nodeBox(pos: GridPos): Box {
    return {
        x: MARGIN + pos.x * CELL_W,
        y: MARGIN + CLUSTER_HEAD + pos.y * CELL_H,
        w: NODE_W,
        h: NODE_H,
    };
}

function union(boxes: Box[]): Box {
    const x0 = Math.min(...boxes.map((b) => b.x));
    const y0 = Math.min(...boxes.map((b) => b.y));
    const x1 = Math.max(...boxes.map((b) => b.x + b.w));
    const y1 = Math.max(...boxes.map((b) => b.y + b.h));
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

const r1 = (n: number) => Math.round(n * 10) / 10;

// A cubic between the facing sides of two boxes: left/right ports when the
// boxes sit side by side, top/bottom when one is above the other.
export function edgePath(a: Box, b: Box): { d: string; mid: [number, number] } {
    const ca: [number, number] = [a.x + a.w / 2, a.y + a.h / 2];
    const cb: [number, number] = [b.x + b.w / 2, b.y + b.h / 2];
    const dx = cb[0] - ca[0];
    const dy = cb[1] - ca[1];
    let p0: [number, number];
    let p1: [number, number];
    let c0: [number, number];
    let c1: [number, number];
    if (Math.abs(dx) >= Math.abs(dy) * 1.6) {
        const s = Math.sign(dx) || 1;
        p0 = [ca[0] + (s * a.w) / 2, ca[1]];
        p1 = [cb[0] - (s * b.w) / 2, cb[1]];
        const k = Math.max(24, Math.abs(p1[0] - p0[0]) / 2);
        c0 = [p0[0] + s * k, p0[1]];
        c1 = [p1[0] - s * k, p1[1]];
    } else {
        const s = Math.sign(dy) || 1;
        p0 = [ca[0], ca[1] + (s * a.h) / 2];
        p1 = [cb[0], cb[1] - (s * b.h) / 2];
        const k = Math.max(24, Math.abs(p1[1] - p0[1]) / 2);
        c0 = [p0[0], p0[1] + s * k];
        c1 = [p1[0], p1[1] - s * k];
    }
    const d = `M${r1(p0[0])},${r1(p0[1])}C${r1(c0[0])},${r1(c0[1])} ${r1(c1[0])},${r1(c1[1])} ${r1(p1[0])},${r1(p1[1])}`;
    // Point at t = 0.5 on the cubic.
    const mid: [number, number] = [
        r1((p0[0] + 3 * c0[0] + 3 * c1[0] + p1[0]) / 8),
        r1((p0[1] + 3 * c0[1] + 3 * c1[1] + p1[1]) / 8),
    ];
    return { d, mid };
}

// For side-by-side sub-chains: right from `a`, along a vertical trunk at
// `trunk`, then right into `b`, with rounded corners. Every final step's
// line shares the trunk, so the product reads as one merge point.
export function busPath(
    a: Box,
    b: Box,
    trunk: number,
): { d: string; mid: [number, number] } {
    const p0: [number, number] = [a.x + a.w, a.y + a.h / 2];
    const p1: [number, number] = [b.x, b.y + b.h / 2];
    const dy = p1[1] - p0[1];
    const r = Math.min(16, Math.abs(dy) / 2, (trunk - p0[0]) / 2, (p1[0] - trunk) / 2);
    if (Math.abs(dy) < 1 || r <= 0) return edgePath(a, b);
    const s = Math.sign(dy);
    const d = `M${r1(p0[0])},${r1(p0[1])}H${r1(trunk - r)}Q${r1(trunk)},${r1(p0[1])} ${r1(trunk)},${r1(p0[1] + s * r)}V${r1(p1[1] - s * r)}Q${r1(trunk)},${r1(p1[1])} ${r1(trunk + r)},${r1(p1[1])}H${r1(p1[0])}`;
    return { d, mid: [r1(trunk), r1((p0[1] + p1[1]) / 2)] };
}

export function chainLayout(chain: ProcessChain): ChainLayout {
    const nodes = new Map<string, Box>();
    for (const s of chain.steps) nodes.set(s.id, nodeBox(s.pos));
    nodes.set(PRODUCT_ID, nodeBox(chain.productPos));
    const clusters: ClusterFrame[] = chain.clusters.map((c) => {
        // The recycling loop floats between clusters; the product sits in
        // the last cluster's frame, or outside every frame when the
        // clusters are side-by-side sub-chains.
        const members = chain.steps
            .filter((s) => s.cluster === c.id && s.branch !== "recycling")
            .map((s) => nodes.get(s.id) as Box);
        if (!chain.parallel && c === chain.clusters.at(-1))
            members.push(nodes.get(PRODUCT_ID) as Box);
        const u = union(members);
        return {
            id: c.id,
            x: u.x - CLUSTER_PAD,
            y: u.y - CLUSTER_PAD - CLUSTER_HEAD,
            w: u.w + 2 * CLUSTER_PAD,
            h: u.h + 2 * CLUSTER_PAD + CLUSTER_HEAD,
        };
    });
    const last = chain.steps.at(-1);
    const terminal = chain.steps.filter(
        (s) => s.branch !== "recycling" && !chain.edges.some((e) => e.from === s.id),
    );
    const edges: EdgeGeom[] = chain.edges.map((e) => {
        const g = edgePath(nodes.get(e.from) as Box, nodes.get(e.to) as Box);
        return { from: e.from, to: e.to, kind: e.kind, ...g };
    });
    const product = nodes.get(PRODUCT_ID) as Box;
    if (chain.parallel) {
        // Every sub-chain's final step feeds the product along one trunk,
        // halfway between the cluster frames and the product.
        const right = Math.max(
            ...terminal.map((s) => (nodes.get(s.id) as Box).x + NODE_W),
        );
        const frameRight = right + CLUSTER_PAD;
        const trunk = frameRight + (product.x - frameRight) / 2;
        for (const s of terminal) {
            const g = busPath(nodes.get(s.id) as Box, product, trunk);
            edges.push({ from: s.id, to: PRODUCT_ID, kind: "main", ...g });
        }
    } else {
        // The finished part leaves the last main-line step.
        const end = terminal.at(-1) ?? last;
        if (end) {
            const g = edgePath(nodes.get(end.id) as Box, product);
            edges.push({ from: end.id, to: PRODUCT_ID, kind: "main", ...g });
        }
    }
    const all = union([...nodes.values(), ...clusters]);
    return {
        width: Math.ceil(all.x + all.w + MARGIN),
        height: Math.ceil(all.y + all.h + MARGIN),
        nodes,
        clusters,
        edges,
    };
}

// Level of detail by zoom scale: clusters only when far out (the fitted
// overview, or anything below a readable card size), steps once zoomed in.
// Focusing a step (the third level) is a selection, not a scale.
export type Detail = "clusters" | "steps";
export const STEP_DETAIL_SCALE = 0.62;
// Zooming this far past the fitted overview switches to steps.
export const STEP_DETAIL_OVER_FIT = 1.15;

export function detailFor(scale: number, fitScale = 0): Detail {
    return scale < Math.max(STEP_DETAIL_SCALE, fitScale * STEP_DETAIL_OVER_FIT)
        ? "clusters"
        : "steps";
}

export interface ZoomTransform {
    k: number;
    x: number;
    y: number;
}

// The transform that fits `box` inside a view, centred, capped at `max`.
export function fitTransform(
    viewW: number,
    viewH: number,
    box: Box,
    pad = 24,
    max = 2.4,
): ZoomTransform {
    const k = Math.min(
        max,
        Math.max(0.05, Math.min((viewW - 2 * pad) / box.w, (viewH - 2 * pad) / box.h)),
    );
    return {
        k,
        x: viewW / 2 - (box.x + box.w / 2) * k,
        y: viewH / 2 - (box.y + box.h / 2) * k,
    };
}
