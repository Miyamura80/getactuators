import { MAGNET_PRESS_LOOP } from "./demos";
import type { ExplodeSceneSpec, ProcessLoopSpec, Vec3 } from "./spec";

// Looping vignettes for the /manufacturing magnet chain, ore to rotor.
// Schematic, not to scale: each shows what happens at the step, sized to
// read in a card. Millimetres in the scene frame; Y is up.

const TAU = Math.PI * 2;
// Quarter turn about X: a rotary part's local Z axis becomes world Y.
const UPRIGHT: Vec3 = [-Math.PI / 2, 0, 0];
const y = (v: number): Vec3 => [0, v, 0];

export const OPEN_PIT_LOOP: ProcessLoopSpec = {
    id: "open-pit-mining-loop",
    title: "Open-pit mine with a haul truck",
    duration: 8,
    posterAt: 0.3,
    steps: [
        { at: 0, label: "Blast" },
        { at: 0.18, label: "Load" },
        { at: 0.4, label: "Haul" },
    ],
    actors: [
        {
            id: "bench-1",
            label: "Upper bench",
            component: "ring",
            props: { outer: 64, inner: 46, length: 6 },
            assembled: { position: y(0), rotation: UPRIGHT },
            track: [],
        },
        {
            id: "bench-2",
            label: "Middle bench",
            component: "ring",
            props: { outer: 46, inner: 30, length: 6 },
            assembled: { position: y(-6), rotation: UPRIGHT },
            track: [],
        },
        {
            id: "bench-3",
            label: "Lower bench",
            component: "ring",
            props: { outer: 30, inner: 15, length: 6 },
            assembled: { position: y(-12), rotation: UPRIGHT },
            track: [],
        },
        {
            id: "pit-floor",
            label: "Pit floor",
            component: "cylinder",
            props: { radius: 15, length: 2 },
            assembled: { position: y(-16), rotation: UPRIGHT },
            track: [
                { at: 0, value: 1 },
                { at: 0.12, value: 0 },
            ],
        },
        {
            id: "truck",
            label: "Haul truck",
            component: "block",
            props: { width: 12, height: 6, depth: 7 },
            assembled: { position: [0, 0, 0] },
            accent: true,
            track: [
                { at: 0.18, position: [8, -11, 0], rotation: [0, 0, 0] },
                { at: 0.4, position: [8, -11, 0], rotation: [0, 0, 0] },
                { at: 0.55, position: [0, -5, 38], rotation: [0, -TAU / 4, 0] },
                { at: 0.7, position: [-38, -5, 0], rotation: [0, -TAU / 2, 0] },
                { at: 0.85, position: [0, 5, -56], rotation: [0, -TAU * 0.75, 0] },
                { at: 0.95, position: [56, 5, 0], rotation: [0, -TAU, 0], opacity: 1 },
                { at: 1, opacity: 0 },
            ],
        },
    ],
    particles: [
        {
            id: "blasted-rock",
            count: 120,
            size: [24, 12, 24],
            center: [0, -10, 0],
            mode: "fall",
            seed: 3,
            track: [
                { at: 0, opacity: 0, value: 1 },
                { at: 0.04, opacity: 1 },
                { at: 0.22, opacity: 1 },
                { at: 0.32, opacity: 0 },
            ],
        },
    ],
};

// One mixer-settler: a mixer box with an impeller beside a settler holding
// aqueous below and organic above.
function settler(i: number, x: number): ProcessLoopSpec["actors"] {
    const wave = (i * 0.14) % 1;
    return [
        {
            id: `aqueous-${i}`,
            label: `Stage ${i + 1} aqueous`,
            component: "block",
            props: { width: 14, height: 7, depth: 14 },
            assembled: { position: [x, -3.5, 0] },
            track: [],
        },
        {
            id: `organic-${i}`,
            label: `Stage ${i + 1} organic`,
            component: "block",
            props: { width: 14, height: 5, depth: 14 },
            assembled: { position: [x, 2.5, 0] },
            track: [
                { at: wave, value: 0 },
                { at: Math.min(1, wave + 0.12), value: 1 },
                { at: Math.min(1, wave + 0.3), value: 0.2 },
            ],
        },
        {
            id: `impeller-${i}`,
            label: `Stage ${i + 1} mixer`,
            component: "spur-gear",
            props: { teeth: 6, module: 0.8, width: 1.5 },
            assembled: { position: [x, 9, 0], rotation: UPRIGHT },
            track: [
                { at: 0, rotation: [0, 0, 0] },
                { at: 1, rotation: [0, TAU * 3, 0] },
            ],
        },
    ];
}

export const SOLVENT_EXTRACTION_LOOP: ProcessLoopSpec = {
    id: "solvent-extraction-loop",
    title: "Mixer-settler cascade",
    duration: 7,
    posterAt: 0.45,
    steps: [
        { at: 0, label: "Mix" },
        { at: 0.3, label: "Settle" },
        { at: 0.6, label: "Advance" },
    ],
    actors: [0, 1, 2, 3, 4].flatMap((i) => settler(i, (i - 2) * 18)),
};

export const ELECTROLYSIS_LOOP: ProcessLoopSpec = {
    id: "electrolysis-loop",
    title: "Fluoride electrolysis cell",
    duration: 6,
    posterAt: 0.55,
    steps: [
        { at: 0, label: "Feed oxide" },
        { at: 0.25, label: "Current on" },
        { at: 0.55, label: "Metal drips" },
    ],
    actors: [
        {
            id: "cell",
            label: "Cell",
            component: "housing",
            props: { profile: "cup", outer: 30, length: 40, wall: 3 },
            assembled: { rotation: UPRIGHT },
            // See-through so the cathode and droplets read.
            track: [
                { at: 0.2, value: 0, opacity: 0.32 },
                { at: 0.35, value: 0.8 },
                { at: 0.9, value: 0.8 },
                { at: 1, value: 0 },
            ],
        },
        {
            id: "anode",
            label: "Graphite anode",
            component: "ring",
            props: { outer: 20, inner: 15, length: 30 },
            assembled: { position: y(6), rotation: UPRIGHT },
            track: [],
        },
        {
            id: "cathode",
            label: "Tungsten cathode",
            component: "cylinder",
            props: { radius: 3, length: 48 },
            assembled: { position: y(10), rotation: UPRIGHT },
            accent: true,
            track: [],
        },
        {
            id: "metal-pool",
            label: "Metal receiver",
            component: "cylinder",
            props: { radius: 7, length: 4 },
            assembled: { position: y(-15), rotation: UPRIGHT },
            track: [
                { at: 0.5, scale: 0.6 },
                { at: 0.95, scale: 1 },
            ],
        },
    ],
    particles: [
        {
            id: "droplets",
            count: 40,
            size: [5, 22, 5],
            center: [0, -4, 0],
            mode: "fall",
            seed: 11,
            track: [
                { at: 0.4, opacity: 0, value: 1 },
                { at: 0.5, opacity: 1 },
                { at: 0.92, opacity: 1 },
                { at: 1, opacity: 0 },
            ],
        },
    ],
};

export const STRIP_CASTING_LOOP: ProcessLoopSpec = {
    id: "strip-casting-loop",
    title: "Strip casting on a chilled wheel",
    duration: 6,
    posterAt: 0.5,
    steps: [
        { at: 0, label: "Melt" },
        { at: 0.2, label: "Pour" },
        { at: 0.45, label: "Quench" },
        { at: 0.7, label: "Flake" },
    ],
    actors: [
        {
            id: "crucible",
            label: "Crucible",
            component: "housing",
            props: { profile: "cup", outer: 12, length: 18, wall: 2 },
            assembled: { position: [-30, 34, 0], rotation: UPRIGHT },
            track: [
                { at: 0, rotation: [0, 0, 0], value: 0.6 },
                { at: 0.2, rotation: [0, 0, -0.6], value: 1 },
                { at: 0.85, rotation: [0, 0, -0.6] },
                { at: 1, rotation: [0, 0, 0] },
            ],
        },
        {
            id: "tundish",
            label: "Tundish",
            component: "block",
            props: { width: 20, height: 3, depth: 14 },
            assembled: { position: [-14, 26, 0], rotation: [0, 0, -0.3] },
            track: [
                { at: 0.15, value: 0 },
                { at: 0.25, value: 1 },
                { at: 0.85, value: 1 },
                { at: 0.95, value: 0 },
            ],
        },
        {
            id: "wheel",
            label: "Water-cooled copper wheel",
            component: "cylinder",
            props: { radius: 22, length: 18, bore: 6 },
            assembled: { position: [0, 0, 0] },
            accent: true,
            track: [
                { at: 0, rotation: [0, 0, 0] },
                { at: 0.25, rotation: [0, 0, -TAU / 4] },
                { at: 0.5, rotation: [0, 0, -TAU / 2] },
                { at: 0.75, rotation: [0, 0, -TAU * 0.75] },
                { at: 1, rotation: [0, 0, -TAU] },
            ],
        },
    ],
    particles: [
        {
            id: "flakes",
            count: 90,
            size: [14, 30, 12],
            center: [30, -16, 0],
            mode: "fall",
            seed: 5,
            track: [
                { at: 0.35, opacity: 0, value: 1, scale: 1.6 },
                { at: 0.45, opacity: 1 },
                { at: 0.9, opacity: 1 },
                { at: 1, opacity: 0 },
            ],
        },
    ],
};

export const HYDROGEN_DECREPITATION_LOOP: ProcessLoopSpec = {
    id: "hydrogen-decrepitation-loop",
    title: "Flakes cracking in hydrogen",
    duration: 6,
    posterAt: 0.55,
    steps: [
        { at: 0, label: "Charge H2" },
        { at: 0.3, label: "Crack" },
        { at: 0.7, label: "Degas" },
    ],
    actors: [
        {
            id: "vessel",
            label: "Hydrogen vessel",
            component: "ring",
            props: { outer: 30, inner: 27, length: 8 },
            assembled: { position: y(-12), rotation: UPRIGHT },
            track: [
                { at: 0.65, value: 0 },
                { at: 0.75, value: 0.7 },
                { at: 0.95, value: 0 },
            ],
        },
        ...[-12, 0, 12].map((x, i) => ({
            id: `flake-${i + 1}`,
            label: "Alloy flake",
            component: "block" as const,
            props: { width: 10, height: 1.2, depth: 16 },
            assembled: {
                position: [x, -2 + i * 2, 0] as Vec3,
                rotation: [0, i * 0.6, 0.2] as Vec3,
            },
            accent: i === 1,
            track: [
                { at: 0.25, opacity: 1, scale: 1 },
                { at: 0.5, opacity: 0, scale: 0.4 },
                { at: 0.98, opacity: 0, scale: 0.4 },
                { at: 1, opacity: 1, scale: 1 },
            ],
        })),
    ],
    particles: [
        {
            id: "coarse-powder",
            count: 160,
            size: [36, 10, 24],
            center: [0, -4, 0],
            mode: "fall",
            seed: 9,
            track: [
                { at: 0.3, opacity: 0, value: 0.3 },
                { at: 0.5, opacity: 1 },
                { at: 0.92, opacity: 1 },
                { at: 1, opacity: 0 },
            ],
        },
    ],
};

export const JET_MILL_LOOP: ProcessLoopSpec = {
    id: "jet-milling-loop",
    title: "Jet mill in nitrogen",
    duration: 6,
    posterAt: 0.6,
    steps: [
        { at: 0, label: "Feed" },
        { at: 0.25, label: "Collide" },
        { at: 0.7, label: "Classify" },
    ],
    actors: [
        {
            id: "chamber",
            label: "Grinding chamber",
            component: "ring",
            props: { outer: 34, inner: 31, length: 14 },
            assembled: { rotation: UPRIGHT },
            track: [],
        },
        {
            id: "nozzles",
            label: "Gas nozzles",
            component: "bolt",
            props: { diameter: 3, length: 8, count: 4, circle: 30 },
            assembled: { rotation: UPRIGHT },
            track: [
                { at: 0.15, value: 0 },
                { at: 0.25, value: 1 },
                { at: 0.85, value: 1 },
                { at: 0.95, value: 0 },
            ],
        },
        {
            id: "classifier",
            label: "Classifier wheel",
            component: "spur-gear",
            props: { teeth: 18, module: 1, width: 4, bore: 3 },
            assembled: { position: y(16), rotation: UPRIGHT },
            accent: true,
            track: [
                { at: 0, rotation: [0, 0, 0] },
                { at: 1, rotation: [0, 0, TAU * 2] },
            ],
        },
    ],
    particles: [
        {
            id: "powder",
            count: 220,
            size: [52, 8, 52],
            mode: "swirl",
            axis: "y",
            seed: 13,
            track: [
                { at: 0, opacity: 0, value: 0, scale: 2.4 },
                { at: 0.1, opacity: 1 },
                { at: 0.25, value: 1 },
                { at: 0.8, scale: 0.7 },
                { at: 0.92, opacity: 1 },
                { at: 1, opacity: 0 },
            ],
        },
    ],
};

export const SINTERING_LOOP: ProcessLoopSpec = {
    id: "sintering-loop",
    title: "Vacuum sintering furnace",
    duration: 7,
    posterAt: 0.5,
    steps: [
        { at: 0, label: "Heat" },
        { at: 0.3, label: "Densify" },
        { at: 0.6, label: "Anneal" },
        { at: 0.85, label: "Cool" },
    ],
    actors: [
        {
            id: "furnace",
            label: "Furnace tube",
            component: "housing",
            props: { profile: "tube", outer: 26, length: 70, wall: 3 },
            assembled: { rotation: [0, TAU / 4, 0] },
            // See-through so the blocks inside read.
            track: [
                { at: 0, value: 0, opacity: 0.28 },
                { at: 0.3, value: 1 },
                { at: 0.55, value: 1 },
                { at: 0.65, value: 0.5 },
                { at: 0.8, value: 0.5 },
                { at: 1, value: 0 },
            ],
        },
        {
            id: "tray",
            label: "Tray",
            component: "block",
            props: { width: 50, height: 1.5, depth: 24 },
            assembled: { position: y(-9) },
            track: [],
        },
        ...[-14, 0, 14].map((x, i) => ({
            id: `green-${i + 1}`,
            label: "Pressed block",
            component: "block" as const,
            props: { width: 10, height: 10, depth: 14 },
            assembled: { position: [x, -3, 0] as Vec3 },
            accent: i === 1,
            track: [
                { at: 0.05, scale: 1, position: [0, 0, 0] as Vec3 },
                { at: 0.45, scale: 0.84, position: [0, -0.8, 0] as Vec3 },
                { at: 0.97, scale: 0.84, position: [0, -0.8, 0] as Vec3 },
                { at: 1, scale: 1, position: [0, 0, 0] as Vec3 },
            ],
        })),
    ],
};

export const GRAIN_BOUNDARY_DIFFUSION_LOOP: ProcessLoopSpec = {
    id: "grain-boundary-diffusion-loop",
    title: "Dy or Tb diffusing along grain boundaries",
    duration: 7,
    posterAt: 0.55,
    steps: [
        { at: 0, label: "Coat Dy/Tb" },
        { at: 0.3, label: "Heat" },
        { at: 0.55, label: "Diffuse" },
    ],
    actors: [
        {
            id: "magnet",
            label: "Sintered magnet (cutaway)",
            component: "block",
            props: { width: 40, height: 16, depth: 24, slices: 7 },
            assembled: { position: y(-4) },
            track: [
                { at: 0.3, value: 0, opacity: 0.45 },
                { at: 0.85, value: 0.9 },
                { at: 1, value: 0 },
            ],
        },
        {
            id: "coating",
            label: "Dy/Tb layer",
            component: "block",
            props: { width: 40, height: 1.2, depth: 24 },
            assembled: { position: y(4.8) },
            accent: true,
            track: [
                { at: 0, opacity: 0, position: y(8) },
                { at: 0.15, opacity: 1, position: y(0) },
                { at: 0.4, opacity: 1 },
                { at: 0.8, opacity: 0.1 },
                { at: 1, opacity: 0 },
            ],
        },
    ],
    particles: [
        {
            id: "heavy-atoms",
            count: 140,
            size: [38, 14, 22],
            center: [0, -3, 0],
            mode: "fall",
            seed: 21,
            track: [
                { at: 0.35, opacity: 0, value: 0.4, scale: 0.6 },
                { at: 0.5, opacity: 1 },
                { at: 0.9, opacity: 1 },
                { at: 1, opacity: 0 },
            ],
        },
    ],
};

export const MACHINING_LOOP: ProcessLoopSpec = {
    id: "machining-loop",
    title: "Wire saw slicing a block into segments",
    duration: 6,
    posterAt: 0.5,
    steps: [
        { at: 0, label: "Fix" },
        { at: 0.15, label: "Slice" },
        { at: 0.7, label: "Grind" },
    ],
    actors: [
        {
            id: "block",
            label: "Sintered block",
            component: "block",
            props: { width: 44, height: 14, depth: 22, slices: 4 },
            track: [{ at: 0, opacity: 0.45 }],
        },
        ...[-17.6, -8.8, 0, 8.8, 17.6].map((x, i) => ({
            id: `wire-${i + 1}`,
            label: "Diamond wire",
            component: "cylinder" as const,
            props: { radius: 0.5, length: 44 },
            assembled: { position: [x, 0, 0] as Vec3 },
            accent: i === 2,
            track: [
                { at: 0.1, position: [0, 12, 0] as Vec3 },
                { at: 0.6, position: [0, -12, 0] as Vec3 },
                { at: 0.9, position: [0, -12, 0] as Vec3 },
                { at: 1, position: [0, 12, 0] as Vec3 },
            ],
        })),
        {
            id: "fixture",
            label: "Fixture plate",
            component: "block",
            props: { width: 54, height: 3, depth: 30 },
            assembled: { position: y(-9) },
            track: [],
        },
    ],
    particles: [
        {
            id: "swarf",
            count: 100,
            size: [44, 16, 22],
            center: [0, -18, 0],
            mode: "fall",
            seed: 17,
            track: [
                { at: 0.15, opacity: 0, value: 1, scale: 0.6 },
                { at: 0.25, opacity: 1 },
                { at: 0.62, opacity: 1 },
                { at: 0.72, opacity: 0 },
            ],
        },
    ],
};

export const COATING_LOOP: ProcessLoopSpec = {
    id: "coating-loop",
    title: "Segments dipping through plating baths",
    duration: 7,
    posterAt: 0.62,
    steps: [
        { at: 0, label: "Clean" },
        { at: 0.25, label: "Nickel" },
        { at: 0.5, label: "Copper" },
        { at: 0.75, label: "Nickel" },
    ],
    actors: [
        ...[-30, 0, 30].map((x, i) => ({
            id: `bath-${i + 1}`,
            label: i === 1 ? "Copper bath" : "Nickel bath",
            component: "housing" as const,
            props: { profile: "cup" as const, outer: 13, length: 22, wall: 1.5 },
            assembled: { position: [x, -8, 0] as Vec3, rotation: UPRIGHT },
            track: [],
        })),
        {
            id: "rack",
            label: "Rack of segments",
            component: "arc-segment",
            props: { outer: 9, inner: 5, angle: 0.9, length: 14, count: 3 },
            assembled: { position: [-30, 22, 0], rotation: UPRIGHT },
            accent: true,
            track: [
                { at: 0.05, position: [0, 0, 0] },
                { at: 0.15, position: [0, -26, 0], value: 0 },
                { at: 0.27, position: [0, 0, 0], value: 0.4 },
                { at: 0.33, position: [30, 0, 0] },
                { at: 0.43, position: [30, -26, 0] },
                { at: 0.52, position: [30, 0, 0], value: 0.7 },
                { at: 0.58, position: [60, 0, 0] },
                { at: 0.68, position: [60, -26, 0] },
                { at: 0.78, position: [60, 0, 0], value: 1 },
                { at: 0.95, position: [60, 0, 0], value: 1 },
                { at: 1, position: [0, 0, 0], value: 0 },
            ],
        },
    ],
};

export const MAGNETISING_LOOP: ProcessLoopSpec = {
    id: "magnetising-loop",
    title: "Pulse coil magnetising a rotor ring",
    duration: 5,
    posterAt: 0.6,
    steps: [
        { at: 0, label: "Load" },
        { at: 0.35, label: "Pulse" },
        { at: 0.6, label: "Magnetised" },
    ],
    actors: [
        {
            id: "segments",
            label: "Magnet segments",
            component: "arc-segment",
            props: { outer: 26, inner: 20, angle: 0.55, length: 16, count: 10 },
            assembled: { rotation: UPRIGHT },
            accent: true,
            track: [
                { at: 0, position: [0, 30, 0] },
                { at: 0.25, position: [0, 0, 0] },
                { at: 0.9, position: [0, 0, 0] },
                { at: 1, position: [0, 30, 0] },
            ],
        },
        {
            id: "coil",
            label: "Pulse coil",
            component: "winding-coils",
            props: { slots: 10, outer: 40, inner: 30, length: 18 },
            assembled: { rotation: UPRIGHT },
            track: [
                { at: 0.34, value: 0 },
                { at: 0.38, value: 1 },
                { at: 0.46, value: 0 },
            ],
        },
    ],
    fields: [
        {
            id: "pole-field",
            kind: "radial",
            count: 20,
            radius: 30,
            length: 20,
            axis: "y",
            track: [
                { at: 0.36, opacity: 0 },
                { at: 0.4, opacity: 1 },
                { at: 0.9, opacity: 1 },
                { at: 0.96, opacity: 0 },
            ],
        },
    ],
};

// Every vignette on the magnet chain, in chain order. Pressing reuses the
// kit's demo loop (and its poster).
export const MAGNET_LOOPS: ProcessLoopSpec[] = [
    OPEN_PIT_LOOP,
    SOLVENT_EXTRACTION_LOOP,
    ELECTROLYSIS_LOOP,
    STRIP_CASTING_LOOP,
    HYDROGEN_DECREPITATION_LOOP,
    JET_MILL_LOOP,
    MAGNET_PRESS_LOOP,
    SINTERING_LOOP,
    GRAIN_BOUNDARY_DIFFUSION_LOOP,
    MACHINING_LOOP,
    COATING_LOOP,
    MAGNETISING_LOOP,
];

// The product state at the end of the chain: magnet segments bonded onto a
// rotor hub, pulled apart along the shaft.
export const MAGNET_ROTOR: ExplodeSceneSpec = {
    id: "magnet-rotor",
    title: "Rotor with bonded magnet segments",
    stagger: 0.05,
    parts: [
        {
            id: "shaft",
            label: "Shaft",
            component: "cylinder",
            props: { radius: 6, length: 70 },
            explodedOffset: [0, 0, -40],
        },
        {
            id: "hub",
            label: "Rotor hub",
            component: "ring",
            props: { outer: 20, inner: 6, length: 30 },
            explodedOffset: [0, 0, -10],
        },
        {
            id: "segments",
            label: "Magnet segments",
            component: "arc-segment",
            props: { outer: 26, inner: 20.2, angle: 0.58, length: 30, count: 10 },
            explodedOffset: [0, 0, 22],
            accent: true,
            bomNodeId: "rotor-magnet",
        },
        {
            id: "sleeve",
            label: "Retaining sleeve",
            component: "ring",
            props: { outer: 27.5, inner: 26.2, length: 30 },
            explodedOffset: [0, 0, 56],
        },
    ],
};
