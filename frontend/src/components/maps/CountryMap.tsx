import { type ReactNode, useId, useMemo, useState } from "react";
import { geoPath } from "d3-geo";
import { merge } from "topojson-client";
import type { MultiPolygon, Polygon } from "topojson-specification";
import { countryName } from "../../../../src/country-flag";
import { type Admin1Country, admin1File, type MapPin, REFERENCE_CITIES, type RefCity } from "../../../../src/supply-chain/map";
import { ChoroplethLegend, choroplethScale, type ValueMap } from "./choropleth";
import { countByRegion } from "./density";
import { type GeoFeature, type MapTopology, topoFeatures, useTopology } from "./geo";
import { GeoLayer } from "./GeoLayer";
import { inView, toScreen, useMap } from "./map-context";
import { useMapLabels } from "./MapLabels";
import { MapFrame } from "./MapFrame";
import { MapTable } from "./MapTable";
import { PinLegend } from "./Pins";
import { countryView } from "./projection";

export interface CountryMapProps {
    code: Admin1Country;
    label?: string;
    // Optional choropleth per ISO 3166-2 region code ("JP-20").
    values?: ValueMap;
    format?: (v: number) => string;
    valueLabel?: string;
    // The sites on this map: shades each region by how many it holds (when
    // no `values` are given) and keys the segments present under the map.
    sites?: readonly MapPin[];
    // Orientation cities; defaults to the capital and largest metros.
    cities?: readonly RefCity[] | false;
    topology?: MapTopology;
    toggle?: ReactNode;
    // Pins, Arcs, ClusterZoom.
    children?: ReactNode;
}

const codeOf = (f: GeoFeature) => f.properties?.code ?? "";
const nameOf = (f: GeoFeature) => f.properties?.name ?? codeOf(f);
const defaultFormat = (v: number) => v.toLocaleString("en-US");
const siteCount = (v: number) => `${v} site${v === 1 ? "" : "s"}`;

// The country's outer edge (admin-1 shapes merged), drawn brighter than the
// internal borders so land reads against the black sea.
function coastline(topo: MapTopology, path: ReturnType<typeof geoPath>): string {
    const key = Object.keys(topo.objects)[0];
    const obj = key ? topo.objects[key] : undefined;
    if (!obj) return "";
    return path(merge(topo, obj.geometries as Array<Polygon | MultiPolygon>)) ?? "";
}

// Faint city dots with names, placed after every site label.
function CityLabels({ cities }: { cities: readonly RefCity[] }) {
    const { width, height, project, zoom } = useMap();
    const items = cities.flatMap((c) => {
        const b = project(c.lon, c.lat);
        if (!b) return [];
        const at = toScreen(b, zoom);
        if (!inView(at, width, height)) return [];
        return [{ id: `city-${c.name}`, at, text: c.name, priority: c.capital ? 0.5 : 0, tone: "city" as const, r: 3, dot: c.capital ? "capital" as const : "city" as const }];
    });
    useMapLabels(`cities${useId()}`, items);
    return null;
}

// One country's admin-1 outlines (prefectures, provinces, states), fitted to
// its bounds, with a coastline, orientation cities and a scale bar. Holds its
// frame until the outlines load, then fits.
export function CountryMap({ code, label, values, format, valueLabel, sites, cities, topology, toggle, children }: CountryMapProps) {
    const topo = useTopology(admin1File(code), topology);
    const features = useMemo(() => (topo ? topoFeatures(topo) : []), [topo]);
    const view = useMemo(() => (features.length ? countryView(code, features) : null), [code, features]);
    const coast = useMemo(() => (topo && view ? coastline(topo, geoPath(view.projection)) : ""), [topo, view]);
    const density = useMemo(() => (!values && sites ? countByRegion(features, sites, codeOf) : undefined), [values, sites, features]);
    const shade = values ?? density;
    const fmt = format ?? (density ? siteCount : defaultFormat);
    const what = valueLabel ?? (density ? "Sites per region" : "Value");
    const [active, setActive] = useState<string | null>(null);
    const step = useMemo(() => (shade ? choroplethScale(shade) : undefined), [shade]);
    const name = countryName(code);
    const title = label ?? `${name} by region`;
    if (!view) return <figure className="mk-map mk-country is-loading" aria-label={title}><div className="mk-stage" style={{ aspectRatio: "4 / 3" }} /></figure>;
    const regionName = (id: string) => nameOf(features.find((f) => codeOf(f) === id) ?? ({ properties: { code: id } } as GeoFeature));
    const ranked = Object.entries(shade ?? {}).filter((e): e is [string, number] => typeof e[1] === "number").sort((a, b) => b[1] - a[1]);
    const ramp = shade && ranked[0] ? <ChoroplethLegend label={what} min={density ? "0" : fmt(0)} max={density ? String(ranked[0][1]) : fmt(ranked[0][1])} /> : null;
    return <MapFrame
        view={view}
        label={title}
        toggle={toggle}
        className="mk-country"
        scaleBar
        readout={active ? <>
            <span className="mk-readout-name">{regionName(active)}</span>
            {shade?.[active] !== undefined ? <b>{fmt(shade[active] as number)}</b> : null}
        </> : null}
        legend={sites || ramp ? <div className="mk-keyrow">
            {sites ? <PinLegend pins={sites} /> : null}
            {ramp}
        </div> : null}
        base={<>
            <GeoLayer
                features={features}
                projection={view.projection}
                idOf={codeOf}
                nameOf={nameOf}
                stepOf={step ? (id) => step(shade?.[id]) : undefined}
                activeId={active}
                onHover={setActive}
            />
            {coast ? <path className="mk-coast" d={coast} /> : null}
        </>}
        table={shade ? <MapTable caption={density ? `${title}: sites per region` : title} head={["Region", what]} rows={ranked.map(([id, v]) => [regionName(id), fmt(v)])} /> : null}
    >
        {cities === false ? null : <CityLabels cities={cities ?? REFERENCE_CITIES[code]} />}
        {children}
    </MapFrame>;
}
