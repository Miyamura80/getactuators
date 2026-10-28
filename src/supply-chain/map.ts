import { SEGMENTS, type Segment } from "./companies";
import type { CountryCode } from "./countries";
import type { SupplyLink } from "./links";
import { activeLinks, companyAnchor, getCompany } from "./registry";
import { SITES, type Site } from "./sites";
import type { Confidence } from "./sourced";

// Map kit data: what the browser maps (frontend/src/components/maps/) and the
// server-rendered fallback (src/server/agent/supply-chain/map-svg.ts) both
// draw. Plain data, no d3, so the browser bundle and the server share it.

// TopoJSON assets under frontend/public/geo/ (see its README for sources).
export const GEO_DIR = "/geo";
export const WORLD_FILE = {
    "110m": "world-110m.json",
    "50m": "world-50m.json",
} as const;
export type WorldResolution = keyof typeof WORLD_FILE;

// Countries with an admin-1 (state / prefecture / province) outline file.
export const ADMIN1_COUNTRIES = ["JP", "CN", "KR", "US"] as const;
export type Admin1Country = (typeof ADMIN1_COUNTRIES)[number];

export function admin1File(code: Admin1Country): string {
    return `${code.toLowerCase()}-admin1.json`;
}

// The world map is Pacific-centred: the atlas is about Japan, China, Korea and
// the US, and centring on 150E keeps all four on one side of the seam.
export const WORLD_VIEW = { width: 960, height: 500, centerLon: 150 } as const;

// Country pages a supply arc can link out to (live once the page ships).
export const COUNTRY_PAGE: Partial<Record<CountryCode, string>> = {
    JP: "/japan",
    CN: "/china",
    KR: "/korea",
    US: "/us",
};

export interface LonLat {
    lon: number;
    lat: number;
}

// Segment identity on every map: a colour tile with the segment's object
// knocked out of it (SEGMENT_PICTO), the /policy "object tile" language, so
// colour is never the only channel. Validated as a categorical set on the
// dark surface (OKLCH L 0.665; CVD-separable with the pictograms as the
// secondary encoding).
export const SEGMENT_COLOR: Record<Segment, string> = {
    "ree-mining-refining": "#e36e13",
    "magnets-motors": "#a577eb",
    "gears-screws-bearings": "#af9100",
    "robot-actuator-oem": "#e06099",
};

// One pictogram per segment on a 24-unit grid, drawn into the tile's middle
// (TILE_MARK): `line` is stroked, `solid` is stroked and filled. Chosen by
// rendering candidates at 14 to 18 px: a pickaxe (mining), a tilted
// horseshoe magnet with solid poles (outline after Lucide's magnet, ISC), a
// six-tooth gear, a humanoid robot.
export const SEGMENT_PICTO: Record<Segment, { line: string; solid?: string }> = {
    "ree-mining-refining": {
        line: "M3.5 21 14 10.5",
        solid: "M7 4.5C13 2 20.5 6 20.5 17 17.5 10.5 13.5 7.5 7 4.5z",
    },
    "magnets-motors": {
        line: "m6 15-4-4 6.75-6.77a7.79 7.79 0 0 1 11 11L13 22l-4-4 6.39-6.36a2.14 2.14 0 0 0-3-3L6 15",
        solid: "M2 11 6 15 9 12 5 8zM13 22 9 18 12 15 16 19z",
    },
    "gears-screws-bearings": {
        line: "M9.07 4.77 9.53 1.49 14.47 1.49 14.93 4.77 16.79 5.85 19.87 4.61 22.34 8.88 19.73 10.93 19.73 13.07 22.34 15.12 19.87 19.39 16.79 18.15 14.93 19.23 14.47 22.51 9.53 22.51 9.07 19.23 7.21 18.15 4.13 19.39 1.66 15.12 4.27 13.07 4.27 10.93 1.66 8.88 4.13 4.61 7.21 5.85zM14.6 12a2.6 2.6 0 1 1-5.2 0 2.6 2.6 0 1 1 5.2 0",
    },
    "robot-actuator-oem": {
        line: "M8.6 10.5H4.5v6M15.4 10.5h4.1v6M10.3 17.5v4.8M13.7 17.5v4.8",
        solid: "M9.3 2h5.4a1.3 1.3 0 0 1 1.3 1.3v3.4A1.3 1.3 0 0 1 14.7 8H9.3A1.3 1.3 0 0 1 8 6.7V3.3A1.3 1.3 0 0 1 9.3 2zM8.6 10h6.8v7.5H8.6z",
    },
};

// Tile geometry both renderers share: a rounded square on the 24 grid, the
// pictogram scaled into its middle, strokes in grid units.
export const TILE_MARK = "translate(3.6 3.6) scale(0.7)";
export const TILE_STROKE = { tile: 1.6, mark: 2.6, dash: "2.4 2" } as const;

// What a group of pins holds, segment by segment in chain order (rare
// earths, magnets & motors, gears & bearings, robot makers).
export interface SegmentCount {
    segment: Segment;
    n: number;
}

export function segmentMix(pins: readonly { segment: Segment }[]): SegmentCount[] {
    return SEGMENTS.map((segment) => ({
        segment,
        n: pins.filter((p) => p.segment === segment).length,
    })).filter((c) => c.n > 0);
}

const SITE_NOUN: Record<Segment, string> = {
    "ree-mining-refining": "rare earth site",
    "magnets-motors": "magnet and motor site",
    "gears-screws-bearings": "gear and bearing site",
    "robot-actuator-oem": "robot maker site",
};

// "3 magnet and motor sites, 1 robot maker site": what a group holds, for
// its accessible name.
export function mixPhrase(mix: readonly SegmentCount[]): string {
    return mix
        .map(({ segment, n }) => `${n} ${SITE_NOUN[segment]}${n === 1 ? "" : "s"}`)
        .join(", ");
}

// Short names for the in-map key, where the full SEGMENT_LABEL wraps.
export const SEGMENT_SHORT: Record<Segment, string> = {
    "ree-mining-refining": "Rare earths",
    "magnets-motors": "Magnets & motors",
    "gears-screws-bearings": "Gears & bearings",
    "robot-actuator-oem": "Robots & actuators",
};

// A few cities per country map for orientation: the capital plus the
// largest metros. Plain geography, drawn faint under the site labels.
export interface RefCity extends LonLat {
    name: string;
    capital?: boolean;
}

export const REFERENCE_CITIES: Record<Admin1Country, readonly RefCity[]> = {
    JP: [
        { name: "Tokyo", lat: 35.6812, lon: 139.7671, capital: true },
        { name: "Osaka", lat: 34.6937, lon: 135.5023 },
        { name: "Nagoya", lat: 35.1815, lon: 136.9066 },
        { name: "Sapporo", lat: 43.0618, lon: 141.3545 },
        { name: "Fukuoka", lat: 33.5904, lon: 130.4017 },
    ],
    CN: [
        { name: "Beijing", lat: 39.9042, lon: 116.4074, capital: true },
        { name: "Shanghai", lat: 31.2304, lon: 121.4737 },
        { name: "Guangzhou", lat: 23.1291, lon: 113.2644 },
        { name: "Chengdu", lat: 30.5728, lon: 104.0668 },
        { name: "Wuhan", lat: 30.5928, lon: 114.3055 },
    ],
    KR: [
        { name: "Seoul", lat: 37.5665, lon: 126.978, capital: true },
        { name: "Busan", lat: 35.1796, lon: 129.0756 },
        { name: "Daegu", lat: 35.8714, lon: 128.6014 },
    ],
    US: [
        { name: "Washington", lat: 38.9072, lon: -77.0369, capital: true },
        { name: "New York", lat: 40.7128, lon: -74.006 },
        { name: "Los Angeles", lat: 34.0522, lon: -118.2437 },
        { name: "Chicago", lat: 41.8781, lon: -87.6298 },
        { name: "Houston", lat: 29.7604, lon: -95.3698 },
    ],
};

// One marker. Tile colour and pictogram encode the segment; `precision` other
// than "site" draws the tile hollow (dashed) because the pin is a city centre, not the
// gate. `company` is the short on-map label, `admin1` names a group of pins
// that share a region.
export interface MapPin extends LonLat {
    id: string;
    label: string;
    company?: string;
    admin1?: string;
    segment: Segment;
    precision: Site["precision"];
    country: CountryCode;
    companyId?: string;
    kind?: Site["kind"];
}

export interface MapArcEnd extends LonLat {
    id: string;
    label: string;
    country: CountryCode;
}

// A great-circle supply arc, seller to buyer.
export interface MapArc {
    id: string;
    from: MapArcEnd;
    to: MapArcEnd;
    label: string;
    confidence: Confidence;
}

// A named region to zoom to: [minLat, minLon, maxLat, maxLon], the same order
// as the country boxes in countries.ts.
export interface NamedCluster {
    id: string;
    label: string;
    bbox: [number, number, number, number];
}

export function sitePin(site: Site): MapPin | null {
    const company = getCompany(site.companyId);
    if (!company) return null;
    return {
        id: site.id,
        label: `${company.name} · ${site.name}`,
        company: company.name,
        admin1: site.admin1,
        segment: company.segment,
        precision: site.precision,
        country: site.country,
        companyId: site.companyId,
        kind: site.kind,
        lon: site.lon,
        lat: site.lat,
    };
}

export function sitePins(sites: readonly Site[] = SITES): MapPin[] {
    return sites.flatMap((s) => sitePin(s) ?? []);
}

function arcEnd(companyId: string): MapArcEnd | null {
    const company = getCompany(companyId);
    const at = companyAnchor(companyId);
    if (!company || !at) return null;
    return {
        id: companyId,
        label: company.name,
        country: at.country,
        lon: at.lon,
        lat: at.lat,
    };
}

// Arcs for current supply links between companies with a mapped site. Ended
// links are history, never drawn as a live flow.
export function supplyArcs(links: readonly SupplyLink[] = activeLinks()): MapArc[] {
    return links.flatMap((l) => {
        const from = arcEnd(l.from);
        const to = arcEnd(l.to);
        if (!from || !to) return [];
        return [
            {
                id: `${l.from}--${l.to}`,
                from,
                to,
                label: l.what,
                confidence: l.confidence,
            },
        ];
    });
}

// Arcs touching a country: domestic ones plus those that leave or arrive.
export function arcsTouching(arcs: readonly MapArc[], code: CountryCode): MapArc[] {
    return arcs.filter((a) => a.from.country === code || a.to.country === code);
}
