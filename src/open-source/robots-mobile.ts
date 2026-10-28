import { cost, gh } from "./build";
import type { OpenRobot } from "./types";

// Mobile manipulators: a base that drives plus one or two arms.

const YOR_PAPER = "https://arxiv.org/abs/2602.11150";
const YOR_SITE = "https://yourownrobot.ai/";
const YOR_REVIEW =
    "https://www.themoonlight.io/en/review/yor-your-own-mobile-manipulator-for-generalizable-robotics";
const YOR_REPORTED =
    "Reported by the YOR paper and project site; the files were not opened for this page.";

const MANMARU = "manmaruai/manmaru-yor";
const MANMARU_SITE = "https://yor.manmaruai.co.jp/en";
const REBOT_BOM = gh("Seeed-Projects/reBot-DevArm", "hardware/reBot_B601_DM/readme.md");

const LEKIWI = "SIGRobotics-UIUC/LeKiwi";
const XLE = "Vector-Wangel/XLeRobot";
const XLE_MATERIAL = gh(XLE, "docs/en/source/hardware/getting_started/material.md");

export const MOBILE_ROBOTS: OpenRobot[] = [
    {
        id: "yor",
        name: "YOR",
        type: "mobile-manipulator",
        maintainers: ["NYU", "UC Berkeley"],
        country: "US",
        repo: null,
        homepage: YOR_SITE,
        summary:
            "Your Own Robot: a low-cost mobile manipulator from NYU and UC Berkeley with an omnidirectional swerve base, a telescopic lift and two compliant 6-DoF arms with grippers. The paper puts the BOM under US$10,000.",
        dof: 13,
        dofNote:
            "Two 6-DoF arms plus the lift; grippers and the holonomic base are not counted.",
        weightKg: 27,
        openness: {
            cad: { url: YOR_SITE, status: "partial", note: YOR_REPORTED },
            software: { url: YOR_SITE, status: "partial", note: YOR_REPORTED },
            bom: { url: YOR_SITE, status: "partial", note: YOR_REPORTED },
            assembly: { url: YOR_SITE, status: "partial", note: YOR_REPORTED },
            licence: {
                url: YOR_SITE,
                status: "partial",
                note: "Press coverage reports MIT for the code; no hardware licence was found in the sources checked.",
            },
        },
        licence: ["MIT"],
        bomCost: cost(9250, [YOR_PAPER, "https://arxiv.org/html/2605.16537"], {
            confidence: "estimated",
            note: "Third-party reading of the paper's BOM; the paper's abstract says under US$10,000.",
        }),
        joints: [
            {
                role: "Swerve base, drive and steer (4 modules, 2 motors each)",
                count: 8,
                motor: "REV Robotics MAXSwerve module motors",
                brand: "REV Robotics",
                sources: [YOR_REVIEW],
            },
            {
                role: "Arm joints (2 x 6-DoF compliant arms)",
                count: 12,
                motor: "Arm motor not named in the sources checked",
                brand: "Not stated",
                sources: [YOR_PAPER, YOR_REVIEW],
            },
            {
                role: "Telescopic lift (standing-desk column)",
                count: 1,
                motor: "Standing-desk lift column",
                brand: "Not stated",
                sources: [YOR_REVIEW],
            },
        ],
        meetsInclusionRule: true,
        inclusionNote:
            "CAD, BOM and build docs are reported as public with MIT code; checked against the paper and press, not the files themselves.",
        sources: [YOR_PAPER, YOR_SITE, YOR_REVIEW],
    },
    {
        id: "manmaru-yor",
        name: "Manmaru YOR",
        type: "mobile-manipulator",
        maintainers: ["ManmaruAI"],
        country: "JP",
        repo: MANMARU,
        homepage: MANMARU_SITE,
        summary:
            "ManmaruAI's build of YOR for manufacturing and logistics research: two Seeed reBot Arm B601-DM arms on a YOR-based omnidirectional base with an aluminium-extrusion frame. About $6,300 in parts, or about $12,700 assembled.",
        dof: 14,
        dofNote: "Two arms of 6 axes plus a gripper each.",
        openness: {
            cad: {
                url: gh(MANMARU),
                status: "partial",
                note: "Arm mounting plate STEP only; further CAD is marked in preparation.",
            },
            bom: {
                url: "https://docs.google.com/spreadsheets/d/1wTV4-W7uaUN-rPmUG_nEQrrD-Kc_9OFs5pRmW5-EbK4/edit?usp=sharing",
                status: "full",
            },
            sim: {
                url: "https://drive.google.com/drive/folders/1xSVIpzPFBEdiUuaOV5YIRsTOdhVtDF5L",
                status: "full",
                note: "Robot model v1.0: URDF and meshes.",
            },
        },
        licence: [],
        bomCost: cost(6300, [MANMARU_SITE], {
            note: "Parts to build from the public BOM; about $12,700 assembled and tested.",
            range: [6300, 12700],
        }),
        derivedFrom: ["yor"],
        catalogRobotId: "manmaru-yor",
        image: { url: "/robot-images/manmaru-yor.webp", credit: "ManmaruAI" },
        joints: [
            {
                role: "Arm joints, higher torque (3 per arm)",
                count: 6,
                actuatorId: "damiao-dm-j4340p-2ec",
                motor: "DM-J4340P-2EC",
                brand: "DAMIAO (DMBots)",
                sources: [REBOT_BOM],
            },
            {
                role: "Arm joints and gripper (4 per arm)",
                count: 8,
                actuatorId: "damiao-dm-j4310-2ec",
                motor: "DM-J4310-2EC",
                brand: "DAMIAO (DMBots)",
                sources: [REBOT_BOM],
            },
        ],
        meetsInclusionRule: false,
        inclusionNote:
            "Listed as the named YOR derivative. The repo assigns no blanket licence and assembly instructions and ROS 2 packages are marked in preparation.",
        sources: [MANMARU_SITE, gh(MANMARU), REBOT_BOM],
    },
    {
        id: "lekiwi",
        name: "LeKiwi",
        type: "mobile-manipulator",
        maintainers: ["SIGRobotics at UIUC", "Hugging Face"],
        country: "US",
        repo: LEKIWI,
        summary:
            "Low-cost mobile manipulator: an SO-101 arm on a 3D-printed three-wheel kiwi (holonomic) base with omni wheels and a Raspberry Pi 5, driven from LeRobot.",
        dof: 9,
        dofNote: "Three wheel servos plus the 6-servo SO-101 follower arm.",
        openness: {
            cad: {
                url: "https://a360.co/4k1P8yO",
                status: "full",
                note: "Fusion 360 CAD and print files.",
            },
            software: {
                url: "https://huggingface.co/docs/lerobot/lekiwi",
                status: "full",
                note: "LeRobot driver, teleoperation and data collection.",
            },
            bom: { url: gh(LEKIWI, "BOM.md"), status: "full" },
            assembly: { url: gh(LEKIWI, "Assembly.md"), status: "full" },
            sim: {
                url: gh(LEKIWI, "URDF/"),
                status: "full",
                note: "URDF exported from CAD.",
            },
            licence: { url: gh(LEKIWI, "LICENSE.txt"), status: "full" },
        },
        licence: ["Apache-2.0"],
        bomCost: cost(482, [gh(LEKIWI, "BOM.md")], {
            note: "12 V version, including an SO-101 leader and follower arm set.",
        }),
        derivedFrom: ["so-101"],
        image: {
            url: "/open-robot-images/lekiwi.webp",
            credit: "SIGRobotics-UIUC/LeKiwi, Apache-2.0",
        },
        joints: [
            {
                role: "Wheels (kiwi drive)",
                count: 3,
                actuatorId: "feetech-sts3215",
                motor: "STS3215 (12V)",
                brand: "Feetech",
                sources: [gh(LEKIWI, "BOM.md")],
            },
            {
                role: "SO-101 arm and gripper",
                count: 6,
                actuatorId: "feetech-sts3215",
                motor: "STS3215 (12V)",
                brand: "Feetech",
                sources: [gh(LEKIWI, "BOM.md")],
            },
        ],
        meetsInclusionRule: true,
        sources: [gh(LEKIWI), gh(LEKIWI, "BOM.md")],
    },
    {
        id: "xlerobot",
        name: "XLeRobot",
        type: "mobile-manipulator",
        maintainers: ["Gaotian (Vector) Wang", "XLeRobot contributors"],
        repo: XLE,
        homepage: "https://xlerobot.readthedocs.io/en/latest/index.html",
        summary:
            "Dual-arm household mobile robot built from two SO-101 arms on a LeKiwi base with a 2-DoF head camera. From about $660 in parts and under four hours of assembly.",
        dof: 17,
        dofNote: "12 arm servos, 3 base servos and 2 head servos.",
        openness: {
            cad: {
                url: "https://xlerobot.readthedocs.io/en/latest/hardware/getting_started/3d.html",
                status: "partial",
                note: "Printable parts in the 3D printing guide.",
            },
            software: { url: gh(XLE), status: "full" },
            bom: { url: XLE_MATERIAL, status: "full" },
            assembly: {
                url: "https://xlerobot.readthedocs.io/en/latest/hardware/getting_started/assemble.html",
                status: "full",
            },
            sim: {
                url: "https://xlerobot.readthedocs.io/en/latest/simulation/index.html",
                status: "full",
                note: "URDFs and MuJoCo scenes.",
            },
            licence: { url: gh(XLE, "LICENSE"), status: "full" },
        },
        licence: ["Apache-2.0"],
        bomCost: cost(660, [gh(XLE)], {
            note: "Basic build, US parts; excludes 3D printing, tools, shipping and taxes.",
        }),
        derivedFrom: ["lekiwi", "so-101"],
        joints: [
            {
                role: "Two SO-101 arms",
                count: 12,
                actuatorId: "feetech-sts3215",
                motor: "STS3215 (12V)",
                brand: "Feetech",
                sources: [XLE_MATERIAL],
            },
            {
                role: "Base wheels",
                count: 3,
                actuatorId: "feetech-sts3215",
                motor: "STS3215 (12V)",
                brand: "Feetech",
                sources: [XLE_MATERIAL],
            },
            {
                role: "Head (pan and tilt)",
                count: 2,
                actuatorId: "feetech-sts3215",
                motor: "STS3215 (12V)",
                brand: "Feetech",
                sources: [XLE_MATERIAL],
            },
        ],
        meetsInclusionRule: true,
        sources: [gh(XLE), XLE_MATERIAL],
    },
];
