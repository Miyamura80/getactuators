import { useId } from "react";
import { countryName } from "../../../../src/country-flag";
import { SEGMENTS, SEGMENT_LABEL, type Segment } from "../../../../src/supply-chain/companies";
import { type MapPin, SEGMENT_COLOR, SEGMENT_SHORT } from "../../../../src/supply-chain/map";
import { monogram } from "../flows/graph-layout";
import { ObjectTile } from "../glyphs/ObjectTile";
import type { LabelItem } from "./labels";
import { type Point, inView, pct, toScreen, useMap } from "./map-context";
import { useMapLabels } from "./MapLabels";
import { OverlayTable } from "./MapTable";
import { SegmentTile } from "./SegmentTile";

// A site marker is its segment's object tile (SegmentTile): colour and
// pictogram both say what is there, so neither relies on the other.
export const PIN_SIZE = 16;

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

// Marker half-size in CSS pixels, for label collision (tile plus stroke).
const PIN_R = PIN_SIZE / 2 + 1;

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
                <SegmentTile segment={p.segment} hollow={p.precision !== "site"} size={PIN_SIZE} />
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

// Tile key for the segments, plus the hollow = approximate convention (a
// bare dashed tile, as /policy keys its statuses). Given `pins`, it lists
// only the segments present, with counts.
export function PinLegend({ segments = SEGMENTS, pins }: { segments?: readonly Segment[]; pins?: readonly MapPin[] }) {
    const count = (s: Segment) => pins?.filter((p) => p.segment === s).length ?? 0;
    const shown = pins ? segments.filter((s) => count(s) > 0) : segments;
    const approx = !pins || pins.some((p) => p.precision !== "site");
    return <ul className="mk-key">
        {shown.map((s) => <li key={s} title={SEGMENT_LABEL[s]}>
            <SegmentTile segment={s} size={14} />{pins ? SEGMENT_SHORT[s] : SEGMENT_LABEL[s]}{pins ? <b>{count(s)}</b> : null}
        </li>)}
        {approx ? <li className="is-approx"><ObjectTile className="mk-tile" hollow size={14} />City centre</li> : null}
    </ul>;
}
