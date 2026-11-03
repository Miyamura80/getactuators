import { ALT_DRIVE_SCENES } from "../scenes/alt-drives";
import { estimated, milestone, trl } from "./make";
import type { AltTech } from "./types";

// Hydraulic drives, and transmissions that change how much motor (and so how
// much magnet) a joint needs.

export const HYDRAULIC_TECHS: AltTech[] = [
    {
        id: "servo-hydraulic",
        family: "hydraulic",
        name: "Servo-hydraulic actuator",
        short: "Servo hydraulic",
        principle:
            "A central pump pressurises oil; servo valves meter it into cylinders. Huge force from a small joint.",
        magnets: "motor",
        trl: trl(
            9,
            ["icas-a380-flight-controls-2006", "ap-atlas-retired-2024"],
            "Standard in aircraft and heavy machinery; in humanoids the hydraulic Atlas was retired in 2024 for an electric one.",
        ),
        milestones: [
            milestone("lab", 2013, "Hydraulic Atlas humanoid debuts", [
                "ap-atlas-retired-2024",
            ]),
        ],
        players: [{ companyId: "boston-dynamics", companyType: "incumbent" }],
        metrics: {},
        facts: [],
        scene: { kind: "explode", spec: ALT_DRIVE_SCENES.servoHydraulic },
        sources: ["ap-atlas-retired-2024", "icas-a380-flight-controls-2006"],
    },
    {
        id: "electrohydrostatic",
        family: "hydraulic",
        name: "Electro-hydrostatic actuator (EHA)",
        short: "EHA",
        principle:
            "Motor, pump, reservoir and cylinder sealed in one unit: hydraulic force, but only wires run to it.",
        magnets: "motor",
        trl: trl(
            9,
            ["icas-a380-flight-controls-2006", "airbus-2h2e-2025"],
            "Flying in primary flight controls on the A380, and standard on the A350 and A400M.",
        ),
        milestones: [
            milestone(
                "lab",
                1992,
                "EBHA aileron flight-tested on an A320",
                ["haw-a380-flight-controls-2007"],
                {
                    note: "An electrical backup hydraulic actuator, a close relative of the EHA.",
                },
            ),
            milestone(
                "first-commercial",
                2005,
                "A380 flies on EHAs with no hydraulics",
                ["icas-a380-flight-controls-2006"],
            ),
        ],
        players: [],
        metrics: {},
        facts: [],
        scene: { kind: "explode", spec: ALT_DRIVE_SCENES.eha },
        sources: ["icas-a380-flight-controls-2006", "haw-a380-flight-controls-2007"],
    },
];

export const TRANSMISSION_TECHS: AltTech[] = [
    {
        id: "cycloidal",
        family: "transmission",
        name: "Cycloidal reducer",
        short: "Cycloidal",
        principle:
            "A lobed disc wobbles around a ring of pins and turns back one lobe per input turn: high ratio, shock-tolerant.",
        magnets: "none",
        trl: trl(
            9,
            ["sumitomo-drive-profile", "pat-nabtesco-share"],
            "Made since the 1930s; RV-type cycloidal gears sit in most industrial robot joints.",
        ),
        milestones: [
            milestone("lab", 1928, "Braren's cycloid gear patent granted", [
                "sumitomo-drive-profile",
            ]),
            milestone("first-commercial", 1931, "Cyclo GmbH starts making reducers", [
                "sumitomo-drive-history",
            ]),
            milestone("volume", 1939, "First Japanese-built Cyclo at Niihama", [
                "sumitomo-drive-profile",
            ]),
        ],
        players: [
            { companyId: "nabtesco", companyType: "incumbent" },
            { companyId: "sumitomo-heavy", companyType: "incumbent" },
        ],
        metrics: {},
        facts: [
            {
                label: "Nabtesco robot-joint share",
                value: estimated(
                    0.6,
                    "fraction",
                    ["pat-nabtesco-share"],
                    "2026",
                    "Share of world precision reduction gears for industrial robot joints, as the company states it.",
                ),
            },
        ],
        scene: { kind: "loop", spec: ALT_DRIVE_SCENES.cycloidal },
        sources: ["sumitomo-drive-profile"],
    },
    {
        id: "cable-capstan",
        family: "transmission",
        name: "Cable and capstan drive",
        short: "Cable capstan",
        principle:
            "Cable wrapped on a small drum turns a large one; the diameter ratio is the gear ratio, without backlash.",
        magnets: "none",
        trl: trl(
            9,
            ["barrett-history"],
            "Barrett has sold cable-driven WAM arms since 1990.",
        ),
        milestones: [
            milestone(
                "first-commercial",
                1990,
                "Barrett commercialises MIT's gearless WAM drives",
                ["barrett-history"],
            ),
        ],
        players: [{ companyId: "barrett-technology", companyType: "incumbent" }],
        metrics: {},
        facts: [],
        scene: { kind: "loop", spec: ALT_DRIVE_SCENES.capstan },
        sources: ["barrett-history"],
    },
    {
        id: "roller-screw",
        family: "transmission",
        name: "Planetary roller screw",
        short: "Roller screw",
        principle:
            "Threaded rollers orbit between screw and nut, so many lines carry load where a ball screw has a few points.",
        magnets: "none",
        trl: trl(
            9,
            ["machinedesign-roller-screw"],
            "Catalogue products for industrial linear actuators; the motor behind it still decides the magnet content.",
        ),
        milestones: [],
        players: [{ companyId: "tesla", companyType: "incumbent" }],
        metrics: {},
        facts: [
            {
                label: "Load vs ball screw",
                value: estimated(
                    15,
                    "x",
                    ["machinedesign-roller-screw"],
                    "2026",
                    "Up to 15 times the load capacity of a similar-size ball screw, per a roller screw maker.",
                ),
            },
            {
                label: "Optimus largest linear",
                value: estimated(
                    8000,
                    "N",
                    ["humanoidguide-optimus-roller-screw"],
                    "2022",
                    "Rating shown at Tesla AI Day 2022, as reported by a secondary source.",
                ),
            },
        ],
        scene: { kind: "explode", spec: ALT_DRIVE_SCENES.screws },
        sources: ["machinedesign-roller-screw", "humanoidguide-optimus-roller-screw"],
    },
    {
        id: "magnetic-gear",
        family: "transmission",
        name: "Magnetic gear",
        short: "Magnetic gear",
        principle:
            "Two magnet rings with different pole counts couple through steel pole pieces: torque without touching teeth.",
        magnets: "permanent",
        trl: trl(
            6,
            ["ref-magnomatics-2014", "airframer-magnomatics-86kw"],
            "Demonstrator motors and vehicle trials; no volume product cited.",
        ),
        milestones: [
            milestone("lab", 2001, "Sheffield proposes the high-torque magnetic gear", [
                "ref-magnomatics-2014",
            ]),
        ],
        players: [{ companyId: "magnomatics", companyType: "startup" }],
        metrics: {
            torqueDensity: estimated(
                30,
                "Nm/kg",
                ["airframer-magnomatics-86kw"],
                "2022",
                "Magnomatics' claim for its 86 kW air-cooled magnetically geared motor.",
            ),
            efficiency: estimated(
                0.99,
                "fraction",
                ["houston-fluxworks-2024"],
                "2024-04",
                "FluxWorks' claim for its magnetic gear designs; not independently tested.",
            ),
        },
        facts: [],
        scene: { kind: "explode", spec: ALT_DRIVE_SCENES.magneticGear },
        sources: ["ref-magnomatics-2014", "gov-uk-magnomatics"],
    },
];
