import { describe, expect, test } from "bun:test";
import { type EdgeChip, spreadChips } from "../src/components/maps/arc-geometry";
import { placeTag, type PxRect, tagSize } from "../src/components/maps/cluster";

const rectOf = (c: EdgeChip, at: [number, number]): PxRect => [at[0] - c.w / 2, at[1] - c.h / 2, at[0] + c.w / 2, at[1] + c.h / 2];
const overlap = (a: PxRect, b: PxRect) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];

function noneOverlap(chips: EdgeChip[], at: Map<string, [number, number]>) {
    const rects = chips.map((c) => rectOf(c, at.get(c.key) as [number, number]));
    for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) expect(overlap(rects[i] as PxRect, rects[j] as PxRect)).toBe(false);
    }
    return rects;
}

describe("spreadChips", () => {
    test("slides chips that exit close together apart along their edge", () => {
        const chips: EdgeChip[] = [
            { key: "cn", at: [160, 35], w: 71, h: 20 },
            { key: "kr", at: [210, 31], w: 60, h: 20 },
            { key: "jp", at: [190, 0], w: 60, h: 20 },
        ];
        const rects = noneOverlap(chips, spreadChips(chips, 1000, 600));
        for (const r of rects) expect(r[1]).toBeGreaterThanOrEqual(0);
    });

    test("wraps into a second row when one edge cannot hold them all", () => {
        const chips: EdgeChip[] = Array.from({ length: 8 }, (_, i) => ({ key: `c${i}`, at: [40 + i * 10, 0] as [number, number], w: 64, h: 20 }));
        const at = spreadChips(chips, 390, 400);
        const rects = noneOverlap(chips, at);
        for (const r of rects) {
            expect(r[0]).toBeGreaterThanOrEqual(0);
            expect(r[2]).toBeLessThanOrEqual(390);
        }
        expect(new Set(rects.map((r) => Math.round(r[1]))).size).toBe(2);
    });

    test("on a short frame, rows from the top never reach the bottom chips", () => {
        // Eight top chips would need a second row, which on a 60 px frame
        // would land on the bottom chips.
        const top: EdgeChip[] = Array.from({ length: 8 }, (_, i) => ({ key: `t${i}`, at: [40 + i * 10, 0] as [number, number], w: 64, h: 20 }));
        const bottom: EdgeChip[] = [
            { key: "b0", at: [60, 60], w: 64, h: 20 },
            { key: "b1", at: [300, 60], w: 64, h: 20 },
        ];
        const at = spreadChips([...top, ...bottom], 400, 60);
        const rect = (c: EdgeChip) => rectOf(c, at.get(c.key) as [number, number]);
        for (const t of top) {
            expect(rect(t)[1]).toBeGreaterThanOrEqual(0);
            for (const b of bottom) expect(overlap(rect(t), rect(b))).toBe(false);
        }
    });

    test("a side chip drops below a top chip in its corner", () => {
        // "side" leaves by the right edge (x = 1000) near the top-right
        // corner, where "top" leaves by the top edge: once clamped into the
        // frame they would sit on each other.
        const chips: EdgeChip[] = [
            { key: "top", at: [960, 0], w: 60, h: 20 },
            { key: "side", at: [1000, 15], w: 60, h: 20 },
        ];
        const at = spreadChips(chips, 1000, 600);
        const [top, side] = noneOverlap(chips, at) as [PxRect, PxRect];
        expect(side[1]).toBeGreaterThanOrEqual(top[3]);
        // The side chip stays on its edge.
        expect(side[2]).toBeGreaterThan(990);
    });

    test("rows fit when chips differ in width", () => {
        // Total width fits two rows, but a round-robin split of these widths
        // would overflow one of them.
        const widths = [150, 30, 150, 30, 150];
        const chips: EdgeChip[] = widths.map((w, i) => ({ key: `c${i}`, at: [20 + i * 5, 0] as [number, number], w, h: 20 }));
        const rects = noneOverlap(chips, spreadChips(chips, 400, 300));
        for (const r of rects) {
            expect(r[0]).toBeGreaterThanOrEqual(0);
            expect(r[2]).toBeLessThanOrEqual(400);
        }
    });
});

describe("placeTag", () => {
    const size = tagSize("Southwest rare earths");

    test("sits above the box's left corner when free", () => {
        const tag = placeTag([200, 200, 400, 400], size, 1000, 600, []) as PxRect;
        expect(tag[0]).toBe(200);
        expect(tag[3]).toBeLessThanOrEqual(200);
    });

    test("moves to another corner, or gives up, rather than cover a marker", () => {
        const marker: PxRect = [190, 170, 260, 198];
        const tag = placeTag([200, 200, 400, 400], size, 1000, 600, [marker]) as PxRect;
        expect(overlap(tag, marker)).toBe(false);
        const all: PxRect = [0, 0, 1000, 600];
        expect(placeTag([200, 200, 400, 400], size, 1000, 600, [all])).toBeNull();
    });
});
