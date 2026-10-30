import { type ReactNode, useMemo, useState } from "react";
import { formatValue } from "../../../../src/supply-chain/format";
import { NodeBadge, type NodeBadgeProps } from "./NodeBadge";
import { ProcessStepChip } from "./ProcessStepChip";
import { type FlowLink, type LaidNode, flowPath, layoutSankey, valueAdded } from "./sankey-layout";
import { useWidth } from "./use-width";
import "./flows.css";

export type { FlowLink } from "./sankey-layout";

export interface FlowNode {
    id: string;
    label: string;
    badges?: NodeBadgeProps[];
    // /manufacturing step ids that make this node.
    steps?: string[];
}

export interface ValueSankeyProps {
    nodes: readonly FlowNode[];
    links: readonly FlowLink[];
    label: string;
    unit?: string;
    format?: (v: number) => string;
    selectedId?: string | null;
    onSelectNode?: (id: string) => void;
    // Extra content in a node's label block, after its badges.
    renderNode?: (node: FlowNode, laid: LaidNode) => ReactNode;
    // Shared value scale across several Sankeys (see layoutSankey).
    valueMax?: number;
    orientation?: "auto" | "horizontal" | "vertical";
    // Chart height when horizontal; vertical charts grow with their depth.
    height?: number;
}

// Below this width the chart turns top to bottom.
export const VERTICAL_BELOW = 600;
const LABEL_MIN = 64;
const SINK_LABEL = 44;

function usdFormat(unit: string) {
    return (v: number) => (unit === "USD" && Math.abs(v) < 1e5 ? `$${Math.round(v).toLocaleString("en-US")}` : formatValue(v, unit));
}

// Value-added Sankey: band width is the value that flows, left to right
// (top to bottom on narrow screens). Hover or focus a node to light its
// upstream and downstream paths; click to select it (`onSelectNode`).
export function ValueSankey({ nodes, links, label, unit = "USD", format, selectedId, onSelectNode, renderNode, valueMax, orientation = "auto", height = 400 }: ValueSankeyProps) {
    const { ref, width } = useWidth<HTMLElement>(720);
    const fmt = format ?? usdFormat(unit);
    const vertical = orientation === "vertical" || (orientation === "auto" && width < VERTICAL_BELOW);
    const [hover, setHover] = useState<string | null>(null);
    const [picked, setPicked] = useState<string | null>(null);
    const selected = selectedId !== undefined ? selectedId : picked;
    const ids = useMemo(() => nodes.map((n) => n.id), [nodes]);
    const depth = useMemo(() => layoutSankey(ids, links, { width: 600, height: 400 }).nodes.reduce((m, n) => Math.max(m, n.depth), 0), [ids, links]);
    const h = vertical ? Math.max(320, (depth + 1) * 150) : height;
    const layout = useMemo(() => layoutSankey(ids, links, {
        width,
        // Room under the last row for its labels.
        height: vertical ? h - SINK_LABEL : h,
        vertical,
        nodeWidth: vertical ? 8 : 10,
        nodePadding: vertical ? 10 : 18,
        valueMax,
    }), [ids, links, width, h, vertical, valueMax]);
    const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
    const focus = hover ?? selected ?? null;
    const path = useMemo(() => (focus ? flowPath(links, focus) : null), [links, focus]);
    const lit = (id: string) => !path || path.nodes.has(id);
    const sinks = layout.nodes.filter((n) => n.outflow === 0);
    const total = sinks.reduce((s, n) => s + n.value, 0);
    const active = focus ? layout.nodes.find((n) => n.id === focus) : undefined;
    const activeNode = active ? byId.get(active.id) : undefined;
    const select = (id: string) => {
        const next = selected === id ? null : id;
        if (selectedId === undefined) setPicked(next);
        onSelectNode?.(next ?? id);
    };
    const labelSide = (n: LaidNode) => (vertical ? "below" : n.x0 < width / 2 ? "right" : "left");
    return <figure className={`fk-sankey${vertical ? " is-vertical" : ""}${path ? " has-focus" : ""}`} ref={ref}>
        <div className="fk-readout" aria-live="polite">
            {active && activeNode ? <>
                <span className="fk-readout-name">{activeNode.label}</span>
                <b>{fmt(active.value)}</b>
                {active.inflow > 0 && valueAdded(active) > 0 ? <span className="fk-readout-sub">+{fmt(valueAdded(active))} added</span> : null}
            </> : <>
                <span className="fk-readout-name">{label}</span>
                <b>{fmt(total)}</b>
            </>}
        </div>
        <div className="fk-sankey-stage" style={{ height: h }}>
            <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} aria-hidden="true">
                {layout.links.map((l) => <path key={l.key} className={`fk-link${!path || path.links.has(l.key) ? " is-lit" : ""}`}
                    d={l.d} strokeWidth={Math.max(1, l.width)} />)}
                {layout.nodes.map((n) => <rect key={n.id} className={`fk-node${lit(n.id) ? " is-lit" : ""}${n.id === selected ? " is-selected" : ""}`}
                    x={n.x0} y={n.y0} width={Math.max(1, n.x1 - n.x0)} height={Math.max(1, n.y1 - n.y0)} />)}
            </svg>
            {layout.nodes.map((n) => {
                const node = byId.get(n.id);
                if (!node) return null;
                const side = labelSide(n);
                const room = vertical ? n.x1 - n.x0 >= LABEL_MIN : true;
                const pos = side === "below"
                    ? { left: n.x0, top: n.y1 + 4 }
                    : side === "right" ? { left: n.x1 + 6, top: (n.y0 + n.y1) / 2 } : { right: width - n.x0 + 6, top: (n.y0 + n.y1) / 2 };
                return <div key={n.id}>
                    <button type="button" className={`fk-node-hit${n.id === selected ? " is-selected" : ""}`}
                        style={{ left: n.x0 - 6, top: n.y0 - 6, width: n.x1 - n.x0 + 12, height: Math.max(12, n.y1 - n.y0 + 12) }}
                        aria-label={`${node.label}: ${fmt(n.value)}${n.inflow > 0 && valueAdded(n) > 0 ? `, ${fmt(valueAdded(n))} added` : ""}`}
                        aria-pressed={n.id === selected}
                        onPointerEnter={() => setHover(n.id)} onPointerLeave={() => setHover(null)}
                        onFocus={() => setHover(n.id)} onBlur={() => setHover(null)}
                        onClick={() => select(n.id)} />
                    {room ? <div className={`fk-label is-${side}${lit(n.id) ? "" : " is-dim"}`} style={pos}>
                        <span className="fk-label-line">
                            <span className="fk-label-name">{node.label}</span>
                            <span className="fk-label-value">{fmt(n.value)}</span>
                        </span>
                        {node.badges?.length || node.steps?.length || renderNode ? <span className="fk-label-badges">
                            {node.badges?.map((b, i) => <NodeBadge key={i} {...b} />)}
                            {node.steps?.map((s) => <ProcessStepChip key={s} stepId={s} />)}
                            {renderNode?.(node, n)}
                        </span> : null}
                    </div> : null}
                </div>;
            })}
        </div>
        <div className="fk-sr">
            <table>
                <caption>{label}</caption>
                <thead><tr><th scope="col">Node</th><th scope="col">Value</th><th scope="col">Value added</th><th scope="col">Flows into</th></tr></thead>
                <tbody>
                    {layout.nodes.map((n) => <tr key={n.id}>
                        <th scope="row">{byId.get(n.id)?.label ?? n.id}</th>
                        <td>{fmt(n.value)}</td>
                        <td>{fmt(valueAdded(n))}</td>
                        <td>{links.filter((l) => l.source === n.id).map((l) => byId.get(l.target)?.label ?? l.target).join(", ")}</td>
                    </tr>)}
                </tbody>
            </table>
        </div>
    </figure>;
}
