import { cost, gh } from "./build";
import type { OpenJoint, OpenRobot } from "./types";

// Legged robots: quadrupeds, bipeds and wheel-legs.

const DUCK = "apirrone/Open_Duck_Mini";
const DUCK_MJCF = gh(
    "apirrone/Open_Duck_Playground",
    "playground/open_duck_mini_v2/xmls/open_duck_mini_v2.xml",
);

const ODRI = "open-dynamic-robot-initiative/open_robot_actuator_hardware";
const odri = (path: string) => gh(ODRI, path, "master");
const ODRI_MODULE = odri("mechanics/actuator_module_v1/README.md");
const SOLO12 = odri("mechanics/quadruped_robot_12dof_v1/README.md");
const SOLO8 = odri("mechanics/quadruped_robot_8dof_v2/README.md");

const UPKIE = "upkie/upkie";
const UPKIE_BOM = gh(UPKIE, "docs/assembly/bill-of-materials.md");

const DOGGO = "Nate711/StanfordDoggoProject";

const odriJoints = (count: number, src: string): OpenJoint[] => [
    {
        role: "Every joint (ODRI actuator module, 9:1 two-stage belt)",
        count,
        motor: "T-Motor Antigravity 4004 300 kV",
        brand: "T-Motor",
        sources: [ODRI_MODULE, src],
    },
];

const odriOpenness = (readme: string) =>
    ({
        cad: {
            url: readme,
            status: "full",
            note: "CAD, 3D-printed and machined part drawings.",
        },
        electronics: {
            url: odri("electronics/"),
            status: "full",
            note: "Micro driver and master board.",
        },
        firmware: {
            url: gh("open-dynamic-robot-initiative/master-board"),
            status: "full",
        },
        software: {
            url: gh(
                "open-dynamic-robot-initiative/open-dynamic-robot-initiative.github.io/wiki",
            ),
            status: "full",
        },
        bom: { url: readme, status: "full" },
        assembly: {
            url: ODRI_MODULE,
            status: "full",
            note: "Step-by-step module and robot assembly.",
        },
        licence: { url: odri("LICENSE"), status: "full" },
    }) as const;

export const LEGGED_ROBOTS: OpenRobot[] = [
    {
        id: "open-duck-mini",
        name: "Open Duck Mini v2",
        type: "legged",
        maintainers: ["Antoine Pirrone"],
        repo: DUCK,
        summary:
            "Miniature, about 42 cm take on Disney's BDX droid: a 3D-printed biped with a 4-DoF head on Feetech bus servos, walking from an RL policy on a Raspberry Pi Zero 2W. Full BOM under $400.",
        dof: 14,
        dofNote: "Five per leg plus neck pitch and head pitch, yaw and roll.",
        openness: {
            cad: {
                url: "https://cad.onshape.com/documents/64074dfcfa379b37d8a47762/w/3650ab4221e215a4f65eb7fe/e/0505c262d882183a25049d05",
                status: "full",
                note: "Onshape document.",
            },
            software: { url: gh("apirrone/Open_Duck_Mini_Runtime"), status: "full" },
            bom: {
                url: gh(DUCK, "README.md", "v2"),
                status: "full",
                note: "Google Sheets BOM.",
            },
            assembly: {
                url: gh(DUCK, "docs/assembly_guide.md", "v2"),
                status: "partial",
                note: "The README marks the guide incomplete.",
            },
            sim: {
                url: DUCK_MJCF,
                status: "full",
                note: "MJCF in Open Duck Playground.",
            },
            licence: { url: gh(DUCK, "LICENSE"), status: "full" },
        },
        licence: ["Apache-2.0"],
        bomCost: cost(400, [gh(DUCK, "README.md", "v2")], {
            confidence: "estimated",
            note: "Upper bound: the README says the full BOM should be under $400.",
        }),
        joints: [
            {
                role: "Legs: hip yaw, roll, pitch, knee and ankle",
                count: 10,
                actuatorId: "feetech-sts3215",
                motor: "STS3215",
                brand: "Feetech",
                note: "The MJCF names every joint class sts3215; voltage variant not stated.",
                sources: [DUCK_MJCF],
            },
            {
                role: "Neck pitch and head pitch, yaw, roll",
                count: 4,
                actuatorId: "feetech-sts3215",
                motor: "STS3215",
                brand: "Feetech",
                sources: [DUCK_MJCF],
            },
        ],
        meetsInclusionRule: true,
        sources: [gh(DUCK, "README.md", "v2"), DUCK_MJCF],
    },
    {
        id: "solo-8",
        name: "Solo-8",
        type: "legged",
        maintainers: ["Open Dynamic Robot Initiative (MPI-IS, NYU)"],
        repo: ODRI,
        homepage: "https://open-dynamic-robot-initiative.github.io",
        summary:
            "Torque-controlled 8-DoF research quadruped from the Open Dynamic Robot Initiative: four 2-DoF legs of identical brushless modules with a 9:1 belt reduction, 1.9 kg with battery placeholders.",
        dof: 8,
        weightKg: 1.9,
        openness: odriOpenness(SOLO8),
        licence: ["BSD-3-Clause"],
        image: {
            url: "/open-robot-images/solo-8.webp",
            credit: "open_robot_actuator_hardware, BSD-3-Clause",
        },
        joints: odriJoints(8, SOLO8),
        meetsInclusionRule: true,
        sources: [SOLO8, ODRI_MODULE],
    },
    {
        id: "solo-12",
        name: "Solo-12",
        type: "legged",
        maintainers: ["Open Dynamic Robot Initiative (MPI-IS, NYU)"],
        repo: ODRI,
        homepage: "https://open-dynamic-robot-initiative.github.io",
        summary:
            "The 12-DoF version of Solo: a body module and four identical 3-DoF legs built from the same open actuator module. 2.5 kg.",
        dof: 12,
        weightKg: 2.5,
        openness: odriOpenness(SOLO12),
        licence: ["BSD-3-Clause"],
        derivedFrom: ["solo-8"],
        image: {
            url: "/open-robot-images/solo-12.webp",
            credit: "open_robot_actuator_hardware, BSD-3-Clause",
        },
        joints: odriJoints(12, SOLO12),
        meetsInclusionRule: true,
        sources: [SOLO12, ODRI_MODULE],
    },
    {
        id: "upkie",
        name: "Upkie",
        type: "legged",
        maintainers: ["Stéphane Caron and contributors"],
        repo: UPKIE,
        homepage: "https://upkie.github.io/upkie/",
        summary:
            "Wheeled biped that balances on two wheels and uses its legs for uneven ground, built from off-the-shelf mjbots servos and 3D-printed parts. Python or C++, same code in sim and on the robot.",
        dof: 6,
        dofNote: "Hip and knee per leg plus two wheels.",
        openness: {
            cad: {
                url: gh(UPKIE, "docs/assembly/3d-printing.md"),
                status: "partial",
                note: "Printable parts.",
            },
            electronics: {
                url: gh(UPKIE, "docs/assembly/cables.md"),
                status: "partial",
                note: "Off-the-shelf mjbots boards and cable guide.",
            },
            firmware: {
                url: gh("mjbots/moteus"),
                status: "full",
                note: "The servos run mjbots' open moteus firmware.",
            },
            software: { url: gh(UPKIE), status: "full" },
            bom: { url: UPKIE_BOM, status: "full" },
            assembly: { url: gh(UPKIE, "docs/assembly/assembly.md"), status: "full" },
            sim: {
                url: gh(UPKIE),
                status: "full",
                note: "PyBullet and MuJoCo environments.",
            },
            licence: { url: gh(UPKIE, "LICENSE"), status: "full" },
        },
        licence: ["Apache-2.0"],
        joints: [
            {
                role: "Hips and knees",
                count: 4,
                actuatorId: "mjbots-qdd100",
                motor: "qdd100 beta",
                brand: "mjbots",
                sources: [UPKIE_BOM],
            },
            {
                role: "Wheels",
                count: 2,
                actuatorId: "mjbots-moteus-r4-11",
                motor: "moteus r4.11 developer kit",
                brand: "mjbots",
                note: "Developer kit: moteus r4.11 controller with a motor.",
                sources: [UPKIE_BOM],
            },
        ],
        meetsInclusionRule: true,
        sources: [gh(UPKIE), UPKIE_BOM],
    },
    {
        id: "stanford-doggo",
        name: "Stanford Doggo",
        type: "legged",
        maintainers: ["Stanford Student Robotics"],
        country: "US",
        repo: DOGGO,
        summary:
            "Agile quadruped from Stanford Student Robotics: four 2-DoF five-bar legs, each driven by two coaxial T-Motor MN5212 motors on ODrive controllers. No longer maintained; the team moved on to Pupper v3.",
        dof: 8,
        openness: {
            cad: {
                url: "https://a360.co/2OBxTbH",
                status: "full",
                note: "Fusion 360 model.",
            },
            firmware: {
                url: gh("Nate711/ODrive"),
                status: "full",
                note: "Custom ODrive firmware and Teensy code.",
            },
            software: { url: gh("Nate711/Doggo"), status: "full" },
            bom: {
                url: "https://docs.google.com/spreadsheets/d/1MQRoZCfsMdJhHQ-ht6YvhzNvye6xDXO8vhWQql2HtlI/edit#gid=726381752",
                status: "partial",
                note: "Work-in-progress BOM.",
            },
            licence: { url: gh(DOGGO, "LICENSE", "master"), status: "full" },
        },
        licence: ["MIT"],
        image: {
            url: "/open-robot-images/stanford-doggo.webp",
            credit: "Nate711/StanfordDoggoProject, MIT",
        },
        joints: [
            {
                role: "Leg motors (two coaxial per leg)",
                count: 8,
                motor: "T-Motor MN5212",
                brand: "T-Motor",
                sources: [gh(DOGGO)],
            },
        ],
        meetsInclusionRule: true,
        sources: [gh(DOGGO)],
    },
];
