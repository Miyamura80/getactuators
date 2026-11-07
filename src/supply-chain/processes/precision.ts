import {
    BALL_SORTING_LOOP,
    BEARING_NOISE_TEST_LOOP,
    ENCODER_CALIBRATION_LOOP,
    GRATING_LITHOGRAPHY_LOOP,
    INTERPOLATION_ASIC_LOOP,
    MAGNETIC_POLE_WRITING_LOOP,
    PRECISION_JOINT,
    RACEWAY_GRINDING_LOOP,
    RACEWAY_SUPERFINISHING_LOOP,
    RING_ROLLING_LOOP,
} from "../scenes/precision-loops";
import { num, range } from "./key-number";
import {
    BEARING_MAKERS,
    BEARING_ROW,
    DRIVE_STEPS,
    ENCODER_ROW,
    GEAR_ROW,
} from "./precision-drive-steps";
import type { ProcessChain, ProcessEdge, ProcessStep } from "./types";

// The precision chain: the four micron-tolerance parts of an actuator that
// few suppliers can make, each a sub-chain from bar stock to a tested part.
// Step ids are stable: /bom nodes (flexspline, roller screw, precision
// bearing, encoder) point their processStepIds here and #step= links use
// them. Numbers are one source's published figure each; a range is that
// source's spread, not a world average. Every source was confirmed from
// search results only (see ./precision-sources).
// The gear and screw steps are in ./precision-drive-steps.

const STEPS: ProcessStep[] = [
    ...DRIVE_STEPS,
    // ---- Precision bearing ---------------------------------------------
    {
        id: "bearing-steel-refining",
        cluster: "bearing",
        label: "Clean bearing steel",
        caption: "Vacuum-degas and refine the steel so few oxide inclusions remain.",
        icon: "crucible",
        inputs: ["High-carbon chromium steel melt"],
        outputs: ["Clean bearing steel bar"],
        keyNumbers: [
            num("Oxygen", 5.8, "ppm", ["jstage-bearing-steel-oxygen-1985"], "1985", {
                note: "Average with ladle refining, RH degassing and continuous casting.",
            }),
            range(
                "Life gain",
                2,
                3,
                "x",
                ["jstage-bearing-steel-oxygen-1985"],
                "1985",
                {
                    note: "Rolling contact fatigue life against vacuum-degassed ingot steel.",
                },
            ),
        ],
        companyIds: [],
        shares: "rolling-bearings",
        bomNodeIds: [],
        elementIds: [],
        pos: { x: 0, y: BEARING_ROW },
        sources: ["jstage-bearing-steel-oxygen-1985", "nsk-ti-0004"],
    },
    {
        id: "ring-forging",
        cluster: "bearing",
        label: "Ring forging and rolling",
        caption: "Hot-forge ring blanks, then roll them out close to size.",
        icon: "press",
        inputs: ["Clean bearing steel bar"],
        outputs: ["Rolled ring blanks"],
        keyNumbers: [
            num("Waste, turned", 35, "%", ["ncu-bearing-ring-forging-2011"], "2011", {
                note: "Share of starting weight lost turning rings from bar or tube.",
            }),
            num("Waste, forged", 7, "%", ["ncu-bearing-ring-forging-2011"], "2011", {
                note: "With hot forging followed by cold ring rolling.",
            }),
        ],
        companyIds: [],
        shares: "rolling-bearings",
        bomNodeIds: [],
        elementIds: [],
        animation: RING_ROLLING_LOOP,
        pos: { x: 1, y: BEARING_ROW },
        sources: ["ncu-bearing-ring-forging-2011"],
    },
    {
        id: "ring-hardening",
        cluster: "bearing",
        label: "Through hardening",
        caption: "Quench and temper the rings so the raceway is fully hard.",
        icon: "furnace",
        inputs: ["Turned rings"],
        outputs: ["Hardened rings"],
        keyNumbers: [
            range("Raceway", 58, 65, "HRC", ["uspto-us9540705-bearing-ring"], "2017"),
        ],
        companyIds: [],
        shares: "rolling-bearings",
        bomNodeIds: [],
        elementIds: [],
        pos: { x: 2, y: BEARING_ROW },
        sources: ["uspto-us9540705-bearing-ring"],
    },
    {
        id: "raceway-grinding",
        cluster: "bearing",
        label: "Raceway grinding",
        caption: "Plunge-grind raceways, bores and faces to micron form.",
        icon: "grind",
        inputs: ["Hardened rings"],
        outputs: ["Ground rings"],
        keyNumbers: [
            num(
                "Ground finish",
                0.3,
                "µm Ra",
                ["cranfield-raceway-finishing"],
                "2023",
                {
                    note: "A ground ring before finishing.",
                },
            ),
        ],
        companyIds: BEARING_MAKERS,
        shares: "rolling-bearings",
        bomNodeIds: [],
        elementIds: [],
        animation: RACEWAY_GRINDING_LOOP,
        pos: { x: 3, y: BEARING_ROW },
        sources: ["cranfield-raceway-finishing"],
    },
    {
        id: "raceway-superfinishing",
        cluster: "bearing",
        label: "Raceway superfinishing",
        caption: "An oscillating stone rubs the raceway to a near mirror.",
        icon: "grind",
        inputs: ["Ground rings"],
        outputs: ["Finished rings"],
        keyNumbers: [
            num("Finish", 0.03, "µm Ra", ["uspto-us8757886-rolling-bearing"], "2014", {
                note: "At most, on a superfinished inner ring raceway.",
            }),
            num("P4 limit", 63, "nm", ["napstic-si3n4-superfinishing-2017"], "2017", {
                note: "Raceway roughness allowed for P4 precision grade.",
            }),
            num("Cycle", 6, "s", ["cranfield-raceway-finishing"], "2023", {
                note: "Fine CBN stone taking a ground ring from 0.3 to under 0.02 µm Ra.",
            }),
        ],
        companyIds: BEARING_MAKERS,
        shares: "rolling-bearings",
        bomNodeIds: [],
        elementIds: [],
        animation: RACEWAY_SUPERFINISHING_LOOP,
        pos: { x: 4, y: BEARING_ROW },
        sources: [
            "uspto-us8757886-rolling-bearing",
            "napstic-si3n4-superfinishing-2017",
            "cranfield-raceway-finishing",
        ],
    },
    {
        id: "rolling-element-sorting",
        cluster: "bearing",
        label: "Ball and roller sorting",
        caption: "Gauge every ball or roller and bin it by size class.",
        icon: "gauge",
        inputs: ["Lapped balls or rollers"],
        outputs: ["Sorted element lots"],
        keyNumbers: [
            num("G3 variation", 0.08, "µm", ["din-5401-balls"], "2026", {
                note: "Largest diameter variation of one grade G3 ball; G5 allows 0.13.",
            }),
        ],
        companyIds: [],
        shares: "rolling-bearings",
        bomNodeIds: [],
        elementIds: [],
        animation: BALL_SORTING_LOOP,
        pos: { x: 4, y: BEARING_ROW + 1 },
        sources: ["din-5401-balls"],
    },
    {
        id: "bearing-assembly",
        cluster: "bearing",
        label: "Cage fit and preload",
        caption: "Fit elements and cage between the rings, then set preload.",
        icon: "assemble",
        inputs: ["Finished rings", "Sorted element lots", "Cages"],
        outputs: ["Crossed-roller bearing"],
        keyNumbers: [
            num("Runout P5", 4, "µm", ["thk-cross-roller-ring-catalog"], "2026", {
                note: "Radial runout tolerance of one cross-roller ring size (RU42).",
            }),
            num("Runout P2", 2.5, "µm", ["thk-cross-roller-ring-catalog"], "2026"),
        ],
        companyIds: BEARING_MAKERS,
        shares: "rolling-bearings",
        bomNodeIds: [],
        elementIds: [],
        pos: { x: 5, y: BEARING_ROW },
        sources: ["thk-cross-roller-ring-catalog"],
    },
    {
        id: "bearing-noise-test",
        cluster: "bearing",
        label: "Noise and vibration test",
        caption: "Spin the inner ring while a pickup grades three vibration bands.",
        icon: "gauge",
        inputs: ["Crossed-roller bearing"],
        outputs: ["Tested bearing"],
        keyNumbers: [
            num("Test speed", 1800, "rpm", ["sugawara-bearing-inspection"], "2026"),
            range("Bands", 50, 10000, "Hz", ["sugawara-bearing-inspection"], "2026", {
                note: "Low 50 to 300, medium 300 to 1,800, high 1,800 to 10,000 Hz.",
            }),
        ],
        companyIds: BEARING_MAKERS,
        shares: "rolling-bearings",
        bomNodeIds: [],
        elementIds: [],
        animation: BEARING_NOISE_TEST_LOOP,
        pos: { x: 6, y: BEARING_ROW },
        sources: ["sugawara-bearing-inspection"],
    },
    // ---- Encoder -------------------------------------------------------
    {
        id: "scale-substrate",
        cluster: "encoder",
        label: "Scale substrate",
        caption: "Lap glass, glass ceramic or steel into flat, stable blanks.",
        icon: "lathe",
        inputs: ["Glass or steel blank"],
        outputs: ["Scale blank"],
        keyNumbers: [],
        companyIds: ["heidenhain", "renishaw"],
        shares: "encoders",
        bomNodeIds: [],
        elementIds: [],
        pos: { x: 0, y: ENCODER_ROW },
        sources: ["heidenhain-general-catalog", "renishaw-resa30"],
    },
    {
        id: "grating-lithography",
        cluster: "encoder",
        label: "Grating lithography",
        caption: "Expose and etch a chrome grating on glass through a mask.",
        icon: "laser",
        inputs: ["Scale blank", "Photomask"],
        outputs: ["Optical scale"],
        keyNumbers: [
            num("Grating period", 10, "µm", ["heidenhain-general-catalog"], "2026", {
                note: "Chrome on glass; the maker's gold-on-steel scales use 20 or 40 µm.",
            }),
            range("Resolution", 500, 600, "lp/mm", ["maxlevy-encoder-disks"], "2026", {
                note: "Pattern resolution on small encoder discs.",
            }),
        ],
        companyIds: ["heidenhain"],
        shares: "encoders",
        bomNodeIds: [],
        elementIds: [],
        animation: GRATING_LITHOGRAPHY_LOOP,
        pos: { x: 1.25, y: ENCODER_ROW },
        sources: ["heidenhain-general-catalog", "maxlevy-encoder-disks"],
    },
    {
        id: "magnetic-pole-writing",
        cluster: "encoder",
        label: "Magnetic pole writing",
        caption: "Write alternating poles onto a magnetic ring against a reference.",
        icon: "coil",
        inputs: ["Scale blank", "Magnetic ring"],
        outputs: ["Magnetic scale"],
        keyNumbers: [
            num("Pole length", 2, "mm", ["rls-magnetic-ring-accuracy"], "2026"),
            num("Ring error", 0.16, "°", ["rls-magnetic-ring-accuracy"], "2026", {
                note: "Plus or minus, one 2 mm pole ring; 5 mm poles give about 0.50.",
            }),
        ],
        companyIds: ["rls"],
        shares: "encoders",
        bomNodeIds: [],
        elementIds: [],
        animation: MAGNETIC_POLE_WRITING_LOOP,
        branch: "alternative",
        pos: { x: 1.25, y: ENCODER_ROW + 1 },
        sources: ["rls-magnetic-ring-accuracy", "rls-aksim-2"],
    },
    {
        id: "readhead-assembly",
        cluster: "encoder",
        label: "Read head optics",
        caption: "Align LED, optics and photodiodes, or Hall sensors, over the scale.",
        icon: "chip",
        inputs: ["Optical or magnetic scale", "LED and photodiode array"],
        outputs: ["Read head and scale"],
        keyNumbers: [
            num("Scale pitch", 30, "µm", ["renishaw-resa30"], "2026", {
                note: "Single-track absolute code on a steel ring.",
            }),
            num("Jitter", 10, "nm RMS", ["renishaw-resolute-datasheet"], "2026", {
                note: "Below; sub-divisional error within 40 nm.",
            }),
        ],
        companyIds: ["renishaw", "heidenhain", "tamagawa-seiki", "rls"],
        shares: "encoders",
        bomNodeIds: [],
        elementIds: [],
        pos: { x: 2.5, y: ENCODER_ROW },
        sources: ["renishaw-resa30", "renishaw-resolute-datasheet"],
    },
    {
        id: "interpolation-asic",
        cluster: "encoder",
        label: "Interpolation ASIC",
        caption: "A chip splits each sine period of the scale into fine counts.",
        icon: "chip",
        inputs: ["Read head signals"],
        outputs: ["Digital position"],
        keyNumbers: [
            num("Resolution", 16, "bit", ["ichaus-tw8"], "2026", {
                note: "One sin/cos interpolator chip, per signal period.",
            }),
            num("Input", 125, "kHz", ["ichaus-tw8"], "2026", {
                note: "Highest sine input frequency.",
            }),
        ],
        companyIds: ["ic-haus"],
        shares: "encoders",
        bomNodeIds: [],
        elementIds: [],
        animation: INTERPOLATION_ASIC_LOOP,
        pos: { x: 3.75, y: ENCODER_ROW },
        sources: ["ichaus-tw8"],
    },
    {
        id: "encoder-calibration",
        cluster: "encoder",
        label: "Calibration",
        caption: "Compare against a reference encoder and store the error map.",
        icon: "gauge",
        inputs: ["Assembled encoder"],
        outputs: ["Calibrated encoder"],
        keyNumbers: [
            num("Installed", 1.9, "arc-sec", ["renishaw-resa30"], "2026", {
                note: "Plus or minus, on a 550 mm ring; 12.7 on a 52 mm ring.",
            }),
            num(
                "Self-calibrated",
                0.04,
                "arc-sec",
                ["ubc-encoder-self-calibration"],
                "2008",
                {
                    note: "From about 1 arc-sec, in an on-axis self-calibration study.",
                },
            ),
        ],
        companyIds: ["renishaw", "heidenhain"],
        shares: "encoders",
        bomNodeIds: [],
        elementIds: [],
        animation: ENCODER_CALIBRATION_LOOP,
        pos: { x: 5, y: ENCODER_ROW },
        sources: ["renishaw-resa30", "ubc-encoder-self-calibration"],
    },
    {
        id: "encoder-sealing",
        cluster: "encoder",
        label: "Sealing",
        caption: "Seal the read head and cover the scale against dust and coolant.",
        icon: "seal",
        inputs: ["Calibrated encoder"],
        outputs: ["Sealed encoder"],
        keyNumbers: [
            num("IP rating", 64, "", ["renishaw-resolute-datasheet"], "2026", {
                note: "IP64 sealed read head.",
            }),
            num("Max temp", 80, "°C", ["renishaw-resolute-datasheet"], "2026"),
        ],
        companyIds: ["renishaw"],
        shares: "encoders",
        bomNodeIds: [],
        elementIds: [],
        pos: { x: 6, y: ENCODER_ROW },
        sources: ["renishaw-resolute-datasheet"],
    },
];

const main = (from: string, to: string, label: string): ProcessEdge => ({
    from,
    to,
    kind: "main",
    label,
});
const branch = (from: string, to: string, label: string): ProcessEdge => ({
    from,
    to,
    kind: "branch",
    label,
});

const EDGES: ProcessEdge[] = [
    // Strain-wave gear
    main("flexspline-forging", "flexspline-forming", "Cup blank"),
    main("flexspline-forming", "flexspline-hardening", "Thin cup"),
    main("flexspline-hardening", "flexspline-hobbing", "Hardened cup"),
    main("flexspline-hobbing", "strain-wave-assembly", "Flexspline"),
    branch("flexspline-hobbing", "flexspline-shot-peening", "Flexspline"),
    branch("flexspline-shot-peening", "strain-wave-assembly", "Peened"),
    main("circular-spline-cutting", "strain-wave-assembly", "Circular spline"),
    main("wave-generator-grinding", "strain-wave-assembly", "Wave generator"),
    main("strain-wave-assembly", "strain-wave-testing", "Gear set"),
    // Planetary roller screw
    main("roller-screw-turning", "screw-hardening", "Blanks"),
    main("screw-hardening", "screw-thread-grinding", "Screw"),
    main("screw-hardening", "roller-thread-grinding", "Rollers"),
    main("screw-hardening", "nut-thread-grinding", "Nut"),
    main("screw-thread-grinding", "roller-screw-assembly", "Screw"),
    main("roller-thread-grinding", "roller-screw-assembly", "Roller set"),
    main("nut-thread-grinding", "roller-screw-assembly", "Nut"),
    main("roller-screw-assembly", "lead-accuracy-test", "Roller screw"),
    // Precision bearing
    main("bearing-steel-refining", "ring-forging", "Steel bar"),
    main("ring-forging", "ring-hardening", "Ring blanks"),
    main("ring-hardening", "raceway-grinding", "Hard rings"),
    main("raceway-grinding", "raceway-superfinishing", "Ground rings"),
    main("raceway-superfinishing", "bearing-assembly", "Rings"),
    main("rolling-element-sorting", "bearing-assembly", "Element lots"),
    main("bearing-assembly", "bearing-noise-test", "Bearing"),
    // Encoder
    main("scale-substrate", "grating-lithography", "Glass blank"),
    branch("scale-substrate", "magnetic-pole-writing", "Ring blank"),
    main("grating-lithography", "readhead-assembly", "Optical scale"),
    branch("magnetic-pole-writing", "readhead-assembly", "Magnetic scale"),
    main("readhead-assembly", "interpolation-asic", "Sin/cos"),
    main("interpolation-asic", "encoder-calibration", "Encoder"),
    main("encoder-calibration", "encoder-sealing", "Error map"),
];

export const PRECISION_CHAIN: ProcessChain = {
    id: "precision",
    label: "Precision",
    title: "How an actuator's precision parts are made",
    span: "bar stock to tested part",
    product:
        "One joint's matched precision parts: strain-wave gear set, planetary roller screw, crossed-roller bearing and encoder",
    productLabel: "Precision set",
    parallel: true,
    clusters: [
        {
            id: "strain-wave",
            label: "Strain-wave gear",
            stage: "gearing",
            shares: "strain-wave-gears",
        },
        {
            id: "roller-screw",
            label: "Roller screw",
            stage: "screw",
            shares: "roller-screws",
        },
        {
            id: "bearing",
            label: "Precision bearing",
            stage: "bearing",
            shares: "rolling-bearings",
        },
        { id: "encoder", label: "Encoder", stage: "electronics", shares: "encoders" },
    ],
    steps: STEPS,
    edges: EDGES,
    productScene: PRECISION_JOINT,
    productPos: { x: 7.4, y: (GEAR_ROW + ENCODER_ROW + 1) / 2 },
};

// The ids /bom may reference, in chain order.
export const PRECISION_STEP_IDS: readonly string[] = STEPS.map((s) => s.id);

// The last step of each sub-chain: where a /bom node for the finished part
// (flexspline set, roller screw, precision bearing, encoder) should point.
export const PRECISION_PART_STEPS = {
    "strain-wave-gear": "strain-wave-testing",
    "roller-screw": "lead-accuracy-test",
    "precision-bearing": "bearing-noise-test",
    encoder: "encoder-sealing",
} as const;
