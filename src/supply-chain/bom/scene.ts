import type { ExplodeSceneSpec, PartSpec } from "../scenes/spec";
import { flatten } from "./metrics";
import type { BomCase, BomNode } from "./types";

// The case explode, gathered from the nodes that carry a part. Each part
// keeps its node's id (so a click selects the node), label and sources;
// geometry we inferred rather than took from a teardown is "estimated".

export function nodePart(node: BomNode): PartSpec | null {
    if (!node.part3d) return null;
    return {
        ...node.part3d,
        id: node.id,
        label: node.label,
        bomNodeId: node.id,
        sources: node.sources,
        confidence: node.inferred ? "estimated" : "reported",
    } as PartSpec;
}

export function caseScene(c: BomCase): ExplodeSceneSpec {
    return {
        id: `bom-${c.slug}`,
        title: `${c.name}, exploded`,
        stagger: 0.04,
        parts: flatten(c.root).flatMap(({ node }) => {
            const p = nodePart(node);
            return p ? [p] : [];
        }),
    };
}

// The node a 3D part stands for: the part's own node, or for a node without
// one, the nearest ancestor that has a part (so selecting magnets lights the
// rotor). Linking runs up the tree only: an assembly with no part of its own
// (a stator) lights nothing, though its children's parts are drawn.
export function partFor(c: BomCase, nodeId: string): string | null {
    const placed = flatten(c.root);
    const parent = new Map(placed.map((p) => [p.node.id, p.parent?.id ?? null]));
    const hasPart = new Set(placed.filter((p) => p.node.part3d).map((p) => p.node.id));
    let id: string | null = nodeId;
    while (id) {
        if (hasPart.has(id)) return id;
        id = parent.get(id) ?? null;
    }
    return null;
}
