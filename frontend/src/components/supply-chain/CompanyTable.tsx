import { useState } from "react";
import { SEGMENTS, type Company } from "../../../../src/supply-chain/companies";
import { SEGMENT_SHORT } from "../../../../src/supply-chain/map";
import { Flag } from "../Flag";
import { NodeBadge } from "../flows/NodeBadge";
import { SegmentTile } from "../maps/SegmentTile";
import { SourcedValue } from "./SourcedValue";
import "./company.css";

type Key = "name" | "segment" | "hq" | "sites" | "revenue" | "margin";

const COLUMNS: [Key, string][] = [
    ["name", "Company"],
    ["segment", "Segment"],
    ["hq", "HQ"],
    ["sites", "Sites"],
    ["revenue", "Revenue"],
    ["margin", "Gross margin"],
];

export interface CompanyTableProps {
    companies: readonly Company[];
    // Sites per company on this map (a plant count for the country).
    sitesOf: (companyId: string) => number;
    sitesLabel?: string;
    selectedId?: string | null;
    onSelect?: (companyId: string) => void;
    caption: string;
}

function sortValue(c: Company, key: Key, sites: number): string | number {
    switch (key) {
        case "name": return c.name.toLowerCase();
        case "segment": return SEGMENTS.indexOf(c.segment);
        case "hq": return c.hqCountry;
        case "sites": return sites;
        case "revenue": return c.revenue?.value ?? -1;
        case "margin": return c.grossMargin?.value ?? -1;
    }
}

// Companies as a sortable table under a map: click a header to sort, a name
// to open the company card. Unknown revenue or margin sorts last. Shared by
// the country pages; the page filters `companies` by its segment control.
export function CompanyTable({ companies, sitesOf, sitesLabel = "Sites", selectedId, onSelect, caption }: CompanyTableProps) {
    const [sort, setSort] = useState<{ key: Key; desc: boolean }>({ key: "segment", desc: false });
    const rows = [...companies].sort((a, b) => {
        const x = sortValue(a, sort.key, sitesOf(a.id));
        const y = sortValue(b, sort.key, sitesOf(b.id));
        const d = x < y ? -1 : x > y ? 1 : a.name.localeCompare(b.name);
        return sort.desc ? -d : d;
    });
    const by = (key: Key) => setSort((s) => ({ key, desc: s.key === key ? !s.desc : key === "revenue" || key === "margin" || key === "sites" }));
    return <div className="sc-ctable-wrap">
        <table className="sc-ctable">
            <caption>{caption}</caption>
            <thead>
                <tr>{COLUMNS.map(([key, label]) => <th key={key} scope="col"
                    aria-sort={sort.key === key ? (sort.desc ? "descending" : "ascending") : "none"}>
                    <button type="button" onClick={() => by(key)}>{key === "sites" ? sitesLabel : label}</button>
                </th>)}</tr>
            </thead>
            <tbody>
                {rows.map((c) => <tr key={c.id} className={c.id === selectedId ? "is-on" : undefined}>
                    <th scope="row">
                        <button type="button" aria-pressed={c.id === selectedId} onClick={() => onSelect?.(c.id)}>{c.name}</button>
                    </th>
                    <td><span className="sc-ctable-seg"><SegmentTile segment={c.segment} size={12} />{SEGMENT_SHORT[c.segment]}</span></td>
                    <td><Flag code={c.hqCountry} /></td>
                    <td className="sc-num">{sitesOf(c.id)}</td>
                    <td>{c.revenue ? <SourcedValue value={c.revenue} /> : <span className="sc-dash">-</span>}</td>
                    <td>{c.grossMargin ? <NodeBadge kind="margin" value={c.grossMargin} /> : <span className="sc-dash">-</span>}</td>
                </tr>)}
            </tbody>
        </table>
    </div>;
}
