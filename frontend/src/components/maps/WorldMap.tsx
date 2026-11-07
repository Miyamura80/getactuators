import { type ReactNode, useMemo, useState } from "react";
import { geoGraticule10, geoPath } from "d3-geo";
import { countryName } from "../../../../src/country-flag";
import { WORLD_FILE, type WorldResolution } from "../../../../src/supply-chain/map";
import { Flag } from "../Flag";
import { ChoroplethLegend, choroplethScale, type ValueMap } from "./choropleth";
import { type GeoFeature, type MapTopology, topoFeatures, useTopology } from "./geo";
import { GeoLayer } from "./GeoLayer";
import { MapFrame } from "./MapFrame";
import { MapTable } from "./MapTable";
import { worldView } from "./projection";

export interface WorldMapProps {
    label: string;
    // Choropleth value per ISO alpha-2 code.
    values?: ValueMap;
    // Top of the colour scale; defaults to the largest value (pass the same
    // max to several maps to compare them on one scale).
    max?: number;
    format?: (v: number) => string;
    // Names the value in the legend, readout and hidden table.
    valueLabel?: string;
    resolution?: WorldResolution;
    topology?: MapTopology;
    // Slot for a stage toggle (top left of the map).
    toggle?: ReactNode;
    selectedCountry?: string | null;
    onSelectCountry?: (iso: string) => void;
    // Pins, Arcs, ClusterZoom.
    children?: ReactNode;
}

const isoOf = (f: GeoFeature) => f.properties?.iso ?? "";
const nameOf = (f: GeoFeature) => f.properties?.name ?? countryName(isoOf(f));
const defaultFormat = (v: number) => v.toLocaleString("en-US");

// World choropleth, Pacific centred, with a faint graticule.
export function WorldMap({ label, values, max, format = defaultFormat, valueLabel = "Value", resolution = "110m", topology, toggle, selectedCountry, onSelectCountry, children }: WorldMapProps) {
    const topo = useTopology(WORLD_FILE[resolution], topology);
    const features = useMemo(() => (topo ? topoFeatures(topo) : []), [topo]);
    const view = useMemo(() => worldView(), []);
    const graticule = useMemo(() => geoPath(view.projection)(geoGraticule10()) ?? "", [view]);
    const sphere = useMemo(() => geoPath(view.projection)({ type: "Sphere" }) ?? "", [view]);
    const [active, setActive] = useState<string | null>(null);
    const step = useMemo(() => (values ? choroplethScale(values, max) : undefined), [values, max]);
    const ranked = useMemo(() => Object.entries(values ?? {})
        .filter((e): e is [string, number] => typeof e[1] === "number")
        .sort((a, b) => b[1] - a[1]), [values]);
    const top = max ?? ranked[0]?.[1];
    const shown = active ?? selectedCountry ?? null;
    const readout = shown ? <>
        <Flag code={shown} decorative />
        <span className="mk-readout-name">{countryName(shown)}</span>
        {values?.[shown] !== undefined ? <b>{format(values[shown] as number)}</b> : null}
    </> : null;
    return <MapFrame
        view={view}
        label={label}
        toggle={toggle}
        readout={readout}
        legend={values && top ? <ChoroplethLegend label={valueLabel} min={format(0)} max={format(top)} /> : null}
        base={<>
            <path className="mk-sphere" d={sphere} />
            <path className="mk-graticule" d={graticule} />
            <GeoLayer
                features={features}
                projection={view.projection}
                idOf={isoOf}
                nameOf={nameOf}
                stepOf={step ? (id) => step(values?.[id]) : undefined}
                activeId={active}
                selectedId={selectedCountry}
                selectable={(id) => values?.[id] !== undefined}
                onSelect={onSelectCountry}
                onHover={setActive}
            />
        </>}
        table={values ? <MapTable
            caption={label}
            head={["Country", valueLabel]}
            rows={ranked.map(([iso, v]) => [countryName(iso), format(v)])}
        /> : null}
    >
        {children}
    </MapFrame>;
}
