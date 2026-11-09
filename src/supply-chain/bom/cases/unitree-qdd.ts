import type { Vec3 } from "../../scenes/spec";
import type { Sourced } from "../../sourced";
import {
    BEARING_ROUTE,
    BOARD_ROUTE,
    CAST_ROUTE,
    FASTENER_ROUTE,
    GEAR_ROUTE,
    LAMINATION_ROUTE,
    MAGNET_STEPS,
    RING_GEAR_ROUTE,
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
} from "../make";
import type { BomCase, BomNode } from "../types";

// Unitree GO-M8010-6, the Go1 joint motor Unitree sells on its own shop:
// price, mass and the 6.33:1 reduction are published. Unitree publishes no
// internals for this motor, so the layout follows teardowns of its sibling,
// the Go2's GO-M8018-6 (outrunner, 36 slots and 42 poles, one planetary
// stage, magnetic encoder, Cortex-M0 driver board), sized to the M8010-6's
// 530 g. Unitree designs the motor, gearbox and driver itself, so its own
// parts have no public price: they carry their raw material, and what
// Unitree adds on top shows at the motor as labour and overhead plus its
// 60% gross margin. The chips and bearings it buys in are priced from
// distributor listings for the same or a comparable part.

const z = (v: number): Vec3 => [0, 0, v];
const SIBLING = ["simplexity-go2-motor"];
const BOARD = ["simplefoc-go2-motor-2026", "hackaday-go-m8018-2026"];
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
const ENCODER_MAGNET = magnetGrams(disc(3, 2.5), SIBLING);

const steel = (v: ReturnType<typeof ring>, label = "Gear steel") => ({
    label,
    seriesId: "bearing-steel",
    v,
});

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
            kind: "assembly",
            ...shape,
            note: "Wound in house; the core and wire come in as stamped steel and enamelled copper.",
            children: [
                piece(
                    "stator-core",
                    "Lamination stack",
                    {
                        label: "Electrical steel",
                        seriesId: "electrical-steel",
                        v: ring(36, 22, 10, 0.55),
                    },
                    SIBLING,
                    {
                        ...shape,
                        route: LAMINATION_ROUTE,
                        makerNote: "Steel mill and stamping shop not public.",
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
                piece(
                    "stator-winding",
                    "Copper windings",
                    { label: "Copper", seriesId: "copper", v: ring(36, 22, 10, 0.27) },
                    SIBLING,
                    {
                        ...shape,
                        route: WINDING_ROUTE,
                        makerIds: ["jiangxi-copper"],
                        makerConfidence: "modeled",
                        makerNote:
                            "China's largest copper producer stands in for the wire's source.",
                        note: "Slots take 45% of the stack, copper fills 40% of a slot; a short stack's end turns add half again.",
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
                    },
                ),
                piece(
                    "stator-hub",
                    "Stator hub",
                    {
                        label: "Aluminium",
                        seriesId: "aluminium",
                        v: ring(22, 9, 12, 0.6),
                    },
                    SIBLING,
                    {
                        ...shape,
                        route: CAST_ROUTE,
                        note: "Carries the stack on the housing and holds the rotor bearing.",
                    },
                ),
            ],
        },
        {
            id: "rotor",
            label: "Outer rotor",
            kind: "assembly",
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
                    references: [blankReference(MAGNET)],
                    ...shape,
                    note: "42 arc segments glued inside the rotor cup; the set is counted as one part.",
                    children: magnetContent("rotor-magnet", MAGNET),
                },
                piece(
                    "rotor-cup",
                    "Rotor back iron",
                    { label: "Steel", seriesId: "carbon-steel", v: ring(41, 39, 10) },
                    SIBLING,
                    { ...shape, route: TURNED_ROUTE },
                ),
                piece(
                    "rotor-plate",
                    "Rotor end plate",
                    {
                        label: "Aluminium",
                        seriesId: "aluminium",
                        v: disc(41, 1.5, 0.7),
                    },
                    SIBLING,
                    {
                        ...shape,
                        route: ["CNC machine", "Press sun gear"],
                        note: "Closes the cup and carries the sun gear, so the rotor drives the gearbox directly.",
                    },
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
        piece("sun-gear", "Sun gear", steel(disc(4.8, 7, 0.9)), SIBLING, {
            ...shape,
            route: GEAR_ROUTE,
        }),
        piece("planet-gears", "Planet gear", steel(ring(10.4, 3, 7, 0.9)), SIBLING, {
            ...shape,
            qty: 3,
            route: GEAR_ROUTE,
        }),
        piece("planet-pins", "Planet pin", steel(disc(1.5, 9), "Pin steel"), SIBLING, {
            ...shape,
            qty: 3,
            route: ["Cut wire", "Harden", "Centreless grind"],
        }),
        piece(
            "planet-needles",
            "Planet needle bearing",
            steel(ring(3, 1.5, 7, 0.5), "Bearing steel"),
            SIBLING,
            {
                ...shape,
                qty: 3,
                route: BEARING_ROUTE,
                alternateMakerIds: ["zwz-bearing", "nippon-thompson"],
                makerNote: "Bought-in needle rollers; supplier not public.",
            },
        ),
        piece("ring-gear", "Ring gear", steel(ring(28.5, 25.6, 7, 0.95)), SIBLING, {
            ...shape,
            route: RING_GEAR_ROUTE,
        }),
        piece(
            "planet-carrier",
            "Planet carrier",
            steel(disc(22, 3, 0.8), "Carrier steel"),
            SIBLING,
            {
                ...shape,
                route: TURNED_ROUTE,
                note: "The output: the leg link bolts to it.",
                part3d: {
                    component: "cylinder",
                    props: { radius: 22, length: 3, bore: 5 },
                    assembled: { position: z(16) },
                    explodedOffset: z(100),
                    accent: true,
                },
            },
        ),
    ],
};

// Distributor prices for the board's bought-in chips. Unitree sands the
// markings off, so each is a comparable part, not a confirmed one.
const MCU_COST = listed(
    0.8,
    [0.8, 1.1],
    ["lcsc-stm32f103c8t6"],
    "2025",
    "LCSC's 1,000-unit tier for an STM32F103, a Cortex-M3 that stands in for Unitree's Cortex-M0; an M0 usually costs less, so read it as a ceiling.",
    "modeled",
);
const GATE_COST = listed(
    0.36,
    [0.25, 0.36],
    ["lcsc-fd6288q"],
    "2025",
    "LCSC's 1,000-unit tier for a Fortior FD6288Q three-phase gate driver, a common Chinese part for this job; the low end is a second maker's version.",
    "modeled",
);
const FET_COST = listed(
    0.25,
    [0.25, 0.31],
    ["lcsc-wsd4066dn"],
    "2025",
    "LCSC's 10-unit tier for a 40 V dual N-channel MOSFET in a 3 mm package; three of them make the six switches of a 24 V inverter.",
    "modeled",
);
const RS485_COST = listed(
    0.12,
    [0.12, 0.19],
    ["lcsc-sp3485"],
    "2025",
    "LCSC's 500 to 2,500-unit tiers for an SP3485-class RS-485 transceiver.",
    "modeled",
);
const ENCODER_COST = listed(
    2.07,
    [2.07, 4.41],
    ["lcsc-mt6835"],
    "2025",
    "LCSC's 1,000-unit tier for a Magn Tek MT6835, a Chinese magnetic angle sensor of the class the 15-bit encoder needs; small lots cost up to twice as much.",
    "modeled",
);

const electronics: BomNode = {
    id: "driver-board",
    label: "FOC driver board",
    kind: "assembly",
    ...UNITREE,
    sources: BOARD,
    inferred: true,
    note: "Inverter, current sensing and RS-485 on one board; Unitree sands the chip markings off.",
    part3d: {
        component: "pcb",
        props: { shape: "round", width: 76, thickness: 1.6, bore: 8, chips: 6 },
        assembled: { position: z(-17) },
        explodedOffset: z(-110),
    },
    children: [
        piece(
            "bare-board",
            "Bare circuit board",
            { label: "Board copper", seriesId: "copper", v: boardCopper(38) },
            SIBLING,
            {
                route: BOARD_ROUTE,
                inferred: true,
                makerNote: "Board fab not public; Shenzhen has hundreds.",
            },
        ),
        chip("mcu", "Motor-control MCU", 6, ["simplefoc-go2-motor-2026"], {
            unitCost: MCU_COST,
            makerIds: ["cmsemicon"],
            makerConfidence: "estimated",
            makerNote:
                "A reverse engineer identifies a Cmsemicon CMS32M57-series Cortex-M0; the markings are removed, so this is his reading.",
        }),
        chip("gate-driver", "Gate driver", 3, SIBLING, {
            unitCost: GATE_COST,
            makerNote:
                "Not public; a Chinese three-phase driver chip is typical at this price.",
        }),
        chip("power-mosfets", "Dual power MOSFET", 4, SIBLING, {
            qty: 3,
            unitCost: FET_COST,
            makerNote: "Not public; the markings are removed.",
        }),
        chip("rs485-transceiver", "RS-485 transceiver", 2, SIBLING, {
            unitCost: RS485_COST,
            makerNote: "Not public.",
        }),
        piece(
            "leads",
            "Power and bus leads",
            {
                label: "Copper",
                seriesId: "copper",
                v: {
                    cm3: 0.5,
                    how: "Two 300 mm power leads and a bus pair, 0.5 cm3 of copper",
                },
            },
            LISTING,
            {
                inferred: true,
                route: ["Draw wire", "Strand", "Insulate", "Crimp"],
                note: "The motor takes power and RS-485 on one cable.",
            },
        ),
    ],
};

const encoder: BomNode = {
    id: "magnetic-encoder",
    label: "Magnetic encoder",
    kind: "assembly",
    makerNote: "Chip maker not public.",
    sources: ["simplefoc-go2-motor-2026"],
    inferred: true,
    note: "A diametric magnet on the rotor axis over an angle sensor on the board; 15 bits per Unitree.",
    part3d: {
        component: "encoder",
        props: { radius: 9, thickness: 2, kind: "magnetic" },
        assembled: { position: z(-14) },
        explodedOffset: z(-80),
    },
    children: [
        chip("encoder-chip", "Angle sensor chip", 4, ["simplefoc-go2-motor-2026"], {
            unitCost: ENCODER_COST,
        }),
        {
            id: "encoder-magnet",
            label: "Diametric magnet",
            kind: "component",
            sources: SIBLING,
            inferred: true,
            processStepIds: MAGNET_STEPS,
            alternateMakerIds: ["ningbo-yunsheng"],
            makerNote: "Not public.",
            children: magnetContent("encoder-magnet", ENCODER_MAGNET),
        },
    ],
};

const BEARING_PRICE = {
    label: "6800-series listing",
    value: listed(
        1.4,
        undefined,
        ["ebay-6800-thin-bearings"],
        "2026",
        "A China-based seller's single-unit price for a 6800-series thin-wall bearing (GBP 1.09); volume prices are lower, so a ceiling.",
    ),
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
        "No supplier margin sits between the metal and the shelf: the bought-in chips come to about $4, and almost everything else is Unitree's own step.",
    uses: {
        actuators: [{ id: "unitree-go-m8010-6", relation: "this" }],
        // Go1 is in the robots catalog with twelve of these joints.
        robotMotorIds: ["unitree-go-m8010-6"],
        humanoids: { actuatorType: "qdd" },
    },
    root: {
        id: "unitree-qdd",
        label: "GO-M8010-6 joint motor",
        kind: "assembly",
        unitCost: PRICE,
        ...UNITREE,
        sources: [...LISTING, "unitree-go1-motor-shop", "sse-unitree-pricing-2026"],
        note: "Unitree's core business ran a 60% gross margin in 2025, per its IPO prospectus as the exchange quotes it.",
        route: [
            "Wind stator",
            "Bond magnets",
            "Assemble gearbox",
            "Fit board",
            "Calibrate encoder",
            "Test",
        ],
        children: [
            motor,
            gearbox,
            electronics,
            encoder,
            piece(
                "bearings",
                "Ball bearing",
                steel(ring(14, 9, 5, 0.55), "Bearing steel"),
                SIBLING,
                {
                    ...shape,
                    qty: 2,
                    route: BEARING_ROUTE,
                    makerNote: "Bearing supplier not public.",
                    alternateMakerIds: ["zwz-bearing", "lyc-bearing", "nsk"],
                    references: [BEARING_PRICE],
                    part3d: {
                        component: "bearing",
                        props: { kind: "deep-groove", outer: 14, inner: 9, width: 5 },
                        assembled: { position: z(12) },
                        explodedOffset: z(130),
                    },
                },
            ),
            {
                id: "housing",
                label: "Housing",
                kind: "assembly",
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
                    piece(
                        "housing-shell",
                        "Cast shell",
                        {
                            label: "Aluminium",
                            seriesId: "aluminium",
                            v: {
                                cm3:
                                    (Math.PI *
                                        ((47 * 47 - 45 * 45) * 40 + 47 * 47 * 2)) /
                                    1000,
                                how: "Cup r 47 mm, 40 mm long, 2 mm wall and a 2 mm face",
                            },
                        },
                        SIBLING,
                        { ...shape, route: CAST_ROUTE },
                    ),
                    piece(
                        "housing-cover",
                        "Rear cover",
                        { label: "Aluminium", seriesId: "aluminium", v: disc(47, 2) },
                        SIBLING,
                        { ...shape, route: CAST_ROUTE, note: "Closes the board end." },
                    ),
                    piece(
                        "fasteners",
                        "Screw",
                        { label: "Steel", seriesId: "carbon-steel", v: disc(1.5, 8) },
                        SIBLING,
                        {
                            ...shape,
                            qty: 16,
                            route: FASTENER_ROUTE,
                            note: "M3 screws: eight hold the cover, eight the output face.",
                            part3d: {
                                component: "bolt",
                                props: { diameter: 3, length: 8, count: 8, circle: 43 },
                                assembled: { position: z(-21) },
                                explodedOffset: z(-150),
                            },
                        },
                    ),
                ],
            },
        ],
    },
};
