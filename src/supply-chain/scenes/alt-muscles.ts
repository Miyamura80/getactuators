import type { LoopActor, ProcessLoopSpec, Vec3 } from "./spec";

// "Under the hood" loops for the artificial muscles on /alts. Schematic: each
// shows the working principle (what squeezes, what shortens, what lifts the
// load) with the shared part library. Millimetres; Y is up.

const UPRIGHT: Vec3 = [-Math.PI / 2, 0, 0];
const TAU = Math.PI * 2;

// A load hanging from the muscle, lifted by `lift` mm while contracted.
function load(lift: number, on: number, off: number): LoopActor {
    return {
        id: "load",
        label: "Load",
        component: "block",
        props: { width: 14, height: 10, depth: 14 },
        assembled: { position: [0, -46, 0] },
        track: [
            { at: on, position: [0, 0, 0] },
            { at: on + 0.18, position: [0, lift, 0] },
            { at: off, position: [0, lift, 0] },
            { at: Math.min(1, off + 0.15), position: [0, 0, 0] },
        ],
    };
}

const anchor: LoopActor = {
    id: "anchor",
    label: "Fixed mount",
    component: "block",
    props: { width: 40, height: 4, depth: 20 },
    assembled: { position: [0, 40, 0] },
    track: [],
};

// HASEL: a liquid-filled pouch; voltage on the electrodes zips them shut from
// one side, pushing liquid into the rest of the pouch, which bulges and
// shortens.
export const HASEL_LOOP: ProcessLoopSpec = {
    id: "hasel-loop",
    title: "HASEL pouch: electrodes zip, liquid bulges, the pouch shortens",
    duration: 5,
    posterAt: 0.45,
    steps: [
        { at: 0, label: "Voltage off" },
        { at: 0.2, label: "Electrodes zip" },
        { at: 0.45, label: "Pouch contracts" },
        { at: 0.75, label: "Release" },
    ],
    actors: [
        anchor,
        {
            id: "pouch",
            label: "Pouch with liquid dielectric",
            component: "block",
            props: { width: 30, height: 60, depth: 4 },
            assembled: { position: [0, 8, 0] },
            accent: true,
            track: [
                { at: 0.2, position: [0, 0, 0], scale: 1 },
                { at: 0.45, position: [0, 6, 0], scale: 0.82 },
                { at: 0.75, position: [0, 6, 0], scale: 0.82 },
                { at: 0.92, position: [0, 0, 0], scale: 1 },
            ],
        },
        ...[-1, 1].map(
            (side): LoopActor => ({
                id: side < 0 ? "electrode-front" : "electrode-back",
                label: "Flexible electrode",
                component: "block",
                props: { width: 30, height: 22, depth: 0.8 },
                assembled: { position: [0, 30, side * 3] },
                track: [
                    { at: 0.2, position: [0, 0, 0], value: 0 },
                    { at: 0.3, value: 1 },
                    { at: 0.45, position: [0, -4, -side * 2], value: 1 },
                    { at: 0.75, position: [0, -4, -side * 2], value: 1 },
                    { at: 0.85, value: 0 },
                    { at: 0.92, position: [0, 0, 0] },
                ],
            }),
        ),
        load(10, 0.22, 0.75),
    ],
};

// Dielectric elastomer: a stack of soft films between electrodes; the field
// squeezes each film thinner, so the stack shortens and spreads.
export const DEA_LOOP: ProcessLoopSpec = {
    id: "dea-loop",
    title: "Dielectric elastomer stack squeezed thin by the field",
    duration: 4,
    posterAt: 0.45,
    steps: [
        { at: 0, label: "Voltage off" },
        { at: 0.25, label: "Field squeezes films" },
        { at: 0.7, label: "Release" },
    ],
    actors: Array.from({ length: 6 }, (_, i): LoopActor => {
        const y = (i - 2.5) * 7;
        return {
            id: `film-${i + 1}`,
            label: i % 2 === 0 ? "Elastomer film" : "Compliant electrode film",
            component: "cylinder",
            props: { radius: 22, length: 5 },
            assembled: { position: [0, y, 0], rotation: UPRIGHT },
            accent: i === 0,
            track: [
                { at: 0.25, position: [0, 0, 0], scale: 1, value: 0 },
                { at: 0.45, position: [0, -y * 0.3, 0], scale: 1.12, value: 1 },
                { at: 0.7, position: [0, -y * 0.3, 0], scale: 1.12, value: 1 },
                { at: 0.9, position: [0, 0, 0], scale: 1, value: 0 },
            ],
        };
    }),
};

// Twisted and coiled polymer: a nylon line twisted until it coils; heat
// untwists the fibre and the coil pulls shorter.
export const TCP_LOOP: ProcessLoopSpec = {
    id: "tcp-loop",
    title: "Coiled nylon fibre contracting when heated",
    duration: 5,
    posterAt: 0.45,
    steps: [
        { at: 0, label: "Cool" },
        { at: 0.2, label: "Heat: fibre untwists" },
        { at: 0.45, label: "Coil shortens" },
        { at: 0.75, label: "Cool and relax" },
    ],
    actors: [
        anchor,
        {
            id: "coil",
            label: "Twisted, coiled nylon fibre",
            component: "coil",
            props: { radius: 5, wire: 1.4, pitch: 4, turns: 14 },
            assembled: { position: [0, 8, 0], rotation: UPRIGHT },
            accent: true,
            track: [
                { at: 0.2, rotation: [0, 0, 0], scale: 1, value: 0 },
                { at: 0.45, rotation: [0, TAU / 3, 0], scale: 0.86, value: 1 },
                { at: 0.75, rotation: [0, TAU / 3, 0], scale: 0.86, value: 1 },
                { at: 0.95, rotation: [0, 0, 0], scale: 1, value: 0 },
            ],
        },
        load(8, 0.22, 0.75),
    ],
};

// Shape memory alloy: a NiTi spring stretched cold returns to its trained
// short shape when current heats it past its transition.
export const SMA_LOOP: ProcessLoopSpec = {
    id: "sma-loop",
    title: "Shape memory alloy spring snapping back when heated",
    duration: 5,
    posterAt: 0.45,
    steps: [
        { at: 0, label: "Cold, stretched" },
        { at: 0.2, label: "Current heats NiTi" },
        { at: 0.45, label: "Recovers its shape" },
        { at: 0.75, label: "Cools" },
    ],
    actors: [
        anchor,
        {
            id: "spring",
            label: "NiTi wire spring",
            component: "coil",
            props: { radius: 8, wire: 0.9, pitch: 5, turns: 10 },
            assembled: { position: [0, 12, 0], rotation: UPRIGHT },
            accent: true,
            track: [
                { at: 0.2, scale: 1, value: 0 },
                { at: 0.4, scale: 0.75, value: 1 },
                { at: 0.75, scale: 0.75, value: 1 },
                { at: 0.95, scale: 1, value: 0 },
            ],
        },
        load(12, 0.22, 0.75),
    ],
};

// McKibben muscle (pneumatic or hydraulic): an inner bladder in a braided
// sleeve; pressure widens it and the braid angle turns that into pull.
function mckibben(
    id: string,
    title: string,
    medium: string,
    withPump: boolean,
): ProcessLoopSpec {
    const actors: LoopActor[] = [
        anchor,
        {
            id: "bladder",
            label: `Rubber bladder (${medium} inside)`,
            component: "cylinder",
            props: { radius: 7, length: 56 },
            assembled: { position: [0, 8, 0], rotation: UPRIGHT },
            track: [
                { at: 0.2, scale: 1, position: [0, 0, 0] },
                { at: 0.45, scale: 1.18, position: [0, 6, 0] },
                { at: 0.75, scale: 1.18, position: [0, 6, 0] },
                { at: 0.95, scale: 1, position: [0, 0, 0] },
            ],
        },
        {
            id: "braid",
            label: "Braided sleeve",
            component: "coil",
            props: {
                radius: 8,
                wire: 0.5,
                pitch: 7,
                turns: 8,
                strands: 3,
                crossed: true,
            },
            assembled: { position: [0, 8, 0], rotation: UPRIGHT },
            accent: true,
            track: [
                { at: 0.2, scale: 1, position: [0, 0, 0] },
                { at: 0.45, scale: 1.12, position: [0, 6, 0] },
                { at: 0.75, scale: 1.12, position: [0, 6, 0] },
                { at: 0.95, scale: 1, position: [0, 0, 0] },
            ],
        },
        load(12, 0.22, 0.75),
    ];
    if (withPump)
        actors.push({
            id: "pump",
            label: "Electric pump and valve",
            component: "block",
            props: { width: 16, height: 12, depth: 16 },
            assembled: { position: [34, 40, 0] },
            track: [
                { at: 0.15, value: 0 },
                { at: 0.2, value: 1 },
                { at: 0.45, value: 0 },
            ],
        });
    return {
        id,
        title,
        duration: 5,
        posterAt: 0.45,
        steps: [
            { at: 0, label: "Vent" },
            { at: 0.2, label: `${medium} in` },
            { at: 0.45, label: "Widens, shortens" },
            { at: 0.75, label: "Vent" },
        ],
        actors,
    };
}

export const MCKIBBEN_LOOP = mckibben(
    "mckibben-loop",
    "McKibben muscle: pressure widens the braid and shortens it",
    "Air",
    false,
);

export const HYDRAULIC_MUSCLE_LOOP = mckibben(
    "hydraulic-muscle-loop",
    "Hydraulic artificial muscle driven by an electric pump",
    "Oil",
    true,
);

export const ALT_MUSCLE_SCENES = {
    hasel: HASEL_LOOP,
    dea: DEA_LOOP,
    tcp: TCP_LOOP,
    sma: SMA_LOOP,
    mckibben: MCKIBBEN_LOOP,
    hydraulicMuscle: HYDRAULIC_MUSCLE_LOOP,
};
