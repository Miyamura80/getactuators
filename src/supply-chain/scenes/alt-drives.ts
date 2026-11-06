import type { ExplodeSceneSpec, PartSpec, ProcessLoopSpec, Vec3 } from "./spec";

// "Under the hood" scenes for the hydraulic drives and transmission
// alternatives on /alts. Schematic, not to scale and not any one product.
// Millimetres; explodes pull apart along Z unless noted.

const TAU = Math.PI * 2;
const z = (v: number): Vec3 => [0, 0, v];

// The cylinder end every hydraulic drive shares: barrel, piston and rod.
function cylinderParts(at: number): PartSpec[] {
    return [
        {
            id: "barrel",
            label: "Cylinder barrel",
            component: "ring",
            props: { outer: 14, inner: 11, length: 70 },
            assembled: { position: z(at) },
            explodedOffset: z(10),
        },
        {
            id: "piston",
            label: "Piston",
            component: "cylinder",
            props: { radius: 10.8, length: 8 },
            assembled: { position: z(at - 10) },
            explodedOffset: z(50),
        },
        {
            id: "rod",
            label: "Piston rod (output)",
            component: "cylinder",
            props: { radius: 5, length: 90 },
            assembled: { position: z(at + 30) },
            accent: true,
            explodedOffset: z(90),
        },
    ];
}

// Central hydraulics: a remote pump and a servo valve block meter oil into
// the cylinder through hoses.
export const SERVO_HYDRAULIC_EXPLODE: ExplodeSceneSpec = {
    id: "servo-hydraulic-explode",
    title: "Servo-hydraulic joint: pump, servo valve, cylinder",
    stagger: 0.06,
    parts: [
        {
            id: "pump",
            label: "Hydraulic power unit (pump)",
            component: "cylinder",
            props: { radius: 16, length: 30 },
            assembled: { position: [0, 40, -50] },
            explodedOffset: [0, 30, -40],
        },
        {
            id: "hoses",
            label: "High-pressure hoses",
            component: "coil",
            props: { radius: 3, wire: 1, pitch: 6, turns: 6 },
            assembled: { position: [0, 22, -40], rotation: [Math.PI / 2, 0, 0] },
            explodedOffset: [0, 14, -26],
        },
        {
            id: "valve",
            label: "Servo valve block",
            component: "block",
            props: { width: 24, height: 14, depth: 22 },
            assembled: { position: [0, 20, -20] },
            explodedOffset: [0, 26, -6],
        },
        ...cylinderParts(0),
    ],
};

// Electro-hydrostatic actuator: motor, pump, small reservoir and cylinder in
// one sealed unit, so only wires run to it.
export const EHA_EXPLODE: ExplodeSceneSpec = {
    id: "eha-explode",
    title: "Electro-hydrostatic actuator: a self-contained unit",
    stagger: 0.06,
    parts: [
        {
            id: "motor-stator",
            label: "Electric motor",
            component: "lamination-stack",
            props: { slots: 12, outer: 14, inner: 7, length: 20 },
            assembled: { position: [0, 26, -32] },
            explodedOffset: [0, 0, -46],
        },
        {
            id: "pump",
            label: "Gear pump",
            component: "spur-gear",
            props: { teeth: 12, module: 1.6, width: 8 },
            assembled: { position: [0, 26, -16] },
            explodedOffset: [0, 0, -24],
        },
        {
            id: "reservoir",
            label: "Accumulator and reservoir",
            component: "block",
            props: { width: 26, height: 10, depth: 30 },
            assembled: { position: [0, 14, -10] },
            explodedOffset: [0, 22, -6],
        },
        {
            id: "manifold",
            label: "Valve manifold",
            component: "block",
            props: { width: 30, height: 8, depth: 14 },
            assembled: { position: [0, 4, -30] },
            explodedOffset: [0, 14, -26],
        },
        ...cylinderParts(0),
    ],
};

// Cycloidal reducer: the disc wobbles on an eccentric around a ring of pins,
// turning backwards one lobe per input turn.
const LOBES = 11;
const ECC = 1.6;
const wobble = Array.from({ length: 9 }, (_, i) => {
    const t = i / 8;
    const a = t * TAU * 2;
    return {
        at: t,
        position: [ECC * Math.cos(a), ECC * Math.sin(a), 0] as Vec3,
        rotation: [0, 0, (-t * 2 * TAU) / LOBES] as Vec3,
    };
});

export const CYCLOIDAL_LOOP: ProcessLoopSpec = {
    id: "cycloidal-loop",
    title: "Cycloid disc wobbling on its pins",
    duration: 6,
    posterAt: 0.1,
    steps: [
        { at: 0, label: "Eccentric spins fast" },
        { at: 0.5, label: "Disc rolls one lobe back" },
    ],
    actors: [
        {
            id: "pins",
            label: "Fixed ring of pins",
            component: "cycloid-disc",
            props: {
                lobes: LOBES,
                radius: 34,
                eccentricity: ECC,
                pinRadius: 2.6,
                thickness: 8,
                pinsOnly: true,
            },
            // In the disc's plane, so the lobes visibly roll on the pins.
            assembled: { position: z(0) },
            track: [{ at: 0, opacity: 0.35 }],
        },
        {
            id: "disc",
            label: "Cycloid disc",
            component: "cycloid-disc",
            props: {
                lobes: LOBES,
                radius: 34,
                eccentricity: ECC,
                pinRadius: 2.6,
                thickness: 8,
                holes: 6,
            },
            accent: true,
            track: wobble,
        },
        {
            id: "eccentric",
            label: "Input eccentric",
            component: "cylinder",
            props: { radius: 7, length: 12 },
            track: wobble.map((k) => ({ at: k.at, position: k.position })),
        },
    ],
};

// Cable capstan: a small drum winds a cable that turns a large drum, so the
// ratio is the drum diameters and there is no backlash. The capstan sits on
// the drum's rim, so its cable wrap touches the cable laid on the drum; the
// drum turns the other way by the radius ratio.
const DRUM_R = 40;
const DRUM_Y = -10;
const WRAP_R = 5.6;
const CAPSTAN_Y = DRUM_Y + DRUM_R + WRAP_R;
const spin = (turn: number) => [
    { at: 0, rotation: [0, 0, 0] as Vec3 },
    { at: 0.5, rotation: [0, 0, turn] as Vec3 },
    { at: 1, rotation: [0, 0, 0] as Vec3 },
];
// Capstan turns per half loop; kept small enough that the contact point
// stays on the drum sector.
const CAPSTAN_TURN = TAU * 1.5;
const drumTurn = (-CAPSTAN_TURN * WRAP_R) / DRUM_R;

export const CAPSTAN_LOOP: ProcessLoopSpec = {
    id: "capstan-loop",
    title: "Capstan drive: a small drum winding a cable on a large one",
    duration: 6,
    posterAt: 0.3,
    steps: [
        { at: 0, label: "Motor turns the capstan" },
        { at: 0.5, label: "Cable turns the output drum" },
    ],
    actors: [
        {
            id: "capstan",
            label: "Capstan on the motor",
            component: "cylinder",
            props: { radius: 5, length: 16 },
            assembled: { position: [0, CAPSTAN_Y, 0] },
            track: spin(CAPSTAN_TURN),
        },
        {
            id: "wrap",
            label: "Cable wraps",
            component: "coil",
            props: { radius: WRAP_R, wire: 0.6, pitch: 2, turns: 6 },
            assembled: { position: [0, CAPSTAN_Y, 0] },
            accent: true,
            track: spin(CAPSTAN_TURN),
        },
        {
            id: "drum",
            label: "Output drum sector",
            component: "arc-segment",
            props: { outer: DRUM_R, inner: 30, angle: 1.6, length: 14 },
            assembled: { position: [0, DRUM_Y, 0], rotation: [0, 0, Math.PI / 2] },
            track: spin(drumTurn),
        },
        {
            id: "cable",
            label: "Cable along the drum, anchored at both ends",
            component: "arc-segment",
            props: { outer: DRUM_R + 0.6, inner: DRUM_R, angle: 1.6, length: 1.2 },
            assembled: { position: [0, DRUM_Y, 0], rotation: [0, 0, Math.PI / 2] },
            accent: true,
            track: spin(drumTurn),
        },
    ],
};

// Ball screw beside a planetary roller screw, nuts pulled off.
export const SCREWS_EXPLODE: ExplodeSceneSpec = {
    id: "roller-vs-ball-screw",
    title: "Ball screw and planetary roller screw side by side",
    stagger: 0.05,
    parts: [
        {
            id: "ball-screw",
            label: "Ball screw and nut",
            component: "ball-screw",
            props: { diameter: 14, length: 120, lead: 5, nutLength: 26, nutOuter: 13 },
            assembled: { position: [-30, 0, 0] },
            explodedOffset: [-10, 0, 0],
        },
        {
            id: "roller-screw",
            label: "Roller screw shaft",
            component: "roller-screw",
            props: {
                screwDiameter: 14,
                length: 120,
                lead: 5,
                rollers: 10,
                rollerDiameter: 4.6,
                rollerLength: 26,
                piece: "screw",
            },
            assembled: { position: [30, 0, 0] },
            explodedOffset: [0, 0, 0],
        },
        {
            id: "rollers",
            label: "Threaded rollers (many contact lines)",
            component: "roller-screw",
            props: {
                screwDiameter: 14,
                length: 120,
                lead: 5,
                rollers: 10,
                rollerDiameter: 4.6,
                rollerLength: 26,
                piece: "rollers",
            },
            assembled: { position: [30, 0, 0] },
            accent: true,
            explodedOffset: [0, 0, 40],
        },
        {
            id: "roller-nut",
            label: "Roller screw nut",
            component: "roller-screw",
            props: {
                screwDiameter: 14,
                length: 120,
                lead: 5,
                rollers: 10,
                rollerDiameter: 4.6,
                rollerLength: 26,
                piece: "nut",
            },
            assembled: { position: [30, 0, 0] },
            explodedOffset: [0, 0, 80],
        },
    ],
};

// Concentric magnetic gear: inner and outer magnet rings with different pole
// counts, coupled through a ring of steel pole pieces. No teeth touch.
export const MAGNETIC_GEAR_EXPLODE: ExplodeSceneSpec = {
    id: "magnetic-gear-explode",
    title: "Magnetic gear: a modulator ring between two magnet rings",
    stagger: 0.05,
    parts: [
        {
            id: "inner-rotor",
            label: "Inner rotor, 4 poles (fast)",
            component: "magnet-ring",
            props: {
                poles: 4,
                outer: 20,
                inner: 8,
                length: 24,
                backIron: 3,
                backIronSide: "inner",
            },
            explodedOffset: z(-50),
        },
        {
            id: "modulator",
            label: "Steel pole pieces, 11 (modulator)",
            component: "arc-segment",
            props: { outer: 27, inner: 22, angle: 0.32, length: 24, count: 11 },
            accent: true,
            explodedOffset: z(0),
        },
        {
            id: "outer-rotor",
            label: "Outer rotor, 18 poles (slow)",
            component: "magnet-ring",
            props: {
                poles: 18,
                outer: 36,
                inner: 29,
                length: 24,
                backIron: 3,
                backIronSide: "outer",
            },
            explodedOffset: z(50),
        },
        {
            id: "shaft",
            label: "Input shaft",
            component: "cylinder",
            props: { radius: 5, length: 50 },
            explodedOffset: z(-90),
        },
    ],
};

export const ALT_DRIVE_SCENES = {
    servoHydraulic: SERVO_HYDRAULIC_EXPLODE,
    eha: EHA_EXPLODE,
    cycloidal: CYCLOIDAL_LOOP,
    capstan: CAPSTAN_LOOP,
    screws: SCREWS_EXPLODE,
    magneticGear: MAGNETIC_GEAR_EXPLODE,
};
