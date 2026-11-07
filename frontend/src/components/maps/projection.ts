import {
    geoAlbersUsa,
    geoConicEqualArea,
    geoMercator,
    geoNaturalEarth1,
    geoPath,
    type GeoProjection,
} from "d3-geo";
import { type Admin1Country, WORLD_VIEW } from "../../../../src/supply-chain/map";
import { collection, type GeoFeature } from "./geo";

// Projections for the map kit. The world map is Natural Earth, Pacific
// centred; country maps are fitted to their admin-1 outlines: Albers USA
// (with the Alaska and Hawaii insets), an equal-area conic for China and
// Mercator for Japan and Korea, where it matches the maps people know.

export interface MapView {
    projection: GeoProjection;
    width: number;
    height: number;
}

// Fitted to the whole sphere, so it is known before any outline loads and
// matches the server-rendered fallback exactly.
export function worldView(): MapView {
    const { width, height, centerLon } = WORLD_VIEW;
    const projection = geoNaturalEarth1()
        .rotate([-centerLon, 0])
        .fitExtent([[4, 4], [width - 4, height - 4]], { type: "Sphere" });
    return { projection, width, height };
}

const COUNTRY_WIDTH = 800;
const PAD = 16;

function baseProjection(code: Admin1Country): GeoProjection {
    if (code === "US") return geoAlbersUsa();
    if (code === "CN") return geoConicEqualArea().parallels([25, 47]).rotate([-105, 0]);
    return geoMercator();
}

// Fitted to the outlines, with the height following the country's shape
// (clamped so a tall country still fits a screen).
export function countryView(code: Admin1Country, features: GeoFeature[]): MapView {
    const fc = collection(features);
    const probe = baseProjection(code).fitWidth(COUNTRY_WIDTH - 2 * PAD, fc);
    const [[, y0], [, y1]] = geoPath(probe).bounds(fc);
    const height = Math.round(Math.min(640, Math.max(420, y1 - y0 + 2 * PAD)));
    const projection = baseProjection(code).fitExtent(
        [[PAD, PAD], [COUNTRY_WIDTH - PAD, height - PAD]],
        fc,
    );
    return { projection, width: COUNTRY_WIDTH, height };
}
