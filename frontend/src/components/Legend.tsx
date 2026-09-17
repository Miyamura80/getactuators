import type { LegendEntry } from "../lib/brands";

interface Props {
    entries: LegendEntry[];
}

export function Legend({ entries }: Props) {
    if (entries.length === 0) return null;
    return (
        <div className="legend">
            {entries.map((e) => (
                <span className="legend-item" key={e.name}>
                    <span className="legend-dot" style={{ background: e.color }} />
                    {e.name}
                </span>
            ))}
        </div>
    );
}
