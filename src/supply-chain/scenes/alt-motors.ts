import type { ExplodeSceneSpec, PartSpec, ProcessLoopSpec, Vec3 } from "./spec";

// "Under the hood" scenes for the rare-earth-free motors on /alts. Schematic,
// not to scale and not any one product: each shows the working principle
// with the shared part library. Millimetres; explodes pull apart along Z.

const TAU = Math.PI * 2;
const z = (v: number): Vec3 => [0, 0, v];

function stator(
    slots: number,
    outer: number,
    inner: number,
    length: number,
    at: number,
): PartSpec[] {
    return [
        {
            id: "stator",
            label: "Stator laminations",
            component: "lamination-stack",
            props: { slots, outer, inner, length, sheets: 10 },
            explodedOffset: z(at),
        },
        {
            id: "windings",
            label: "Copper windings",
            component: "winding-coils",
            props: { slots, outer, inner, length },
            explodedOffset: z(at - 34),
        },
    ];
}

const shaft = (length: number, at: number, accent = false): PartSpec => ({
    accent,
    id: "shaft",
    label: "Shaft",
    component: "cylinder",
    props: { radius: 5, length },
    explodedOffset: z(at),
});

// Switched reluctance: four salient rotor teeth step towards whichever pair of
// stator poles is energised; no magnets and no rotor copper.
const SRM_PHASES = 3;
export const SRM_LOOP: ProcessLoopSpec = {
    id: "srm-loop",
    title: "Switched reluctance rotor stepping as phases fire",
    duration: 6,
    posterAt: 0.2,
    steps: [
        { at: 0, label: "Phase A on" },
        { at: 1 / 3, label: "Phase B on" },
        { at: 2 / 3, label: "Phase C on" },
    ],
    actors: [
        {
            id: "stator",
            label: "Stator, six salient poles",
            component: "lamination-stack",
            props: { slots: 6, outer: 46, inner: 26, length: 20 },
            track: [],
        },
        ...Array.from({ length: SRM_PHASES }, (_, i) => ({
            id: `phase-${"abc"[i]}`,
            label: `Phase ${"ABC"[i]} coils`,
            component: "arc-segment" as const,
            props: { outer: 40, inner: 30, angle: 0.5, length: 22, count: 2 },
            assembled: { rotation: [0, 0, (i * TAU) / 6] as Vec3 },
            track: [
                { at: i / 3, value: 0 },
                { at: i / 3 + 0.02, value: 1 },
                { at: i / 3 + 0.3, value: 1 },
                { at: Math.min(1, i / 3 + 0.33), value: 0 },
            ],
        })),
        {
            id: "rotor",
            label: "Salient rotor, no magnets",
            component: "rotor-core",
            props: { kind: "salient", poles: 4, outer: 25, inner: 5, length: 20 },
            accent: true,
            track: [
                { at: 0, rotation: [0, 0, 0] },
                { at: 0.08, rotation: [0, 0, 0] },
                { at: 0.3, rotation: [0, 0, TAU / 12] },
                { at: 0.41, rotation: [0, 0, TAU / 12] },
                { at: 0.63, rotation: [0, 0, TAU / 6] },
                { at: 0.74, rotation: [0, 0, TAU / 6] },
                { at: 0.97, rotation: [0, 0, TAU / 4] },
                { at: 1, rotation: [0, 0, TAU / 4] },
            ],
        },
    ],
};

export const SYNRM_EXPLODE: ExplodeSceneSpec = {
    id: "synrm-explode",
    title: "Synchronous reluctance rotor with flux barriers",
    stagger: 0.05,
    parts: [
        ...stator(36, 46, 27, 30, -60),
        {
            id: "rotor",
            label: "Rotor laminations with air flux barriers",
            component: "rotor-core",
            props: {
                kind: "flux-barrier",
                poles: 4,
                layers: 3,
                outer: 26,
                inner: 5,
                length: 30,
            },
            explodedOffset: z(20),
        },
        shaft(60, 60, true),
    ],
};

export const INDUCTION_EXPLODE: ExplodeSceneSpec = {
    id: "induction-explode",
    title: "Induction motor with a squirrel-cage rotor",
    stagger: 0.05,
    parts: [
        ...stator(36, 46, 27, 30, -60),
        {
            id: "cage-rotor",
            label: "Squirrel cage: copper bars and end rings",
            component: "rotor-core",
            props: {
                kind: "cage",
                poles: 4,
                bars: 28,
                outer: 26,
                inner: 5,
                length: 30,
            },
            explodedOffset: z(20),
        },
        shaft(60, 60, true),
    ],
};

export const FERRITE_SPOKE_EXPLODE: ExplodeSceneSpec = {
    id: "ferrite-spoke-explode",
    title: "Spoke rotor with ferrite magnets",
    stagger: 0.05,
    parts: [
        ...stator(36, 46, 27, 30, -60),
        {
            id: "spoke-rotor",
            label: "Spoke rotor: ferrite blocks concentrate flux",
            component: "rotor-core",
            props: { kind: "spoke", poles: 10, outer: 26, inner: 6, length: 30 },
            explodedOffset: z(20),
        },
        shaft(60, 60, true),
    ],
};

export const AXIAL_FLUX_EXPLODE: ExplodeSceneSpec = {
    id: "axial-flux-explode",
    title: "Axial-flux motor: twin rotor discs around a stator",
    stagger: 0.05,
    parts: [
        {
            id: "rotor-a",
            label: "Rotor disc A",
            component: "cylinder",
            props: { radius: 40, length: 3, bore: 6 },
            assembled: { position: z(-9) },
            explodedOffset: z(-40),
        },
        {
            id: "magnets-a",
            label: "Ferrite magnet segments",
            component: "arc-segment",
            props: { outer: 38, inner: 20, angle: 0.42, length: 4, count: 12 },
            assembled: { position: z(-5.5) },
            explodedOffset: z(-24),
        },
        {
            id: "stator",
            label: "Stator teeth and coils",
            component: "arc-segment",
            props: { outer: 38, inner: 20, angle: 0.36, length: 8, count: 9 },
            accent: true,
            explodedOffset: z(0),
        },
        {
            id: "magnets-b",
            label: "Ferrite magnet segments",
            component: "arc-segment",
            props: { outer: 38, inner: 20, angle: 0.42, length: 4, count: 12 },
            assembled: { position: z(5.5) },
            explodedOffset: z(24),
        },
        {
            id: "rotor-b",
            label: "Rotor disc B",
            component: "cylinder",
            props: { radius: 40, length: 3, bore: 6 },
            assembled: { position: z(9) },
            explodedOffset: z(40),
        },
        shaft(40, 70),
    ],
};

// Same rotor, magnet material swapped: NdFeB fades out, iron nitride in.
export const IRON_NITRIDE_LOOP: ProcessLoopSpec = {
    id: "iron-nitride-loop",
    title: "Swapping NdFeB for iron nitride magnets on one rotor",
    duration: 6,
    posterAt: 0.7,
    steps: [
        { at: 0, label: "NdFeB rotor" },
        { at: 0.35, label: "Swap the magnet" },
        { at: 0.6, label: "Iron nitride rotor" },
    ],
    actors: [
        {
            id: "stator",
            label: "Stator",
            component: "lamination-stack",
            props: { slots: 36, outer: 46, inner: 28, length: 22 },
            track: [],
        },
        {
            id: "hub",
            label: "Rotor hub",
            component: "ring",
            props: { outer: 20, inner: 5, length: 22 },
            track: [],
        },
        {
            id: "ndfeb",
            label: "NdFeB magnets (rare earth)",
            component: "magnet-ring",
            props: { poles: 10, outer: 26, inner: 20.5, length: 22 },
            track: [
                { at: 0, position: [0, 0, 0], opacity: 1 },
                { at: 0.3, position: [0, 0, 0], opacity: 1 },
                { at: 0.5, position: [0, 0, 40], opacity: 0 },
                { at: 1, position: [0, 0, 40], opacity: 0 },
            ],
        },
        {
            id: "iron-nitride",
            label: "Iron nitride magnets (no rare earth)",
            component: "magnet-ring",
            props: { poles: 10, outer: 26, inner: 20.5, length: 22 },
            accent: true,
            track: [
                { at: 0, position: [0, 0, -40], opacity: 0 },
                { at: 0.35, position: [0, 0, -40], opacity: 0 },
                { at: 0.6, position: [0, 0, 0], opacity: 1, value: 1 },
                { at: 0.95, position: [0, 0, 0], opacity: 1, value: 0 },
                { at: 1, position: [0, 0, -40], opacity: 0 },
            ],
        },
    ],
};

// Wound-field synchronous: the rotor poles carry their own DC coils, fed
// through slip rings, instead of magnets.
export const WFSM_EXPLODE: ExplodeSceneSpec = {
    id: "wfsm-explode",
    title: "Wound-field rotor fed through slip rings",
    stagger: 0.05,
    parts: [
        ...stator(48, 50, 30, 30, -70),
        {
            id: "rotor-core",
            label: "Salient rotor poles",
            component: "rotor-core",
            props: { kind: "salient", poles: 8, outer: 29, inner: 6, length: 30 },
            explodedOffset: z(10),
        },
        {
            id: "field-coils",
            label: "DC field coils on the rotor",
            component: "winding-coils",
            props: { slots: 8, outer: 29, inner: 12, length: 30, teeth: "outer" },
            accent: true,
            explodedOffset: z(36),
        },
        {
            id: "slip-rings",
            label: "Slip rings",
            component: "ring",
            props: { outer: 9, inner: 5, length: 6 },
            assembled: { position: z(24) },
            explodedOffset: z(62),
        },
        shaft(70, 90),
    ],
};

export const ALT_MOTOR_SCENES = {
    srm: SRM_LOOP,
    synrm: SYNRM_EXPLODE,
    induction: INDUCTION_EXPLODE,
    ferrite: FERRITE_SPOKE_EXPLODE,
    axial: AXIAL_FLUX_EXPLODE,
    ironNitride: IRON_NITRIDE_LOOP,
    wfsm: WFSM_EXPLODE,
};
