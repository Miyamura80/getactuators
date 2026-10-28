import type { ReactNode } from "react";
import "./object-tile.css";

// The site's "object tile": a solid tile in a type colour with an object
// knocked out of it in black, drawn on a 24-unit grid. Hollow (a dashed
// outline, the object drawn in the colour) marks something not fully there:
// a measure not yet in force on /policy, an approximate location on the
// maps. /policy measure types and map segments both draw through this.
export function ObjectTile({ color, hollow = false, size = 16, className, children, after }: {
    color?: string;
    hollow?: boolean;
    size?: number;
    className?: string;
    // The object, in 24-grid units; `.ot-solid` parts are filled.
    children?: ReactNode;
    // Drawn over the tile at full scale (a status badge).
    after?: ReactNode;
}) {
    return <svg className={`ot${className ? ` ${className}` : ""}`} width={size} height={size} viewBox="0 0 24 24"
        aria-hidden="true" style={color ? { color } : undefined}>
        <rect x="1" y="1" width="22" height="22" rx="5" className={`ot-tile${hollow ? " is-hollow" : ""}`} />
        {children ? <g className="ot-mark" transform="translate(3.6 3.6) scale(0.7)">{children}</g> : null}
        {after}
    </svg>;
}
