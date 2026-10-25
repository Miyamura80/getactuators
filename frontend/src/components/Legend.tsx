import type { LegendEntry } from "../lib/brands";
import { resolveBrand } from "../../../src/brands";
import { CompanyLogo } from "./CompanyLogo";

interface Props {
    entries: LegendEntry[];
}

// Entries that name a company get its logo; category keys ("Humanoid",
// "Other") stay a plain swatch.
export function Legend({ entries }: Props) {
    if (entries.length === 0) return null;
    return (
        <div className="legend">
            {entries.map((e) => (
                <span className="legend-item" key={e.name}>
                    <span className="legend-dot" style={{ background: e.color }} />
                    {resolveBrand(e.name) && <CompanyLogo name={e.name} size={14} />}
                    {e.name}
                </span>
            ))}
        </div>
    );
}
