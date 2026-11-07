import {
    CIRCULAR_SPLINE_BROACHING_LOOP,
    FLEXSPLINE_HOBBING_LOOP,
    FLEXSPLINE_PEENING_LOOP,
    FLEXSPLINE_TURNING_LOOP,
    LEAD_ACCURACY_TEST_LOOP,
    NUT_THREAD_GRINDING_LOOP,
    ROLLER_SCREW_ASSEMBLY_LOOP,
    ROLLER_THREAD_GRINDING_LOOP,
    SCREW_HARDENING_LOOP,
    SCREW_THREAD_GRINDING_LOOP,
    STRAIN_WAVE_TEST_LOOP,
    WAVE_GENERATOR_GRINDING_LOOP,
} from "./precision-drive-loops";
import { SIDE, TAU, UPRIGHT, glow, spin, x, y } from "./precision-kit";
import type { ExplodeSceneSpec, Keyframe, LoopActor, ProcessLoopSpec } from "./spec";

// Looping vignettes for the /manufacturing precision chain: strain-wave
// gears, planetary roller screws, precision bearings and encoders.
// Schematic, not to scale: each shows the motion of one step, sized to read
// in a card. Millimetres in the scene frame; Y is up. Each loop is modelled
// on the documents its step cites (the machine-tool note, catalogue or
// paper behind the step's numbers).

// Strain-wave and roller screw loops live in ./precision-drive-loops.

export {
    FLEXSPLINE_TURNING_LOOP,
    FLEXSPLINE_HOBBING_LOOP,
    FLEXSPLINE_PEENING_LOOP,
    CIRCULAR_SPLINE_BROACHING_LOOP,
    WAVE_GENERATOR_GRINDING_LOOP,
    STRAIN_WAVE_TEST_LOOP,
    SCREW_HARDENING_LOOP,
    SCREW_THREAD_GRINDING_LOOP,
    ROLLER_THREAD_GRINDING_LOOP,
    NUT_THREAD_GRINDING_LOOP,
    ROLLER_SCREW_ASSEMBLY_LOOP,
    LEAD_ACCURACY_TEST_LOOP,
} from "./precision-drive-loops";

// ---- Precision bearing --------------------------------------------------

export const RING_ROLLING_LOOP: ProcessLoopSpec = {
    id: "ring-rolling-loop",
    title: "Rolling a forged ring out to size",
    duration: 6,
    posterAt: 0.6,
    steps: [
        { at: 0, label: "Pierce" },
        { at: 0.15, label: "Roll" },
        { at: 0.75, label: "Size" },
    ],
    actors: [
        {
            id: "ring",
            label: "Bearing ring blank",
            component: "ring",
            props: { outer: 20, inner: 12, length: 12 },
            assembled: { rotation: UPRIGHT },
            accent: true,
            // The wall thins and the ring grows; it resets out of sight.
            track: [
                ...spin(3),
                { at: 0.1, scale: 0.7, value: 0.9 },
                { at: 0.75, scale: 1.2, value: 0.5 },
                { at: 0.9, scale: 1.2, value: 0, opacity: 1 },
                { at: 0.94, opacity: 0 },
                { at: 0.98, scale: 0.7, opacity: 0 },
                { at: 1, opacity: 1 },
            ],
        },
        {
            id: "main-roll",
            label: "Main roll",
            component: "cylinder",
            props: { radius: 11, length: 18 },
            assembled: { position: [-36, 0, 0], rotation: UPRIGHT },
            // Outside the ring, pressing the wall against the mandrel.
            track: [
                { at: 0, rotation: [0, 0, 0] },
                { at: 1, rotation: [0, 0, -TAU * 5] },
                { at: 0.1, position: x(11) },
                { at: 0.75, position: x(1) },
                { at: 0.92, position: x(1) },
                { at: 1, position: x(11) },
            ],
        },
        {
            id: "mandrel",
            label: "Mandrel",
            component: "cylinder",
            props: { radius: 3.5, length: 22 },
            assembled: { position: [-7, 0, 0], rotation: UPRIGHT },
            // Inside the bore, on the same side as the main roll.
            track: [
                { at: 0, rotation: [0, 0, 0] },
                { at: 1, rotation: [0, 0, TAU * 9] },
                { at: 0.1, position: x(2.1) },
                { at: 0.75, position: x(-3.9) },
                { at: 0.92, position: x(-3.9) },
                { at: 1, position: x(2.1) },
            ],
        },
    ],
};

export const RACEWAY_GRINDING_LOOP: ProcessLoopSpec = {
    id: "raceway-grinding-loop",
    title: "Plunge grinding an inner ring raceway",
    duration: 6,
    posterAt: 0.5,
    steps: [
        { at: 0, label: "Approach" },
        { at: 0.2, label: "Plunge" },
        { at: 0.8, label: "Spark out" },
    ],
    actors: [
        {
            id: "inner-ring",
            label: "Inner ring",
            component: "ring",
            props: { outer: 20, inner: 13, length: 12 },
            assembled: { rotation: UPRIGHT },
            accent: true,
            track: spin(4),
        },
        {
            id: "wheel",
            label: "Grinding wheel",
            component: "grinding-wheel",
            props: { radius: 22, width: 8 },
            assembled: { position: [42, 0, 0], rotation: UPRIGHT },
            track: [
                { at: 0, rotation: [0, 0, 0] },
                { at: 1, rotation: [0, 0, TAU * 16] },
                { at: 0.05, position: [8, 0, 0] },
                { at: 0.2, position: [0.4, 0, 0] },
                { at: 0.8, position: [0, 0, 0] },
                { at: 0.95, position: [8, 0, 0] },
            ],
        },
    ],
    particles: [
        {
            id: "sparks",
            count: 60,
            size: [6, 16, 12],
            center: [20, -6, 0],
            mode: "fall",
            seed: 51,
            track: [
                { at: 0.18, opacity: 0, value: 1, scale: 0.4 },
                { at: 0.25, opacity: 1 },
                { at: 0.78, opacity: 1 },
                { at: 0.85, opacity: 0 },
            ],
        },
    ],
};

export const RACEWAY_SUPERFINISHING_LOOP: ProcessLoopSpec = {
    id: "raceway-superfinishing-loop",
    title: "Oscillating stone superfinishing the raceway",
    duration: 5,
    posterAt: 0.4,
    steps: [
        { at: 0, label: "Press stone" },
        { at: 0.1, label: "Oscillate" },
        { at: 0.9, label: "Lift" },
    ],
    actors: [
        {
            id: "inner-ring",
            label: "Inner ring",
            component: "ring",
            props: { outer: 20, inner: 13, length: 12 },
            assembled: { rotation: UPRIGHT },
            accent: true,
            track: spin(5),
        },
        {
            // Short, fast strokes across the raceway while the ring turns.
            id: "stone",
            label: "Superfinishing stone",
            component: "finishing-stone",
            props: { width: 10, height: 14, depth: 8, radius: 20 },
            assembled: { position: [0, 0, 0], rotation: [0, 0, -Math.PI / 2] },
            track: [
                { at: 0, position: [30, 0, 0] },
                { at: 0.1, position: [27.1, 0, 0] },
                ...Array.from(
                    { length: 16 },
                    (_, i): Keyframe => ({
                        at: 0.12 + i * 0.048,
                        position: [27.1, i % 2 === 0 ? 2.5 : -2.5, 0],
                    }),
                ),
                { at: 0.92, position: [30, 0, 0] },
            ],
        },
    ],
};

export const BALL_SORTING_LOOP: ProcessLoopSpec = {
    id: "ball-sorting-loop",
    title: "Sorting balls into size classes",
    duration: 6,
    posterAt: 0.55,
    steps: [
        { at: 0, label: "Gauge" },
        { at: 0.3, label: "Drop to class" },
        { at: 0.8, label: "Fill lots" },
    ],
    actors: [
        {
            id: "gauge",
            label: "Diameter gauge",
            component: "block",
            props: { width: 50, height: 3, depth: 10 },
            assembled: { position: y(18), rotation: [0, 0, -0.12] },
            track: [],
        },
        ...[-16, -5, 6, 17].map(
            (bx, i): LoopActor => ({
                id: `bin-${i + 1}`,
                label: `Size class ${i + 1}`,
                component: "housing",
                props: { profile: "cup", outer: 5, length: 12, wall: 0.8 },
                assembled: { position: [bx, -10, 0], rotation: UPRIGHT },
                accent: i === 1,
                track: glow(0.3 + i * 0.12, 0.38 + i * 0.12, 0.6),
            }),
        ),
    ],
    particles: [
        {
            id: "balls",
            count: 60,
            size: [44, 22, 6],
            center: [0, 5, 0],
            mode: "fall",
            seed: 61,
            track: [
                { at: 0.2, opacity: 0, value: 1, scale: 1.6 },
                { at: 0.3, opacity: 1 },
                { at: 0.85, opacity: 1 },
                { at: 0.95, opacity: 0 },
            ],
        },
    ],
};

export const BEARING_NOISE_TEST_LOOP: ProcessLoopSpec = {
    id: "bearing-noise-test-loop",
    title: "Vibration test of a finished bearing",
    duration: 6,
    posterAt: 0.5,
    steps: [
        { at: 0, label: "Mount" },
        { at: 0.15, label: "Spin" },
        { at: 0.8, label: "Pass or fail" },
    ],
    actors: [
        {
            id: "bearing",
            label: "Crossed-roller bearing",
            component: "bearing",
            props: { kind: "crossed-roller", outer: 30, inner: 18, width: 10 },
            assembled: { rotation: UPRIGHT },
            accent: true,
            track: [],
        },
        {
            id: "spindle",
            label: "Spindle (turns the inner ring)",
            component: "cylinder",
            props: { radius: 17.5, length: 24 },
            assembled: { position: y(-6), rotation: UPRIGHT },
            track: spin(8),
        },
        {
            id: "pickup",
            label: "Velocity pickup",
            component: "cylinder",
            props: { radius: 2, length: 14 },
            assembled: { position: [37, 0, 0], rotation: SIDE },
            track: glow(0.15, 0.8, 0.9),
        },
    ],
    fields: [
        {
            id: "vibration",
            kind: "radial",
            count: 16,
            radius: 34,
            length: 10,
            axis: "y",
            track: [
                { at: 0.15, opacity: 0 },
                { at: 0.25, opacity: 0.7 },
                { at: 0.78, opacity: 0.7 },
                { at: 0.85, opacity: 0 },
            ],
        },
    ],
};

// ---- Encoder ------------------------------------------------------------

export const GRATING_LITHOGRAPHY_LOOP: ProcessLoopSpec = {
    id: "grating-lithography-loop",
    title: "Exposing a chrome grating through a mask",
    duration: 6,
    posterAt: 0.45,
    steps: [
        { at: 0, label: "Coat resist" },
        { at: 0.2, label: "Expose" },
        { at: 0.6, label: "Etch chrome" },
    ],
    actors: [
        {
            id: "disc",
            label: "Glass disc",
            component: "grating-disc",
            props: { radius: 26, thickness: 2, lines: 180, tracks: 3 },
            assembled: { rotation: UPRIGHT },
            accent: true,
            track: [
                { at: 0, opacity: 0.35 },
                { at: 0.6, opacity: 0.35 },
                { at: 0.7, opacity: 1 },
            ],
        },
        {
            id: "mask",
            label: "Photomask",
            component: "grating-disc",
            props: { radius: 28, thickness: 0.8, lines: 180, tracks: 3, hub: 3 },
            assembled: { position: y(10), rotation: UPRIGHT },
            track: [
                { at: 0.1, opacity: 0 },
                { at: 0.18, opacity: 0.6 },
                { at: 0.55, opacity: 0.6 },
                { at: 0.62, opacity: 0 },
            ],
        },
        {
            id: "lamp",
            label: "UV lamp",
            component: "housing",
            props: { profile: "cup", outer: 20, length: 10, wall: 1.5 },
            assembled: { position: y(34), rotation: [Math.PI / 2, 0, 0] },
            track: glow(0.2, 0.5, 1),
        },
    ],
    fields: [
        {
            id: "uv",
            kind: "axial",
            count: 14,
            radius: 18,
            length: 28,
            center: [0, 20, 0],
            axis: "y",
            track: [
                { at: 0.18, opacity: 0 },
                { at: 0.22, opacity: 1 },
                { at: 0.5, opacity: 1 },
                { at: 0.54, opacity: 0 },
            ],
        },
    ],
};

export const MAGNETIC_POLE_WRITING_LOOP: ProcessLoopSpec = {
    id: "magnetic-pole-writing-loop",
    title: "Writing poles onto a magnetic scale ring",
    duration: 7,
    posterAt: 0.6,
    steps: [
        { at: 0, label: "Index" },
        { at: 0.1, label: "Write poles" },
        { at: 0.85, label: "Verify" },
    ],
    actors: [
        {
            id: "ring",
            label: "Magnetic ring",
            component: "magnet-ring",
            props: { poles: 64, outer: 26, inner: 20, length: 6 },
            assembled: { rotation: UPRIGHT },
            accent: true,
            track: [
                { at: 0.1, rotation: [0, 0, 0] },
                { at: 0.85, rotation: [0, 0, TAU] },
            ],
        },
        {
            id: "head",
            label: "Magnetising head",
            component: "block",
            props: { width: 6, height: 10, depth: 8 },
            assembled: { position: [31, 0, 0] },
            track: [
                { at: 0.08, value: 0 },
                ...Array.from(
                    { length: 12 },
                    (_, i): Keyframe => ({
                        at: 0.1 + i * 0.062,
                        value: i % 2 === 0 ? 1 : 0.2,
                    }),
                ),
                { at: 0.86, value: 0 },
            ],
        },
        {
            id: "reference",
            label: "Reference encoder",
            component: "grating-disc",
            props: { radius: 14, thickness: 1.5, lines: 90 },
            assembled: { position: y(-14), rotation: UPRIGHT },
            track: [
                { at: 0.1, rotation: [0, 0, 0] },
                { at: 0.85, rotation: [0, 0, TAU] },
            ],
        },
    ],
};

export const INTERPOLATION_ASIC_LOOP: ProcessLoopSpec = {
    id: "interpolation-asic-loop",
    title: "Read head and interpolation chip on the encoder board",
    duration: 6,
    posterAt: 0.75,
    steps: [
        { at: 0, label: "Place ASIC" },
        { at: 0.3, label: "Bond" },
        { at: 0.6, label: "Read sin/cos" },
    ],
    actors: [
        {
            id: "board",
            label: "Encoder board",
            component: "pcb",
            props: { shape: "round", width: 44, bore: 8, chips: 5 },
            assembled: { rotation: UPRIGHT },
            track: [],
        },
        {
            id: "asic",
            label: "Interpolation ASIC",
            component: "block",
            props: { width: 9, height: 1.6, depth: 9 },
            assembled: { position: [10, 1.8, 0] },
            accent: true,
            track: [
                { at: 0, position: [0, 16, 0] },
                { at: 0.25, position: [0, 0, 0] },
                ...glow(0.6, 0.92, 0.9),
            ],
        },
        {
            id: "disc",
            label: "Scale disc",
            component: "grating-disc",
            props: { radius: 22, thickness: 1.5, lines: 120, tracks: 2 },
            assembled: { position: y(8), rotation: UPRIGHT },
            track: [
                { at: 0.55, rotation: [0, 0, 0], opacity: 0 },
                { at: 0.6, opacity: 0.8 },
                { at: 1, rotation: [0, 0, TAU / 2] },
            ],
        },
    ],
};

export const ENCODER_CALIBRATION_LOOP: ProcessLoopSpec = {
    id: "encoder-calibration-loop",
    title: "Calibrating against a reference encoder",
    duration: 7,
    posterAt: 0.5,
    steps: [
        { at: 0, label: "Couple" },
        { at: 0.1, label: "Rotate and compare" },
        { at: 0.85, label: "Store map" },
    ],
    actors: [
        {
            id: "unit",
            label: "Encoder under test",
            component: "grating-disc",
            props: { radius: 20, thickness: 2, lines: 120, tracks: 3 },
            assembled: { position: y(10), rotation: UPRIGHT },
            accent: true,
            track: [
                { at: 0.1, rotation: [0, 0, 0] },
                { at: 0.85, rotation: [0, 0, TAU] },
            ],
        },
        {
            id: "shaft",
            label: "Air-bearing spindle",
            component: "cylinder",
            props: { radius: 3, length: 34 },
            assembled: { rotation: UPRIGHT },
            track: [
                { at: 0.1, rotation: [0, 0, 0] },
                { at: 0.85, rotation: [0, 0, TAU] },
            ],
        },
        {
            id: "reference",
            label: "Reference encoder",
            component: "grating-disc",
            props: { radius: 26, thickness: 2, lines: 240 },
            assembled: { position: y(-10), rotation: UPRIGHT },
            track: [
                { at: 0.1, rotation: [0, 0, 0] },
                { at: 0.85, rotation: [0, 0, TAU] },
            ],
        },
        {
            id: "board",
            label: "Error map in memory",
            component: "pcb",
            props: { shape: "rect", width: 18, height: 12, chips: 2 },
            assembled: { position: [36, 10, 0], rotation: UPRIGHT },
            track: glow(0.85, 0.97, 0.9),
        },
    ],
};

// Every vignette on the precision chain, in chain order.
export const PRECISION_LOOPS: ProcessLoopSpec[] = [
    FLEXSPLINE_TURNING_LOOP,
    FLEXSPLINE_HOBBING_LOOP,
    FLEXSPLINE_PEENING_LOOP,
    CIRCULAR_SPLINE_BROACHING_LOOP,
    WAVE_GENERATOR_GRINDING_LOOP,
    STRAIN_WAVE_TEST_LOOP,
    SCREW_HARDENING_LOOP,
    SCREW_THREAD_GRINDING_LOOP,
    ROLLER_THREAD_GRINDING_LOOP,
    NUT_THREAD_GRINDING_LOOP,
    ROLLER_SCREW_ASSEMBLY_LOOP,
    LEAD_ACCURACY_TEST_LOOP,
    RING_ROLLING_LOOP,
    RACEWAY_GRINDING_LOOP,
    RACEWAY_SUPERFINISHING_LOOP,
    BALL_SORTING_LOOP,
    BEARING_NOISE_TEST_LOOP,
    GRATING_LITHOGRAPHY_LOOP,
    MAGNETIC_POLE_WRITING_LOOP,
    INTERPOLATION_ASIC_LOOP,
    ENCODER_CALIBRATION_LOOP,
];

// The product state at the end of the chain: one joint's precision parts,
// pulled apart along the joint axis, with a roller screw beside them for a
// linear joint.
export const PRECISION_JOINT: ExplodeSceneSpec = {
    id: "precision-joint",
    title: "A joint's precision parts",
    stagger: 0.05,
    parts: [
        {
            id: "encoder",
            label: "Encoder disc",
            component: "grating-disc",
            props: { radius: 22, thickness: 1.5, lines: 120, tracks: 3 },
            assembled: { position: [0, 0, -14] },
            explodedOffset: [0, 0, -42],
        },
        {
            id: "wave-generator",
            label: "Wave generator",
            component: "wave-generator",
            props: { major: 19.4, minor: 17.8, width: 6, bore: 6 },
            assembled: { position: [0, 0, -6] },
            explodedOffset: [0, 0, -22],
        },
        {
            id: "flexspline",
            label: "Flexspline",
            component: "flexspline",
            props: { teeth: 100, module: 0.4, length: 26, wall: 0.8, deflection: 0.8 },
            assembled: { position: [0, 0, 4] },
            explodedOffset: [0, 0, 0],
            accent: true,
        },
        {
            id: "circular-spline",
            label: "Circular spline",
            component: "circular-spline",
            props: { teeth: 102, module: 0.4, width: 8, outer: 30 },
            assembled: { position: [0, 0, -6] },
            explodedOffset: [0, 0, 26],
        },
        {
            id: "cross-roller",
            label: "Crossed-roller bearing",
            component: "bearing",
            props: { kind: "crossed-roller", outer: 38, inner: 26, width: 10 },
            assembled: { position: [0, 0, 12] },
            explodedOffset: [0, 0, 48],
        },
        {
            id: "roller-screw",
            label: "Planetary roller screw (linear joints)",
            component: "roller-screw",
            props: {
                screwDiameter: 10,
                length: 90,
                lead: 8,
                rollers: 8,
                rollerDiameter: 3.4,
                rollerLength: 18,
            },
            assembled: { position: [60, 0, 0] },
            explodedOffset: [16, 0, 0],
        },
    ],
};
