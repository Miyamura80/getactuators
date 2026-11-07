import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { type MapPin, type NamedCluster, mixPhrase, segmentMix } from "../../../../src/supply-chain/map";
import { boxOf, clusterBox, groupName, groupPoints, insideCluster, mergeOverlapping, type Placed, placeTag, type PxRect, tagSize } from "./cluster";
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
    // only ("groups", for a busy world map), group callouts with company
    // names once zoomed in ("zoomed", for a busy country), or none.
    labels?: boolean | "groups" | "zoomed";
    // Regional hubs for a busy map: while zoomed out, every pin a hub `has`
    // joins that hub's one marker, named after it, instead of grouping by
    // distance, and named cluster boxes wait until the map is zoomed in.
    hubs?: readonly MapHub[];
    // Named cluster boxes and tags on the map (false: the index under the
    // map still lists them), e.g. off when zoomed into one region.
    boxes?: boolean;
}

export interface MapHub {
    id: string;
    label: string;
    has: (pin: MapPin) => boolean;
}

const MAX_K = 12;
const MIN_BOX_PX = 44;
// Tile size inside a group marker, and in the cluster tags and index.
const GROUP_TILE = 16;
const TAG_TILE = 12;
// The zoom from which "zoomed" labels name single sites.
const NAME_SITES_K = 2;
// Hubs stand in for the pins below this zoom.
const HUB_K = 1.25;

// Pins that group while they overlap: a group marker zooms to its members
// (d3-zoom), named clusters draw as a dashed box with a label that zooms to it.
// A group marker shows what it holds, one segment tile per segment present
// with its site count (SegmentMix), and, when its members share a named
// cluster, a company or a region, a callout naming it ("Yangtze River Delta").
export function ClusterZoom({ pins, radius = 28, clusters = [], activeCluster, onCluster, selectedId, onSelect, table = "Sites", labels = true, hubs, boxes = true }: ClusterZoomProps) {
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
    const hubbed = !!hubs?.length && zoom.k < HUB_K;
    const oneRegion = !!pins[0]?.admin1 && pins.every((p) => p.admin1 === pins[0]?.admin1);
    const hubOf = (p: MapPin) => (hubbed ? hubs?.find((h) => h.has(p)) : undefined);
    const seeds = hubbed ? hubGroups(placed, (id) => { const p = byId.get(id); return p ? hubOf(p)?.id : undefined; }) : groupPoints(placed, r);
    const groups = mergeOverlapping(seeds, new Map(placed.map((p) => [p.id, p.at])), sizeOf, 2 / scale);
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
    const boxed = (hubbed || !boxes ? [] : named).map((n) => ({ ...n, screen: [toScreen(n.box[0], zoom), toScreen(n.box[1], zoom)] as Box }))
        .filter((n) => (n.screen[1][0] - n.screen[0][0]) * scale >= MIN_BOX_PX);
    const multi = groups.filter((g) => g.ids.length > 1).map((g) => {
        const members = g.ids.flatMap((id) => byId.get(id) ?? []);
        const mix = segmentMix(members);
        const name = hubbed ? hubName(members.map(hubOf)) : groupName(members, boxes ? clusters : [], !oneRegion);
        return { g, key: g.ids.join("|"), members, mix, size: mixSize(mix, GROUP_TILE), name };
    });
    // Each tag takes a free corner of its box, clear of every marker and of
    // the tags placed before it; with none free, only the box draws.
    const px = ([x, y]: Point): Point => [x * scale, y * scale];
    const taken: PxRect[] = [
        ...multi.map(({ g, size: [w, h] }) => { const [x, y] = px(g.at); return [x - w / 2, y - h / 2, x + w / 2, y + h / 2] as PxRect; }),
        ...singles.flatMap((p) => {
            const b = base.get(p.id);
            if (!b) return [];
            const [x, y] = px(toScreen(b, zoom));
            const r = PIN_SIZE / 2 + 1;
            return [[x - r, y - r, x + r, y + r] as PxRect];
        }),
    ];
    const shown = boxed.map((n) => {
        const [[x0, y0], [x1, y1]] = n.screen;
        const tag = placeTag([x0 * scale, y0 * scale, x1 * scale, y1 * scale], tagSize(n.c.label), width * scale, height * scale, taken);
        if (tag) taken.push(tag);
        return { ...n, tag };
    });
    // A group callout names what no tag already names, once: the biggest
    // group sharing a name keeps it.
    const tagged = new Set(shown.filter((n) => n.tag).map((n) => n.c.label));
    const owner = new Map<string, string>();
    for (const m of [...multi].sort((a, b) => b.members.length - a.members.length)) {
        if (m.name && !tagged.has(m.name) && !owner.has(m.name)) owner.set(m.name, m.key);
    }
    // Every group registers (an unnamed one as a bare obstacle), at the size
    // of its tile block, and so does every tag.
    const callouts: LabelItem[] = [
        // Hub names place smallest hub first, so a small hub squeezed between
        // big ones still gets its name.
        ...multi.map(({ g, key, name, size: [w, h] }): LabelItem => ({ id: `group-${key}`, at: g.at, text: labels && name && owner.get(name) === key ? name : "", priority: hubbed ? 3 + 1 / g.ids.length : 3, tone: "cluster", r: w / 2, ry: h / 2 })),
        ...shown.flatMap(({ c, tag }): LabelItem[] => (tag
            ? [{ id: `tag-${c.id}`, at: [(tag[0] + tag[2]) / 2 / scale, (tag[1] + tag[3]) / 2 / scale], text: "", priority: 0, tone: "cluster", r: (tag[2] - tag[0]) / 2, ry: (tag[3] - tag[1]) / 2 }]
            : [])),
    ];
    useMapLabels(`groups${useId()}`, callouts);
    const nameSites = labels === true || (labels === "zoomed" && zoom.k >= NAME_SITES_K);
    return <>
        {svgLayer ? createPortal(<g className="mk-clusters">
            {shown.map(({ c, screen: [[x0, y0], [x1, y1]] }) => <rect key={c.id} className={`mk-cluster-box${c.id === activeCluster ? " is-active" : ""}`}
                x={x0} y={y0} width={x1 - x0} height={y1 - y0} />)}
        </g>, svgLayer) : null}
        {shown.map(({ c, box, mix, tag }) => {
            if (!tag) return null;
            return <button key={c.id} type="button" className={`mk-cluster-tag${c.id === activeCluster ? " is-active" : ""}`}
                style={pct([tag[0] / scale, tag[1] / scale], width, height)} aria-pressed={c.id === activeCluster}
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
        <Pins pins={singles} selectedId={selectedId} onSelect={onSelect} table={false} labels={nameSites} />
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

// One group per hub, at the mean of its pins; pins in no hub stay single.
function hubGroups(placed: readonly Placed[], hubOf: (id: string) => string | undefined): { ids: string[]; at: Point }[] {
    const by = new Map<string, Placed[]>();
    const out: { ids: string[]; at: Point }[] = [];
    for (const p of placed) {
        const h = hubOf(p.id);
        if (!h) out.push({ ids: [p.id], at: p.at });
        else by.set(h, [...(by.get(h) ?? []), p]);
    }
    for (const members of by.values()) {
        const n = members.length;
        out.push({ ids: members.map((m) => m.id), at: [members.reduce((s, m) => s + m.at[0], 0) / n, members.reduce((s, m) => s + m.at[1], 0) / n] });
    }
    return out;
}

// A hub marker's name: its hub, or both hubs when two had to merge.
function hubName(of: readonly (MapHub | undefined)[]): string | null {
    const labels = [...new Set(of.map((h) => h?.label))];
    if (labels.some((l) => !l) || labels.length > 2) return null;
    return labels.join(" and ");
}
