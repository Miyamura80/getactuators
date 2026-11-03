import { ALT_MUSCLE_SCENES } from "../scenes/alt-muscles";
import { estimated, milestone, reported, trl } from "./make";
import type { AltTech } from "./types";

// Artificial muscles: soft actuators that contract or squeeze directly,
// driven by voltage, heat or fluid pressure instead of a spinning motor.

export const MUSCLE_TECHS: AltTech[] = [
    {
        id: "hasel",
        family: "artificial-muscle",
        name: "HASEL electrohydraulic muscle",
        short: "HASEL",
        principle:
            "Voltage zips electrodes on a liquid-filled pouch shut, pushing liquid aside so the pouch bulges and shortens.",
        magnets: "none",
        trl: trl(
            4,
            ["imechanica-hasel-2018", "csail-hasel-keplinger"],
            "Published in Science in 2018 and spun out into Artimus Robotics the same year; no volume product cited.",
        ),
        milestones: [
            milestone("lab", 2018, "HASEL published in Science", [
                "imechanica-hasel-2018",
            ]),
        ],
        players: [{ companyId: "artimus-robotics", companyType: "startup" }],
        metrics: {
            specificPower: reported(
                600,
                "W/kg",
                ["csail-hasel-keplinger"],
                "2026",
                "Best of the group's designs; the 2019 toolkit actuators reach over 150 W/kg.",
            ),
            efficiency: reported(
                0.3,
                "fraction",
                ["csail-hasel-keplinger"],
                "2026",
                "Full-cycle electromechanical efficiency of the group's best designs.",
            ),
        },
        facts: [
            {
                label: "Toolkit specific power",
                value: reported(
                    150,
                    "W/kg",
                    ["mpi-hasel-toolkit-2019"],
                    "2019",
                    "Lower bound reported for the easy-to-build toolkit actuators.",
                ),
            },
        ],
        scene: { kind: "loop", spec: ALT_MUSCLE_SCENES.hasel },
        sources: ["imechanica-hasel-2018", "csail-hasel-keplinger"],
    },
    {
        id: "dielectric-elastomer",
        family: "artificial-muscle",
        name: "Dielectric elastomer actuator",
        short: "Dielectric elastomer",
        principle:
            "A soft film between stretchy electrodes is squeezed thin by electrostatic pressure and spreads out sideways.",
        magnets: "none",
        trl: trl(
            4,
            ["srt-pelrine-dea-2000"],
            "Lab demonstrations since 2000; no shipping actuator product cited here.",
        ),
        milestones: [
            milestone("lab", 2000, "SRI shows strain above 100%", [
                "srt-pelrine-dea-2000",
            ]),
        ],
        players: [],
        metrics: {},
        facts: [
            {
                label: "Strain",
                value: reported(
                    1,
                    "fraction",
                    ["srt-pelrine-dea-2000"],
                    "2000",
                    "Over 100% strain in the 2000 Science paper.",
                ),
            },
        ],
        scene: { kind: "loop", spec: ALT_MUSCLE_SCENES.dea },
        sources: ["srt-pelrine-dea-2000"],
    },
    {
        id: "twisted-coiled-polymer",
        family: "artificial-muscle",
        name: "Twisted and coiled polymer muscle",
        short: "Coiled polymer",
        principle:
            "Nylon line twisted until it coils; heating untwists the fibre and the coil pulls shorter.",
        magnets: "none",
        trl: trl(
            3,
            ["uow-haines-tcp-2014", "srep-coiled-polymer-efficiency-2016"],
            "Lab stage since 2014; low efficiency limits use.",
        ),
        milestones: [
            milestone("lab", 2014, "Fishing-line muscles published in Science", [
                "uow-haines-tcp-2014",
                "utd-fishing-line-muscles-2014",
            ]),
        ],
        players: [],
        metrics: {
            specificPower: reported(
                5300,
                "W/kg",
                ["uow-haines-tcp-2014"],
                "2014",
                "Peak mechanical work rate per kilogram of muscle in the Science paper.",
            ),
            efficiency: reported(
                0.002,
                "fraction",
                ["srep-coiled-polymer-efficiency-2016"],
                "2016",
                "Work efficiency of coiled nylon 6,6 between 30 and 90 °C; polyethylene reached 1.2%.",
            ),
        },
        facts: [
            {
                label: "Contraction",
                value: reported(0.49, "fraction", ["uow-haines-tcp-2014"], "2014"),
            },
        ],
        scene: { kind: "loop", spec: ALT_MUSCLE_SCENES.tcp },
        sources: ["uow-haines-tcp-2014", "utd-fishing-line-muscles-2014"],
    },
    {
        id: "shape-memory-alloy",
        family: "artificial-muscle",
        name: "Shape memory alloy",
        short: "SMA",
        principle:
            "A nickel-titanium wire stretched cold returns to its trained shape when current heats it.",
        magnets: "none",
        trl: trl(
            9,
            ["uktech-cml-2024", "counterpoint-sma-ois"],
            "SMA camera actuators ship in tens of millions of phones.",
        ),
        milestones: [
            milestone("lab", 1959, "Nitinol found at the Naval Ordnance Laboratory", [
                "nnci-story-of-nitinol",
            ]),
            milestone(
                "volume",
                2024,
                "SMA camera actuators in 70M phones",
                ["uktech-cml-2024"],
                {
                    note: "Cumulative by February 2024; earliest dated volume figure we cite.",
                },
            ),
        ],
        players: [{ companyId: "cambridge-mechatronics", companyType: "startup" }],
        metrics: {},
        facts: [
            {
                label: "Phones shipped with CML SMA",
                value: estimated(
                    70e6,
                    "units",
                    ["uktech-cml-2024"],
                    "2024-02",
                    "Company figure citing DXOMARK data.",
                ),
            },
        ],
        scene: { kind: "loop", spec: ALT_MUSCLE_SCENES.sma },
        sources: ["nnci-story-of-nitinol", "counterpoint-sma-ois"],
    },
    {
        id: "mckibben",
        family: "artificial-muscle",
        name: "Pneumatic McKibben muscle",
        short: "McKibben",
        principle:
            "Air inflates a bladder inside a braided sleeve; the braid widens and the muscle shortens, like a finger trap.",
        magnets: "none",
        trl: trl(
            9,
            ["machinedesign-fluidic-muscle"],
            "Festo sells the Fluidic Muscle as a catalogue product.",
        ),
        milestones: [],
        players: [{ companyId: "festo", companyType: "incumbent" }],
        metrics: {},
        facts: [
            {
                label: "Usual air pressure",
                value: reported(
                    0.6,
                    "MPa",
                    ["tokyotech-hydraulic-muscle-2017"],
                    "2017",
                    "Conventional McKibben muscles run at 0.3 to 0.6 MPa.",
                ),
            },
        ],
        scene: { kind: "loop", spec: ALT_MUSCLE_SCENES.mckibben },
        sources: ["machinedesign-fluidic-muscle", "tokyotech-hydraulic-muscle-2017"],
    },
    {
        id: "hydraulic-muscle",
        family: "artificial-muscle",
        name: "Hydraulic artificial muscle",
        short: "Hydraulic muscle",
        principle:
            "A McKibben-type muscle driven by oil or water at high pressure from a small electric pump.",
        magnets: "motor",
        trl: trl(
            5,
            ["tokyotech-hydraulic-muscle-2017", "rdworld-protoclone-2025"],
            "Lab prototypes since 2017 and a 1,000-muscle android demo in 2025; production units announced.",
        ),
        milestones: [
            milestone("lab", 2017, "Bridgestone and Tokyo Tech 7 kN muscle", [
                "tokyotech-hydraulic-muscle-2017",
            ]),
            milestone(
                "first-commercial",
                2025,
                "Clone Alpha pre-orders, 279 units planned",
                ["fox-clone-alpha-2025"],
                {
                    announced: true,
                },
            ),
        ],
        players: [],
        metrics: {},
        facts: [
            {
                label: "Contraction force",
                value: reported(
                    7000,
                    "N",
                    ["tokyotech-hydraulic-muscle-2017"],
                    "2017",
                    "From a 15 mm diameter muscle at about 5 MPa.",
                ),
            },
            {
                label: "Muscles in Protoclone",
                value: reported(1000, "units", ["rdworld-protoclone-2025"], "2025"),
            },
        ],
        scene: { kind: "loop", spec: ALT_MUSCLE_SCENES.hydraulicMuscle },
        sources: ["tokyotech-hydraulic-muscle-2017", "rdworld-protoclone-2025"],
    },
];
