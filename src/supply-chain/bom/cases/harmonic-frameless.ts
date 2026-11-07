import type { Vec3 } from "../../scenes/spec";
import type { Sourced } from "../../sourced";
import {
    BOARD_ROUTE,
    CAST_ROUTE,
    FASTENER_ROUTE,
    LAMINATION_ROUTE,
    MAGNET_STEPS,
    TURNED_ROUTE,
    WINDING_ROUTE,
    blankReference,
    boardCopper,
    chip,
    dieSilicon,
    disc,
    listed,
    magnetContent,
    magnetGrams,
    piece,
    ring,
    shareOfPrice,
} from "../make";
import type { BomCase, BomNode } from "../types";

// A strain-wave cobot joint: frameless motor, strain-wave gear, crossed
// roller bearing, two encoders, a friction brake and a driver in one
// housing. Priced as ZeroErr's eRob 80, an integrated joint of exactly this
// layout sold off the shelf. Part costs split that price by HONPINE's
// rotary-actuator shares with its torque sensor taken out (this joint has
// none), so gear, motor and the rest keep their proportions. ZeroErr is
// private, so no assembler margin is taken off first: the shares split the
// whole price. Geometry is our model of an 80 mm joint, marked inferred.

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

const bearingSteel = (v: ReturnType<typeof ring>, label = "Bearing steel") => ({
    label,
    seriesId: "bearing-steel",
    v,
});

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
    route: ["Pair flexspline, spline", "Assemble", "Run in", "Measure backlash"],
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
            kind: "assembly",
            ...shape,
            note: "An elliptical cam inside a thin ball bearing: it turns the flexspline's two meshing zones round once per input turn.",
            part3d: {
                component: "wave-generator",
                props: { major: 19.4, minor: 17.8, width: 6, bore: 6 },
                assembled: { position: z(1) },
                explodedOffset: z(26),
            },
            children: [
                piece(
                    "wave-cam",
                    "Elliptical cam",
                    bearingSteel(ring(16.5, 6, 6, 0.95), "Cam steel"),
                    LISTING,
                    {
                        ...shape,
                        route: ["Cut bar", "Turn", "Grind ellipse", "Harden"],
                    },
                ),
                piece(
                    "flex-bearing",
                    "Flexible bearing",
                    bearingSteel(ring(19.4, 16.5, 6, 0.6)),
                    LISTING,
                    {
                        ...shape,
                        route: [
                            "Turn thin rings",
                            "Harden",
                            "Grind races",
                            "Fit balls",
                        ],
                        note: "Thin rings that take the cam's ellipse; a special bearing few makers produce.",
                    },
                ),
            ],
        },
        piece(
            "circular-spline",
            "Circular spline",
            {
                label: "Spline steel",
                seriesId: "carbon-steel",
                v: ring(30, 20.4, 8, 0.95),
            },
            LISTING,
            {
                ...shape,
                route: ["Forge ring", "Turn", "Shape teeth", "Nitride"],
                note: "Rigid internal gear with 102 teeth, bolted to the housing.",
                part3d: {
                    component: "circular-spline",
                    props: { teeth: 102, module: 0.4, width: 8, outer: 30 },
                    assembled: { position: z(1) },
                    explodedOffset: z(56),
                },
            },
        ),
        piece(
            "flexspline",
            "Flexspline",
            bearingSteel(
                {
                    cm3:
                        (Math.PI *
                            ((20.2 * 20.2 - 19.4 * 19.4) * 26 + 20.2 * 20.2 * 1.5)) /
                        1000,
                    how: "Cup r 20.2 mm, 26 mm long, 0.8 mm wall and 1.5 mm base",
                },
                "Alloy steel",
            ),
            LISTING,
            {
                ...shape,
                route: [
                    "Forge cup",
                    "Turn wall thin",
                    "Hob teeth",
                    "Heat-treat",
                    "Shot peen",
                ],
                note: "A thin steel cup flexed by the wave generator; two fewer teeth than the circular spline. Its fatigue life sets the gear's.",
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
            },
        ),
    ],
};

const MAGNET = magnetGrams(ring(26, 23, 18, 0.85), LISTING);
const ENCODER_MAGNET = magnetGrams(disc(3, 2.5), LISTING);

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
            kind: "assembly",
            ...shape,
            children: [
                piece(
                    "stator-core",
                    "Lamination stack",
                    {
                        label: "Electrical steel",
                        seriesId: "electrical-steel",
                        v: ring(41, 27, 18, 0.6),
                    },
                    LISTING,
                    {
                        ...shape,
                        route: LAMINATION_ROUTE,
                        makerNote: "Steel mill and stamping shop not public.",
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
                piece(
                    "stator-winding",
                    "Copper windings",
                    { label: "Copper", seriesId: "copper", v: ring(41, 27, 18, 0.25) },
                    LISTING,
                    {
                        ...shape,
                        route: WINDING_ROUTE,
                        makerIds: ["jiangxi-copper"],
                        makerConfidence: "modeled",
                        makerNote:
                            "China's largest copper producer stands in for the wire's source.",
                        note: "Slots take 40% of the stack, copper fills 45% of a slot, end turns add 40%.",
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
                    },
                ),
            ],
        },
        {
            id: "rotor",
            label: "Frameless rotor",
            kind: "assembly",
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
                    references: [blankReference(MAGNET)],
                    ...shape,
                    children: magnetContent("rotor-magnet", MAGNET),
                },
                piece(
                    "rotor-hub",
                    "Rotor hub",
                    { label: "Steel", seriesId: "carbon-steel", v: ring(23, 21, 18) },
                    LISTING,
                    {
                        ...shape,
                        route: TURNED_ROUTE,
                    },
                ),
            ],
        },
    ],
};

// Bought-in electronics at distributor prices, for comparable parts:
// ZeroErr does not publish its board.
const MCU_COST = listed(
    0.8,
    [0.8, 1.1],
    ["lcsc-stm32f103c8t6"],
    "2025",
    "LCSC's 1,000-unit tier for an STM32F103 Cortex-M3, a comparable motor-control MCU; ZeroErr's is not public.",
    "modeled",
);
const GATE_COST = listed(
    0.36,
    [0.25, 0.36],
    ["lcsc-fd6288q"],
    "2025",
    "LCSC's 1,000-unit tier for a three-phase gate driver of the class a 48 V joint needs.",
    "modeled",
);
const FET_COST = listed(
    0.25,
    [0.25, 0.31],
    ["lcsc-wsd4066dn"],
    "2025",
    "LCSC's 10-unit tier for a 40 V dual N-channel MOSFET; a 48 V joint needs higher-rated parts, so a floor.",
    "modeled",
);
const MOTOR_ENCODER_COST = listed(
    8.15,
    [7.44, 8.83],
    ["findchips-as5045"],
    "2025",
    "Distributor prices for an ams AS5045 12-bit magnetic encoder at 1,000 units, a comparable motor-side encoder chip.",
    "modeled",
);

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
        piece(
            "crossed-roller-bearing",
            "Crossed-roller bearing",
            bearingSteel(ring(34, 24, 8, 0.6)),
            LISTING,
            {
                ...shape,
                makerIds: ["nippon-thompson"],
                makerConfidence: "modeled",
                makerNote:
                    "Bearing source not public; Nippon Thompson (IKO), a listed crossed-roller maker, stands in.",
                alternateMakerIds: ["thk", "zhenhua-bearing"],
                route: [
                    "Forge rings",
                    "Turn",
                    "Harden",
                    "Grind V-races",
                    "Fit crossed rollers",
                ],
                note: "Rollers set at alternating right angles take the arm's tilting load in one bearing.",
                references: [
                    {
                        label: "CRBH listing",
                        value: listed(
                            79,
                            undefined,
                            ["lkpb-crbh-ebay"],
                            "2026",
                            "A Chinese maker's listed price for a CRBH-series crossed roller bearing in P5/P4 precision; the listing spans several sizes.",
                        ),
                    },
                ],
                part3d: {
                    component: "bearing",
                    props: { kind: "crossed-roller", outer: 34, inner: 24, width: 8 },
                    assembled: { position: z(27) },
                    explodedOffset: z(128),
                },
            },
        ),
        {
            id: "output-encoder",
            label: "Output encoder",
            kind: "assembly",
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
                piece(
                    "encoder-scale",
                    "Scale ring",
                    { label: "Steel", seriesId: "carbon-steel", v: ring(17, 12, 1.5) },
                    LISTING,
                    {
                        ...shape,
                        route: ["Turn ring", "Laser-mark code", "Lap"],
                    },
                ),
                chip("encoder-readhead", "Readhead chip", 8, LISTING),
            ],
        },
        {
            id: "motor-encoder",
            label: "Motor encoder",
            kind: "assembly",
            makerNote: "Chip maker not public.",
            ...shape,
            children: [
                chip("motor-encoder-chip", "Angle sensor chip", 4, LISTING, {
                    unitCost: MOTOR_ENCODER_COST,
                }),
                {
                    id: "encoder-magnet",
                    label: "Diametric magnet",
                    kind: "component",
                    ...shape,
                    processStepIds: MAGNET_STEPS,
                    makerNote: "Not public.",
                    children: magnetContent("encoder-magnet", ENCODER_MAGNET),
                },
            ],
        },
        {
            id: "brake",
            label: "Friction brake",
            kind: "assembly",
            makerNote: "Not public.",
            ...shape,
            note: "Springs clamp the friction disc when power drops, so the arm holds its pose; the coil releases it.",
            references: [
                {
                    label: "Small power-off brake",
                    value: listed(
                        132.87,
                        [129.86, 148.76],
                        ["ato-brake-prices"],
                        "2026",
                        "A distributor's single-unit prices for 24 V power-off brakes of 0.3 to 8 N·m; a joint maker buying thousands pays less.",
                    ),
                },
            ],
            part3d: {
                component: "cylinder",
                props: { radius: 20, length: 6, bore: 8 },
                assembled: { position: z(-38) },
                explodedOffset: z(-140),
            },
            children: [
                piece(
                    "brake-armature",
                    "Armature plate",
                    {
                        label: "Steel",
                        seriesId: "carbon-steel",
                        v: ring(20, 8, 2, 0.9),
                    },
                    LISTING,
                    {
                        ...shape,
                        route: ["Stamp", "Grind flat"],
                    },
                ),
                piece(
                    "brake-field",
                    "Field body",
                    {
                        label: "Steel",
                        seriesId: "carbon-steel",
                        v: ring(20, 8, 4, 0.5),
                    },
                    LISTING,
                    {
                        ...shape,
                        route: TURNED_ROUTE,
                    },
                ),
                piece(
                    "brake-coil",
                    "Brake coil",
                    { label: "Copper", seriesId: "copper", v: ring(18, 12, 4, 0.5) },
                    LISTING,
                    {
                        ...shape,
                        route: WINDING_ROUTE,
                    },
                ),
                piece(
                    "brake-springs",
                    "Pressure spring",
                    {
                        label: "Spring steel",
                        seriesId: "carbon-steel",
                        v: disc(1, 6, 0.4),
                    },
                    LISTING,
                    {
                        ...shape,
                        qty: 6,
                        route: ["Draw wire", "Coil", "Stress-relieve"],
                    },
                ),
            ],
        },
        {
            id: "driver-board",
            label: "Servo driver board",
            kind: "assembly",
            makerNote: "ZeroErr's own design; chip makers not public.",
            ...shape,
            part3d: {
                component: "pcb",
                props: { shape: "round", width: 60, thickness: 1.6, bore: 8, chips: 5 },
                assembled: { position: z(-42) },
                explodedOffset: z(-210),
            },
            children: [
                piece(
                    "bare-board",
                    "Bare circuit board",
                    { label: "Board copper", seriesId: "copper", v: boardCopper(30) },
                    LISTING,
                    {
                        ...shape,
                        route: BOARD_ROUTE,
                    },
                ),
                chip("mcu", "Motor-control MCU", 10, LISTING, { unitCost: MCU_COST }),
                chip("gate-driver", "Gate driver", 3, LISTING, { unitCost: GATE_COST }),
                chip("power-mosfets", "Dual power MOSFET", 4, LISTING, {
                    qty: 3,
                    unitCost: FET_COST,
                }),
                piece(
                    "bus-transceiver",
                    "Bus transceiver",
                    {
                        label: "Silicon die",
                        seriesId: "silicon",
                        v: dieSilicon(2),
                        suffix: "die",
                    },
                    LISTING,
                    {
                        ...shape,
                        route: ["Wafer fab", "Dice", "Package", "Test"],
                        note: "CAN or EtherCAT, depending on the variant.",
                    },
                ),
            ],
        },
        {
            id: "housing",
            label: "Housing",
            kind: "assembly",
            ...shape,
            part3d: {
                component: "housing",
                props: { profile: "tube", outer: 45, length: 66, wall: 3, bolts: 12 },
                explodedOffset: z(-128),
            },
            children: [
                piece(
                    "housing-shell",
                    "Housing tube",
                    { label: "Aluminium", seriesId: "aluminium", v: ring(45, 42, 66) },
                    LISTING,
                    {
                        ...shape,
                        route: CAST_ROUTE,
                    },
                ),
                piece(
                    "output-flange",
                    "Output flange",
                    {
                        label: "Aluminium",
                        seriesId: "aluminium",
                        v: ring(34, 10, 5, 0.8),
                    },
                    LISTING,
                    {
                        ...shape,
                        route: ["CNC machine", "Anodise"],
                        note: "The face the next link bolts to, carried by the crossed-roller bearing.",
                    },
                ),
                piece(
                    "hollow-shaft",
                    "Hollow shaft",
                    { label: "Steel", seriesId: "carbon-steel", v: ring(8, 6.5, 60) },
                    LISTING,
                    {
                        ...shape,
                        route: TURNED_ROUTE,
                        note: "Lets cables run through the joint.",
                    },
                ),
                piece(
                    "fasteners",
                    "Screw",
                    { label: "Steel", seriesId: "carbon-steel", v: disc(1.5, 10) },
                    LISTING,
                    {
                        ...shape,
                        qty: 12,
                        route: FASTENER_ROUTE,
                        part3d: {
                            component: "bolt",
                            props: { diameter: 3, length: 10, count: 12, circle: 40 },
                            assembled: { position: z(33) },
                            explodedOffset: z(170),
                        },
                    },
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
    uses: {
        actuators: [
            { id: "encos-ec-a5013-h17-100", relation: "same-design" },
            { id: "harmonic-drive-fha-14c-100", relation: "same-design" },
        ],
        humanoids: { actuatorType: "harmonic" },
    },
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
        route: [
            "Mount stator",
            "Fit gear",
            "Fit bearing",
            "Fit brake, board",
            "Calibrate encoders",
            "Test",
        ],
        children: [strainWave, motor, rest],
    },
};
