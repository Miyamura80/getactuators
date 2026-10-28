import { cost, gh } from "./build";
import type { OpenRobot } from "./types";

// Humanoids and upper bodies.

const BHL = "HybridRobotics/Berkeley-Humanoid-Lite";
const BHL_PAPER = "https://arxiv.org/abs/2504.17249";
const BHL_COST =
    "https://www.rdworldonline.com/berkeley-debuts-5000-open-source-humanoid-built-with-desktop-3d-printers/";
const BHL_ASSETS = gh("HybridRobotics/Berkeley-Humanoid-Lite-Assets");
const BHL_DOCS = "https://berkeley-humanoid-lite.gitbook.io/docs";

const TODDLER = "hshi74/toddlerbot";
const TODDLER_MOTORS = gh(TODDLER, "toddlerbot/descriptions/default.yml");

const KBOT = "kscalelabs/kbot";
const KBOT_DOCS = "https://docs.kscale.dev/robots/k-bot/mechanical/";
const KBOT_MAP =
    "https://deepwiki.com/kscalelabs/kscale-assets/2.1-kbot-v2-humanoid-robot";

const POPPY = "poppy-project/poppy-humanoid";
const POPPY_DOCS = "https://docs.poppy-project.org/en/assembly-guides/poppy-humanoid/";

const ASIMOV = "menloresearch/asimov-1";
const ASIMOV_MECH = "https://docs.menlo.ai/asimov/1/overview/system-tour/mechanical";

const robstride = (role: string, model: "00" | "02" | "03" | "04", count: number) => ({
    role,
    count,
    actuatorId: `robstride-${model}`,
    motor: `RobStride ${model}`,
    brand: "RobStride",
    sources: [KBOT_DOCS, KBOT_MAP],
});

const encos = (role: string, part: string, count: number) => ({
    role,
    count,
    actuatorId: `encos-${part.toLowerCase()}`,
    motor: part,
    brand: "ENCOS",
    sources: [ASIMOV_MECH],
});

const dynamixel = (role: string, motor: string, count: number) => ({
    role,
    count,
    motor: `Dynamixel ${motor}`,
    brand: "Robotis (Dynamixel)",
    sources: [TODDLER_MOTORS],
});

export const HUMANOID_ROBOTS: OpenRobot[] = [
    {
        id: "berkeley-humanoid-lite",
        name: "Berkeley Humanoid Lite",
        type: "humanoid",
        maintainers: ["UC Berkeley Hybrid Robotics"],
        country: "US",
        repo: BHL,
        homepage: "https://lite.berkeley-humanoid.org/",
        summary:
            "Sub-$5,000 research humanoid from UC Berkeley. Every joint is a drone-class BLDC behind a 3D-printed cycloidal gearbox, in two sizes.",
        dof: 22,
        weightKg: 16,
        openness: {
            cad: {
                url: `${BHL_DOCS}/releases`,
                status: "full",
                note: "Onshape CAD and print files per release.",
            },
            software: {
                url: gh(BHL),
                status: "full",
                note: "Isaac Lab tasks, sim2sim and on-robot code.",
            },
            bom: { url: BHL_DOCS, status: "full" },
            assembly: { url: BHL_DOCS, status: "full" },
            sim: { url: BHL_ASSETS, status: "full", note: "URDF, MJCF and USD." },
            licence: {
                url: gh(BHL),
                status: "full",
                note: "MIT code, CC-BY-SA-4.0 other assets.",
            },
        },
        licence: ["MIT", "CC-BY-SA-4.0"],
        bomCost: cost(4312, [BHL_COST, BHL_PAPER], {
            note: "Full robot BOM in the paper.",
        }),
        joints: [
            {
                role: "Legs: hip yaw, roll, pitch, knee, ankle pitch and roll",
                count: 12,
                motor: "6512 BLDC + 3D-printed cycloidal",
                brand: "Generic BLDC",
                sources: [BHL_ASSETS, BHL_PAPER],
            },
            {
                role: "Arms: shoulder pitch, roll, yaw, elbow and wrist",
                count: 10,
                motor: "5010 BLDC + 3D-printed cycloidal (15:1)",
                brand: "Generic BLDC",
                sources: [BHL_ASSETS, BHL_PAPER],
            },
        ],
        meetsInclusionRule: true,
        sources: [gh(BHL), BHL_PAPER, BHL_COST],
    },
    {
        id: "toddlerbot",
        name: "ToddlerBot",
        type: "humanoid",
        maintainers: ["Stanford TML"],
        country: "US",
        repo: TODDLER,
        homepage: "https://toddlerbot.github.io/",
        summary:
            "Low-cost, ML-first humanoid from Stanford built from Dynamixel servos and 3D-printed parts, with RL training, teleoperation and a calibration jig in one pip-installable Python package.",
        dof: 30,
        dofNote: "30 joints plus 2 gripper racks in the default motor table.",
        openness: {
            cad: {
                url: "https://cad.onshape.com/documents/565bc33af293a651f66e88d2",
                status: "full",
                note: "Onshape document and MakerWorld print files.",
            },
            electronics: {
                url: gh(TODDLER, "docs/hardware/02_pcb8ch.rst"),
                status: "full",
            },
            software: { url: gh(TODDLER), status: "full" },
            bom: {
                url: gh(TODDLER, "docs/hardware/01_bill_of_materials.rst"),
                status: "full",
            },
            assembly: {
                url: gh(TODDLER, "docs/hardware/04_assembly_manual.rst"),
                status: "full",
            },
            sim: {
                url: gh(TODDLER, "toddlerbot/descriptions/"),
                status: "full",
                note: "MJCF and URDF per variant.",
            },
            licence: {
                url: gh(TODDLER),
                status: "partial",
                note: "MIT code; the design is CC-BY-NC-SA-4.0 (non-commercial).",
            },
        },
        licence: ["MIT", "CC-BY-NC-SA-4.0"],
        image: {
            url: "/open-robot-images/toddlerbot.webp",
            credit: "hshi74/toddlerbot, MIT / CC-BY-NC-SA-4.0",
        },
        joints: [
            dynamixel("Neck, waist, hip yaw and gripper racks", "XC330", 8),
            dynamixel("Hip pitch and roll", "2XC430", 4),
            dynamixel("Knee and ankle pitch", "XM430-W210", 4),
            dynamixel("Ankle roll and shoulder pitch", "XC430", 4),
            dynamixel("Shoulder roll and yaw, elbow, wrist", "2XL430", 12),
        ],
        meetsInclusionRule: true,
        inclusionNote: "The design licence is non-commercial.",
        sources: [gh(TODDLER), TODDLER_MOTORS],
    },
    {
        id: "kbot",
        name: "K-Bot",
        type: "humanoid",
        maintainers: ["K-Scale Labs"],
        country: "US",
        repo: KBOT,
        homepage: "https://www.kscale.dev/",
        summary:
            "Open-source 1.4 m humanoid built entirely from four RobStride QDD sizes. Hardware under CERN-OHL-S, software under GPL v3; in public alpha.",
        dof: 20,
        weightKg: 34,
        openness: {
            cad: {
                url: gh(KBOT, "mechanical/", "master"),
                status: "partial",
                note: "Mechanical folder; contents not itemized here.",
            },
            electronics: { url: gh(KBOT, "electrical/", "master"), status: "partial" },
            software: { url: gh("kscalelabs/kos-kbot"), status: "full" },
            sim: {
                url: gh("kscalelabs/ksim-kbot"),
                status: "partial",
                note: "RL environment with the robot model.",
            },
            licence: { url: gh(KBOT, "LICENSE-HW", "master"), status: "full" },
        },
        licence: ["CERN-OHL-S-2.0", "GPL-3.0-only"],
        image: {
            url: "/open-robot-images/kbot.webp",
            credit: "kscalelabs/kbot, CERN-OHL-S-2.0",
        },
        joints: [
            robstride("Hip pitch and knee", "04", 4),
            robstride("Shoulder pitch and roll, hip roll and yaw", "03", 8),
            robstride("Shoulder yaw, elbow and ankle pitch", "02", 6),
            robstride("Wrist", "00", 2),
        ],
        meetsInclusionRule: true,
        sources: [gh(KBOT), KBOT_DOCS, KBOT_MAP],
    },
    {
        id: "poppy-humanoid",
        name: "Poppy Humanoid",
        type: "humanoid",
        maintainers: ["Poppy Station", "Inria Flowers"],
        country: "FR",
        repo: POPPY,
        homepage: "https://www.poppy-project.org/",
        summary:
            "3D-printed research and education humanoid from Inria's Poppy project (2012). 25 Dynamixel actuators make up about 60% of an $8,000 to $9,000 build.",
        dof: 25,
        openness: {
            cad: {
                url: `${gh(POPPY)}/releases`,
                status: "full",
                note: "SolidWorks, STEP, STL and Parasolid in releases.",
            },
            software: {
                url: gh(POPPY),
                status: "full",
                note: "poppy-humanoid Python package and system image.",
            },
            bom: { url: `${POPPY_DOCS}bom.html`, status: "full" },
            assembly: { url: POPPY_DOCS, status: "full" },
            licence: {
                url: gh(POPPY, "LICENSE", "master"),
                status: "full",
                note: "CC BY-SA hardware, GPL v3 software.",
            },
        },
        licence: ["CC-BY-SA-4.0", "GPL-3.0-only"],
        bomCost: cost(8500, [gh(POPPY)], {
            range: [8000, 9000],
            note: "Full build; about 60% is the Dynamixel actuators.",
        }),
        image: {
            url: "/open-robot-images/poppy-humanoid.webp",
            credit: "poppy-project/poppy-humanoid, CC-BY-SA-4.0",
        },
        joints: [
            {
                role: "All joints",
                count: 25,
                motor: "Dynamixel (MX and AX series, mix per BOM)",
                brand: "Robotis (Dynamixel)",
                sources: [gh(POPPY), `${POPPY_DOCS}bom.html`],
            },
        ],
        meetsInclusionRule: true,
        sources: [gh(POPPY)],
    },
    {
        id: "asimov-1",
        name: "Asimov 1",
        type: "humanoid",
        maintainers: ["Menlo Research"],
        country: "SG",
        repo: ASIMOV,
        homepage: "https://menlo.ai/asimov-1",
        summary:
            "1.2 m, 35 kg biped with 25 actuated joints for whole-body control research. The repo holds mechanical and electrical CAD, a MuJoCo model and onboard software; sold as a $20,000 DIY kit or self-sourced from the BOM.",
        dof: 25,
        weightKg: 35,
        openness: {
            cad: {
                url: gh(ASIMOV, "mechanical/"),
                status: "full",
                note: "Mechanical CAD, 7 subassemblies.",
            },
            electronics: {
                url: gh(ASIMOV),
                status: "full",
                note: "Schematics, PCB files and wiring harness.",
            },
            firmware: {
                url: gh(ASIMOV),
                status: "partial",
                note: "Onboard software; the locomotion policy is still to come.",
            },
            software: { url: gh(ASIMOV), status: "full" },
            bom: {
                url: "https://docs.menlo.ai/asimov/1/assembly-preparations/self-source/select-release-and-bom",
                status: "full",
                note: "BOM plus a CAD-derived fabrication manifest.",
            },
            assembly: { url: "https://manual.asimov.inc", status: "full" },
            sim: { url: gh(ASIMOV), status: "full", note: "MuJoCo model." },
            licence: { url: gh(ASIMOV, "HARDWARE-LICENSE.txt"), status: "full" },
        },
        licence: ["CERN-OHL-S-2.0", "GPL-2.0-only"],
        bomCost: cost(20000, [gh(ASIMOV)], {
            note: "DIY kit price; the README does not total the self-source BOM.",
        }),
        catalogRobotId: "menlo-asimov-1",
        image: { url: "/robot-images/menlo-asimov-1.webp", credit: "Menlo Research" },
        joints: [
            encos("Hip pitch and waist yaw", "EC-A6416-P2-25", 3),
            encos("Hip roll and shoulder pitch", "EC-A5013-H17-100", 4),
            encos("Hip yaw and shoulder yaw", "EC-A3814-H14-107", 4),
            encos("Knee and shoulder roll", "EC-A4315-P2-36", 4),
            encos("Ankle (parallel), elbow, wrist yaw and neck", "EC-A4310-P2-36", 10),
        ],
        meetsInclusionRule: true,
        sources: [gh(ASIMOV), ASIMOV_MECH, "https://menlo.ai/asimov-1"],
    },
];
