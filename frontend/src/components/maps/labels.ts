import type { Point } from "./map-context";

// Pure label placement for the map kit. Overlays hand in candidates (a marker
// at a screen point plus the text beside it); higher priority places first,
// trying right, left, above and below the marker, and a label that would hit
// a marker, another label, a reserved HUD corner or the frame edge is
// dropped. The marker always stays; only its text yields.

export type LabelTone = "cluster" | "site" | "city";

export interface LabelItem {
    id: string;
    // Screen viewBox units (after zoom), like every overlay.
    at: Point;
    // "" registers the marker as an obstacle without a label.
    text: string;
    priority: number;
    tone: LabelTone;
    // Half-width of the marker in CSS pixels: an obstacle for every label.
    r: number;
    // Half-height, when the marker is not square (a group's tile block).
    ry?: number;
    // City dots are drawn by the label layer itself.
    dot?: "city" | "capital";
}

export type Side = "right" | "left" | "top" | "bottom";

export interface PlacedLabel {
    item: LabelItem;
    side: Side;
}

// [x0, y0, x1, y1] in CSS pixels.
export type Rect = [number, number, number, number];

// Approximate advance per character in CSS pixels for each tone's font (see
// .mk-label in maps.css); the label box is padded so estimates err wide.
const CHAR_PX: Record<LabelTone, number> = { cluster: 6.9, site: 6.1, city: 6.4 };
const LABEL_H: Record<LabelTone, number> = { cluster: 16, site: 14, city: 12 };
const GAP = 3;
const SIDES: Side[] = ["right", "left", "top", "bottom"];

export function labelSize(item: LabelItem): [number, number] {
    return [Math.ceil(item.text.length * CHAR_PX[item.tone]) + 8, LABEL_H[item.tone]];
}

// Where a label's box sits beside its marker, in CSS pixels from the marker
// centre: [left, top] offsets for each side.
export function labelOffset(item: LabelItem, side: Side): Point {
    const [w, h] = labelSize(item);
    const rx = item.r + GAP;
    const ry = (item.ry ?? item.r) + GAP;
    if (side === "right") return [rx, -h / 2];
    if (side === "left") return [-rx - w, -h / 2];
    if (side === "top") return [-w / 2, -ry - h];
    return [-w / 2, ry];
}

function rectFor(at: Point, item: LabelItem, side: Side): Rect {
    const [w, h] = labelSize(item);
    const [dx, dy] = labelOffset(item, side);
    return [at[0] + dx, at[1] + dy, at[0] + dx + w, at[1] + dy + h];
}

const hits = (a: Rect, b: Rect) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];

// `scale` is CSS pixels per viewBox unit; `reserved` are HUD boxes in pixels.
export function placeLabels(items: readonly LabelItem[], width: number, height: number, scale: number, reserved: readonly Rect[] = []): PlacedLabel[] {
    const W = width * scale;
    const H = height * scale;
    const px = (p: Point): Point => [p[0] * scale, p[1] * scale];
    const markers: Rect[] = items.map((i) => {
        const [x, y] = px(i.at);
        const ry = i.ry ?? i.r;
        return [x - i.r, y - ry, x + i.r, y + ry];
    });
    const taken: Rect[] = [...reserved];
    const out: PlacedLabel[] = [];
    const order = items.map((item, i) => ({ item, i })).sort((a, b) => b.item.priority - a.item.priority || a.i - b.i);
    for (const { item, i } of order) {
        // An empty text is a marker that only keeps others' labels off it.
        if (!item.text) continue;
        const at = px(item.at);
        if (at[0] < 0 || at[0] > W || at[1] < 0 || at[1] > H) continue;
        for (const side of SIDES) {
            const rect = rectFor(at, item, side);
            if (rect[0] < 2 || rect[1] < 2 || rect[2] > W - 2 || rect[3] > H - 2) continue;
            if (taken.some((t) => hits(t, rect))) continue;
            if (markers.some((m, j) => j !== i && hits(m, rect))) continue;
            taken.push(rect);
            out.push({ item, side });
            break;
        }
    }
    return out;
}
