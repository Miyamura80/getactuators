import { BOM_MARGINS } from "../../companies/bom";
import type { Vec3 } from "../../scenes/spec";
import type { Sourced } from "../../sourced";
import {
    BEARING_ROUTE,
    CAST_ROUTE,
    FASTENER_ROUTE,
    LAMINATION_ROUTE,
    MAGNET_STEPS,
    SCREW_ROUTE,
    TURNED_ROUTE,
    WINDING_ROUTE,
    blankReference,
    boardCopper,
    chip,
    disc,
    listed,
    magnetContent,
    magnetGrams,
    piece,
    ring,
    shareOfCost,
} from "../make";
import type { BomCase, BomNode } from "../types";

// Tesla Optimus linear actuator: a frameless torque motor turning an
// inverted planetary roller screw, with a force sensor, a position sensor
// and two bearings, per secondary accounts of AI Day 2022. Tesla publishes
// no cost or teardown, so:
//   - the price is the average linear unit in two analyst BOMs (range);
//   - the assembler keeps its gross margin (Sanhua's, as the reported
//     maker), and HONPINE's published shares of a linear actuator's cost
//     split what is left between the parts;
//   - geometry (and so every gram) is our model at a 60 mm, 3,900 N class
//     size, marked inferred.

const z = (v: number): Vec3 => [0, 0, v];
const STACK = ["optimusk-actuators"];
const SHARES = ["honpine-actuator-cost-2025"];
const CNY_PER_USD = 7.2;
const ASSEMBLER = BOM_MARGINS.sanhua;

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

const cost = (share: number, what: string) =>
    shareOfCost(PRICE, ASSEMBLER, share, SHARES, what);

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
const bearingSteel = (v: ReturnType<typeof ring>, label = "Bearing steel") => ({
    label,
    seriesId: "bearing-steel",
    v,
});

const rollerScrew: BomNode = {
    id: "roller-screw",
    label: "Planetary roller screw",
    kind: "assembly",
    unitCost: cost(
        0.642,
        "the roller screw's share of a linear actuator's cost (HONPINE).",
    ),
    makerIds: ["beite"],
    makerConfidence: "modeled",
    makerNote:
        "Tesla has not named its roller screw supplier. Beite, a listed Chinese maker sampling planetary roller screws for humanoids, stands in.",
    alternateMakerIds: ["best-precision", "nousbot"],
    route: ["Match rollers, nut", "Assemble", "Run in", "Measure lead error"],
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
    note: "The inverted type: the motor turns the nut and the threaded rod moves the joint. The thread grinding is the slow, costly step.",
    children: [
        piece(
            "screw-shaft",
            "Threaded screw",
            bearingSteel(disc(7, 150, 0.85), "Screw steel"),
            STACK,
            {
                ...shape,
                route: SCREW_ROUTE,
                part3d: {
                    component: "roller-screw",
                    props: { ...SCREW, piece: "screw" },
                    explodedOffset: z(0),
                },
            },
        ),
        piece(
            "rollers",
            "Planetary roller",
            bearingSteel(disc(2.3, 24, 0.85), "Roller steel"),
            STACK,
            {
                ...shape,
                qty: 10,
                route: [
                    "Cut bar",
                    "Centreless grind",
                    "Thread grind",
                    "Cut end teeth",
                    "Harden",
                ],
                note: "Each roller carries a spur gear at both ends that keeps it in step with the nut.",
                part3d: {
                    component: "roller-screw",
                    props: { ...SCREW, piece: "rollers" },
                    assembled: { position: z(25) },
                    explodedOffset: z(40),
                    accent: true,
                },
            },
        ),
        piece(
            "nut",
            "Roller nut",
            bearingSteel(ring(14, 11.6, 24, 0.9), "Nut steel"),
            STACK,
            {
                ...shape,
                route: ["Cut tube", "Turn", "Internal thread grind", "Harden"],
                part3d: {
                    component: "roller-screw",
                    props: { ...SCREW, piece: "nut" },
                    assembled: { position: z(25) },
                    explodedOffset: z(76),
                },
            },
        ),
        piece(
            "nut-ring-gears",
            "Nut ring gear",
            bearingSteel(ring(11.6, 10.6, 3, 0.85), "Gear steel"),
            STACK,
            {
                ...shape,
                qty: 2,
                route: ["Turn", "Shape teeth", "Harden", "Press into nut"],
                note: "Internal gears at the nut's ends that mesh with the rollers' end teeth.",
            },
        ),
        piece(
            "roller-carriers",
            "Roller carrier",
            { label: "Steel", seriesId: "carbon-steel", v: ring(10.6, 7.4, 2, 0.6) },
            STACK,
            {
                ...shape,
                qty: 2,
                route: ["Stamp", "Drill pockets"],
                note: "Rings that space the rollers evenly around the screw.",
            },
        ),
        piece(
            "retaining-rings",
            "Retaining ring",
            { label: "Spring steel", seriesId: "carbon-steel", v: ring(12, 10.8, 1) },
            STACK,
            {
                ...shape,
                qty: 2,
                route: ["Stamp", "Harden"],
            },
        ),
    ],
};

const MAGNET = magnetGrams(ring(14.5, 12.5, 36, 0.85), STACK);
const SENSOR_MAGNET = magnetGrams(disc(3, 2.5), STACK);

const motor: BomNode = {
    id: "frameless-motor",
    label: "Frameless torque motor",
    kind: "assembly",
    unitCost: cost(
        0.072,
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
            kind: "assembly",
            ...shape,
            children: [
                piece(
                    "stator-core",
                    "Lamination stack",
                    {
                        label: "Electrical steel",
                        seriesId: "electrical-steel",
                        v: ring(27, 15, 36, 0.6),
                    },
                    STACK,
                    {
                        ...shape,
                        route: LAMINATION_ROUTE,
                        makerNote: "Steel mill and stamping shop not public.",
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
                piece(
                    "stator-winding",
                    "Copper windings",
                    { label: "Copper", seriesId: "copper", v: ring(27, 15, 36, 0.234) },
                    STACK,
                    {
                        ...shape,
                        route: WINDING_ROUTE,
                        makerIds: ["jiangxi-copper"],
                        makerConfidence: "modeled",
                        makerNote:
                            "China's largest copper producer stands in for the wire's source.",
                        note: "Slots take 40% of the stack, copper fills 45% of a slot, end turns add 30%.",
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
                    },
                ),
            ],
        },
        {
            id: "rotor",
            label: "Hollow rotor",
            kind: "assembly",
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
                    references: [blankReference(MAGNET)],
                    ...shape,
                    children: magnetContent("rotor-magnet", MAGNET),
                },
                piece(
                    "rotor-sleeve",
                    "Rotor back iron",
                    { label: "Steel", seriesId: "carbon-steel", v: ring(12.5, 11, 36) },
                    STACK,
                    {
                        ...shape,
                        route: TURNED_ROUTE,
                        note: "The hollow sleeve the nut is fixed in, so the rotor turns the nut directly.",
                    },
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

const SENSOR_CHIP = listed(
    2.07,
    [2.07, 4.41],
    ["lcsc-mt6835"],
    "2025",
    "LCSC's 1,000-unit tier for a Magn Tek MT6835 magnetic angle sensor, a comparable part; Tesla's sensor is not public.",
    "modeled",
);

const rest: BomNode = {
    id: "other-parts",
    label: "Bearings, sensor and housing",
    kind: "assembly",
    unitCost: cost(
        0.125,
        "what is left after the roller screw, force sensor and motor in HONPINE's split.",
    ),
    sources: STACK,
    children: [
        piece(
            "four-point-bearing",
            "Four-point contact bearing",
            bearingSteel(ring(16, 9.5, 8, 0.55)),
            STACK,
            {
                ...BEARING,
                ...shape,
                route: BEARING_ROUTE,
                note: "Takes the screw's axial load where it leaves the housing.",
                part3d: {
                    component: "bearing",
                    props: { kind: "angular-contact", outer: 16, inner: 9.5, width: 8 },
                    assembled: { position: z(43) },
                    explodedOffset: z(108),
                },
            },
        ),
        piece(
            "deep-groove-bearing",
            "Deep-groove bearing",
            bearingSteel(ring(14, 8, 6, 0.55)),
            STACK,
            {
                ...BEARING,
                ...shape,
                route: BEARING_ROUTE,
                part3d: {
                    component: "bearing",
                    props: { kind: "deep-groove", outer: 14, inner: 8, width: 6 },
                    assembled: { position: z(-46) },
                    explodedOffset: z(-132),
                },
            },
        ),
        {
            id: "position-sensor",
            label: "Position sensor",
            kind: "assembly",
            makerNote: "Not public.",
            ...shape,
            part3d: {
                component: "encoder",
                props: { radius: 14, thickness: 2, kind: "magnetic" },
                assembled: { position: z(-52) },
                explodedOffset: z(-160),
            },
            children: [
                piece(
                    "sensor-board",
                    "Sensor board",
                    { label: "Board copper", seriesId: "copper", v: boardCopper(14) },
                    STACK,
                    {
                        ...shape,
                        route: ["Laminate", "Drill", "Plate", "Etch"],
                    },
                ),
                chip("sensor-chip", "Angle sensor chip", 5, STACK, {
                    unitCost: SENSOR_CHIP,
                }),
                {
                    id: "sensor-magnet",
                    label: "Diametric magnet",
                    kind: "component",
                    ...shape,
                    processStepIds: MAGNET_STEPS,
                    makerNote: "Not public.",
                    children: magnetContent("sensor-magnet", SENSOR_MAGNET),
                },
            ],
        },
        {
            id: "housing",
            label: "Housing",
            kind: "assembly",
            ...shape,
            part3d: {
                component: "housing",
                props: { profile: "tube", outer: 30, length: 100, wall: 2.5, bolts: 6 },
                assembled: { position: z(5) },
                explodedOffset: [0, 74, 0],
            },
            children: [
                piece(
                    "housing-tube",
                    "Housing tube",
                    {
                        label: "Aluminium",
                        seriesId: "aluminium",
                        v: ring(30, 27.5, 100),
                    },
                    STACK,
                    {
                        ...shape,
                        route: ["Extrude", "CNC machine", "Anodise"],
                    },
                ),
                piece(
                    "end-caps",
                    "End cap",
                    { label: "Aluminium", seriesId: "aluminium", v: disc(30, 4, 0.6) },
                    STACK,
                    {
                        ...shape,
                        qty: 2,
                        route: CAST_ROUTE,
                        note: "Carry the bearings and the mounting eyes.",
                    },
                ),
                piece(
                    "fasteners",
                    "Screw",
                    { label: "Steel", seriesId: "carbon-steel", v: disc(1.5, 8) },
                    STACK,
                    {
                        ...shape,
                        qty: 12,
                        route: FASTENER_ROUTE,
                        part3d: {
                            component: "bolt",
                            props: { diameter: 3, length: 8, count: 6, circle: 26 },
                            assembled: { position: z(-56) },
                            explodedOffset: z(-190),
                        },
                    },
                ),
            ],
        },
    ],
};

const forceSensor: BomNode = {
    id: "force-sensor",
    label: "Force sensor",
    kind: "assembly",
    unitCost: cost(
        0.161,
        "the force sensor's share of a linear actuator's cost (HONPINE).",
    ),
    makerNote: "Not public.",
    ...shape,
    note: "A roller screw does not backdrive, so the joint needs its own load cell to feel force.",
    route: ["Bond gauges", "Wire bridge", "Calibrate", "Temperature-compensate"],
    part3d: {
        component: "cylinder",
        props: { radius: 16, length: 10, bore: 8 },
        assembled: { position: z(62) },
        explodedOffset: z(140),
    },
    children: [
        piece(
            "sensor-flexure",
            "Flexure body",
            {
                label: "Flexure steel",
                seriesId: "carbon-steel",
                v: ring(16, 8, 10, 0.7),
            },
            STACK,
            {
                ...shape,
                route: ["Cut bar", "CNC machine", "Heat-treat", "Grind faces"],
                note: "A spoked steel ring that bends a few microns under load.",
            },
        ),
        piece(
            "strain-gauges",
            "Foil strain gauge",
            {
                label: "Gauge foil",
                seriesId: "copper",
                v: {
                    cm3: 0.0005,
                    how: "A 5 x 5 mm foil grid, 5 um thick, priced as copper (constantan is copper and nickel)",
                },
            },
            STACK,
            {
                ...shape,
                qty: 4,
                route: ["Roll foil", "Photo-etch grid", "Laminate"],
                note: "Four gauges in a full bridge.",
            },
        ),
        chip("bridge-amplifier", "Bridge amplifier chip", 4, STACK),
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
        "About two thirds of what the assembler spends is the roller screw, a few hundred grams of bearing steel turned into a precision part.",
    uses: {
        humanoids: { actuatorType: "linear-roller-screw", thisIds: ["tesla-optimus"] },
    },
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
        route: [
            "Mount motor, nut",
            "Insert screw",
            "Fit sensors",
            "Close housing",
            "Calibrate force",
            "End-of-line test",
        ],
        children: [rollerScrew, forceSensor, motor, rest],
    },
};
