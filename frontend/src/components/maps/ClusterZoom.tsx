import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { type MapPin, type NamedCluster, mixPhrase, segmentMix } from "../../../../src/supply-chain/map";
import { boxOf, clusterBox, groupName, groupPoints, insideCluster, mergeOverlapping, type Placed } from "./cluster";
import type { LabelItem } from "./labels";
import { type Box, type Point, inView, pct, toScreen, useMap } from "./map-context";
import { useMapLabels } from "./MapLabels";
import { PIN_SIZE, PinTable, Pins, pinName } from "./Pins";
import { mixSize } from "../../../../src/supply-chain/map-groups";
import { SegmentMix, SegmentTile } from "./SegmentTile";

export interface ClusterZoomProps {
    pins: readonly MapPin[];
    // Markers closer than this many CSS pixels group.
    radius?: number;
    clusters?: readonly NamedCluster[];
    // The named cluster to zoom to, e.g. from `?cluster=`.
    activeCluster?: string | null;
    onCluster?: (id: string | null) => void;
    selectedId?: string | null;
    onSelect?: (pin: MapPin) => void;
    table?: string;
    // On-map text: company names and group callouts (true), group callouts
    // only ("groups", for a busy world map), or none.
    labels?: boolean | "groups";
}

const MAX_K = 12;
const MIN_BOX_PX = 44;
// Tile size inside a group marker, and in the cluster tags and index.
const GROUP_TILE = 16;
const TAG_TILE = 12;

// Pins that group while they overlap: a group marker zooms to its members
// (d3-zoom), named clusters draw as a dashed box with a label that zooms to it.
// A group marker shows what it holds, one segment tile per segment present
// with its site count (SegmentMix), and, when its members share a named
// cluster, a company or a region, a callout naming it ("Yangtze River Delta").
export function ClusterZoom({ pins, radius = 28, clusters = [], activeCluster, onCluster, selectedId, onSelect, table = "Sites", labels = true }: ClusterZoomProps) {
    const map = useMap();
    const { width, height, project, zoom, scale, svgLayer, belowLayer, zoomTo } = map;
    const r = radius / scale;
    const [open, setOpen] = useState<string | null>(null);
    const base = useMemo(() => new Map(pins.flatMap((p) => {
        const b = project(p.lon, p.lat);
        return b ? [[p.id, b] as const] : [];
    })), [pins, project]);
    const placed: Placed[] = pins.flatMap((p) => {
        const b = base.get(p.id);
        if (!b) return [];
        const at = toScreen(b, zoom);
        return inView(at, width, height) ? [{ id: p.id, at }] : [];
    });
    const byId = new Map(pins.map((p) => [p.id, p]));
    // Screen units per CSS pixel: marker sizes are in pixels, `at` is not.
    const sizeOf = (ids: readonly string[]): [number, number] => {
        const [w, h] = ids.length === 1 ? [PIN_SIZE + 2, PIN_SIZE + 2] : mixSize(segmentMix(ids.flatMap((id) => byId.get(id) ?? [])), GROUP_TILE);
        return [w / scale, h / scale];
    };
    const groups = mergeOverlapping(groupPoints(placed, r), new Map(placed.map((p) => [p.id, p.at])), sizeOf, 2 / scale);
    const singles = groups.filter((g) => g.ids.length === 1).flatMap((g) => byId.get(g.ids[0] as string) ?? []);
    const named = clusters
        .map((c) => ({ c, box: clusterBox(c, project), mix: segmentMix(pins.filter((p) => insideCluster(c, p))) }))
        .filter((n): n is { c: NamedCluster; box: Box; mix: ReturnType<typeof segmentMix> } => n.box !== null && n.mix.length > 0);
    const active = named.find((n) => n.c.id === activeCluster);
    useEffect(() => {
        if (active && svgLayer) zoomTo(active.box, MAX_K);
        // Zoom when the requested cluster changes, not on every pan.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeCluster, svgLayer, active?.box[0][0]]);
    const go = (c: NamedCluster, box: Box) => { zoomTo(box, MAX_K); onCluster?.(c.id); };
    // On-map boxes only once they are big enough to read; the index under
    // the map always lists them.
    const shown = named.map((n) => ({ ...n, screen: [toScreen(n.box[0], zoom), toScreen(n.box[1], zoom)] as Box }))
        .filter((n) => (n.screen[1][0] - n.screen[0][0]) * scale >= MIN_BOX_PX);
    const tagged = new Set(shown.map((n) => n.c.label));
    const multi = groups.filter((g) => g.ids.length > 1).map((g) => {
        const members = g.ids.flatMap((id) => byId.get(id) ?? []);
        const name = groupName(members, clusters);
        const mix = segmentMix(members);
        return { g, key: g.ids.join("|"), members, mix, size: mixSize(mix, GROUP_TILE), name: name && !tagged.has(name) ? name : null };
    });
    // Every group registers (an unnamed one as a bare obstacle), at the size
    // of its tile block.
    const callouts: LabelItem[] = multi.map(({ g, key, name, size: [w, h] }) => ({ id: `group-${key}`, at: g.at, text: labels && name ? name : "", priority: 3, tone: "cluster", r: w / 2, ry: h / 2 }));
    useMapLabels(`groups${useId()}`, callouts);
    return <>
        {svgLayer ? createPortal(<g className="mk-clusters">
            {shown.map(({ c, screen: [[x0, y0], [x1, y1]] }) => <rect key={c.id} className={`mk-cluster-box${c.id === activeCluster ? " is-active" : ""}`}
                x={x0} y={y0} width={x1 - x0} height={y1 - y0} />)}
        </g>, svgLayer) : null}
        {shown.map(({ c, box, mix, screen }) => {
            const end = screen[0][0] > width * 0.7;
            const at: Point = end ? [screen[1][0], screen[0][1]] : screen[0];
            if (!inView(at, width, height, 40)) return null;
            return <button key={c.id} type="button" className={`mk-cluster-tag${end ? " is-end" : ""}${c.id === activeCluster ? " is-active" : ""}`}
                style={pct(at, width, height)} aria-pressed={c.id === activeCluster}
                aria-label={`${c.label}: ${mixPhrase(mix)}. Zoom in`} onClick={() => go(c, box)}>
                {c.label}
            </button>;
        })}
        {belowLayer && named.length ? createPortal(<div className="mk-cluster-index" role="group" aria-label="Clusters">
            {named.map(({ c, box, mix }) => <button key={c.id} type="button" aria-pressed={c.id === activeCluster}
                aria-label={`${c.label}: ${mixPhrase(mix)}. Zoom in`} onClick={() => go(c, box)}>
                <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M1 4V1h3M8 1h3v3M11 8v3H8M4 11H1V8" /></svg>
                {c.label}<SegmentMix mix={mix} size={TAG_TILE} layout="row" />
            </button>)}
        </div>, belowLayer) : null}
        <Pins pins={singles} selectedId={selectedId} onSelect={onSelect} table={false} labels={labels === true} />
        {multi.map(({ g, key, members, mix, name }) => {
            const box = boxOf(g.ids.map((id) => base.get(id)).filter((p): p is Point => !!p));
            // Still overlapping at full zoom (several sites share a city): a
            // click lists the members instead of zooming.
            const tiny = Math.max(box[1][0] - box[0][0], box[1][1] - box[0][1]) * MAX_K < r || zoom.k >= MAX_K * 0.98;
            const hasSelected = members.some((m) => m.id === selectedId);
            return <div key={key} className="mk-group" style={pct(g.at, width, height)}>
                <button type="button" className={`mk-cluster${hasSelected ? " is-selected" : ""}`} data-group={key}
                    aria-label={`${name ?? `${members.length} sites`}: ${mixPhrase(mix)}. ${tiny ? "List them" : "Zoom in"}`}
                    aria-expanded={tiny ? open === key : undefined}
                    onClick={() => (tiny ? setOpen(open === key ? null : key) : zoomTo(box, MAX_K))}>
                    <SegmentMix mix={mix} size={GROUP_TILE} />
                </button>
                {tiny && open === key ? <ul className="mk-group-list">
                    {members.map((m) => <li key={m.id}>
                        <button type="button" aria-label={pinName(m)} aria-pressed={m.id === selectedId}
                            onClick={() => { setOpen(null); onSelect?.(m); }}>
                            <SegmentTile segment={m.segment} hollow={m.precision !== "site"} size={14} />{m.label}
                        </button>
                    </li>)}
                </ul> : null}
            </div>;
        })}
        <PinTable caption={table} pins={pins} />
    </>;
}
