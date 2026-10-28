import { cost, gh } from "./build";
import type { OpenRobot } from "./types";

// Arms: desktop and research manipulators.

const SO = "TheRobotStudio/SO-ARM100";
const LEROBOT_SO101 = "https://huggingface.co/docs/lerobot/so101";
const KOCH = "AlexanderKoch-Koch/low_cost_robot";
const KOCH11 = "jess-moss/koch-v1-1";
const OPENARM = "enactic/openarm";
const OPENARM_MOTORS = gh("enactic/openarm_teleop", "src/openarm_constants.hpp");
const PAROL = "PCrnjak/PAROL6-Desktop-robot-arm";
const PAROL_BOM = gh(PAROL, "BOM/BOM.md");
const THOR = "AngelLM/Thor";

const soArm = (bom: string) =>
    ({
        cad: { url: gh(SO, "STEP/"), status: "full", note: "STEP and STL." },
        software: { url: "https://github.com/huggingface/lerobot", status: "full" },
        bom: { url: bom, status: "full" },
        assembly: { url: LEROBOT_SO101, status: "full" },
        sim: { url: gh(SO, "Simulation/"), status: "full" },
        licence: { url: gh(SO, "LICENSE"), status: "full" },
    }) as const;

export const ARM_ROBOTS: OpenRobot[] = [
    {
        id: "so-100",
        name: "SO-100",
        type: "arm",
        maintainers: ["TheRobotStudio", "Hugging Face"],
        repo: SO,
        summary:
            "The first Standard Open arm: a 3D-printed 5-axis arm plus gripper on six Feetech bus servos, built as a leader and follower pair for imitation learning in LeRobot. Now superseded by SO-101.",
        dof: 6,
        dofNote: "Five arm joints plus the gripper.",
        openness: soArm(gh(SO, "SO100.md")),
        licence: ["Apache-2.0"],
        bomCost: cost(123, [gh(SO, "SO100.md")], { note: "Follower arm, US parts." }),
        image: {
            url: "/open-robot-images/so-100.webp",
            credit: "TheRobotStudio/SO-ARM100, Apache-2.0",
        },
        joints: [
            {
                role: "Arm joints and gripper",
                count: 6,
                actuatorId: "feetech-sts3215-c001",
                motor: "STS3215 (7.4V)",
                brand: "Feetech",
                note: "The SO-100 BOM lists the 7.4 V servo without naming the gear variant.",
                sources: [gh(SO, "SO100.md")],
            },
        ],
        meetsInclusionRule: true,
        sources: [gh(SO), gh(SO, "SO100.md")],
    },
    {
        id: "so-101",
        name: "SO-101",
        type: "arm",
        maintainers: ["TheRobotStudio", "Hugging Face"],
        repo: SO,
        summary:
            "Successor to SO-100 with easier wiring and assembly: six STS3215 servos at 1:345 on the follower, a mixed-ratio leader arm for teleoperation, and kits from several vendors.",
        dof: 6,
        dofNote: "Five arm joints plus the gripper.",
        openness: soArm(gh(SO, "README.md")),
        licence: ["Apache-2.0"],
        bomCost: cost(121.94, [gh(SO, "README.md")], {
            note: "Follower arm, US parts; $229.88 for a leader and follower pair.",
        }),
        derivedFrom: ["so-100"],
        catalogRobotId: "therobotstudio-so-101",
        image: {
            url: "/robot-images/therobotstudio-so-101.webp",
            credit: "TheRobotStudio",
        },
        joints: [
            {
                role: "Arm joints and gripper",
                count: 6,
                actuatorId: "feetech-sts3215-c001",
                motor: "STS3215 C001 (7.4V, 1:345)",
                brand: "Feetech",
                sources: [gh(SO, "README.md")],
            },
        ],
        meetsInclusionRule: true,
        sources: [gh(SO), LEROBOT_SO101],
    },
    {
        id: "koch-v1",
        name: "Koch low-cost arm",
        type: "arm",
        maintainers: ["Alexander Koch"],
        repo: KOCH,
        summary:
            "3D-printed follower arm on Dynamixel servos (two XL430 for the first joints, four light XL330) with a GELLO-style leader arm. About $250 for the follower.",
        dof: 6,
        dofNote: "With the elbow-to-wrist extension; five without.",
        openness: {
            cad: {
                url: gh(KOCH, "hardware/"),
                status: "partial",
                note: "STL files only.",
            },
            software: {
                url: gh(KOCH),
                status: "full",
                note: "Dynamixel SDK scripts and teleoperation.",
            },
            bom: { url: gh(KOCH, "README.md"), status: "full" },
            assembly: {
                url: "https://youtu.be/RckrXOEoWrk",
                status: "full",
                note: "Video plus written steps.",
            },
            sim: {
                url: gh(KOCH, "README.md"),
                status: "partial",
                note: "A basic MuJoCo scene.",
            },
            licence: { url: gh(KOCH, "LICENSE"), status: "full" },
        },
        licence: ["MIT"],
        bomCost: cost(258, [gh(KOCH, "README.md")], {
            note: "Follower arm; the leader adds $183.",
        }),
        image: {
            url: "/open-robot-images/koch-v1.webp",
            credit: "AlexanderKoch-Koch/low_cost_robot, MIT",
        },
        joints: [
            {
                role: "Shoulder rotation and lift",
                count: 2,
                actuatorId: "dynamixel-xl430-w250-t",
                motor: "XL430-W250-T",
                brand: "Robotis (Dynamixel)",
                sources: [gh(KOCH, "README.md")],
            },
            {
                role: "Elbow, wrist and gripper",
                count: 4,
                actuatorId: "dynamixel-xl330-m288-t",
                motor: "XL330-M288-T",
                brand: "Robotis (Dynamixel)",
                sources: [gh(KOCH, "README.md")],
            },
        ],
        meetsInclusionRule: true,
        sources: [gh(KOCH)],
    },
    {
        id: "koch-v1-1",
        name: "Koch v1.1",
        type: "arm",
        maintainers: ["Jess Moss", "Hugging Face"],
        repo: KOCH11,
        summary:
            "Koch arm revised for easier assembly: fixed interferences, no soldering, a leader platform, SolidWorks models and a wiring diagram. Same Dynamixel servos.",
        dof: 6,
        dofNote: "Five arm joints plus the gripper.",
        openness: {
            cad: {
                url: gh(KOCH11),
                status: "full",
                note: "SolidWorks models and STL.",
            },
            electronics: {
                url: gh(KOCH11, "README.md"),
                status: "partial",
                note: "Wiring diagram for off-the-shelf boards.",
            },
            software: { url: "https://github.com/huggingface/lerobot", status: "full" },
            bom: { url: gh(KOCH11, "README.md"), status: "full" },
            assembly: {
                url: gh(KOCH11, "README.md"),
                status: "full",
                note: "Videos with SolidWorks animations.",
            },
            licence: { url: gh(KOCH11, "LICENSE"), status: "full" },
        },
        licence: ["Apache-2.0"],
        bomCost: cost(278, [gh(KOCH11, "README.md")], {
            note: "Follower arm, US parts; the leader adds $199.",
        }),
        derivedFrom: ["koch-v1"],
        image: {
            url: "/open-robot-images/koch-v1-1.webp",
            credit: "jess-moss/koch-v1-1, Apache-2.0",
        },
        joints: [
            {
                role: "Shoulder rotation and lift",
                count: 2,
                actuatorId: "dynamixel-xl430-w250-t",
                motor: "XL430-W250-T",
                brand: "Robotis (Dynamixel)",
                sources: [gh(KOCH11, "README.md")],
            },
            {
                role: "Elbow, wrist and gripper",
                count: 4,
                actuatorId: "dynamixel-xl330-m288-t",
                motor: "XL330-M288-T",
                brand: "Robotis (Dynamixel)",
                sources: [gh(KOCH11, "README.md")],
            },
        ],
        meetsInclusionRule: true,
        sources: [gh(KOCH11)],
    },
    {
        id: "openarm",
        name: "OpenArm",
        type: "arm",
        maintainers: ["Enactic"],
        repo: OPENARM,
        homepage: "https://openarm.dev",
        summary:
            "Human-scale, backdrivable 7-DoF arm for contact-rich physical AI research, sold assembled or DIY. $6,500 for a complete bimanual system; quasi-direct Damiao actuators over CAN.",
        dof: 14,
        dofNote: "Bimanual system, 7 per arm; grippers not counted.",
        openness: {
            cad: {
                url: gh("enactic/openarm_hardware"),
                status: "full",
                note: "STEP and STL (Google Drive, mirrored in releases).",
            },
            electronics: {
                url: gh("enactic/openarm_hardware"),
                status: "partial",
                note: "Wiring diagrams; the KER leader arm has PCBs.",
            },
            firmware: {
                url: gh("enactic/openarm_ker_firmware"),
                status: "partial",
                note: "KER encoder firmware; the arm runs stock Damiao motor firmware.",
            },
            software: {
                url: gh("enactic/openarm_can"),
                status: "full",
                note: "CAN library, ROS 2, teleop, dora-rs nodes.",
            },
            bom: { url: "https://docs.openarm.dev/hardware/", status: "full" },
            assembly: { url: "https://docs.openarm.dev/hardware/", status: "full" },
            sim: {
                url: gh("enactic/openarm_mujoco"),
                status: "full",
                note: "URDF/xacro, MuJoCo and Isaac Lab.",
            },
            licence: {
                url: gh("enactic/openarm_hardware", "LICENSE.txt"),
                status: "full",
            },
        },
        licence: ["CERN-OHL-S-2.0", "Apache-2.0"],
        bomCost: cost(6500, [gh(OPENARM)], {
            note: "Price of a complete bimanual system, not a parts total.",
        }),
        joints: [
            {
                role: "J1 and J2, per arm",
                count: 4,
                actuatorId: "damiao-dm-j8009-2ec",
                motor: "DM-J8009-2EC",
                brand: "DAMIAO (DMBots)",
                sources: [OPENARM_MOTORS],
            },
            {
                role: "J3 and J4, per arm",
                count: 4,
                actuatorId: "damiao-dm-j4340-2ec",
                motor: "DM-J4340-2EC",
                brand: "DAMIAO (DMBots)",
                sources: [OPENARM_MOTORS],
            },
            {
                role: "J5 to J7 and gripper, per arm",
                count: 8,
                actuatorId: "damiao-dm-j4310-2ec",
                motor: "DM-J4310-2EC",
                brand: "DAMIAO (DMBots)",
                sources: [OPENARM_MOTORS],
            },
        ],
        meetsInclusionRule: true,
        sources: [gh(OPENARM), gh("enactic/openarm_hardware"), OPENARM_MOTORS],
    },
    {
        id: "parol6",
        name: "PAROL6",
        type: "arm",
        maintainers: ["Source Robotics"],
        repo: PAROL,
        homepage: "https://source-robotics.com",
        summary:
            "3D-printed 6-axis desktop arm laid out like an industrial robot: NEMA 17 steppers, three of them behind planetary gearboxes, with commander software, a Python API and a ROS 2 MoveIt model.",
        dof: 6,
        openness: {
            cad: {
                url: gh(PAROL),
                status: "partial",
                note: "STL files are open; source CAD is not.",
            },
            software: { url: gh("PCrnjak/PAROL-commander-software"), status: "full" },
            bom: { url: PAROL_BOM, status: "full" },
            assembly: { url: gh(PAROL, "Building instructions/"), status: "full" },
            sim: { url: gh("PCrnjak/PAROL6-ROS2-MOVEIT"), status: "full" },
            licence: { url: gh(PAROL, "LICENSE"), status: "full" },
        },
        licence: ["GPL-3.0-only"],
        image: {
            url: "/open-robot-images/parol6.webp",
            credit: "PCrnjak/PAROL6-Desktop-robot-arm, GPL-3.0",
        },
        joints: [
            {
                role: "Stepper 1 (16 N·cm, 42x42x20 mm)",
                count: 1,
                motor: "NEMA 17 stepper, 16 N·cm",
                brand: "StepperOnline",
                sources: [PAROL_BOM],
            },
            {
                role: "Stepper 2 (45 N·cm, 42x42x40 mm)",
                count: 3,
                motor: "NEMA 17 stepper, 45 N·cm",
                brand: "StepperOnline",
                sources: [PAROL_BOM],
            },
            {
                role: "Stepper 3 (65 N·cm, 42x42x60 mm)",
                count: 2,
                motor: "NEMA 17 stepper, 65 N·cm",
                brand: "StepperOnline",
                sources: [PAROL_BOM],
            },
        ],
        meetsInclusionRule: true,
        sources: [gh(PAROL), PAROL_BOM],
    },
    {
        id: "thor",
        name: "Thor",
        type: "arm",
        maintainers: ["AngelLM"],
        repo: THOR,
        homepage: "http://thor.angel-lm.com/",
        summary:
            "3D-printed 6-DoF arm designed in FreeCAD and KiCad, G-code controlled like a 3D printer. 625 mm tall, lifts 750 g, hardware under 350 EUR.",
        dof: 6,
        openness: {
            cad: {
                url: gh(THOR, "freecad-src/"),
                status: "full",
                note: "FreeCAD sources, STEP and STL.",
            },
            electronics: {
                url: gh("AngelLM/ThorControlPCB"),
                status: "full",
                note: "KiCad shield for Arduino Mega.",
            },
            firmware: {
                url: "http://thor.angel-lm.com/documentation/firmware/",
                status: "full",
                note: "GRBL or RepRapFirmware configuration.",
            },
            software: { url: gh("AngelLM/Asgard"), status: "full" },
            bom: { url: "http://thor.angel-lm.com/documentation/bom/", status: "full" },
            assembly: {
                url: "http://thor.angel-lm.com/documentation/assembly/",
                status: "full",
            },
            sim: {
                url: gh("AngelLM/Thor-ROS"),
                status: "partial",
                note: "ROS 2 and MoveIt 2 packages.",
            },
            licence: { url: gh(THOR, "LICENSE"), status: "full" },
        },
        licence: ["CC-BY-SA-4.0"],
        bomCost: cost(350, [gh(THOR)], {
            unit: "EUR",
            confidence: "estimated",
            note: "Upper bound: the README says hardware cost below 350 EUR.",
        }),
        image: {
            url: "/open-robot-images/thor.webp",
            credit: "AngelLM/Thor, CC-BY-SA-4.0",
        },
        joints: [
            {
                role: "All six axes (3D-printed gears, GT2 belts)",
                count: null,
                motor: "Stepper motors",
                brand: "Not stated",
                note: "The README does not give per-joint motor sizes.",
                sources: [gh(THOR)],
            },
        ],
        meetsInclusionRule: true,
        sources: [gh(THOR)],
    },
];
