import type { MouseEvent } from "react";
import type { ChainLayout, ZoomTransform } from "../../../../../src/supply-chain/processes/layout";

const W = 168;

// The whole chain in miniature, bottom right of the map, with the visible
// area as a frame. Clicking it centres the map there.
export function Minimap({ layout, transform, viewW, viewH, onCenter, focusId }: {
    layout: ChainLayout;
    transform: ZoomTransform;
    viewW: number;
    viewH: number;
    onCenter: (x: number, y: number) => void;
    focusId: string | null;
}) {
    const s = W / layout.width;
    const h = Math.round(layout.height * s);
    const vx = -transform.x / transform.k;
    const vy = -transform.y / transform.k;
    const click = (e: MouseEvent<SVGSVGElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        onCenter((e.clientX - r.left) / s, (e.clientY - r.top) / s);
    };
    return <svg className="mf-minimap" width={W} height={h} viewBox={`0 0 ${W} ${h}`} onClick={click} aria-hidden="true">
        {layout.clusters.map((c) => <rect key={c.id} className="mf-mini-cluster" x={c.x * s} y={c.y * s} width={c.w * s} height={c.h * s} />)}
        {[...layout.nodes].map(([id, b]) => <rect key={id} className={`mf-mini-node${id === focusId ? " is-focus" : ""}`} x={b.x * s} y={b.y * s} width={b.w * s} height={b.h * s} />)}
        <rect className="mf-mini-view" x={vx * s} y={vy * s} width={(viewW / transform.k) * s} height={(viewH / transform.k) * s} />
    </svg>;
}
