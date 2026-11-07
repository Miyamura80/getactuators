import { useRef } from "react";
import type { CountryRegions } from "../../../../../src/supply-chain/country-pages";
import type { MapPin } from "../../../../../src/supply-chain/map";

// The region picker beside the segment filter: a disclosure listing only
// the regions (states) that hold a shown site, with their site counts, for
// keyboard and touch users and for regions too small to tap on the map.
export function RegionPicker({ regions, pins, selected, onSelect }: {
    regions: CountryRegions;
    pins: readonly MapPin[];
    selected: string | null;
    onSelect: (code: string | null) => void;
}) {
    const ref = useRef<HTMLDetailsElement>(null);
    const counted = regions.list.flatMap((r) => {
        const n = pins.filter((p) => p.admin1 === r.name).length;
        return n || r.code === selected ? [{ ...r, n }] : [];
    });
    const current = counted.find((r) => r.code === selected);
    const pick = (code: string | null) => {
        if (ref.current) ref.current.open = false;
        onSelect(code);
    };
    return <details ref={ref} className="cp-regions">
        <summary aria-label={`${current ? current.name : `All ${regions.plural}`}: choose a ${regions.word}`}>
            {current ? current.name : `All ${regions.plural}`} <b>{current ? current.n : pins.length}</b>
            <svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 4l3 3 3-3" /></svg>
        </summary>
        <div className="cp-regions-list" role="group" aria-label={`Zoom to a ${regions.word}`}>
            <button type="button" aria-pressed={!selected} onClick={() => pick(null)}>All {regions.plural} <b>{pins.length}</b></button>
            {counted.map((r) => <button key={r.code} type="button" aria-pressed={r.code === selected} title={r.name} onClick={() => pick(r.code)}>
                {r.name} <b>{r.n}</b>
            </button>)}
        </div>
    </details>;
}
