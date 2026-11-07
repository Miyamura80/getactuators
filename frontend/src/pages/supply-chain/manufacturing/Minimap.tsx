import { type MouseEvent, useRef } from "react";
import type { ChainLayout, ZoomTransform } from "../../../../../src/supply-chain/processes/layout";

const MAX_W = 168;
// Tall chains (side-by-side sub-chains) are capped by height, so the
// minimap covers as little of the map as it can.
const MAX_H = 96;

// The whole chain in miniature, bottom right of the map, with the visible
// area as a frame. It is a button: a click centres the map on the point
// clicked; Enter or Space centres it on the focused step (or the whole chain).
export function Minimap({ layout, transform, viewW, viewH, onCenter, focusId }: {
    layout: ChainLayout;
    transform: ZoomTransform;
    viewW: number;
    viewH: number;
    onCenter: (x: number, y: number) => void;
    focusId: string | null;
}) {
    const svgRef = useRef<SVGSVGElement>(null);
    const s = Math.min(MAX_W / layout.width, MAX_H / layout.height);
    const W = Math.round(layout.width * s);
    const h = Math.round(layout.height * s);
    const vx = -transform.x / transform.k;
    const vy = -transform.y / transform.k;
    const focus = focusId ? layout.nodes.get(focusId) : undefined;
    const click = (e: MouseEvent<HTMLButtonElement>) => {
        const svg = svgRef.current;
        // detail 0: activated from the keyboard, not a pointer.
        if (e.detail === 0 || !svg) {
            if (focus) onCenter(focus.x + focus.w / 2, focus.y + focus.h / 2);
            else onCenter(layout.width / 2, layout.height / 2);
            return;
        }
        // Map the pointer through the SVG's screen matrix, so the button's
        // border and any CSS scaling are accounted for.
        const ctm = svg.getScreenCTM?.();
        if (ctm && typeof DOMPoint === "function") {
            const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
            onCenter(p.x / s, p.y / s);
            return;
        }
        const r = svg.getBoundingClientRect();
        onCenter((e.clientX - r.left) / s, (e.clientY - r.top) / s);
    };
    return <button type="button" className="mf-minimap" onClick={click}
        aria-label={focus ? "Minimap: centre the map on the focused step" : "Minimap: centre the map"}
        title="Minimap: click a point to centre the map there">
        <svg ref={svgRef} width={W} height={h} viewBox={`0 0 ${W} ${h}`} aria-hidden="true">
            {layout.clusters.map((c) => <rect key={c.id} className="mf-mini-cluster" x={c.x * s} y={c.y * s} width={c.w * s} height={c.h * s} />)}
            {[...layout.nodes].map(([id, b]) => <rect key={id} className={`mf-mini-node${id === focusId ? " is-focus" : ""}`} x={b.x * s} y={b.y * s} width={b.w * s} height={b.h * s} />)}
            <rect className="mf-mini-view" x={vx * s} y={vy * s} width={(viewW / transform.k) * s} height={(viewH / transform.k) * s} />
        </svg>
    </button>;
}
