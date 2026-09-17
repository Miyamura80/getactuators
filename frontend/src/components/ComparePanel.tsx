import type { Actuator } from "../types";
import { COLUMNS } from "../lib/columns";

interface Props {
    actuators: Actuator[];
    onRemove: (id: string) => void;
    onClose: () => void;
}

// Which actuator(s) hold the best value for a column, for highlighting.
function bestIds(rows: Actuator[], col: (typeof COLUMNS)[number]): Set<string> {
    let best: number | null = null;
    for (const a of rows) {
        const v = col.value(a);
        if (v == null) continue;
        if (best == null || (col.higherIsBetter ? v > best : v < best)) best = v;
    }
    const ids = new Set<string>();
    if (best == null) return ids;
    for (const a of rows) if (col.value(a) === best) ids.add(a.id);
    return ids;
}

export function ComparePanel({ actuators, onRemove, onClose }: Props) {
    if (actuators.length === 0) return null;
    return (
        <div className="compare">
            <div className="compare-head">
                <h2>Compare {"·"} {actuators.length}</h2>
                <button type="button" className="reset" onClick={onClose}>
                    Close
                </button>
            </div>
            <div className="compare-scroll">
                <table className="compare-table">
                    <thead>
                        <tr>
                            <th className="rowlabel">Metric</th>
                            {actuators.map((a) => (
                                <th key={a.id}>
                                    <span className="name">{a.name}</span>
                                    <span className="brand">{a.brand}</span>
                                    <button
                                        type="button"
                                        className="remove"
                                        aria-label={`Remove ${a.name}`}
                                        onClick={() => onRemove(a.id)}
                                    >
                                        {"×"}
                                    </button>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {COLUMNS.map((c) => {
                            const winners = bestIds(actuators, c);
                            return (
                                <tr key={c.key}>
                                    <td className="rowlabel">
                                        {c.label}
                                        {c.unit && <em> ({c.unit})</em>}
                                    </td>
                                    {actuators.map((a) => (
                                        <td
                                            key={a.id}
                                            className="num"
                                            data-best={winners.has(a.id)}
                                        >
                                            {c.display(a)}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
