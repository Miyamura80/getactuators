// Pure layout behind <SupplyGraph>: a layered DAG. A node's layer is the
// longest path to it from a source, so every edge points forward; inside a
// layer nodes sort by the mean position of their suppliers, which keeps
// most edges from crossing.

export interface GraphEdgeLike {
    from: string;
    to: string;
}

export function layerOf(ids: readonly string[], edges: readonly GraphEdgeLike[]): Map<string, number> {
    const known = new Set(ids);
    const usable = edges.filter((e) => known.has(e.from) && known.has(e.to) && e.from !== e.to);
    const layer = new Map(ids.map((id) => [id, 0]));
    // Relax up to |V| times; a cycle stops growing there instead of looping.
    for (let i = 0; i < ids.length; i++) {
        let changed = false;
        for (const e of usable) {
            const next = (layer.get(e.from) ?? 0) + 1;
            if (next > (layer.get(e.to) ?? 0) && next < ids.length) {
                layer.set(e.to, next);
                changed = true;
            }
        }
        if (!changed) break;
    }
    return layer;
}

export function layers(ids: readonly string[], edges: readonly GraphEdgeLike[]): string[][] {
    const of = layerOf(ids, edges);
    const out: string[][] = [];
    for (const id of ids) {
        const l = of.get(id) ?? 0;
        (out[l] ??= []).push(id);
    }
    const filled = out.filter((l) => l?.length);
    const pos = new Map<string, number>();
    filled.forEach((col, li) => {
        if (li > 0) {
            const bary = (id: string) => {
                const ups = edges.filter((e) => e.to === id).map((e) => pos.get(e.from)).filter((p): p is number => p !== undefined);
                return ups.length ? ups.reduce((s, p) => s + p, 0) / ups.length : Number.POSITIVE_INFINITY;
            };
            col.sort((a, b) => bary(a) - bary(b));
        }
        col.forEach((id, i) => pos.set(id, i));
    });
    return filled;
}

// Two-letter monogram for a logo-less card: "JL MAG" -> "JM", "Tesla" -> "TE".
export function monogram(name: string): string {
    const words = name.replace(/[^\p{L}\p{N} ]/gu, " ").split(/\s+/).filter(Boolean);
    const first = words[0] ?? "?";
    const second = words[1];
    return (second ? `${first[0]}${second[0]}` : first.slice(0, 2)).toUpperCase();
}

// The ids next to `id` (its suppliers and buyers) and the edges between.
export function neighbours(edges: readonly GraphEdgeLike[], id: string): { nodes: Set<string>; edges: Set<string> } {
    const nodes = new Set([id]);
    const keys = new Set<string>();
    for (const e of edges) {
        if (e.from === id || e.to === id) {
            nodes.add(e.from);
            nodes.add(e.to);
            keys.add(`${e.from}->${e.to}`);
        }
    }
    return { nodes, edges: keys };
}
