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

// A strain-wave cobot joint: frameless motor, strain-wave gear, crossed
// roller bearing, two encoders, a friction brake and a driver in one
// housing. Priced as ZeroErr's eRob 80, an integrated joint of exactly this
// layout sold off the shelf. Part costs split that price by HONPINE's
// rotary-actuator shares with its torque sensor taken out (this joint has
// none), so gear, motor and the rest keep their proportions. Geometry is our
// model of an 80 mm joint, marked inferred.

const z = (v: number): Vec3 => [0, 0, v];
const LISTING = ["rcdrone-erob80"];
const SHARES = ["honpine-actuator-cost-2025"];
const shape = { sources: LISTING, inferred: true } as const;

const PRICE: Sourced<number> = {
    value: 1440,
    unit: "USD",
    sources: LISTING,
    asOf: "2026",
    confidence: "reported",
    note: "eRob 80 T list price at a reseller; the eRob 80 I lists at $1,771.",
};

// HONPINE's rotary split is strain-wave gear 36%, torque sensor 30%, motor
// 13.5%, rest 20.5%. Without the sensor the other three share 70%.
const WITHOUT_SENSOR = 0.7;
const why = (what: string, share: number) =>
    `${what} ${share}% of a rotary actuator's cost in HONPINE's split, over the 70% left once its torque sensor is taken out.`;

const strainWave: BomNode = {
    id: "strain-wave-gear",
    label: "Strain-wave gear",
    kind: "assembly",
    unitCost: shareOfPrice(
        PRICE,
        0.36 / WITHOUT_SENSOR,
        SHARES,
        why("the strain-wave gear's", 36),
    ),
    makerIds: ["harmonic-drive-systems"],
    makerConfidence: "modeled",
    makerNote:
        "ZeroErr does not name its gear source. Harmonic Drive Systems, the incumbent that sets the price of the category, stands in.",
    alternateMakerIds: ["leaderdrive", "laifual"],
    references: [
        {
            label: "High-end gear unit",
            value: {
                value: 1150,
                unit: "USD",
                range: [800, 1500],
                sources: ["humanoidguide-joint-bom"],
                asOf: "2026",
                confidence: "estimated",
                note: "High-end strain-wave reducer per unit; Chinese equivalents are put at 30 to 50% less.",
            },
        },
        {
            label: "CSF-17 marketplace listings",
            value: {
                value: 312,
                unit: "USD",
                range: [185, 440],
                sources: ["accio-csf17"],
                asOf: "2026",
                confidence: "estimated",
                note: "Supplier asking prices for a CSF-17-100-2UH component set; not Harmonic Drive list prices.",
            },
        },
    ],
    sources: LISTING,
    children: [
        {
            id: "wave-generator",
            label: "Wave generator",
            kind: "component",
            ...shape,
            part3d: {
                component: "wave-generator",
                props: { major: 19.4, minor: 17.8, width: 6, bore: 6 },
                assembled: { position: z(1) },
                explodedOffset: z(26),
            },
            children: [
                weighed(
                    "wave-generator-steel",
                    "Cam and bearing steel",
                    "bearing-steel",
                    disc(19, 6, 0.75),
                    LISTING,
                ),
            ],
        },
        {
            id: "circular-spline",
            label: "Circular spline",
            kind: "component",
            ...shape,
            part3d: {
                component: "circular-spline",
                props: { teeth: 102, module: 0.4, width: 8, outer: 30 },
                assembled: { position: z(1) },
                explodedOffset: z(56),
            },
            children: [
                weighed(
                    "circular-spline-steel",
                    "Spline steel",
                    "carbon-steel",
                    ring(30, 20.4, 8, 0.95),
                    LISTING,
                ),
            ],
        },
        {
            id: "flexspline",
            label: "Flexspline",
            kind: "component",
            ...shape,
            note: "A thin steel cup flexed by the wave generator; two fewer teeth than the circular spline.",
            part3d: {
                component: "flexspline",
                props: {
                    teeth: 100,
                    module: 0.4,
                    length: 26,
                    wall: 0.8,
                    deflection: 0.8,
                },
                assembled: { position: z(10) },
                explodedOffset: z(92),
                accent: true,
            },
            children: [
                weighed(
                    "flexspline-steel",
                    "Alloy steel",
                    "bearing-steel",
                    {
                        cm3:
                            (Math.PI *
                                ((20.2 * 20.2 - 19.4 * 19.4) * 26 +
                                    20.2 * 20.2 * 1.5)) /
                            1000,
                        how: "Cup r 20.2 mm, 26 mm long, 0.8 mm wall and 1.5 mm base",
                    },
                    LISTING,
                ),
            ],
        },
    ],
};

const MAGNET = magnetGrams(ring(26, 23, 18, 0.85), LISTING);

const motor: BomNode = {
    id: "frameless-motor",
    label: "Frameless motor",
    kind: "assembly",
    unitCost: shareOfPrice(
        PRICE,
        0.135 / WITHOUT_SENSOR,
        SHARES,
        why("the frameless motor's", 13.5),
    ),
    makerIds: ["leadshine"],
    makerConfidence: "modeled",
    makerNote:
        "Frameless kits are sold by many makers; Leadshine, a listed maker of frameless motors, stands in.",
    alternateMakerIds: ["wolong-electric", "moons"],
    sources: LISTING,
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
                    ring(41, 27, 18, 0.6),
                    LISTING,
                    {
                        ...shape,
                        part3d: {
                            component: "lamination-stack",
                            props: {
                                slots: 24,
                                outer: 41,
                                inner: 27,
                                length: 18,
                                teeth: "inner",
                                sheets: 8,
                            },
                            assembled: { position: z(-18) },
                            explodedOffset: z(-38),
                        },
                    },
                ),
                weighed(
                    "stator-windings",
                    "Copper windings",
                    "copper",
                    ring(41, 27, 18, 0.25),
                    LISTING,
                    {
                        makerIds: ["jiangxi-copper"],
                        makerConfidence: "modeled",
                        makerNote:
                            "China's largest copper producer stands in for the wire's source.",
                        ...shape,
                        part3d: {
                            component: "winding-coils",
                            props: {
                                slots: 24,
                                outer: 41,
                                inner: 27,
                                length: 18,
                                teeth: "inner",
                            },
                            assembled: { position: z(-18) },
                            explodedOffset: z(-76),
                        },
                        note: "Slots take 40% of the stack, copper fills 45% of a slot, end turns add 40%.",
                    },
                ),
            ],
        },
        {
            id: "rotor",
            label: "Frameless rotor",
            kind: "component",
            ...shape,
            part3d: {
                component: "magnet-ring",
                props: {
                    poles: 20,
                    outer: 26,
                    inner: 21,
                    length: 18,
                    backIron: 2,
                    backIronSide: "inner",
                },
                assembled: { position: z(-18) },
                explodedOffset: z(0),
            },
            children: [
                {
                    id: "rotor-magnet",
                    label: "NdFeB magnets",
                    kind: "component",
                    makerIds: ["shin-etsu-chemical"],
                    makerConfidence: "modeled",
                    makerNote:
                        "The magnet source is not public; Shin-Etsu, a listed maker of sintered NdFeB for servo motors, stands in.",
                    alternateMakerIds: ["jl-mag", "proterial", "ningbo-yunsheng"],
                    processStepIds: MAGNET_STEPS,
                    ...shape,
                    children: magnetContent("rotor-magnet", MAGNET),
                },
                weighed(
                    "rotor-hub",
                    "Rotor hub steel",
                    "carbon-steel",
                    ring(23, 21, 18),
                    LISTING,
                ),
            ],
        },
    ],
};

const rest: BomNode = {
    id: "other-parts",
    label: "Bearing, encoders, brake, driver",
    kind: "assembly",
    unitCost: shareOfPrice(
        PRICE,
        0.205 / WITHOUT_SENSOR,
        SHARES,
        why("everything else:", 20.5),
    ),
    sources: LISTING,
    note: "The eRob 80 T has a friction brake and a motor-side absolute encoder; its output encoder is on the eRob 80 I.",
    children: [
        {
            id: "crossed-roller-bearing",
            label: "Crossed-roller bearing",
            kind: "component",
            makerIds: ["nippon-thompson"],
            makerConfidence: "modeled",
            makerNote:
                "Bearing source not public; Nippon Thompson (IKO), a listed crossed-roller maker, stands in.",
            alternateMakerIds: ["thk", "zhenhua-bearing"],
            ...shape,
            part3d: {
                component: "bearing",
                props: { kind: "crossed-roller", outer: 34, inner: 24, width: 8 },
                assembled: { position: z(27) },
                explodedOffset: z(128),
            },
            children: [
                weighed(
                    "crossed-roller-steel",
                    "Bearing steel",
                    "bearing-steel",
                    ring(34, 24, 8, 0.6),
                    LISTING,
                ),
            ],
        },
        {
            id: "output-encoder",
            label: "Output encoder",
            kind: "component",
            makerIds: ["renishaw"],
            makerConfidence: "modeled",
            makerNote:
                "Encoder source not public; Renishaw, a listed maker of absolute ring encoders, stands in.",
            ...shape,
            part3d: {
                component: "encoder",
                props: { radius: 17, thickness: 1.5, kind: "optical", ticks: 96 },
                assembled: { position: z(-32) },
                explodedOffset: z(-176),
            },
            children: [
                weighed(
                    "encoder-scale-steel",
                    "Scale ring steel",
                    "carbon-steel",
                    ring(17, 12, 1.5),
                    LISTING,
                ),
                weighed(
                    "encoder-readhead-silicon",
                    "Readhead die",
                    "silicon",
                    dieSilicon(8),
                    LISTING,
                ),
            ],
        },
        {
            id: "motor-encoder",
            label: "Motor encoder",
            kind: "component",
            makerNote: "Chip maker not public.",
            ...shape,
            children: [
                weighed(
                    "motor-encoder-silicon",
                    "Sensor die",
                    "silicon",
                    dieSilicon(4),
                    LISTING,
                ),
            ],
        },
        {
            id: "brake",
            label: "Friction brake",
            kind: "component",
            makerNote: "Not public.",
            ...shape,
            note: "Holds the arm when power drops.",
            part3d: {
                component: "cylinder",
                props: { radius: 20, length: 6, bore: 8 },
                assembled: { position: z(-38) },
                explodedOffset: z(-140),
            },
            children: [
                weighed(
                    "brake-steel",
                    "Armature steel",
                    "carbon-steel",
                    ring(20, 8, 6, 0.6),
                    LISTING,
                ),
                weighed(
                    "brake-coil",
                    "Coil copper",
                    "copper",
                    ring(18, 12, 4, 0.5),
                    LISTING,
                ),
            ],
        },
        {
            id: "driver-board",
            label: "Servo driver board",
            kind: "component",
            makerNote: "ZeroErr's own design; chip makers not public.",
            ...shape,
            part3d: {
                component: "pcb",
                props: { shape: "round", width: 60, thickness: 1.6, bore: 8, chips: 5 },
                assembled: { position: z(-42) },
                explodedOffset: z(-210),
            },
            children: [
                weighed(
                    "driver-copper",
                    "Board copper",
                    "copper",
                    boardCopper(30),
                    LISTING,
                ),
                weighed(
                    "driver-silicon",
                    "Chip dies",
                    "silicon",
                    dieSilicon(15),
                    LISTING,
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
                props: { profile: "tube", outer: 45, length: 66, wall: 3, bolts: 12 },
                explodedOffset: z(-128),
            },
            children: [
                weighed(
                    "housing-aluminium",
                    "Aluminium",
                    "aluminium",
                    ring(45, 42, 66),
                    LISTING,
                ),
            ],
        },
    ],
};

export const HARMONIC_FRAMELESS: BomCase = {
    slug: "harmonic-frameless",
    name: "Strain-wave cobot joint",
    short: "Harmonic + frameless",
    subject:
        "Frameless motor, strain-wave gear, brake and encoders: ZeroErr eRob 80 class",
    price: PRICE,
    volumeAssumption: "Off-the-shelf price for one integrated joint.",
    month: "2026-09",
    why: "The classic industrial and cobot joint. A handful of incumbent component makers set its price.",
    takeaway:
        "Half the price is the strain-wave gear, whose steel costs about ten cents; its incumbent maker keeps nearly a third of what it charges.",
    root: {
        id: "harmonic-frameless",
        label: "Strain-wave joint",
        kind: "assembly",
        unitCost: PRICE,
        makerIds: ["zeroerr"],
        makerConfidence: "reported",
        makerNote:
            "ZeroErr makes and sells the eRob joints; it is private, so no margin is public.",
        sources: LISTING,
        children: [strainWave, motor, rest],
    },
};
