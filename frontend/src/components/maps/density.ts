import { geoContains } from "d3-geo";
import type { LonLat } from "../../../../src/supply-chain/map";
import type { GeoFeature } from "./geo";

// Points per region: each point counts once, in the first feature containing
// it. Regions with none are left out (drawn as plain land). A point offshore
// of every outline (a pin at a port, say) counts nowhere.
export function countByRegion(features: readonly GeoFeature[], points: readonly LonLat[], idOf: (f: GeoFeature) => string): Partial<Record<string, number>> {
    const out: Partial<Record<string, number>> = {};
    for (const p of points) {
        const f = features.find((x) => geoContains(x, [p.lon, p.lat]));
        const id = f ? idOf(f) : "";
        if (id) out[id] = (out[id] ?? 0) + 1;
    }
    return out;
}
