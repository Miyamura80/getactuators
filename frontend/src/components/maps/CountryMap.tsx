import { type ReactNode, useMemo, useState } from "react";
import { countryName } from "../../../../src/country-flag";
import { type Admin1Country, admin1File } from "../../../../src/supply-chain/map";
import { ChoroplethLegend, choroplethScale, type ValueMap } from "./choropleth";
import { type GeoFeature, type MapTopology, topoFeatures, useTopology } from "./geo";
import { GeoLayer } from "./GeoLayer";
import { MapFrame } from "./MapFrame";
import { MapTable } from "./MapTable";
import { countryView } from "./projection";

export interface CountryMapProps {
    code: Admin1Country;
    label?: string;
    // Optional choropleth per ISO 3166-2 region code ("JP-20").
    values?: ValueMap;
    format?: (v: number) => string;
    valueLabel?: string;
    topology?: MapTopology;
    toggle?: ReactNode;
    // Pins, Arcs, ClusterZoom.
    children?: ReactNode;
}

const codeOf = (f: GeoFeature) => f.properties?.code ?? "";
const nameOf = (f: GeoFeature) => f.properties?.name ?? codeOf(f);
const defaultFormat = (v: number) => v.toLocaleString("en-US");

// One country's admin-1 outlines (prefectures, provinces, states), fitted to
// its bounds. Holds its frame until the outlines load, then fits.
export function CountryMap({ code, label, values, format = defaultFormat, valueLabel = "Value", topology, toggle, children }: CountryMapProps) {
    const topo = useTopology(admin1File(code), topology);
    const features = useMemo(() => (topo ? topoFeatures(topo) : []), [topo]);
    const view = useMemo(() => (features.length ? countryView(code, features) : null), [code, features]);
    const [active, setActive] = useState<string | null>(null);
    const step = useMemo(() => (values ? choroplethScale(values) : undefined), [values]);
    const name = countryName(code);
    const title = label ?? `${name} by region`;
    if (!view) return <figure className="mk-map is-loading" aria-label={title}><div className="mk-stage" style={{ aspectRatio: "4 / 3" }} /></figure>;
    const regionName = (id: string) => nameOf(features.find((f) => codeOf(f) === id) ?? ({ properties: { code: id } } as GeoFeature));
    const ranked = Object.entries(values ?? {}).filter((e): e is [string, number] => typeof e[1] === "number").sort((a, b) => b[1] - a[1]);
    return <MapFrame
        view={view}
        label={title}
        toggle={toggle}
        readout={active ? <>
            <span className="mk-readout-name">{regionName(active)}</span>
            {values?.[active] !== undefined ? <b>{format(values[active] as number)}</b> : null}
        </> : null}
        legend={values && ranked[0] ? <ChoroplethLegend label={valueLabel} min={format(0)} max={format(ranked[0][1])} /> : null}
        base={<GeoLayer
            features={features}
            projection={view.projection}
            idOf={codeOf}
            nameOf={nameOf}
            stepOf={step ? (id) => step(values?.[id]) : undefined}
            activeId={active}
            onHover={setActive}
        />}
        table={values ? <MapTable caption={title} head={["Region", valueLabel]} rows={ranked.map(([id, v]) => [regionName(id), format(v)])} /> : null}
    >
        {children}
    </MapFrame>;
}
