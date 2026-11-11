import { countryName } from "../../../../src/country-flag";
import { type LandscapeScope, countryTotals, leaderboard } from "../../../../src/patents";
import { pct as at, toScreen, inView, useMap } from "../../components/maps/map-context";
import { WorldMap } from "../../components/maps/WorldMap";

// Assignee map: applicant-country families as the choropleth, and a bubble
// at each top assignee's headquarters country sized by its families.

// Rough country centres (lat, lon) for the countries top assignees sit in.
const CENTRE: Record<string, [number, number]> = {
    CN: [34, 108], JP: [36.5, 138.5], KR: [36.3, 127.8], TW: [23.7, 121], US: [39, -98], CA: [56, -106],
    DE: [51, 10.4], FR: [46.6, 2.4], GB: [53, -1.8], CH: [46.8, 8.2], SE: [62, 15], DK: [56, 9.5],
    NL: [52.2, 5.5], BE: [50.6, 4.6], IT: [42.8, 12.5], ES: [40.3, -3.7], AT: [47.6, 14.1], FI: [64, 26],
    NO: [61, 9], IE: [53.2, -8], IL: [31.4, 35], IN: [22, 79], SG: [1.35, 103.8], AU: [-25, 134],
    RU: [58, 60], PL: [52, 19], CZ: [49.8, 15.5], BR: [-10, -52], TR: [39, 35], LU: [49.8, 6.1],
};

interface Bubble {
    country: string;
    families: number;
    names: string[];
}

export function hqBubbles(scope: LandscapeScope): Bubble[] {
    const by = new Map<string, Bubble>();
    for (const r of leaderboard(scope)) {
        if (!CENTRE[r.country]) continue;
        const b = by.get(r.country) ?? { country: r.country, families: 0, names: [] };
        b.families += r.families;
        b.names.push(r.name);
        by.set(r.country, b);
    }
    return [...by.values()].sort((a, b) => b.families - a.families);
}

function Bubbles({ bubbles, onSelect }: { bubbles: Bubble[]; onSelect: (iso: string) => void }) {
    const { width, height, project, zoom } = useMap();
    const max = Math.max(1, ...bubbles.map((b) => b.families));
    return <>{bubbles.flatMap((b) => {
        const c = CENTRE[b.country];
        const base = c ? project(c[1], c[0]) : null;
        if (!base) return [];
        const p = toScreen(base, zoom);
        if (!inView(p, width, height)) return [];
        const d = 10 + Math.sqrt(b.families / max) * 46;
        const label = `${countryName(b.country)}: ${b.families} families from ${b.names.join(", ")}`;
        return [<button key={b.country} type="button" className="pt-bubble" style={{ ...at(p, width, height), width: d, height: d }}
            aria-label={label} title={label} onClick={() => onSelect(b.country)}>
            <span>{b.families}</span>
        </button>];
    })}</>;
}

export function AssigneeMap({ scope, country, onCountry }: { scope: LandscapeScope; country: string | null; onCountry: (iso: string | null) => void }) {
    const bubbles = hqBubbles(scope);
    const pick = (iso: string) => onCountry(iso === country ? null : iso);
    return <WorldMap
        label="Patent families per applicant country"
        values={countryTotals(scope)}
        valueLabel="Families"
        selectedCountry={country}
        onSelectCountry={pick}
    >
        <Bubbles bubbles={bubbles} onSelect={pick} />
    </WorldMap>;
}
