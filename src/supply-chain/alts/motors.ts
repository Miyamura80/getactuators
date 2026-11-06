import { ALT_MOTOR_SCENES } from "../scenes/alt-motors";
import { estimated, milestone, noRareEarth, reported, trl } from "./make";
import type { AltTech } from "./types";

// Rare-earth-free motors: electric machines that make torque without NdFeB
// magnets, by reluctance, induction, a wound field, or a cheaper magnet.

export const MOTOR_TECHS: AltTech[] = [
    {
        id: "induction",
        family: "ree-free-motor",
        name: "Induction motor",
        short: "Induction",
        principle:
            "A rotating stator field induces currents in rotor bars; the induced field drags the rotor round. No magnets.",
        magnets: "none",
        trl: trl(
            9,
            ["tesla-s1-2010"],
            "Sold at scale for over a century; Tesla built its first cars on induction motors.",
        ),
        milestones: [
            milestone("lab", 1888, "Tesla patents the induction motor", [
                "eep-induction-history",
            ]),
        ],
        players: [
            { companyId: "abb", companyType: "incumbent" },
            { companyId: "tesla", companyType: "incumbent" },
        ],
        metrics: {
            efficiency: reported(
                0.87,
                "fraction",
                ["tesla-s1-2010"],
                "2010",
                "Average over the EPA combined cycle for Tesla's three-phase induction motors.",
            ),
        },
        facts: [],
        scene: { kind: "explode", spec: ALT_MOTOR_SCENES.induction },
        sources: ["eep-induction-history", "tesla-s1-2010"],
    },
    {
        id: "switched-reluctance",
        family: "ree-free-motor",
        name: "Switched reluctance motor",
        short: "Switched reluctance",
        principle:
            "Stator coils fire in sequence; plain steel rotor teeth snap to the nearest energised pole. No magnets, no rotor copper.",
        magnets: "none",
        trl: trl(
            9,
            ["popsci-dyson-dc31-2009", "turntide-buildings-2021"],
            "In consumer products since Dyson's digital motors and in building HVAC retrofits.",
        ),
        milestones: [
            milestone(
                "volume",
                2009,
                "Dyson DC31 ships a 104,000 rpm SR motor",
                ["popsci-dyson-dc31-2009"],
                {
                    note: "Earliest dated volume product we cite; Dyson sold SR motors in Japan before this.",
                },
            ),
        ],
        players: [{ companyId: "turntide", companyType: "startup" }],
        metrics: {},
        facts: [
            {
                label: "Dyson DDM V2 speed",
                value: reported(104000, "rpm", ["popsci-dyson-dc31-2009"], "2009"),
            },
        ],
        scene: { kind: "loop", spec: ALT_MOTOR_SCENES.srm },
        sources: ["dnc-dyson-sr-motor", "popsci-dyson-dc31-2009"],
    },
    {
        id: "synchronous-reluctance",
        family: "ree-free-motor",
        name: "Synchronous reluctance motor",
        short: "SynRM",
        principle:
            "Air slots in the rotor laminations make one direction easy for flux; the rotor locks to the rotating field.",
        magnets: "none",
        trl: trl(
            9,
            ["dnc-abb-synrm-2011", "abb-ie6-synrm-2024"],
            "ABB has sold SynRM motor and drive packages since 2011 and launched an IE6 range in 2024.",
        ),
        milestones: [
            milestone(
                "first-commercial",
                2011,
                "ABB launches magnet-free SynRM at Hannover",
                ["dnc-abb-synrm-2011"],
            ),
        ],
        players: [{ companyId: "abb", companyType: "incumbent" }],
        metrics: {
            reeIntensityKgPerKw: noRareEarth(
                ["dnc-abb-synrm-2011"],
                "2011",
                "ABB's first-generation SynRM motors use no magnets.",
            ),
        },
        facts: [],
        scene: { kind: "explode", spec: ALT_MOTOR_SCENES.synrm },
        sources: ["dnc-abb-synrm-2011", "abb-ie6-synrm-2024"],
    },
    {
        id: "ferrite-pm",
        family: "ree-free-motor",
        name: "Ferrite permanent magnet motor",
        short: "Ferrite PM",
        principle:
            "Cheap iron-oxide magnets in spokes or deep slots concentrate flux to make up for their weaker field.",
        magnets: "ferrite",
        trl: trl(
            6,
            ["magneticsmag-proterial-ferrite-2023", "electrek-tesla-ree-free-2023"],
            "Ferrite motors are everyday parts in small machines; at traction power they are at prototype stage, with Tesla's announced rare-earth-free motor not yet confirmed in production.",
        ),
        milestones: [
            milestone("lab", 2023, "Proterial ferrite motor passes 100 kW", [
                "magneticsmag-proterial-ferrite-2023",
            ]),
        ],
        players: [
            { companyId: "proterial", companyType: "incumbent" },
            { companyId: "tesla", companyType: "incumbent" },
        ],
        metrics: {
            reeIntensityKgPerKw: noRareEarth(
                ["electrek-tesla-ree-free-2023"],
                "2023",
                "Tesla said its next permanent magnet drive unit uses no rare earth materials at all.",
            ),
        },
        facts: [
            {
                label: "Prototype output",
                value: reported(
                    100,
                    "kW",
                    ["magneticsmag-proterial-ferrite-2023"],
                    "2023",
                    "Proterial reports more than 100 kW from its ferrite prototype.",
                ),
            },
        ],
        scene: { kind: "explode", spec: ALT_MOTOR_SCENES.ferrite },
        sources: [
            "magneticsmag-proterial-ferrite-2023",
            "electrek-tesla-ree-free-2023",
        ],
    },
    {
        id: "wound-field",
        family: "ree-free-motor",
        name: "Wound-field synchronous motor",
        short: "Wound field",
        principle:
            "Copper coils on the rotor, fed DC through slip rings, replace the magnets; field strength becomes adjustable.",
        magnets: "none",
        trl: trl(
            9,
            ["renault-ree-free-motors", "bmw-ix3-2020"],
            "In series production cars since Renault's Kangoo Z.E. and Zoe and BMW's fifth-generation eDrive.",
        ),
        milestones: [
            milestone(
                "first-commercial",
                2011,
                "Kangoo Z.E. ships with a wound rotor",
                ["renault-ree-free-motors"],
            ),
            milestone("volume", 2012, "Renault Zoe in series production", [
                "renault-ree-free-motors",
            ]),
        ],
        players: [
            { companyId: "renault-group", companyType: "incumbent" },
            { companyId: "bmw-group", companyType: "incumbent" },
        ],
        metrics: {
            reeIntensityKgPerKw: noRareEarth(
                ["bmw-ix3-2020"],
                "2020",
                "BMW says the iX3 motor needs no rare earth materials.",
            ),
        },
        facts: [
            {
                label: "Zoe peak power",
                value: reported(65, "kW", ["eenews-continental-zoe"], "2012"),
            },
            {
                label: "Zoe torque",
                value: reported(220, "Nm", ["eenews-continental-zoe"], "2012"),
            },
            {
                label: "iX3 motor power",
                value: reported(210, "kW", ["bmw-ix3-2020"], "2020"),
            },
        ],
        scene: { kind: "explode", spec: ALT_MOTOR_SCENES.wfsm },
        sources: ["renault-ree-free-motors", "eenews-continental-zoe", "bmw-ix3-2020"],
    },
    {
        id: "axial-flux",
        family: "ree-free-motor",
        name: "Axial-flux motor (ferrite)",
        short: "Axial flux",
        principle:
            "Flux runs along the shaft between flat rotor discs and a stator; the large magnet face suits weaker ferrite.",
        magnets: "ferrite",
        trl: trl(
            7,
            ["vcaonline-conifer-seed-2025", "evreporter-conifer-pune-2025"],
            "Ferrite axial-flux hub motors entered low-volume production in 2025; NdFeB axial-flux motors are further along but are not rare-earth-free.",
        ),
        milestones: [
            milestone(
                "first-commercial",
                2025,
                "Conifer starts low-volume ferrite motor output",
                ["evreporter-conifer-pune-2025"],
            ),
        ],
        players: [],
        metrics: {
            reeIntensityKgPerKw: noRareEarth(
                ["vcaonline-conifer-seed-2025"],
                "2025",
                "Conifer's ferrite version uses C-9 grade ferrite and no rare earths.",
            ),
        },
        facts: [
            {
                label: "Conifer seed round",
                value: reported(
                    20e6,
                    "USD",
                    ["vcaonline-conifer-seed-2025"],
                    "2025-04",
                ),
            },
        ],
        scene: { kind: "explode", spec: ALT_MOTOR_SCENES.axial },
        sources: ["vcaonline-conifer-seed-2025", "evreporter-conifer-pune-2025"],
    },
    {
        id: "iron-nitride",
        family: "ree-free-motor",
        name: "Iron nitride magnet motor",
        short: "Iron nitride",
        principle:
            "A standard permanent magnet rotor with iron nitride magnets, made of iron and nitrogen instead of rare earths.",
        magnets: "iron-nitride",
        trl: trl(
            7,
            ["niron-about", "chemeng-niron-sartell-2025"],
            "The magnet is made on a commercial pilot line; volume production is announced, not running.",
        ),
        milestones: [
            milestone(
                "first-commercial",
                2024,
                "Niron opens a commercial pilot plant",
                ["niron-about"],
            ),
            milestone(
                "volume",
                2027,
                "Sartell plant: 1,500 t a year",
                ["ie-niron-1500t-2027", "chemeng-niron-sartell-2025"],
                {
                    announced: true,
                },
            ),
        ],
        players: [{ companyId: "niron-magnetics", companyType: "startup" }],
        metrics: {
            reeIntensityKgPerKw: noRareEarth(
                ["chemeng-niron-sartell-2025"],
                "2025",
                "Iron nitride magnets contain no rare earth elements.",
            ),
        },
        facts: [
            {
                label: "Planned capacity",
                value: estimated(
                    1500,
                    "t/yr",
                    ["ie-niron-1500t-2027"],
                    "2025",
                    "Announced design capacity of the Sartell, Minnesota plant.",
                ),
            },
        ],
        scene: { kind: "loop", spec: ALT_MOTOR_SCENES.ironNitride },
        sources: ["umn-niron-founded", "niron-about"],
    },
];
