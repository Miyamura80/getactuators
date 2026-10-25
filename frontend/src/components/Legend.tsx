import { type LegendEntry, OTHER_COLOR } from "../lib/brands";
import { CompanyLogo } from "./CompanyLogo";

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
                    {e.color !== OTHER_COLOR && <CompanyLogo name={e.name} size={14} />}
                    {e.name}
                </span>
            ))}
        </div>
    );
}
