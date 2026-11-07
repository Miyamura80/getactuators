import type { Vec3 } from "../../scenes/spec";
import type { Sourced } from "../../sourced";
import {
    MAGNET_STEPS,
    boardCopper,
    dieSilicon,
    disc,
    magnetContent,
    magnetGrams,
    ring,
    weighed,
} from "../make";
import type { BomCase, BomNode } from "../types";

// Unitree GO-M8010-6, the Go1 joint motor Unitree sells on its own shop:
// price, mass and the 6.33:1 reduction are published. Unitree publishes no
// internals for this motor, so the layout follows teardowns of its sibling,
// the Go2's GO-M8018-6 (outrunner, 36 slots and 42 poles, one planetary
// stage, magnetic encoder, Cortex-M0 driver board), sized to the M8010-6's
// 530 g. Unitree designs the motor, gearbox and driver itself, so no part
// inside has a public price: every node below the motor carries only its
// raw material, and the step from that to the shelf price is Unitree's.

const z = (v: number): Vec3 => [0, 0, v];
const SIBLING = ["simplexity-go2-motor"];
const LISTING = ["unitree-go1-motor-page"];
const shape = { sources: SIBLING, inferred: true } as const;

const PRICE: Sourced<number> = {
    value: 369,
    unit: "USD",
    sources: ["unitree-go1-motor-shop"],
    asOf: "2026",
    confidence: "reported",
    note: "Unitree shop price for one GO-M8010-6; resellers list it at $280 to $439.",
};

const MASS: Sourced<number> = {
    value: 530,
    unit: "g",
    sources: LISTING,
    asOf: "2026",
    confidence: "reported",
    note: "About 530 g, per Unitree's motor page.",
};

const UNITREE: Pick<BomNode, "makerIds" | "makerConfidence" | "makerNote"> = {
    makerIds: ["unitree"],
    makerConfidence: "reported",
    makerNote: "Unitree designs and builds its joint motors in house.",
};

// Planetary: sun 12, planets 26, ring 64 at module 0.8 gives 1 + 64/12 =
// 6.33, the published ratio. Tooth counts are ours; the Go2 sibling's 9/19/47
// gives 6.22.
const PLANET = {
    sunTeeth: 12,
    planetTeeth: 26,
    planets: 3,
    module: 0.8,
    width: 7,
    rim: 28.5,
} as const;

const MAGNET = magnetGrams(ring(39, 37, 10, 0.85), SIBLING);

const motor: BomNode = {
    id: "motor",
    label: "Outrunner motor",
    kind: "assembly",
    ...UNITREE,
    sources: SIBLING,
    note: "36 slots and 42 poles in the Go2 sibling: a fractional-slot outrunner, magnets on the outside.",
    children: [
        {
            id: "stator",
            label: "Stator",
            kind: "component",
            ...shape,
            children: [
                weighed(
                    "stator-laminations",
                    "Laminations",
                    "electrical-steel",
                    ring(36, 22, 10, 0.55),
                    SIBLING,
                    {
                        ...shape,
                        part3d: {
                            component: "lamination-stack",
                            props: {
                                slots: 36,
                                outer: 36,
                                inner: 22,
                                length: 10,
                                teeth: "outer",
                                sheets: 7,
                            },
                            assembled: { position: z(-6) },
                            explodedOffset: z(0),
                        },
                    },
                ),
                weighed(
                    "stator-windings",
                    "Copper windings",
                    "copper",
                    ring(36, 22, 10, 0.27),
                    SIBLING,
                    {
                        makerIds: ["jiangxi-copper"],
                        makerConfidence: "modeled",
                        makerNote:
                            "China's largest copper producer stands in for the wire's source.",
                        ...shape,
                        part3d: {
                            component: "winding-coils",
                            props: {
                                slots: 36,
                                outer: 36,
                                inner: 22,
                                length: 10,
                                teeth: "outer",
                            },
                            assembled: { position: z(-6) },
                            explodedOffset: z(-34),
                        },
                        note: "Slots take 45% of the stack, copper fills 40% of a slot; a short stack's end turns add half again.",
                    },
                ),
            ],
        },
        {
            id: "rotor",
            label: "Outer rotor",
            kind: "component",
            ...shape,
            part3d: {
                component: "magnet-ring",
                props: {
                    poles: 42,
                    outer: 41,
                    inner: 37,
                    length: 10,
                    backIron: 2,
                    backIronSide: "outer",
                },
                assembled: { position: z(-6) },
                explodedOffset: z(34),
            },
            children: [
                {
                    id: "rotor-magnet",
                    label: "NdFeB magnets",
                    kind: "component",
                    qty: 1,
                    makerNote:
                        "Unitree does not name its magnet supplier; any of China's large magnet makers could supply it.",
                    alternateMakerIds: [
                        "ningbo-yunsheng",
                        "zhong-ke-san-huan",
                        "jl-mag",
                    ],
                    processStepIds: MAGNET_STEPS,
                    ...shape,
                    note: "42 arc segments glued inside the rotor cup.",
                    children: magnetContent("rotor-magnet", MAGNET),
                },
                weighed(
                    "rotor-cup",
                    "Rotor back iron",
                    "carbon-steel",
                    ring(41, 39, 10),
                    SIBLING,
                ),
            ],
        },
    ],
};

const gearbox: BomNode = {
    id: "planetary",
    label: "Planetary gear stage",
    kind: "assembly",
    ...UNITREE,
    sources: [...SIBLING, ...LISTING],
    note: "One stage, sun driven by the rotor, output on the planet carrier; 6.33:1 is Unitree's figure.",
    part3d: {
        component: "planetary-stage",
        props: PLANET,
        assembled: { position: z(10) },
        explodedOffset: z(70),
    },
    children: [
        weighed(
            "sun-gear",
            "Sun gear steel",
            "bearing-steel",
            disc(4.8, 7, 0.9),
            SIBLING,
            { inferred: true },
        ),
        weighed(
            "planet-gears",
            "Planet gear steel",
            "bearing-steel",
            ring(10.4, 3, 7, 0.9),
            SIBLING,
            { qty: 3, inferred: true },
        ),
        weighed(
            "ring-gear",
            "Ring gear steel",
            "bearing-steel",
            ring(28.5, 25.6, 7, 0.95),
            SIBLING,
            { inferred: true },
        ),
        {
            id: "planet-carrier",
            label: "Planet carrier",
            kind: "component",
            ...shape,
            part3d: {
                component: "cylinder",
                props: { radius: 22, length: 3, bore: 5 },
                assembled: { position: z(16) },
                explodedOffset: z(100),
                accent: true,
            },
            children: [
                weighed(
                    "carrier-steel",
                    "Carrier steel",
                    "carbon-steel",
                    disc(22, 3, 0.8),
                    SIBLING,
                ),
            ],
        },
    ],
};

const electronics: BomNode = {
    id: "driver-board",
    label: "FOC driver board",
    kind: "component",
    ...UNITREE,
    sources: ["simplefoc-go2-motor-2026", "hackaday-go-m8018-2026"],
    inferred: true,
    note: "Inverter, current sensing and RS-485 on one board; Unitree sands the chip markings off.",
    part3d: {
        component: "pcb",
        props: { shape: "round", width: 76, thickness: 1.6, bore: 8, chips: 6 },
        assembled: { position: z(-17) },
        explodedOffset: z(-110),
    },
    children: [
        weighed("board-copper", "Board copper", "copper", boardCopper(38), SIBLING),
        {
            id: "mcu",
            label: "Motor-control MCU",
            kind: "component",
            makerIds: ["cmsemicon"],
            makerConfidence: "estimated",
            makerNote:
                "A reverse engineer identifies a Cmsemicon CMS32M57-series Cortex-M0; the markings are removed, so this is his reading.",
            sources: ["simplefoc-go2-motor-2026"],
            inferred: true,
            children: [
                weighed("mcu-silicon", "MCU die", "silicon", dieSilicon(6), [
                    "simplefoc-go2-motor-2026",
                ]),
            ],
        },
        weighed(
            "power-silicon",
            "Power stage dies",
            "silicon",
            dieSilicon(12),
            SIBLING,
            { inferred: true },
        ),
    ],
};

export const UNITREE_QDD: BomCase = {
    slug: "unitree-qdd",
    name: "Unitree GO-M8010-6 joint motor",
    short: "Unitree QDD",
    subject: "Quasi-direct-drive joint motor from the Go1 quadruped, 6.33:1",
    actuatorId: "unitree-go-m8010-6",
    price: PRICE,
    massG: MASS,
    volumeAssumption: "Retail price for one unit on Unitree's shop.",
    month: "2026-09",
    why: "A cheap, high-volume joint: one company designs the motor, gearbox and driver, so the chain has few hand-offs.",
    takeaway:
        "No supplier margin sits between the metal and the shelf: almost everything above raw material is Unitree's own step.",
    root: {
        id: "unitree-qdd",
        label: "GO-M8010-6 joint motor",
        kind: "assembly",
        unitCost: PRICE,
        ...UNITREE,
        sources: [...LISTING, "unitree-go1-motor-shop"],
        note: "Unitree's core business ran a 60% gross margin in 2025, per its IPO filing.",
        children: [
            motor,
            gearbox,
            electronics,
            {
                id: "magnetic-encoder",
                label: "Magnetic encoder",
                kind: "component",
                makerNote: "Chip maker not public.",
                sources: ["simplefoc-go2-motor-2026"],
                inferred: true,
                part3d: {
                    component: "encoder",
                    props: { radius: 9, thickness: 2, kind: "magnetic" },
                    assembled: { position: z(-14) },
                    explodedOffset: z(-80),
                },
                children: [
                    weighed("encoder-silicon", "Sensor die", "silicon", dieSilicon(4), [
                        "simplefoc-go2-motor-2026",
                    ]),
                ],
            },
            {
                id: "bearings",
                label: "Ball bearings",
                kind: "component",
                qty: 2,
                makerNote: "Bearing supplier not public.",
                alternateMakerIds: ["zwz-bearing", "lyc-bearing", "nsk"],
                ...shape,
                part3d: {
                    component: "bearing",
                    props: { kind: "deep-groove", outer: 14, inner: 9, width: 5 },
                    assembled: { position: z(12) },
                    explodedOffset: z(130),
                },
                children: [
                    weighed(
                        "bearing-steel",
                        "Bearing steel",
                        "bearing-steel",
                        ring(14, 9, 5, 0.55),
                        SIBLING,
                    ),
                ],
            },
            {
                id: "housing",
                label: "Housing",
                kind: "component",
                ...UNITREE,
                ...shape,
                part3d: {
                    component: "housing",
                    props: {
                        profile: "cup",
                        outer: 47,
                        length: 40,
                        wall: 2,
                        ribs: 24,
                        bolts: 8,
                        bore: 9,
                    },
                    explodedOffset: z(-60),
                },
                children: [
                    weighed(
                        "housing-aluminium",
                        "Aluminium",
                        "aluminium",
                        {
                            cm3:
                                (Math.PI *
                                    ((47 * 47 - 45 * 45) * 40 + 47 * 47 * 2 * 2)) /
                                1000,
                            how: "Cup r 47 mm, 40 mm long, 2 mm walls and two 2 mm faces",
                        },
                        SIBLING,
                    ),
                ],
            },
        ],
    },
};
