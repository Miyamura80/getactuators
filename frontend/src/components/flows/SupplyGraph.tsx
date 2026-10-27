import { useLayoutEffect, useMemo, useState } from "react";
import { countryName } from "../../../../src/country-flag";
import type { Confidence } from "../../../../src/supply-chain/sourced";
import { STAGE_LABEL, type Stage } from "../../../../src/supply-chain/stages";
import { Flag } from "../Flag";
import { layers, monogram, neighbours } from "./graph-layout";
import { NodeBadge, type NodeBadgeProps } from "./NodeBadge";
import { useWidth } from "./use-width";
import "./flows.css";

export interface GraphNode {
    id: string;
    name: string;
    country?: string;
    stage?: Stage;
    badges?: NodeBadgeProps[];
}

export interface GraphEdge {
    from: string;
    to: string;
    // What flows along the edge ("Harmonic reducers").
    label?: string;
    confidence?: Confidence;
}

export interface SupplyGraphProps {
    nodes: readonly GraphNode[];
    edges: readonly GraphEdge[];
    label: string;
    selectedId?: string | null;
    onSelectNode?: (id: string) => void;
}

interface Wire {
    key: string;
    d: string;
    mid: [number, number];
    edge: GraphEdge;
}

const edgeKey = (e: GraphEdge) => `${e.from}->${e.to}`;
const NARROW = 600;

// Measure card positions and draw edges between them (right edge to left
// edge, or bottom to top when the layers stack on a phone).
function useWires(root: HTMLElement | null, edges: readonly GraphEdge[], vertical: boolean, deps: unknown[]): Wire[] {
    const [wires, setWires] = useState<Wire[]>([]);
    useLayoutEffect(() => {
        if (!root) return;
        const box = root.getBoundingClientRect();
        const rect = (id: string) => root.querySelector(`[data-node="${CSS.escape(id)}"]`)?.getBoundingClientRect();
        setWires(edges.flatMap((e) => {
            const a = rect(e.from);
            const b = rect(e.to);
            if (!a || !b) return [];
            const [x0, y0, x1, y1] = vertical
                ? [a.left + a.width / 2 - box.left, a.bottom - box.top, b.left + b.width / 2 - box.left, b.top - box.top]
                : [a.right - box.left, a.top + a.height / 2 - box.top, b.left - box.left, b.top + b.height / 2 - box.top];
            const m = vertical ? (y0 + y1) / 2 : (x0 + x1) / 2;
            const d = vertical
                ? `M${x0},${y0}C${x0},${m} ${x1},${m} ${x1},${y1}`
                : `M${x0},${y0}C${m},${y0} ${m},${y1} ${x1},${y1}`;
            return [{ key: edgeKey(e), d, mid: [(x0 + x1) / 2, (y0 + y1) / 2] as [number, number], edge: e }];
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [root, edges, vertical, ...deps]);
    return wires;
}

// A layered company graph: suppliers on the left, buyers on the right (top to
// bottom on phones). Each card is a monogram, name, country and stage with
// optional badges; hover or focus a card to light its links and read what
// flows along them.
export function SupplyGraph({ nodes, edges, label, selectedId, onSelectNode }: SupplyGraphProps) {
    const { ref, width } = useWidth<HTMLDivElement>(900);
    const [root, setRoot] = useState<HTMLDivElement | null>(null);
    const vertical = width < NARROW;
    const [hover, setHover] = useState<string | null>(null);
    const ids = useMemo(() => nodes.map((n) => n.id), [nodes]);
    const cols = useMemo(() => layers(ids, edges), [ids, edges]);
    const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
    const wires = useWires(root, edges, vertical, [width, cols]);
    const focus = hover ?? selectedId ?? null;
    const near = focus ? neighbours(edges, focus) : null;
    const setRefs = (el: HTMLDivElement | null) => {
        ref.current = el;
        setRoot(el);
    };
    return <figure className={`fk-graph${vertical ? " is-vertical" : ""}${near ? " has-focus" : ""}`} aria-label={label}>
        <div className="fk-graph-stage" ref={setRefs} style={vertical ? undefined : { gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))` }}>
            <svg className="fk-wires" aria-hidden="true">
                {wires.map((w) => <path key={w.key} d={w.d}
                    className={`fk-wire${w.edge.confidence === "estimated" ? " is-estimated" : ""}${near?.edges.has(w.key) ? " is-lit" : ""}`} />)}
            </svg>
            {cols.map((col, i) => <ol key={i} className="fk-layer">
                {col.map((id) => {
                    const n = byId.get(id);
                    if (!n) return null;
                    const dim = near && !near.nodes.has(id);
                    return <li key={id} data-node={id} className={`fk-card${dim ? " is-dim" : ""}${id === selectedId ? " is-selected" : ""}`}
                        onPointerEnter={() => setHover(id)} onPointerLeave={() => setHover(null)}>
                        <button type="button" className="fk-card-main" aria-pressed={id === selectedId}
                            onFocus={() => setHover(id)} onBlur={() => setHover(null)}
                            onClick={() => onSelectNode?.(id)}
                            aria-label={[n.name, n.country ? countryName(n.country) : "", n.stage ? STAGE_LABEL[n.stage] : ""].filter(Boolean).join(", ")}>
                            <span className="fk-mono" aria-hidden="true">{monogram(n.name)}</span>
                            <span className="fk-card-name">{n.name}</span>
                            <span className="fk-card-meta" aria-hidden="true">
                                {n.country ? <><Flag code={n.country} decorative />{n.country}</> : null}
                                {n.stage ? <span>{STAGE_LABEL[n.stage]}</span> : null}
                            </span>
                        </button>
                        {n.badges?.length ? <span className="fk-card-badges">{n.badges.map((b, j) => <NodeBadge key={j} {...b} />)}</span> : null}
                    </li>;
                })}
            </ol>)}
            {wires.filter((w) => near?.edges.has(w.key) && w.edge.label).map((w) => <span key={w.key} className="fk-wire-label"
                style={{ left: w.mid[0], top: w.mid[1] }} aria-hidden="true">{w.edge.label}</span>)}
        </div>
        <table className="fk-sr">
            <caption>{label}</caption>
            <thead><tr><th scope="col">Supplier</th><th scope="col">Buyer</th><th scope="col">What flows</th></tr></thead>
            <tbody>{edges.map((e) => <tr key={edgeKey(e)}>
                <th scope="row">{byId.get(e.from)?.name ?? e.from}</th>
                <td>{byId.get(e.to)?.name ?? e.to}</td>
                <td>{e.label ?? ""}{e.confidence === "estimated" ? " (estimated)" : ""}</td>
            </tr>)}</tbody>
        </table>
    </figure>;
}
