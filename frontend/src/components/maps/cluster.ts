import type { LonLat, NamedCluster } from "../../../../src/supply-chain/map";
import type { Box, Point } from "./map-context";

// Pure geometry behind <ClusterZoom>: grouping markers that would overlap on
// screen, and the boxes it zooms to.

export interface Placed {
    id: string;
    at: Point;
}

export interface PinGroup {
    ids: string[];
    at: Point;
}

// Greedy grouping: each ungrouped point seeds a group and takes every other
// ungrouped point within `radius` (screen units) of the seed. Order-stable.
export function groupPoints(points: readonly Placed[], radius: number): PinGroup[] {
    const left = [...points];
    const groups: PinGroup[] = [];
    while (left.length) {
        const seed = left.shift() as Placed;
        const members = [seed];
        for (let i = left.length - 1; i >= 0; i--) {
            const p = left[i] as Placed;
            if (Math.hypot(p.at[0] - seed.at[0], p.at[1] - seed.at[1]) <= radius) {
                members.push(p);
                left.splice(i, 1);
            }
        }
        const n = members.length;
        groups.push({
            ids: members.map((m) => m.id),
            at: [members.reduce((s, m) => s + m.at[0], 0) / n, members.reduce((s, m) => s + m.at[1], 0) / n],
        });
    }
    return groups;
}

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
