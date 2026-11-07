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
    shareOfPrice,
    weighed,
} from "../make";
import type { BomCase, BomNode } from "../types";

// Tesla Optimus linear actuator: a frameless torque motor turning an
// inverted planetary roller screw, with a force sensor, a position sensor
// and two bearings, per secondary accounts of AI Day 2022. Tesla publishes
// no cost or teardown, so:
//   - the price is the average linear unit in two analyst BOMs (range);
//   - part costs are HONPINE's published shares of a linear actuator's cost;
//   - geometry (and so every gram) is our model at a 60 mm, 3,900 N class
//     size, marked inferred.

const z = (v: number): Vec3 => [0, 0, v];
const STACK = ["optimusk-actuators"];
const SHARES = ["honpine-actuator-cost-2025"];
const CNY_PER_USD = 7.2;

// Average linear unit: Huibo's CNY 44,000 for 14 linear units (low) to
// Morgan Stanley's $55k BOM x 56% actuators over 28 body actuators (high).
const LOW = Math.round(44000 / 14 / CNY_PER_USD);
const HIGH = Math.round((55000 * 0.56) / 28);

const PRICE: Sourced<number> = {
    value: Math.round((LOW + HIGH) / 2),
    unit: "USD",
    range: [LOW, HIGH],
    sources: ["huibo-optimus-bom-sc", "ms-optimus-bom-sc"],
    asOf: "2024",
    confidence: "estimated",
    note: `Midpoint of two analyst BOMs for Optimus Gen 2: Huibo's CNY 44,000 for 14 linear units at ${CNY_PER_USD} CNY/USD ($${LOW} each) and Morgan Stanley's $55k robot BOM, 56% actuators over 28 body actuators ($${HIGH} each).`,
};

const SCREW = {
    screwDiameter: 14,
    length: 150,
    lead: 5,
    rollers: 10,
    rollerDiameter: 4.6,
    rollerLength: 24,
    nutOuter: 14,
} as const;

// Geometry is ours: sized to a 60 mm actuator, not measured.
const shape = { sources: STACK, inferred: true } as const;

const rollerScrew: BomNode = {
    id: "roller-screw",
    label: "Planetary roller screw",
    kind: "assembly",
    unitCost: shareOfPrice(
        PRICE,
        0.642,
        SHARES,
        "the roller screw's share of a linear actuator's cost (HONPINE).",
    ),
    makerIds: ["beite"],
    makerConfidence: "modeled",
    makerNote:
        "Tesla has not named its roller screw supplier. Beite, a listed Chinese maker sampling planetary roller screws for humanoids, stands in.",
    alternateMakerIds: ["best-precision", "nousbot"],
    references: [
        {
            label: "Market average, bank estimate",
            value: {
                value: 2025,
                unit: "USD",
                range: [1350, 2700],
                sources: ["holistic-roller-screws-2025"],
                asOf: "2025",
                confidence: "estimated",
                note: "Average planetary roller screw price as relayed from an investment bank; today's low-volume market, not Tesla's contract price.",
            },
        },
        {
            label: "Foreign makers' unit price",
            value: {
                value: Math.round(5000 / CNY_PER_USD),
                unit: "USD",
                sources: ["kgg-humanoid-screws"],
                asOf: "2025",
                confidence: "estimated",
                note: "Over CNY 5,000 a unit from GSA, Ewellix and THK, per a Chinese screw maker; converted at 7.2 CNY/USD.",
            },
        },
    ],
    sources: STACK,
    note: "The inverted type: the motor turns the nut and the threaded rod moves the joint.",
    children: [
        {
            id: "screw-shaft",
            label: "Threaded screw",
            kind: "component",
            ...shape,
            part3d: {
                component: "roller-screw",
                props: { ...SCREW, piece: "screw" },
                explodedOffset: z(0),
            },
            children: [
                weighed(
                    "screw-shaft-steel",
                    "Screw steel",
                    "bearing-steel",
                    disc(7, 150, 0.85),
                    STACK,
                ),
            ],
        },
        {
            id: "rollers",
            label: "Planetary rollers",
            kind: "component",
            qty: 10,
            ...shape,
            part3d: {
                component: "roller-screw",
                props: { ...SCREW, piece: "rollers" },
                assembled: { position: z(25) },
                explodedOffset: z(40),
                accent: true,
            },
            children: [
                weighed(
                    "roller-steel",
                    "Roller steel",
                    "bearing-steel",
                    disc(2.3, 24, 0.85),
                    STACK,
                ),
            ],
        },
        {
            id: "nut",
            label: "Roller nut",
            kind: "component",
            ...shape,
            part3d: {
                component: "roller-screw",
                props: { ...SCREW, piece: "nut" },
                assembled: { position: z(25) },
                explodedOffset: z(76),
            },
            children: [
                weighed(
                    "nut-steel",
                    "Nut steel",
                    "bearing-steel",
                    ring(14, 11.6, 24, 0.9),
                    STACK,
                ),
            ],
        },
    ],
};

const MAGNET = magnetGrams(ring(14.5, 12.5, 36, 0.85), STACK);

const motor: BomNode = {
    id: "frameless-motor",
    label: "Frameless torque motor",
    kind: "assembly",
    unitCost: shareOfPrice(
        PRICE,
        0.072,
        SHARES,
        "the frameless motor's share of a linear actuator's cost (HONPINE).",
    ),
    makerIds: ["leadshine"],
    makerConfidence: "modeled",
    makerNote:
        "Tesla's motor supplier is not public. Leadshine, a listed maker of frameless motors and joint modules, stands in.",
    alternateMakerIds: ["wolong-electric", "moons"],
    sources: STACK,
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
                    ring(27, 15, 36, 0.6),
                    STACK,
                    {
                        ...shape,
                        part3d: {
                            component: "lamination-stack",
                            props: {
                                slots: 12,
                                outer: 27,
                                inner: 15,
                                length: 36,
                                teeth: "inner",
                                sheets: 12,
                            },
                            assembled: { position: z(-22) },
                            explodedOffset: z(-70),
                        },
                    },
                ),
                weighed(
                    "stator-windings",
                    "Copper windings",
                    "copper",
                    ring(27, 15, 36, 0.234),
                    STACK,
                    {
                        makerIds: ["jiangxi-copper"],
                        makerConfidence: "modeled",
                        makerNote:
                            "China's largest copper producer stands in for the wire's source.",
                        ...shape,
                        part3d: {
                            component: "winding-coils",
                            props: {
                                slots: 12,
                                outer: 27,
                                inner: 15,
                                length: 36,
                                teeth: "inner",
                            },
                            assembled: { position: z(-22) },
                            explodedOffset: z(-104),
                        },
                        note: "Slots take 40% of the stack, copper fills 45% of a slot, end turns add 30%.",
                    },
                ),
            ],
        },
        {
            id: "rotor",
            label: "Hollow rotor",
            kind: "component",
            ...shape,
            part3d: {
                component: "magnet-ring",
                props: {
                    poles: 8,
                    outer: 14.5,
                    inner: 11,
                    length: 36,
                    backIron: 1.5,
                    backIronSide: "inner",
                },
                assembled: { position: z(-22) },
                explodedOffset: z(-36),
            },
            children: [
                {
                    id: "rotor-magnet",
                    label: "NdFeB magnets",
                    kind: "component",
                    makerIds: ["jl-mag"],
                    makerConfidence: "modeled",
                    makerNote:
                        "JL MAG supplies Tesla's EV magnets (reported); who makes the Optimus magnets is not public.",
                    alternateMakerIds: ["ningbo-yunsheng", "zhong-ke-san-huan"],
                    processStepIds: MAGNET_STEPS,
                    ...shape,
                    children: magnetContent("rotor-magnet", MAGNET),
                },
                weighed(
                    "rotor-sleeve",
                    "Rotor back iron",
                    "carbon-steel",
                    ring(12.5, 11, 36),
                    STACK,
                ),
            ],
        },
    ],
};

const BEARING: Pick<
    BomNode,
    "makerIds" | "makerConfidence" | "makerNote" | "alternateMakerIds"
> = {
    makerIds: ["nsk"],
    makerConfidence: "modeled",
    makerNote:
        "Bearing suppliers are not public; NSK, a listed precision bearing maker, stands in.",
    alternateMakerIds: ["zwz-bearing", "lyc-bearing", "ntn"],
};

const rest: BomNode = {
    id: "other-parts",
    label: "Bearings, sensor and housing",
    kind: "assembly",
    unitCost: shareOfPrice(
        PRICE,
        0.125,
        SHARES,
        "what is left after the roller screw, force sensor and motor in HONPINE's split.",
    ),
    sources: STACK,
    children: [
        {
            id: "four-point-bearing",
            label: "Four-point contact bearing",
            kind: "component",
            ...BEARING,
            ...shape,
            part3d: {
                component: "bearing",
                props: { kind: "angular-contact", outer: 16, inner: 9.5, width: 8 },
                assembled: { position: z(43) },
                explodedOffset: z(108),
            },
            children: [
                weighed(
                    "four-point-steel",
                    "Bearing steel",
                    "bearing-steel",
                    ring(16, 9.5, 8, 0.55),
                    STACK,
                ),
            ],
        },
        {
            id: "deep-groove-bearing",
            label: "Deep-groove bearing",
            kind: "component",
            ...BEARING,
            ...shape,
            part3d: {
                component: "bearing",
                props: { kind: "deep-groove", outer: 14, inner: 8, width: 6 },
                assembled: { position: z(-46) },
                explodedOffset: z(-132),
            },
            children: [
                weighed(
                    "deep-groove-steel",
                    "Bearing steel",
                    "bearing-steel",
                    ring(14, 8, 6, 0.55),
                    STACK,
                ),
            ],
        },
        {
            id: "position-sensor",
            label: "Position sensor",
            kind: "component",
            makerNote: "Not public.",
            ...shape,
            part3d: {
                component: "encoder",
                props: { radius: 14, thickness: 2, kind: "magnetic" },
                assembled: { position: z(-52) },
                explodedOffset: z(-160),
            },
            children: [
                weighed(
                    "position-sensor-copper",
                    "Board copper",
                    "copper",
                    boardCopper(14),
                    STACK,
                ),
                weighed(
                    "position-sensor-silicon",
                    "Sensor chip",
                    "silicon",
                    dieSilicon(5),
                    STACK,
                ),
            ],
        },
        {
            id: "housing",
            label: "Housing",
            kind: "component",
            ...shape,
            part3d: {
                component: "housing",
                props: { profile: "tube", outer: 30, length: 100, wall: 2.5, bolts: 6 },
                assembled: { position: z(5) },
                explodedOffset: [0, 74, 0],
            },
            children: [
                weighed(
                    "housing-aluminium",
                    "Aluminium",
                    "aluminium",
                    ring(30, 27.5, 100),
                    STACK,
                ),
            ],
        },
    ],
};

export const OPTIMUS_LINEAR: BomCase = {
    slug: "optimus-linear",
    name: "Tesla Optimus linear actuator",
    short: "Optimus linear",
    subject: "Roller-screw linear actuator, 3,900 N class, Optimus Gen 2",
    price: PRICE,
    volumeAssumption: "Analyst BOMs for Optimus Gen 2 (2024); neither states a volume.",
    month: "2026-09",
    why: "The most-analysed humanoid actuator. Its roller screw is a precision part with few qualified suppliers.",
    takeaway:
        "About two thirds of the cost is the roller screw, a few hundred grams of bearing steel.",
    root: {
        id: "optimus-linear",
        label: "Optimus linear actuator",
        kind: "assembly",
        unitCost: PRICE,
        makerIds: ["sanhua"],
        makerConfidence: "estimated",
        makerNote:
            "Counterpoint Research names Sanhua for finished actuators and Chinese media report Tuopu; Tesla has confirmed neither.",
        alternateMakerIds: ["tuopu-group"],
        sources: [
            ...STACK,
            "counterpoint-optimus-2026",
            "cnevpost-optimus-audits-2026",
        ],
        note: "Tesla shows six actuator designs on Optimus, three of them roller-screw linear units at 500, 3,900 and 8,000 N.",
        children: [
            rollerScrew,
            {
                id: "force-sensor",
                label: "Force sensor",
                kind: "component",
                unitCost: shareOfPrice(
                    PRICE,
                    0.161,
                    SHARES,
                    "the force sensor's share of a linear actuator's cost (HONPINE).",
                ),
                makerNote: "Not public.",
                ...shape,
                note: "A roller screw does not backdrive, so the joint needs its own load cell to feel force.",
                part3d: {
                    component: "cylinder",
                    props: { radius: 16, length: 10, bore: 8 },
                    assembled: { position: z(62) },
                    explodedOffset: z(140),
                },
                children: [
                    weighed(
                        "force-sensor-steel",
                        "Flexure steel",
                        "carbon-steel",
                        ring(16, 8, 10, 0.7),
                        STACK,
                    ),
                ],
            },
            motor,
            rest,
        ],
    },
};
