import type { Actuator, SortDir } from "../types";
import { CATEGORY_MAP } from "../types";
import { COLUMNS } from "../lib/columns";
import { list } from "../lib/format";
import { MetricBar } from "./MetricBar";

interface Props {
    rows: Actuator[];
    sortKey: string;
    sortDir: SortDir;
    maxes: Record<string, number>;
    compare: Set<string>;
    onSort: (key: string) => void;
    onToggleCompare: (id: string) => void;
    onSelect: (a: Actuator) => void;
}

export function Leaderboard({
    rows,
    sortKey,
    sortDir,
    maxes,
    compare,
    onSort,
    onToggleCompare,
    onSelect,
}: Props) {
    return (
        <div className="table-wrap">
            <table className="board">
                <thead>
                    <tr>
                        <th className="col-pick" aria-label="Compare" />
                        <th className="col-name">Actuator</th>
                        <th className="col-cat">Category</th>
                        <th className="col-country">Origin</th>
                        {COLUMNS.map((c) => {
                            const on = sortKey === c.key;
                            return (
                                <th
                                    key={c.key}
                                    className="col-num sortable"
                                    aria-sort={
                                        on
                                            ? sortDir === "asc"
                                                ? "ascending"
                                                : "descending"
                                            : "none"
                                    }
                                >
                                    <button type="button" onClick={() => onSort(c.key)}>
                                        <span>{c.label}</span>
                                        {c.unit && <em>{c.unit}</em>}
                                        <i className="arrow">
                                            {on ? (sortDir === "asc" ? "↑" : "↓") : ""}
                                        </i>
                                    </button>
                                </th>
                            );
                        })}
                        <th className="col-comm">Comm</th>
                        <th className="col-src">Source</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((a, i) => {
                        const cat = CATEGORY_MAP[a.category];
                        const picked = compare.has(a.id);
                        return (
                            <tr
                                key={a.id}
                                className="row"
                                data-picked={picked}
                                onClick={() => onSelect(a)}
                            >
                                <td className="col-pick">
                                    <input
                                        type="checkbox"
                                        checked={picked}
                                        aria-label={`Compare ${a.name}`}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={() => onToggleCompare(a.id)}
                                    />
                                </td>
                                <td className="col-name">
                                    <span className="rank">{i + 1}</span>
                                    <span className="name-block">
                                        <span className="name">{a.name}</span>
                                        <span className="brand">{a.brand}</span>
                                    </span>
                                </td>
                                <td className="col-cat">
                                    <span
                                        className="cat-chip"
                                        style={{ ["--hue" as string]: String(cat?.hue ?? 210) }}
                                    >
                                        {cat?.label ?? a.category}
                                    </span>
                                </td>
                                <td className="col-country" title={a.country ?? undefined}>
                                    <span className="flag">{a.country_flag ?? "–"}</span>
                                    <span className="country-name">{a.country ?? ""}</span>
                                </td>
                                {COLUMNS.map((c) => (
                                    <td key={c.key} className="col-num">
                                        {c.bar ? (
                                            <MetricBar
                                                value={c.value(a)}
                                                max={maxes[c.key] ?? 1}
                                                text={c.display(a)}
                                                higherIsBetter={c.higherIsBetter}
                                            />
                                        ) : (
                                            c.display(a)
                                        )}
                                    </td>
                                ))}
                                <td className="col-comm">{list(a.comm)}</td>
                                <td className="col-src">
                                    {a.source_url ? (
                                        <a
                                            href={a.source_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {a.source_domain ?? "link"}
                                        </a>
                                    ) : (
                                        <span className="cell-null">{"–"}</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                    {rows.length === 0 && (
                        <tr>
                            <td colSpan={COLUMNS.length + 6} className="empty">
                                No actuators match these filters.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
