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
export function groupName(members: readonly MapPin[], clusters: readonly NamedCluster[]): string | null {
    const first = members[0];
    if (!first) return null;
    const cluster = clusters.find((c) => members.every((m) => insideCluster(c, m)));
    if (cluster) return cluster.label;
    if (first.company && members.every((m) => m.company === first.company)) return first.company;
    if (first.admin1 && members.every((m) => m.admin1 === first.admin1)) return first.admin1;
    return null;
}
