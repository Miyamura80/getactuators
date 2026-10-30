import { existsSync, readFileSync } from "node:fs";
import type { Segment } from "@/supply-chain/companies";
import {
    GEO_DIR,
    type MapPin,
    SEGMENT_COLOR,
    SEGMENT_PICTO,
    TILE_MARK,
    TILE_STROKE,
    WORLD_FILE,
    WORLD_VIEW,
    mixPhrase,
    segmentMix,
} from "@/supply-chain/map";
import {
    MIX_GAP,
    MIX_PAD,
    type XY,
    countWidth,
    groupPoints,
    mergeOverlapping,
    mixColumns,
    mixSize,
} from "@/supply-chain/map-groups";
import { geoGraticule10, geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import { DIST_DIR } from "../../static";
import { esc } from "../html/head";

// Server-rendered world map for the HTML fallback of map pages: the page has
// a picture before the bundle loads (and without JavaScript). Same
// projection as the browser map (frontend/src/components/maps/projection.ts),
// so nothing jumps when React takes over, and the same markers: segment
// tiles, overlapping pins grouped into a block of the segments they hold.
// Plain fills, no CSS needed.

const LAND = "#121212";
const EDGE = "#383838";
const RAMP = ["#0f1d1c", "#1e3a39", "#325f5d", "#4a8e8b", "#6ac6c2"];

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

// Tile edge in viewBox units (about the browser map's 16 px pins at the
// width this map usually renders).
const TILE = 12;

// The browser map's segment tile (SegmentTile.tsx) as plain SVG: a colour
// tile with the segment's object knocked out in black, or, hollow, a dashed
// outline with the object in the colour. Explicit fills, no CSS needed.
function segmentTileSvg(
    segment: Segment,
    x: number,
    y: number,
    hollow: boolean,
    title: string,
): string {
    const c = SEGMENT_COLOR[segment];
    const ink = hollow ? c : "#000";
    const { line, solid, cut } = SEGMENT_PICTO[segment];
    const at = `translate(${round(x - TILE / 2)} ${round(y - TILE / 2)}) scale(${TILE / 24})`;
    const dash = hollow ? ` stroke-dasharray="${TILE_STROKE.dash}"` : "";
    const named = title ? `<title>${esc(title)}</title>` : "";
    return `<g transform="${at}">${named}<rect x="1" y="1" width="22" height="22" rx="5" fill="${hollow ? "#000" : c}" stroke="${c}" stroke-width="${TILE_STROKE.tile}"${dash}/><g transform="${TILE_MARK}" fill="none" stroke="${ink}" stroke-width="${TILE_STROKE.mark}" stroke-linecap="round" stroke-linejoin="round"><path d="${line}"/>${solid ? `<path d="${solid}" fill="${ink}"/>` : ""}${cut ? `<path d="${cut}" fill="${hollow ? "#000" : c}" stroke="none"/>` : ""}</g></g>`;
}

const round = (n: number) => Math.round(n * 10) / 10;

// A group of overlapping pins as the browser draws it at rest: a black block
// holding one tile per segment present, each with its count when above one.
function groupSvg(members: readonly MapPin[], [x, y]: XY): string {
    const mix = segmentMix(members);
    const cols = mixColumns(mix);
    const [w, h] = mixSize(mix, TILE);
    const widths = Array.from({ length: cols }, (_, c) =>
        Math.max(
            ...mix
                .filter((_, i) => i % cols === c)
                .map((m) => TILE + countWidth(m.n, TILE)),
        ),
    );
    const left = x - w / 2;
    const top = y - h / 2;
    const cells = mix
        .map(({ segment, n }, i) => {
            const col = i % cols;
            const cx =
                left +
                1 +
                MIX_PAD +
                widths.slice(0, col).reduce((s, v) => s + v, 0) +
                col * MIX_GAP;
            const cy = top + 1 + MIX_PAD + Math.floor(i / cols) * (TILE + MIX_GAP);
            const count =
                n > 1
                    ? `<text x="${round(cx + TILE + 0.5)}" y="${round(cy + TILE - 0.5)}" font-family="monospace" font-size="7.5" font-weight="600" fill="#f9f9f9">${n}</text>`
                    : "";
            return `${segmentTileSvg(segment, cx + TILE / 2, cy + TILE / 2, false, "")}${count}`;
        })
        .join("");
    const title = `${mixPhrase(mix)}: ${members.map((m) => m.label).join("; ")}`;
    return `<g><title>${esc(title)}</title><rect x="${round(left)}" y="${round(top)}" width="${round(w)}" height="${round(h)}" fill="#000" stroke="#383838"/>${cells}</g>`;
}

// Pins that would overlap group, as on the browser map (map-groups.ts);
// lone pins draw as their segment tile.
function pinMarks(pins: readonly MapPin[], project: (p: MapPin) => XY | null): string {
    const placed = pins.flatMap((p) => {
        const at = project(p);
        return at ? [{ id: p.id, at }] : [];
    });
    const byId = new Map(pins.map((p) => [p.id, p]));
    const members = (ids: readonly string[]) => ids.flatMap((id) => byId.get(id) ?? []);
    const sizeOf = (ids: readonly string[]): XY =>
        ids.length === 1
            ? [TILE + 1, TILE + 1]
            : mixSize(segmentMix(members(ids)), TILE);
    const groups = mergeOverlapping(
        groupPoints(placed, TILE),
        new Map(placed.map((p) => [p.id, p.at])),
        sizeOf,
        1,
    );
    return groups
        .map((g) => {
            const [one] = g.ids;
            const p = g.ids.length === 1 && one ? byId.get(one) : undefined;
            return p
                ? segmentTileSvg(
                      p.segment,
                      g.at[0],
                      g.at[1],
                      p.precision !== "site",
                      p.label,
                  )
                : groupSvg(members(g.ids), g.at);
        })
        .join("");
}

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
    const marks = pinMarks(pins, (p) => proj([p.lon, p.lat]));
    return `<figure class="ga-map" style="margin:16px 0"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(label)}" style="width:100%;height:auto;display:block;background:#000;border:1px solid #242424"><path d="${path({ type: "Sphere" })}" fill="#050505" stroke="#242424"/><path d="${path(geoGraticule10())}" fill="none" stroke="#161616"/><g stroke="${EDGE}" stroke-width="0.5">${land}</g><g stroke-width="1">${marks}</g></svg></figure>`;
}
