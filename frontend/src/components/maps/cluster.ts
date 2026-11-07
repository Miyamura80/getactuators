import type { LonLat, MapPin, NamedCluster } from "../../../../src/supply-chain/map";
import type { Box, Point } from "./map-context";

// Pure geometry behind <ClusterZoom>: the boxes it zooms to and the names
// groups take. Grouping itself (shared with the server-rendered map) lives in
// src/supply-chain/map-groups.ts.
export { groupPoints, mergeOverlapping, type Placed } from "../../../../src/supply-chain/map-groups";

export function boxOf(points: readonly Point[]): Box {
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    return [[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]];
}

// A named cluster's lat/lon box in base map units (corners and edge midpoints
// projected, so a conic or Albers projection still gets a sensible box).
export function clusterBox(c: NamedCluster, project: (lon: number, lat: number) => Point | null): Box | null {
    const [minLat, minLon, maxLat, maxLon] = c.bbox;
    const midLat = (minLat + maxLat) / 2;
    const midLon = (minLon + maxLon) / 2;
    const pts = [
        [minLon, minLat], [maxLon, minLat], [minLon, maxLat], [maxLon, maxLat],
        [midLon, minLat], [midLon, maxLat], [minLon, midLat], [maxLon, midLat],
    ].map(([lon, lat]) => project(lon as number, lat as number)).filter((p): p is Point => p !== null);
    return pts.length ? boxOf(pts) : null;
}

export function insideCluster(c: NamedCluster, p: LonLat): boolean {
    const [minLat, minLon, maxLat, maxLon] = c.bbox;
    return p.lat >= minLat && p.lat <= maxLat && p.lon >= minLon && p.lon <= maxLon;
}

// What a group of markers has in common, most telling first: the named
// cluster holding all of them, their one company, or their one region.
// Null when they share none of these (the count alone then speaks).
// `region` false skips the shared region (every pin on the map is in it).
export function groupName(members: readonly MapPin[], clusters: readonly NamedCluster[], region = true): string | null {
    const first = members[0];
    if (!first) return null;
    const cluster = clusters.find((c) => members.every((m) => insideCluster(c, m)));
    if (cluster) return cluster.label;
    if (first.company && members.every((m) => m.company === first.company)) return first.company;
    if (region && first.admin1 && members.every((m) => m.admin1 === first.admin1)) return first.admin1;
    return null;
}

// [x0, y0, x1, y1] in CSS pixels.
export type PxRect = [number, number, number, number];

// A named cluster's on-map tag (.mk-cluster-tag: 10px mono caps, padded and
// bordered), estimated wide so the check errs on the safe side.
const TAG_CHAR_PX = 6.8;
const TAG_GAP = 2;
export function tagSize(text: string): [number, number] {
    return [Math.ceil(text.length * TAG_CHAR_PX) + 16, 20];
}

const hits = (a: PxRect, b: PxRect) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];

// Where a cluster's tag sits: on a corner of its box (above it, then below
// it), on the side nearer the middle of the frame first, clear of the frame
// edge and of everything in `taken`. Null when no corner is free: the box
// still draws and the index under the map still lists the cluster.
export function placeTag(box: PxRect, [w, h]: [number, number], frameW: number, frameH: number, taken: readonly PxRect[]): PxRect | null {
    const [x0, y0, x1, y1] = box;
    const left = (y: number): PxRect => [x0, y, x0 + w, y + h];
    const right = (y: number): PxRect => [x1 - w, y, x1, y + h];
    const above = y0 - TAG_GAP - h;
    const below = y1 + TAG_GAP;
    const endFirst = x0 > frameW * 0.7;
    const order = endFirst
        ? [right(above), left(above), right(below), left(below)]
        : [left(above), right(above), left(below), right(below)];
    return order.find((r) => r[0] >= 2 && r[1] >= 2 && r[2] <= frameW - 2 && r[3] <= frameH - 2 && !taken.some((t) => hits(t, r))) ?? null;
}
