import { existsSync, readFileSync } from "node:fs";
import type { Segment } from "@/supply-chain/companies";
import { GEO_DIR, type MapPin, WORLD_FILE, WORLD_VIEW } from "@/supply-chain/map";
import { geoGraticule10, geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import { DIST_DIR } from "../../static";
import { esc } from "../html/head";

// Server-rendered world map for the HTML fallback of map pages: the page has
// a picture before the bundle loads (and without JavaScript). Same
// projection as the browser map (frontend/src/components/maps/projection.ts),
// so nothing jumps when React takes over. Plain fills, no CSS needed.

const LAND = "#121212";
const EDGE = "#383838";
const RAMP = ["#0f1d1c", "#1e3a39", "#325f5d", "#4a8e8b", "#6ac6c2"];
const PIN = "#c3fffd";

// The world outlines, read once: the built copy in production, the source
// copy in a checkout without a frontend build.
let cached: { iso: string; name: string; d: string }[] | null = null;

function topologyText(): string | null {
    for (const dir of [`${DIST_DIR}${GEO_DIR}`, `frontend/public${GEO_DIR}`]) {
        const file = `${dir}/${WORLD_FILE["110m"]}`;
        if (existsSync(file)) return readFileSync(file, "utf8");
    }
    return null;
}

function projection() {
    const { width, height, centerLon } = WORLD_VIEW;
    return geoNaturalEarth1()
        .rotate([-centerLon, 0])
        .fitExtent(
            [
                [4, 4],
                [width - 4, height - 4],
            ],
            { type: "Sphere" },
        );
}

interface CountryProps {
    iso?: string;
    name?: string;
}

function countries(): { iso: string; name: string; d: string }[] {
    if (cached) return cached;
    const text = topologyText();
    if (!text) return [];
    const topo = JSON.parse(text);
    const key = Object.keys(topo.objects)[0] ?? "";
    const fc = feature(topo, topo.objects[key]) as unknown as {
        features: { properties: CountryProps | null }[];
    };
    const path = geoPath(projection());
    cached = fc.features.map((f) => ({
        iso: f.properties?.iso ?? "",
        name: f.properties?.name ?? "",
        d: path(f as Parameters<typeof path>[0]) ?? "",
    }));
    return cached;
}

const SHAPE: Record<Segment, (x: number, y: number) => string> = {
    "ree-mining-refining": (x, y) => `<circle cx="${x}" cy="${y}" r="3.5"/>`,
    "magnets-motors": (x, y) => `<path d="M${x} ${y - 4}l4 4-4 4-4-4z"/>`,
    "gears-screws-bearings": (x, y) =>
        `<rect x="${x - 3.2}" y="${y - 3.2}" width="6.4" height="6.4"/>`,
    "robot-actuator-oem": (x, y) => `<path d="M${x} ${y - 4}l4 7.5h-8z"/>`,
};

function step(v: number | undefined, max: number): number {
    if (!v || v <= 0 || max <= 0) return 0;
    return Math.min(RAMP.length, Math.ceil((v / max) * RAMP.length));
}

export interface WorldMapSvgOptions {
    label: string;
    // Choropleth value per ISO alpha-2 code.
    values?: Partial<Record<string, number>>;
    max?: number;
    pins?: readonly MapPin[];
}

// A static <svg> of the world, shaded by `values`, with segment-shaped pins.
// Empty string when the outlines are missing.
export function worldMapSvg({
    label,
    values = {},
    max,
    pins = [],
}: WorldMapSvgOptions): string {
    const shapes = countries();
    if (!shapes.length) return "";
    const { width, height } = WORLD_VIEW;
    const proj = projection();
    const path = geoPath(proj);
    const top = max ?? Math.max(0, ...Object.values(values).map((v) => v ?? 0));
    const land = shapes
        .map((c) => {
            const s = step(values[c.iso], top);
            return `<path d="${c.d}" fill="${s ? RAMP[s - 1] : LAND}"><title>${esc(c.name)}</title></path>`;
        })
        .join("");
    const marks = pins
        .map((p) => {
            const at = proj([p.lon, p.lat]);
            if (!at) return "";
            const [x, y] = at.map((n) => Math.round(n * 10) / 10) as [number, number];
            const hollow = p.precision !== "site";
            return `<g fill="${hollow ? "#000" : PIN}">${SHAPE[p.segment](x, y)}<title>${esc(p.label)}</title></g>`;
        })
        .join("");
    return `<figure class="ga-map" style="margin:16px 0"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(label)}" style="width:100%;height:auto;display:block;background:#000;border:1px solid #242424"><path d="${path({ type: "Sphere" })}" fill="#050505" stroke="#242424"/><path d="${path(geoGraticule10())}" fill="none" stroke="#161616"/><g stroke="${EDGE}" stroke-width="0.5">${land}</g><g stroke="${PIN}" stroke-width="1">${marks}</g></svg></figure>`;
}
