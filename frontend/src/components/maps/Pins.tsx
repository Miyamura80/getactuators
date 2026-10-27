import { countryName } from "../../../../src/country-flag";
import { SEGMENTS, SEGMENT_LABEL, type Segment } from "../../../../src/supply-chain/companies";
import type { MapPin } from "../../../../src/supply-chain/map";
import { inView, pct, toScreen, useMap } from "./map-context";
import { OverlayTable } from "./MapTable";

// Marker shape encodes the segment, so colour stays the brand's one accent.
export const SEGMENT_SHAPE: Record<Segment, "circle" | "diamond" | "square" | "triangle"> = {
    "ree-mining-refining": "circle",
    "magnets-motors": "diamond",
    "gears-screws-bearings": "square",
    "robot-actuator-oem": "triangle",
};

const SHAPE_PATH = {
    circle: <circle cx="6" cy="6" r="4.5" />,
    diamond: <path d="M6 0.8 11.2 6 6 11.2 0.8 6Z" />,
    square: <rect x="1.8" y="1.8" width="8.4" height="8.4" />,
    triangle: <path d="M6 1 11.2 10.4H0.8Z" />,
};

export function PinGlyph({ segment, hollow = false }: { segment: Segment; hollow?: boolean }) {
    return <svg className={`mk-glyph${hollow ? " is-hollow" : ""}`} viewBox="0 0 12 12" aria-hidden="true">
        {SHAPE_PATH[SEGMENT_SHAPE[segment]]}
    </svg>;
}

const PRECISION_TEXT: Record<MapPin["precision"], string> = {
    site: "exact site",
    city: "city centre",
    region: "region",
};

export function pinName(p: MapPin): string {
    return `${p.label}, ${SEGMENT_LABEL[p.segment]}, ${countryName(p.country)}${p.precision === "site" ? "" : ` (${PRECISION_TEXT[p.precision]})`}`;
}

export interface PinsProps {
    pins: readonly MapPin[];
    selectedId?: string | null;
    onSelect?: (pin: MapPin) => void;
    // Caption of the hidden table; false leaves the table to a parent.
    table?: string | false;
}

// Site markers as real buttons: focusable, named, Enter / Space selects.
// A hollow marker is a city or region centre, not the plant gate.
export function Pins({ pins, selectedId, onSelect, table = "Sites" }: PinsProps) {
    const { width, height, project, zoom } = useMap();
    return <>
        {pins.map((p) => {
            const base = project(p.lon, p.lat);
            if (!base) return null;
            const at = toScreen(base, zoom);
            if (!inView(at, width, height)) return null;
            const selected = p.id === selectedId;
            return <button
                key={p.id}
                type="button"
                className={`mk-pin${selected ? " is-selected" : ""}`}
                style={pct(at, width, height)}
                data-pin={p.id}
                aria-label={pinName(p)}
                aria-pressed={selected}
                onClick={() => onSelect?.(p)}
            >
                <PinGlyph segment={p.segment} hollow={p.precision !== "site"} />
                <span className="mk-tip" aria-hidden="true">{p.label}</span>
            </button>;
        })}
        {table ? <PinTable caption={table} pins={pins} /> : null}
    </>;
}

export function PinTable({ caption, pins }: { caption: string; pins: readonly MapPin[] }) {
    return <OverlayTable
        caption={caption}
        head={["Site", "Segment", "Country", "Pin", "Lat, lon"]}
        rows={pins.map((p) => [p.label, SEGMENT_LABEL[p.segment], countryName(p.country), PRECISION_TEXT[p.precision], `${p.lat.toFixed(2)}, ${p.lon.toFixed(2)}`])}
    />;
}

// Shape key for the four segments, plus the hollow = approximate convention.
export function PinLegend({ segments = SEGMENTS }: { segments?: readonly Segment[] }) {
    return <ul className="mk-key">
        {segments.map((s) => <li key={s}><PinGlyph segment={s} />{SEGMENT_LABEL[s]}</li>)}
        <li><PinGlyph segment="ree-mining-refining" hollow />City centre</li>
    </ul>;
}
