import { describe, expect, test } from "bun:test";
import { Box3, InstancedMesh, Mesh, MeshBasicMaterial } from "three";
import { DEMO_SCENES, MAGNET_PRESS_LOOP } from "../../src/supply-chain/scenes/demos";
import { partExtent, pitchRadius } from "../../src/supply-chain/scenes/motion";
import { PART_KINDS, type PartShape } from "../../src/supply-chain/scenes/spec";
import { buildPart, planetaryPose } from "../src/three/parts";
import { edgeLines, gearPoints } from "../src/three/parts/geometry";
import { cycloidPoints } from "../src/three/parts/drives";

// Geometry builds without a WebGL context, so the whole part library is
// checked here: every kind, every demo part.

const shapes: PartShape[] = [
    ...DEMO_SCENES.flatMap((s) => s.parts),
    ...MAGNET_PRESS_LOOP.actors,
    { component: "spur-gear", props: { teeth: 18, module: 1, width: 5, bore: 3 } },
    { component: "spur-gear", props: { teeth: 48, module: 1, width: 5, internal: true } },
    {
        component: "cycloid-disc",
        props: { lobes: 11, radius: 30, eccentricity: 1.2, pinRadius: 2, thickness: 6, holes: 6, pins: true },
    },
    { component: "ball-screw", props: { diameter: 12, length: 120, lead: 4, nutLength: 30 } },
    { component: "bearing", props: { kind: "deep-groove", outer: 20, inner: 10, width: 6 } },
    { component: "bearing", props: { kind: "needle", outer: 20, inner: 14, width: 10 } },
    { component: "pcb", props: { shape: "rect", width: 40, height: 30, chips: 4 } },
    { component: "housing", props: { profile: "flange", outer: 30, length: 40, wall: 2 } },
    {
        component: "roller-screw",
        props: { screwDiameter: 14, length: 120, lead: 5, rollers: 10, rollerDiameter: 4.6, rollerLength: 24 },
    },
];

function bounds(shape: PartShape): Box3 {
    const box = new Box3();
    const material = new MeshBasicMaterial();
    for (const piece of buildPart(shape)) {
        if (piece.tone === "lines") continue;
        const obj = piece.matrices
            ? new InstancedMesh(piece.geometry, material, piece.matrices.length)
            : new Mesh(piece.geometry, material);
        if (obj instanceof InstancedMesh) piece.matrices?.forEach((m, i) => obj.setMatrixAt(i, m));
        obj.updateMatrixWorld();
        if (obj instanceof InstancedMesh) {
            obj.computeBoundingBox();
            if (obj.boundingBox) box.union(obj.boundingBox);
        } else {
            box.expandByObject(obj);
        }
    }
    return box;
}

describe("part library", () => {
    test("covers every part kind", () => {
        const kinds = new Set(shapes.map((s) => s.component));
        expect([...PART_KINDS].filter((k) => !kinds.has(k))).toEqual([]);
    });

    test("every shape builds finite geometry with edges", () => {
        for (const shape of shapes) {
            const pieces = buildPart(shape);
            expect(pieces.length).toBeGreaterThan(0);
            for (const p of pieces) {
                const pos = p.geometry.getAttribute("position");
                expect(pos.count).toBeGreaterThan(0);
                expect([...(pos.array as Float32Array)].every(Number.isFinite)).toBe(true);
            }
            expect(pieces.some((p) => edgeLines(p) !== null)).toBe(true);
        }
    });

    test("geometry stays inside the extent the camera frames", () => {
        for (const shape of shapes) {
            const box = bounds(shape);
            const { r, h } = partExtent(shape);
            const radial = Math.max(...[box.min.x, box.max.x, box.min.y, box.max.y].map(Math.abs));
            expect({ kind: shape.component, over: radial > r * 1.08 + 0.5 }).toEqual({ kind: shape.component, over: false });
            expect({ kind: shape.component, over: Math.max(-box.min.z, box.max.z) > h * 1.6 + 2 }).toEqual({
                kind: shape.component,
                over: false,
            });
        }
    });

    test("repeated parts are instanced, one geometry per repeat", () => {
        const rotor = buildPart({ component: "magnet-ring", props: { poles: 42, outer: 46, inner: 36, length: 16 } });
        const instanced = rotor.filter((p) => p.matrices);
        expect(instanced.reduce((n, p) => n + (p.matrices?.length ?? 0), 0)).toBe(42);
        // Edge lines for all 42 segments are merged into one geometry each.
        expect(instanced.map((p) => edgeLines(p)).every((g) => g !== null)).toBe(true);
    });

    test("gear outlines put tips and roots either side of the pitch circle", () => {
        const radii = gearPoints(20, 2).map((v) => v.length());
        expect(Math.max(...radii)).toBeCloseTo(pitchRadius(20, 2) + 2);
        expect(Math.min(...radii)).toBeCloseTo(pitchRadius(20, 2) - 2.5);
        const inner = gearPoints(48, 1, true).map((v) => v.length());
        expect(Math.min(...inner)).toBeCloseTo(23);
    });

    test("a cycloid disc has one lobe fewer than its pins", () => {
        const pts = cycloidPoints({ lobes: 11, radius: 30, eccentricity: 1.2, pinRadius: 2, thickness: 6 }, 2200);
        const r = pts.map((p) => p.length());
        let peaks = 0;
        for (let i = 0; i < r.length; i++) {
            const a = r[(i - 1 + r.length) % r.length] as number;
            const b = r[i] as number;
            const c = r[(i + 1) % r.length] as number;
            if (b > a && b >= c) peaks++;
        }
        expect(peaks).toBe(11);
    });

    test("planetary stage: ratio 1 + ring/sun, ring fixed at any input angle", () => {
        const stage = { sunTeeth: 12, planetTeeth: 24, planets: 3, module: 1, width: 8 };
        const p = planetaryPose(stage, 1.2);
        expect(p.carrier).toBeCloseTo(1.2 / (1 + 60 / 12));
        const ring = (phase: number) => {
            const r = planetaryPose(stage, phase).ring;
            const pitch = (Math.PI * 2) / 60;
            return ((r % pitch) + pitch) % pitch;
        };
        expect(ring(0.7)).toBeCloseTo(ring(0));
        expect(ring(2.3)).toBeCloseTo(ring(0));
        expect(p.planets.map((x) => x.theta)).toHaveLength(3);
    });
});
