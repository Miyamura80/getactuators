import type { Segment } from "./companies";
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

// One marker. Shape encodes the segment; `precision` other than "site" draws
// the marker hollow because the pin is a city centre, not the gate.
export interface MapPin extends LonLat {
    id: string;
    label: string;
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
