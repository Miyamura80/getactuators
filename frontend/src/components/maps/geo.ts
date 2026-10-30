import { useEffect, useState } from "react";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";
import { GEO_DIR } from "../../../../src/supply-chain/map";

// TopoJSON loading for the map kit. Files live in frontend/public/geo/ and
// are fetched once per session; a component can also be handed a topology
// directly (tests, or a page that already has it).

// World files carry { iso, name }; admin-1 files carry { code, name }.
export interface GeoProps {
    iso?: string;
    code?: string;
    name?: string;
}

export type GeoFeature = Feature<Geometry, GeoProps>;
export type MapTopology = Topology<Record<string, GeometryCollection<GeoProps>>>;

const cache = new Map<string, Promise<MapTopology>>();

export function loadTopology(file: string): Promise<MapTopology> {
    let p = cache.get(file);
    if (!p) {
        p = fetch(`${GEO_DIR}/${file}`).then((r) => {
            if (!r.ok) throw new Error(`${file}: HTTP ${r.status}`);
            return r.json() as Promise<MapTopology>;
        });
        // A failed fetch is retried on the next mount, not cached forever.
        p.catch(() => cache.delete(file));
        cache.set(file, p);
    }
    return p;
}

// The topology for `file`, or null while it loads (or if it failed: the map
// keeps its frame and the hidden table still carries the data).
export function useTopology(file: string, preset?: MapTopology): MapTopology | null {
    const [topo, setTopo] = useState<{ file: string; topo: MapTopology } | null>(null);
    useEffect(() => {
        if (preset) return;
        let live = true;
        loadTopology(file).then(
            (t) => { if (live) setTopo({ file, topo: t }); },
            () => undefined,
        );
        return () => { live = false; };
    }, [file, preset]);
    return preset ?? (topo?.file === file ? topo.topo : null);
}

// Every feature of the topology's first object.
export function topoFeatures(topo: MapTopology): GeoFeature[] {
    const key = Object.keys(topo.objects)[0];
    const obj = key ? topo.objects[key] : undefined;
    if (!obj) return [];
    return (feature(topo, obj) as FeatureCollection<Geometry, GeoProps>).features;
}

export function collection(features: GeoFeature[]): FeatureCollection<Geometry, GeoProps> {
    return { type: "FeatureCollection", features };
}
