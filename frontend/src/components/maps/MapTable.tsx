import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useMap } from "./map-context";

// The visually hidden table every map layer carries, so screen readers and
// text browsers get the same data as the picture.
export function MapTable({ caption, head, rows }: {
    caption: string;
    head: string[];
    rows: ReactNode[][];
}) {
    return <table className="mk-table">
        <caption>{caption}</caption>
        <thead><tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
        <tbody>
            {rows.map((r, i) => <tr key={i}>{r.map((c, j) => j === 0 ? <th key={j} scope="row">{c}</th> : <td key={j}>{c}</td>)}</tr>)}
        </tbody>
    </table>;
}

// An overlay's table, portalled under the map next to the base layer's.
export function OverlayTable(props: Parameters<typeof MapTable>[0]) {
    const { tableLayer } = useMap();
    return tableLayer ? createPortal(<MapTable {...props} />, tableLayer) : null;
}
