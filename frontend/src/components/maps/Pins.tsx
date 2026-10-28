import { useId } from "react";
import { countryName } from "../../../../src/country-flag";
import { SEGMENTS, SEGMENT_LABEL, type Segment } from "../../../../src/supply-chain/companies";
import { type MapPin, SEGMENT_COLOR, SEGMENT_SHORT } from "../../../../src/supply-chain/map";
import { monogram } from "../flows/graph-layout";
import type { LabelItem } from "./labels";
import { type Point, inView, pct, toScreen, useMap } from "./map-context";
import { useMapLabels } from "./MapLabels";
import { OverlayTable } from "./MapTable";

// Marker shape and colour both encode the segment (SEGMENT_COLOR), so a
// reader who cannot tell the hues apart still reads the shape.
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

// `neutral` drops the segment colour (the key's "city centre" swatch).
export function PinGlyph({ segment, hollow = false, neutral = false }: { segment: Segment; hollow?: boolean; neutral?: boolean }) {
    return <svg className={`mk-glyph${hollow ? " is-hollow" : ""}`} viewBox="0 0 12 12" aria-hidden="true" style={neutral ? undefined : { color: SEGMENT_COLOR[segment] }}>
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

// The site half of "Company · Site".
function siteOf(p: MapPin): string {
    const head = p.company ? `${p.company} · ` : "";
    return head && p.label.startsWith(head) ? p.label.slice(head.length) : p.label;
}

// Marker half-size in CSS pixels, for label collision.
const PIN_R = 6;

// The always-on company name beside a marker; exact sites outrank city
// centres when space runs out.
export function pinLabel(p: MapPin, at: Point): LabelItem {
    return { id: `pin-${p.id}`, at, text: p.company ?? p.label, priority: p.precision === "site" ? 2 : 1, tone: "site", r: PIN_R };
}

export interface PinsProps {
    pins: readonly MapPin[];
    selectedId?: string | null;
    onSelect?: (pin: MapPin) => void;
    // Caption of the hidden table; false leaves the table to a parent.
    table?: string | false;
    // Company names beside the markers, placed around each other.
    labels?: boolean;
}

// Site markers as real buttons: focusable, named, Enter / Space selects.
// A hollow marker is a city or region centre, not the plant gate. Hover or
// focus opens a card with the company monogram and the site.
export function Pins({ pins, selectedId, onSelect, table = "Sites", labels = true }: PinsProps) {
    const { width, height, project, zoom } = useMap();
    const shown = pins.flatMap((p) => {
        const base = project(p.lon, p.lat);
        if (!base) return [];
        const at = toScreen(base, zoom);
        return inView(at, width, height) ? [{ p, at }] : [];
    });
    // Unlabelled markers still register, so no other label covers them.
    useMapLabels(`pins${useId()}`, shown.map(({ p, at }) => (labels ? pinLabel(p, at) : { ...pinLabel(p, at), text: "" })));
    return <>
        {shown.map(({ p, at }) => {
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
                <span className="mk-tip" aria-hidden="true">
                    <b className="mk-mono" style={{ borderColor: SEGMENT_COLOR[p.segment] }}>{monogram(p.company ?? p.label)}</b>
                    <span>{p.company ?? p.label}{p.company ? <i>{siteOf(p)}</i> : null}</span>
                </span>
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

// Shape and colour key for the segments, plus the hollow = approximate
// convention. Given `pins`, it lists only the segments present, with counts.
export function PinLegend({ segments = SEGMENTS, pins }: { segments?: readonly Segment[]; pins?: readonly MapPin[] }) {
    const count = (s: Segment) => pins?.filter((p) => p.segment === s).length ?? 0;
    const shown = pins ? segments.filter((s) => count(s) > 0) : segments;
    const approx = !pins || pins.some((p) => p.precision !== "site");
    return <ul className="mk-key">
        {shown.map((s) => <li key={s} title={SEGMENT_LABEL[s]}>
            <PinGlyph segment={s} />{pins ? SEGMENT_SHORT[s] : SEGMENT_LABEL[s]}{pins ? <b>{count(s)}</b> : null}
        </li>)}
        {approx ? <li className="is-approx"><PinGlyph segment="ree-mining-refining" hollow neutral />City centre</li> : null}
    </ul>;
}
