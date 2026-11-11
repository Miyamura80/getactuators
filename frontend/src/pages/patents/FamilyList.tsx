import { useState } from "react";
import { countryName } from "../../../../src/country-flag";
import { type LandscapeScope, TECHNOLOGIES, googlePatentsUrl, searchFamilies } from "../../../../src/patents";
import { Flag } from "../../components/Flag";

// Searchable list of the largest families (most publishing offices first),
// each linking to Google Patents.

const PAGE = 25;
const SHORT = Object.fromEntries(TECHNOLOGIES.map((t) => [t.id, t.short]));

export function FamilyList({ scope, country, onClearCountry }: { scope: LandscapeScope; country: string | null; onClearCountry: () => void }) {
    const [query, setQuery] = useState("");
    const [shown, setShown] = useState(PAGE);
    const rows = searchFamilies(scope, query).filter((f) => !country || f.country === country);
    return <div className="pt-families">
        <div className="pt-search">
            <input type="search" value={query} placeholder="Search title, assignee or number" aria-label="Search families"
                onChange={(e) => { setQuery(e.target.value); setShown(PAGE); }} />
            {country ? <button type="button" className="pt-chip" onClick={onClearCountry} aria-label={`Clear country filter ${countryName(country)}`}>
                <Flag code={country} decorative />{countryName(country)} ×
            </button> : null}
            <span className="pt-count" aria-live="polite">{rows.length} families</span>
        </div>
        <ol className="pt-list">
            {rows.slice(0, shown).map((f) => <li key={f.id}>
                <a href={googlePatentsUrl(f.pub)} target="_blank" rel="noopener noreferrer">{f.title || f.pub}</a>
                <span className="pt-meta">
                    {f.country !== "XX" ? <Flag code={f.country} /> : null}
                    <span>{f.assignee || "Unknown assignee"}</span>
                    <span>{f.priority.slice(0, 4)}</span>
                    <span title="Publishing offices">{f.jurisdictions} offices</span>
                    {scope === "all" ? <span>{f.techs.map((t) => SHORT[t]).join(", ")}</span> : null}
                </span>
            </li>)}
        </ol>
        {rows.length > shown ? <button type="button" className="pt-more" onClick={() => setShown(shown + PAGE * 2)}>Show more</button> : null}
    </div>;
}
