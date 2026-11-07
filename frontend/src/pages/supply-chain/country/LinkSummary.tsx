import { countryName } from "../../../../../src/country-flag";
import type { CountryRegion } from "../../../../../src/supply-chain/country-pages";
import type { MapArc, MapArcEnd } from "../../../../../src/supply-chain/map";
import { Flag } from "../../../components/Flag";

interface Entry {
    key: string;
    out: number;
    in: number;
    // Flag for a country, region code for a domestic partner.
    country: string | null;
    name: string;
}

// The links in and out of a region, one entry per partner place (a
// country, another state, or "within" the region) with counts out and in.
// Hover or focus draws that place's links on the map; a click keeps them.
export function LinkSummary({ arcs, keyOf, inside, region, regionOf, active, pinned, onHover, onPin }: {
    arcs: readonly MapArc[];
    keyOf: (a: MapArc) => string;
    inside: (end: MapArcEnd) => boolean;
    region: CountryRegion;
    regionOf: (end: MapArcEnd) => string | undefined;
    active: string | null;
    pinned: string | null;
    onHover: (key: string | null) => void;
    onPin: (key: string) => void;
}) {
    const by = new Map<string, Entry>();
    for (const a of arcs) {
        const key = keyOf(a);
        const out = inside(a.from);
        const far = out ? a.to : a.from;
        const domestic = key === "within" || !!regionOf(far);
        const name = key === "within" ? `Within ${region.name}` : domestic ? (far.admin1 ?? key) : countryName(far.country);
        const e = by.get(key) ?? { key, out: 0, in: 0, country: domestic ? null : far.country, name };
        if (key === "within" || out) e.out += 1;
        else e.in += 1;
        by.set(key, e);
    }
    const entries = [...by.values()].sort((a, b) => b.out + b.in - (a.out + a.in) || a.key.localeCompare(b.key));
    return <div className="cp-links" role="group" aria-label={`Links in and out of ${region.name}`}>
        <span className="cp-links-label">Links</span>
        {entries.map((e) => {
            const name = e.name;
            const what = e.key === "within"
                ? `${e.out} link${e.out === 1 ? "" : "s"}`
                : [e.out ? `${e.out} out` : "", e.in ? `${e.in} in` : ""].filter(Boolean).join(", ");
            return <button key={e.key} type="button" aria-pressed={pinned === e.key} className={active === e.key ? "is-active" : undefined}
                aria-label={`${name}: ${what}. Show on the map`}
                onPointerEnter={() => onHover(e.key)} onPointerLeave={() => onHover(null)}
                onFocus={() => onHover(e.key)} onBlur={() => onHover(null)} onClick={() => onPin(e.key)}>
                {e.country ? <Flag code={e.country} decorative /> : null}
                <span>{e.key === "within" ? region.code : e.key}</span>
                {e.key === "within" ? <i aria-hidden="true">{e.out}</i> : <>
                    {e.out ? <i aria-hidden="true">→{e.out}</i> : null}
                    {e.in ? <i aria-hidden="true">←{e.in}</i> : null}
                </>}
            </button>;
        })}
    </div>;
}
