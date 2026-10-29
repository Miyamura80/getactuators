import type { SegmentCount } from "./map";

// Pure geometry for grouping map markers, shared by the browser maps
// (frontend/src/components/maps/ClusterZoom.tsx) and the server-rendered
// fallback (src/server/agent/supply-chain/map-svg.ts): which markers would
// overlap on screen, and how big a group marker (a block of segment tiles)
// is.

export type XY = [number, number];

export interface Placed {
    id: string;
    at: XY;
}

export interface PinGroup {
    ids: string[];
    at: XY;
}

const mean = (pts: readonly XY[]): XY => [
    pts.reduce((s, p) => s + p[0], 0) / pts.length,
    pts.reduce((s, p) => s + p[1], 0) / pts.length,
];

// Greedy grouping: each ungrouped point seeds a group and takes every other
// ungrouped point within `radius` (screen units) of the seed. Order-stable.
export function groupPoints(points: readonly Placed[], radius: number): PinGroup[] {
    const left = [...points];
    const groups: PinGroup[] = [];
    while (left.length) {
        const seed = left.shift() as Placed;
        const members = [seed];
        for (let i = left.length - 1; i >= 0; i--) {
            const p = left[i] as Placed;
            if (Math.hypot(p.at[0] - seed.at[0], p.at[1] - seed.at[1]) <= radius) {
                members.push(p);
                left.splice(i, 1);
            }
        }
        groups.push({
            ids: members.map((m) => m.id),
            at: mean(members.map((m) => m.at)),
        });
    }
    return groups;
}

// Group markers are as big as what they hold, so two groups, or a group and
// a lone pin, can overlap although their seeds were apart. Merge any two
// whose marker boxes (`sizeOf`, [w, h] in the same units as `at`) come
// within `gap`, until none do. Order-stable.
export function mergeOverlapping(
    groups: readonly PinGroup[],
    points: ReadonlyMap<string, XY>,
    sizeOf: (ids: readonly string[]) => XY,
    gap = 0,
): PinGroup[] {
    const out = [...groups];
    const near = (a: PinGroup, b: PinGroup) => {
        const [aw, ah] = sizeOf(a.ids);
        const [bw, bh] = sizeOf(b.ids);
        return (
            Math.abs(a.at[0] - b.at[0]) < (aw + bw) / 2 + gap &&
            Math.abs(a.at[1] - b.at[1]) < (ah + bh) / 2 + gap
        );
    };
    for (let i = 0; i < out.length; i++) {
        for (let j = i + 1; j < out.length; j++) {
            if (!near(out[i] as PinGroup, out[j] as PinGroup)) continue;
            const ids = [...(out[i] as PinGroup).ids, ...(out[j] as PinGroup).ids];
            out[i] = {
                ids,
                at: mean(ids.map((id) => points.get(id)).filter((p): p is XY => !!p)),
            };
            out.splice(j, 1);
            // The merged group may now reach one already passed: start over.
            i = -1;
            break;
        }
    }
    return out;
}

// A group marker's tile block: two segments in a row, three or four in a
// 2 x 2 block, each tile followed by its site count when more than one.
export type MixLayout = "block" | "row";
export const MIX_GAP = 2;
export const MIX_PAD = 2;
// Advance of one count digit relative to the tile edge (10 px mono beside
// a 16 px tile).
const COUNT_CHAR = 6.2 / 16;

export function mixColumns(
    mix: readonly SegmentCount[],
    layout: MixLayout = "block",
): number {
    return layout === "row" || mix.length <= 2 ? mix.length : 2;
}

// Width of a tile's count beside it, for a tile `size` wide.
export function countWidth(n: number, size: number): number {
    return n > 1 ? Math.ceil(String(n).length * COUNT_CHAR * size) + 1 : 0;
}

// Outer [width, height] of a group marker (padding and 1 px border
// included): each column as wide as its widest cell.
export function mixSize(
    mix: readonly SegmentCount[],
    size = 16,
    layout: MixLayout = "block",
): XY {
    const cols = mixColumns(mix, layout);
    const rows = Math.ceil(mix.length / Math.max(1, cols));
    const widths = Array.from({ length: cols }, (_, c) =>
        Math.max(
            ...mix
                .filter((_, i) => i % cols === c)
                .map((m) => size + countWidth(m.n, size)),
        ),
    );
    const w = widths.reduce((s, x) => s + x, 0) + (cols - 1) * MIX_GAP;
    return [w + 2 * MIX_PAD + 2, rows * size + (rows - 1) * MIX_GAP + 2 * MIX_PAD + 2];
}
