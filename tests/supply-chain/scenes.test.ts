import { describe, expect, test } from "bun:test";
import { loopProblems, sceneProblems } from "@/supply-chain/scenes/check";
import { DEMO_SCENES, MAGNET_PRESS_LOOP, QDD_JOINT } from "@/supply-chain/scenes/demos";
import {
    activeStep,
    easeInOutCubic,
    explodedPosition,
    loopPhase,
    nextSelection,
    partExtent,
    partProgress,
    sampleTrack,
    sceneBox,
} from "@/supply-chain/scenes/motion";
import { PART_KINDS, type PartShape, type PartSpec } from "@/supply-chain/scenes/spec";

const SAMPLE_SHAPES: PartShape[] = [
    { component: "cylinder", props: { radius: 5, length: 10 } },
    { component: "ring", props: { outer: 10, inner: 6, length: 4 } },
    {
        component: "lamination-stack",
        props: { outer: 30, inner: 12, length: 14, slots: 36 },
    },
    {
        component: "winding-coils",
        props: { outer: 30, inner: 12, length: 14, slots: 36 },
    },
    {
        component: "magnet-ring",
        props: { poles: 42, outer: 46, inner: 36, length: 16 },
    },
    { component: "spur-gear", props: { teeth: 20, module: 1, width: 6 } },
    {
        component: "planetary-stage",
        props: { sunTeeth: 12, planetTeeth: 24, planets: 3, module: 1, width: 8 },
    },
    { component: "flexspline", props: { teeth: 100, module: 0.4, length: 26 } },
    { component: "wave-generator", props: { major: 19, minor: 18, width: 6 } },
    {
        component: "circular-spline",
        props: { teeth: 102, module: 0.4, width: 8, outer: 30 },
    },
    {
        component: "cycloid-disc",
        props: { lobes: 11, radius: 30, eccentricity: 1.2, pinRadius: 2, thickness: 6 },
    },
    { component: "ball-screw", props: { diameter: 12, length: 120, lead: 4 } },
    {
        component: "roller-screw",
        props: {
            screwDiameter: 14,
            length: 190,
            lead: 5,
            rollers: 10,
            rollerDiameter: 4.6,
            rollerLength: 24,
        },
    },
    {
        component: "bearing",
        props: { kind: "deep-groove", outer: 20, inner: 10, width: 6 },
    },
    { component: "encoder", props: { radius: 14, thickness: 2 } },
    { component: "pcb", props: { shape: "rect", width: 40, height: 30 } },
    { component: "housing", props: { profile: "cup", outer: 50, length: 30, wall: 3 } },
    { component: "bolt", props: { diameter: 3, length: 12, count: 8, circle: 40 } },
];

const part = (over: Partial<PartSpec> = {}): PartSpec =>
    ({
        id: "p",
        label: "P",
        component: "cylinder",
        props: { radius: 5, length: 10 },
        explodedOffset: [0, 0, 100],
        ...over,
    }) as PartSpec;

describe("demo scenes", () => {
    test("every demo scene and the press loop are well formed", () => {
        for (const s of DEMO_SCENES) expect(sceneProblems(s)).toEqual([]);
        expect(loopProblems(MAGNET_PRESS_LOOP)).toEqual([]);
    });

    test("each demo has exactly one accent and labels every part", () => {
        for (const s of DEMO_SCENES) {
            expect(s.parts.filter((p) => p.accent)).toHaveLength(1);
            for (const p of s.parts) expect(p.label.length).toBeGreaterThan(0);
        }
    });

    test("the checks catch duplicate ids, unknown parts and a second accent", () => {
        const bad = {
            id: "bad",
            title: "Bad",
            parts: [
                part({ id: "a", accent: true }),
                part({ id: "a", accent: true }),
                { ...part({ id: "c" }), component: "sprocket" } as unknown as PartSpec,
                part({ id: "Not_Kebab" }),
                part({ id: "nan", explodedOffset: [0, Number.NaN, 0] }),
            ],
        };
        const problems = sceneProblems(bad).join("\n");
        expect(problems).toContain('duplicate id "a"');
        expect(problems).toContain('unknown part "sprocket"');
        expect(problems).toContain("more than one accent");
        expect(problems).toContain("not kebab-case");
        expect(problems).toContain("not finite");
        expect(
            loopProblems({ ...MAGNET_PRESS_LOOP, duration: 0 }).join("\n"),
        ).toContain("duration");
    });
});

describe("explode motion", () => {
    test("easing is clamped and symmetric", () => {
        expect(easeInOutCubic(-1)).toBe(0);
        expect(easeInOutCubic(0.5)).toBeCloseTo(0.5);
        expect(easeInOutCubic(2)).toBe(1);
    });

    test("parts travel from assembled to assembled + offset", () => {
        const p = part({ assembled: { position: [1, 2, 3] } });
        expect(explodedPosition(p, 0)).toEqual([1, 2, 3]);
        expect(explodedPosition(p, 1)).toEqual([1, 2, 103]);
    });

    test("stagger starts later parts later but every part arrives at 1", () => {
        const first = partProgress(0.2, 0, 5, 0.1);
        const last = partProgress(0.2, 4, 5, 0.1);
        expect(first).toBeGreaterThan(0);
        expect(last).toBe(0);
        for (let i = 0; i < 5; i++) {
            expect(partProgress(0, i, 5, 0.1)).toBe(0);
            expect(partProgress(1, i, 5, 0.1)).toBe(1);
        }
    });

    test("every part kind has a finite, positive extent", () => {
        expect(SAMPLE_SHAPES.map((s) => s.component).sort()).toEqual(
            [...PART_KINDS].sort(),
        );
        for (const s of SAMPLE_SHAPES) {
            const { r, h } = partExtent(s);
            expect(Number.isFinite(r) && r > 0).toBe(true);
            expect(Number.isFinite(h) && h > 0).toBe(true);
        }
    });

    test("the scene box grows as the assembly explodes", () => {
        const closed = sceneBox(QDD_JOINT.parts, 0);
        const open = sceneBox(QDD_JOINT.parts, 1);
        expect(open.max[2] - open.min[2]).toBeGreaterThan(
            closed.max[2] - closed.min[2],
        );
        expect(open.max[2]).toBeGreaterThan(150);
    });

    test("clicking the selected part clears the selection", () => {
        expect(nextSelection(null, "a")).toBe("a");
        expect(nextSelection("a", "b")).toBe("b");
        expect(nextSelection("a", "a")).toBeNull();
    });
});

describe("process loop tracks", () => {
    const track = [
        { at: 0.2, position: [0, 0, 0] as [number, number, number], opacity: 0 },
        { at: 0.6, position: [0, -10, 0] as [number, number, number], opacity: 1 },
    ];

    test("channels hold before the first key and after the last", () => {
        expect(sampleTrack(track, 0).opacity).toBe(0);
        expect(sampleTrack(track, 0.9).position).toEqual([0, -10, 0]);
        expect(sampleTrack(track, 0.4).position[1]).toBeCloseTo(-5);
    });

    test("an unset channel keeps the base transform", () => {
        const s = sampleTrack([{ at: 0.5, value: 1 }], 0.7, { position: [0, 5, 0] });
        expect(s.position).toEqual([0, 5, 0]);
        expect(s.scale).toBe(1);
        expect(s.value).toBe(1);
    });

    test("time wraps onto the loop", () => {
        expect(loopPhase(7, 6)).toBeCloseTo(1 / 6);
        expect(loopPhase(-1, 4)).toBeCloseTo(0.75);
        expect(loopPhase(3, 0)).toBe(0);
    });

    test("the active step is the last one started, wrapping before the first", () => {
        const steps = MAGNET_PRESS_LOOP.steps ?? [];
        expect(activeStep(steps, 0.1)).toBe(0);
        expect(activeStep(steps, 0.5)).toBe(2);
        expect(activeStep(steps, 0.99)).toBe(3);
        expect(activeStep([{ at: 0.3, label: "x" }], 0.1)).toBe(0);
        expect(activeStep(undefined, 0.5)).toBe(-1);
    });

    test("the press closes on the powder and the field is on while it presses", () => {
        const punch = MAGNET_PRESS_LOOP.actors.find((a) => a.id === "upper-punch");
        const field = MAGNET_PRESS_LOOP.fields?.[0];
        if (!punch || !field)
            throw new Error("press loop is missing its punch or field");
        const pressed = sampleTrack(punch.track, 0.65, punch.assembled);
        const open = sampleTrack(punch.track, 0.1, punch.assembled);
        expect(pressed.position[1]).toBeLessThan(open.position[1]);
        expect(sampleTrack(field.track, 0.5).opacity).toBe(1);
        expect(sampleTrack(field.track, 0.05).opacity).toBe(0);
    });
});
