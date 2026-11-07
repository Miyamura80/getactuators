import { SIDE, TAU, UPRIGHT, glow, spin, x, y } from "./precision-kit";
import type { Keyframe, LoopActor, ProcessLoopSpec, Vec3 } from "./spec";

// Vignettes for the precision chain's drive parts: the strain-wave gear and
// the planetary roller screw. Same conventions as ./precision-loops.

// ---- Strain-wave gear --------------------------------------------------

export const FLEXSPLINE_TURNING_LOOP: ProcessLoopSpec = {
    id: "flexspline-turning-loop",
    title: "Turning the flexspline's thin wall",
    duration: 6,
    posterAt: 0.55,
    steps: [
        { at: 0, label: "Clamp" },
        { at: 0.15, label: "Turn wall" },
        { at: 0.8, label: "Gauge" },
    ],
    actors: [
        {
            id: "chuck",
            label: "Chuck",
            component: "cylinder",
            props: { radius: 18, length: 10 },
            assembled: { position: x(-26), rotation: SIDE },
            track: spin(6),
        },
        {
            id: "cup",
            label: "Flexspline blank",
            component: "housing",
            props: { profile: "cup", outer: 14, length: 36, wall: 1 },
            assembled: { position: x(0), rotation: [0, -Math.PI / 2, 0] },
            accent: true,
            track: [
                { at: 0, rotation: [0, 0, 0] },
                { at: 1, rotation: [0, 0, -TAU * 6] },
            ],
        },
        {
            id: "tool",
            label: "Turning tool",
            component: "block",
            props: { width: 4, height: 10, depth: 4 },
            assembled: { position: y(20) },
            track: [
                { at: 0.1, position: [16, 4, 0] },
                { at: 0.15, position: [16, 0, 0] },
                { at: 0.7, position: [-16, 0, 0] },
                { at: 0.78, position: [-16, 4, 0] },
                { at: 1, position: [16, 4, 0] },
            ],
        },
    ],
};

export const FLEXSPLINE_HOBBING_LOOP: ProcessLoopSpec = {
    id: "flexspline-hobbing-loop",
    title: "Hobbing the flexspline teeth",
    duration: 7,
    posterAt: 0.5,
    steps: [
        { at: 0, label: "Index" },
        { at: 0.15, label: "Hob teeth" },
        { at: 0.85, label: "Retract" },
    ],
    actors: [
        {
            id: "flexspline",
            label: "Flexspline",
            component: "flexspline",
            props: { teeth: 100, module: 0.4, length: 26, wall: 0.8 },
            assembled: { rotation: [Math.PI / 2, 0, 0] },
            accent: true,
            track: spin(0.5),
        },
        {
            id: "hob",
            label: "Hob",
            component: "hob",
            props: { radius: 8, length: 22, gashes: 12, lead: 3 },
            // Axis across the gear, tilted by the hob's lead angle.
            assembled: { position: [29, 0, 0], rotation: [0.08, 0, 0] },
            track: [
                { at: 0, position: [6, 3, 0], rotation: [0, 0, 0] },
                { at: 0.15, position: [0, 3, 0] },
                { at: 0.8, position: [0, 13, 0], rotation: [0, 0, TAU * 14] },
                { at: 0.9, position: [6, 13, 0] },
                { at: 1, position: [6, 3, 0], rotation: [0, 0, TAU * 15] },
            ],
        },
    ],
};

export const FLEXSPLINE_PEENING_LOOP: ProcessLoopSpec = {
    id: "flexspline-peening-loop",
    title: "Shot peening the flexspline",
    duration: 6,
    posterAt: 0.5,
    steps: [
        { at: 0, label: "Spin" },
        { at: 0.2, label: "Peen" },
        { at: 0.85, label: "Blow off" },
    ],
    actors: [
        {
            id: "flexspline",
            label: "Flexspline",
            component: "flexspline",
            props: { teeth: 100, module: 0.4, length: 26, wall: 0.8 },
            assembled: { rotation: [Math.PI / 2, 0, 0] },
            accent: true,
            track: [...spin(3), ...glow(0.2, 0.85, 0.5)],
        },
        {
            id: "nozzle",
            label: "Peening nozzle",
            component: "cylinder",
            props: { radius: 2.5, length: 14, bore: 1.2 },
            assembled: { position: [0, 30, 0], rotation: UPRIGHT },
            track: [
                { at: 0.15, position: [-8, 0, 0] },
                { at: 0.85, position: [8, 0, 0] },
                { at: 1, position: [-8, 0, 0] },
            ],
        },
    ],
    particles: [
        {
            id: "shot",
            count: 120,
            size: [10, 22, 10],
            center: [0, 14, 0],
            mode: "fall",
            seed: 31,
            track: [
                { at: 0.18, opacity: 0, value: 1, scale: 0.5 },
                { at: 0.25, opacity: 1 },
                { at: 0.82, opacity: 1 },
                { at: 0.88, opacity: 0 },
            ],
        },
    ],
};

export const CIRCULAR_SPLINE_BROACHING_LOOP: ProcessLoopSpec = {
    id: "circular-spline-broaching-loop",
    title: "Broaching the circular spline's internal teeth",
    duration: 6,
    posterAt: 0.5,
    steps: [
        { at: 0, label: "Fix ring" },
        { at: 0.15, label: "Pull broach" },
        { at: 0.75, label: "Return" },
    ],
    actors: [
        {
            id: "ring",
            label: "Circular spline blank",
            component: "circular-spline",
            props: { teeth: 102, module: 0.4, width: 10, outer: 30 },
            assembled: { rotation: UPRIGHT },
            accent: true,
            track: [{ at: 0, opacity: 0.55 }],
        },
        {
            id: "broach",
            label: "Broach",
            component: "broach",
            props: { radius: 17, length: 50, teeth: 10, rise: 0.25, splines: 34 },
            assembled: { rotation: UPRIGHT },
            // Pulled up through the ring, then returned out of sight.
            track: [
                { at: 0.1, position: y(-30), opacity: 1 },
                { at: 0.7, position: y(30), opacity: 1 },
                { at: 0.78, opacity: 0 },
                { at: 0.82, position: y(30) },
                { at: 0.9, position: y(-30), opacity: 0 },
                { at: 1, opacity: 1 },
            ],
        },
    ],
};

export const WAVE_GENERATOR_GRINDING_LOOP: ProcessLoopSpec = {
    id: "wave-generator-grinding-loop",
    title: "Grinding the elliptical wave generator cam",
    duration: 6,
    posterAt: 0.45,
    steps: [
        { at: 0, label: "Rough" },
        { at: 0.4, label: "Finish grind" },
        { at: 0.85, label: "Spark out" },
    ],
    actors: [
        {
            id: "cam",
            label: "Elliptical cam",
            component: "wave-generator",
            props: { major: 19.4, minor: 17.8, width: 6, bore: 6 },
            assembled: { rotation: UPRIGHT },
            accent: true,
            // A quarter turn per eighth of the loop, in step with the wheel.
            track: Array.from(
                { length: 9 },
                (_, i): Keyframe => ({
                    at: i / 8,
                    rotation: [0, 0, (i * TAU) / 4],
                }),
            ),
        },
        {
            // The wheel follows the ellipse: in at the minor axis, out at the
            // major axis, twice per turn.
            id: "wheel",
            label: "CBN grinding wheel",
            component: "grinding-wheel",
            props: { radius: 14, width: 5 },
            assembled: { position: [33.4, 0, 0], rotation: UPRIGHT },
            track: [
                ...[0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1].map(
                    (at, i): Keyframe => ({
                        at,
                        position: [i % 2 === 0 ? 0 : -1.6, 0, 0],
                    }),
                ),
                { at: 0, rotation: [0, 0, 0] },
                { at: 1, rotation: [0, 0, -TAU * 12] },
            ],
        },
    ],
};

export const STRAIN_WAVE_TEST_LOOP: ProcessLoopSpec = {
    id: "strain-wave-test-loop",
    title: "Torsion and lost-motion test of a matched set",
    duration: 7,
    posterAt: 0.4,
    steps: [
        { at: 0, label: "Lock input" },
        { at: 0.15, label: "Load +" },
        { at: 0.5, label: "Load -" },
        { at: 0.85, label: "Read" },
    ],
    actors: [
        {
            id: "circular-spline",
            label: "Circular spline (fixed)",
            component: "circular-spline",
            props: { teeth: 102, module: 0.4, width: 8, outer: 30 },
            assembled: { rotation: UPRIGHT },
            track: [],
        },
        {
            id: "flexspline",
            label: "Flexspline (output)",
            component: "flexspline",
            props: { teeth: 100, module: 0.4, length: 26, wall: 0.8, deflection: 0.8 },
            assembled: { position: y(-9), rotation: [Math.PI / 2, 0, 0] },
            accent: true,
            track: [
                { at: 0.1, rotation: [0, 0, 0] },
                { at: 0.35, rotation: [0, 0, 0.12] },
                { at: 0.5, rotation: [0, 0, 0] },
                { at: 0.75, rotation: [0, 0, -0.12] },
                { at: 0.9, rotation: [0, 0, 0] },
            ],
        },
        {
            id: "torque-arm",
            label: "Torque arm",
            component: "block",
            props: { width: 70, height: 3, depth: 5 },
            assembled: { position: y(-26) },
            track: [
                { at: 0.1, rotation: [0, 0, 0] },
                { at: 0.35, rotation: [0, 0.12, 0] },
                { at: 0.5, rotation: [0, 0, 0] },
                { at: 0.75, rotation: [0, -0.12, 0] },
                { at: 0.9, rotation: [0, 0, 0] },
            ],
        },
        {
            id: "encoder",
            label: "Output encoder",
            component: "grating-disc",
            props: { radius: 16, thickness: 1.5, lines: 72 },
            assembled: { position: y(-31), rotation: UPRIGHT },
            track: glow(0.85, 0.97, 0.8),
        },
    ],
};

// ---- Planetary roller screw ---------------------------------------------

export const SCREW_HARDENING_LOOP: ProcessLoopSpec = {
    id: "screw-hardening-loop",
    title: "Induction hardening a screw shaft",
    duration: 6,
    posterAt: 0.45,
    steps: [
        { at: 0, label: "Heat" },
        { at: 0.1, label: "Scan coil" },
        { at: 0.75, label: "Quench" },
    ],
    actors: [
        {
            id: "shaft",
            label: "Screw shaft",
            component: "cylinder",
            props: { radius: 6, length: 110 },
            assembled: { rotation: SIDE },
            accent: true,
            track: [...spin(4), ...glow(0.1, 0.75, 0.9)],
        },
        {
            id: "coil",
            label: "Induction coil",
            component: "coil",
            props: { radius: 10, wire: 1.2, pitch: 3.5, turns: 3 },
            assembled: { rotation: SIDE },
            track: [
                { at: 0.05, position: x(-48), value: 0 },
                { at: 0.1, value: 1 },
                { at: 0.75, position: x(48), value: 1 },
                { at: 0.8, value: 0 },
                { at: 1, position: x(-48) },
            ],
        },
    ],
    particles: [
        {
            id: "quench",
            count: 80,
            size: [100, 14, 10],
            center: [0, 12, 0],
            mode: "fall",
            seed: 41,
            track: [
                { at: 0.72, opacity: 0, value: 1, scale: 0.5 },
                { at: 0.8, opacity: 1 },
                { at: 0.95, opacity: 0 },
            ],
        },
    ],
};

const threadWheel = (
    radius: number,
    at: Vec3,
    ribs: number,
    tilt: number,
): LoopActor => ({
    id: "wheel",
    label: "Thread-grinding wheel",
    component: "grinding-wheel",
    props: { radius, width: 10, ribs },
    // Axis along the screw, tilted by the thread's helix angle.
    assembled: { position: at, rotation: [0, Math.PI / 2 - tilt, 0] },
    track: spin(20),
});

export const SCREW_THREAD_GRINDING_LOOP: ProcessLoopSpec = {
    id: "screw-thread-grinding-loop",
    title: "Grinding the multi-start screw thread",
    duration: 7,
    posterAt: 0.5,
    steps: [
        { at: 0, label: "Dress" },
        { at: 0.15, label: "Traverse" },
        { at: 0.85, label: "Measure lead" },
    ],
    actors: [
        {
            id: "screw",
            label: "Screw shaft",
            component: "roller-screw",
            props: {
                screwDiameter: 14,
                length: 110,
                lead: 10,
                rollers: 10,
                rollerDiameter: 4.6,
                rollerLength: 24,
                piece: "screw",
            },
            assembled: { rotation: SIDE },
            accent: true,
            track: spin(6),
        },
        {
            ...threadWheel(26, [0, 34, 0], 5, 0.1),
            track: [
                ...spin(24),
                { at: 0.1, position: [-42, 0, 0] },
                { at: 0.85, position: [42, 0, 0] },
                { at: 1, position: [-42, 0, 0] },
            ],
        },
    ],
};

export const ROLLER_THREAD_GRINDING_LOOP: ProcessLoopSpec = {
    id: "roller-thread-grinding-loop",
    title: "Grinding a lot of matched rollers",
    duration: 7,
    posterAt: 0.35,
    steps: [
        { at: 0, label: "Load roller" },
        { at: 0.1, label: "Grind thread" },
        { at: 0.7, label: "Sort to lot" },
    ],
    actors: [
        {
            id: "roller",
            label: "Roller",
            component: "ball-screw",
            props: { diameter: 9, length: 40, lead: 2 },
            assembled: { rotation: SIDE },
            accent: true,
            track: [
                ...spin(8),
                { at: 0, position: [0, 0, 30], opacity: 0 },
                { at: 0.08, position: [0, 0, 0], opacity: 1 },
                { at: 0.7, position: [0, 0, 0] },
                { at: 0.85, position: [0, -24, 0], opacity: 1 },
                { at: 0.9, opacity: 0 },
            ],
        },
        threadWheel(24, [0, 29.5, 0], 7, 0.04),
        ...[-48, -36, -24, -12].map(
            (z, i): LoopActor => ({
                id: `lot-${i + 1}`,
                label: "Ground roller in the lot",
                component: "ball-screw",
                props: { diameter: 9, length: 40, lead: 2 },
                assembled: { position: [0, -24, z], rotation: SIDE },
                track: [],
            }),
        ),
    ],
};

export const NUT_THREAD_GRINDING_LOOP: ProcessLoopSpec = {
    id: "nut-thread-grinding-loop",
    title: "Grinding the nut's internal thread",
    duration: 7,
    posterAt: 0.5,
    steps: [
        { at: 0, label: "Enter" },
        { at: 0.15, label: "Grind" },
        { at: 0.85, label: "Withdraw" },
    ],
    actors: [
        {
            id: "nut",
            label: "Nut (cutaway)",
            component: "ring",
            props: { outer: 22, inner: 14, length: 40 },
            assembled: { rotation: SIDE },
            accent: true,
            track: [...spin(5), { at: 0, opacity: 0.4 }],
        },
        {
            // The quill reaches into the bore along the nut's axis; the wheel
            // on its tip runs against the upper flank of the thread.
            id: "quill",
            label: "Grinding quill",
            component: "cylinder",
            props: { radius: 2.5, length: 60 },
            assembled: { position: [34, 8, 0], rotation: SIDE },
            track: [
                { at: 0.05, position: x(26) },
                { at: 0.15, position: x(0) },
                { at: 0.85, position: x(-14) },
                { at: 1, position: x(26) },
            ],
        },
        {
            id: "wheel",
            label: "Internal thread wheel",
            component: "grinding-wheel",
            props: { radius: 5, width: 6, ribs: 3, bore: 1.5 },
            assembled: { position: [4, 8, 0], rotation: SIDE },
            track: [
                ...spin(30),
                { at: 0.05, position: x(26) },
                { at: 0.15, position: x(0) },
                { at: 0.85, position: x(-14) },
                { at: 1, position: x(26) },
            ],
        },
    ],
};

export const ROLLER_SCREW_ASSEMBLY_LOOP: ProcessLoopSpec = {
    id: "roller-screw-assembly-loop",
    title: "Assembling rollers, ring gears and nut on the screw",
    duration: 7,
    posterAt: 0.75,
    steps: [
        { at: 0, label: "Rollers in" },
        { at: 0.35, label: "Nut on" },
        { at: 0.65, label: "Preload" },
    ],
    actors: [
        {
            id: "screw",
            label: "Screw",
            component: "roller-screw",
            props: {
                screwDiameter: 14,
                length: 110,
                lead: 10,
                rollers: 10,
                rollerDiameter: 4.6,
                rollerLength: 24,
                piece: "screw",
            },
            assembled: { rotation: SIDE },
            track: [],
        },
        {
            id: "rollers",
            label: "Rollers and ring gears",
            component: "roller-screw",
            props: {
                screwDiameter: 14,
                length: 110,
                lead: 10,
                rollers: 10,
                rollerDiameter: 4.6,
                rollerLength: 24,
                piece: "rollers",
            },
            assembled: { rotation: SIDE },
            accent: true,
            track: [
                { at: 0, scale: 1.8, opacity: 0 },
                { at: 0.08, opacity: 1 },
                { at: 0.3, scale: 1 },
            ],
        },
        {
            id: "nut",
            label: "Nut",
            component: "roller-screw",
            props: {
                screwDiameter: 14,
                length: 110,
                lead: 10,
                rollers: 10,
                rollerDiameter: 4.6,
                rollerLength: 24,
                piece: "nut",
            },
            assembled: { rotation: SIDE },
            track: [
                { at: 0.3, position: x(70), opacity: 0 },
                { at: 0.35, opacity: 1 },
                { at: 0.6, position: x(0) },
                { at: 0.65, value: 0 },
                { at: 0.72, value: 0.8 },
                { at: 0.85, value: 0 },
            ],
        },
    ],
};

export const LEAD_ACCURACY_TEST_LOOP: ProcessLoopSpec = {
    id: "lead-accuracy-test-loop",
    title: "Laser check of lead accuracy along the screw",
    duration: 7,
    posterAt: 0.5,
    steps: [
        { at: 0, label: "Drive" },
        { at: 0.1, label: "Measure travel" },
        { at: 0.85, label: "Grade" },
    ],
    actors: [
        {
            id: "screw",
            label: "Roller screw",
            component: "roller-screw",
            props: {
                screwDiameter: 14,
                length: 120,
                lead: 10,
                rollers: 10,
                rollerDiameter: 4.6,
                rollerLength: 24,
                piece: "screw",
            },
            assembled: { rotation: SIDE },
            track: spin(8),
        },
        {
            id: "nut",
            label: "Nut and rollers",
            component: "roller-screw",
            props: {
                screwDiameter: 14,
                length: 120,
                lead: 10,
                rollers: 10,
                rollerDiameter: 4.6,
                rollerLength: 24,
            },
            assembled: { rotation: SIDE },
            accent: true,
            track: [
                { at: 0.05, position: x(-40) },
                { at: 0.85, position: x(40) },
                { at: 1, position: x(-40) },
            ],
        },
        {
            id: "reflector",
            label: "Laser reflector",
            component: "block",
            props: { width: 4, height: 8, depth: 8 },
            assembled: { position: [0, 22, 0] },
            track: [
                { at: 0.05, position: x(-40) },
                { at: 0.85, position: x(40) },
                { at: 1, position: x(-40) },
            ],
        },
        {
            id: "beam",
            label: "Laser beam",
            component: "cylinder",
            props: { radius: 0.4, length: 130 },
            assembled: { position: [0, 22, 0], rotation: SIDE },
            track: glow(0.1, 0.85, 1),
        },
    ],
};
