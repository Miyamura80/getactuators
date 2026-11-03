import type { ReuseAllowlist, SourceReuse } from "../supply-chain/reuse";

// Every source cited on /open-source, keyed by a short id. Repositories are
// "facts" sources: we take individual facts (licence, file list, motor model,
// cost) from them, never their prose or tables.

export interface Source {
    title: string;
    url: string;
    reuse: SourceReuse;
}

const GH = "https://github.com";

export const SOURCES = {
    // YOR (NYU) and Manmaru YOR
    "yor-repo": {
        title: "YOR-robot/YOR: MuJoCo sim and CAN-bus control, MIT (SPARK Flex / SPARK MAX base, PiPER arms)",
        url: `${GH}/YOR-robot/YOR`,
        reuse: "facts",
    },
    "yor-paper": {
        title: "arXiv 2602.11150: YOR, Your Own Mobile Manipulator (NYU, UC Berkeley); BOM under US$10,000",
        url: "https://arxiv.org/abs/2602.11150",
        reuse: "facts",
    },
    "yor-site": {
        title: "yourownrobot.ai: YOR build docs, parts list and CAD",
        url: "https://yourownrobot.ai/",
        reuse: "facts",
    },
    "yor-korben": {
        title: "Korben: YOR parts about US$9,200 (arms about $5,000, base about $2,700), MIT code",
        url: "https://korben.info/en/yor-open-source-robot-build-yourself.html",
        reuse: "facts",
    },
    "manmaru-site": {
        title: "Manmaru AI: YOR build with reBot Arm B601 arms and an aluminium-extrusion frame",
        url: "https://yor.manmaruai.co.jp/en",
        reuse: "facts",
    },
    "manmaru-repo": {
        title: "manmaruai/manmaru-yor: resource index (BOM sheet, URDF and meshes; no blanket licence)",
        url: `${GH}/manmaruai/manmaru-yor`,
        reuse: "facts",
    },
    "rebot-b601-bom": {
        title: "Seeed reBot Arm B601-DM BOM (Damiao motor mix per arm)",
        url: `${GH}/Seeed-Projects/reBot-DevArm/blob/main/hardware/reBot_B601_DM/readme.md`,
        reuse: "facts",
    },
    // LeKiwi, XLeRobot, AhaRobot
    "lekiwi-repo": {
        title: "SIGRobotics-UIUC/LeKiwi: CAD, print meshes, URDF, BOM and assembly, Apache-2.0",
        url: `${GH}/SIGRobotics-UIUC/LeKiwi`,
        reuse: "facts",
    },
    "lekiwi-bom": {
        title: "LeKiwi BOM: 3 base servos plus SO-101 arms, US$482 for the 12 V kit",
        url: `${GH}/SIGRobotics-UIUC/LeKiwi/blob/main/BOM.md`,
        reuse: "facts",
    },
    "xlerobot-repo": {
        title: "Vector-Wangel/XLeRobot: two SO-101 arms on a LeKiwi base, about US$660, Apache-2.0",
        url: `${GH}/Vector-Wangel/XLeRobot`,
        reuse: "facts",
    },
    "xlerobot-hardware": {
        title: "XLeRobot hardware folder (STL, 3MF and STEP)",
        url: `${GH}/Vector-Wangel/XLeRobot/tree/main/hardware`,
        reuse: "facts",
    },
    "aharobot-ws": {
        title: "hilookas/astra_ws: AhaRobot ROS 2 workspace and URDF, GPL-3.0 with a no-commercial-use term",
        url: `${GH}/hilookas/astra_ws`,
        reuse: "facts",
    },
    "aharobot-hw": {
        title: "hilookas/Astra_Hardwares: AhaRobot STEP and STL files, GPL-3.0 with a no-commercial-use term",
        url: `${GH}/hilookas/Astra_Hardwares`,
        reuse: "facts",
    },
    "aharobot-paper": {
        title: "arXiv 2503.10070: AhaRobot, about US$1,000 of hardware",
        url: "https://arxiv.org/abs/2503.10070",
        reuse: "facts",
    },
    "aharobot-fw": {
        title: "hilookas/AstraFirmwares: AhaRobot firmware, linked from the workspace README",
        url: `${GH}/hilookas/AstraFirmwares`,
        reuse: "facts",
    },
    "lerobot-repo": {
        title: "huggingface/lerobot: control, teleoperation and training stack for SO-101, LeKiwi and Koch, Apache-2.0",
        url: `${GH}/huggingface/lerobot`,
        reuse: "facts",
    },
    // Arms
    "so-arm-repo": {
        title: "TheRobotStudio/SO-ARM100: SO-100 and SO-101 STEP, STL, sim and sourcing list, Apache-2.0",
        url: `${GH}/TheRobotStudio/SO-ARM100`,
        reuse: "facts",
    },
    "so-assembly": {
        title: "Hugging Face LeRobot: SO-101 assembly guide",
        url: "https://huggingface.co/docs/lerobot/so101",
        reuse: "facts",
    },
    "koch-repo": {
        title: "AlexanderKoch-Koch/low_cost_robot: follower US$258, leader US$183, STL and MuJoCo sim, MIT",
        url: `${GH}/AlexanderKoch-Koch/low_cost_robot`,
        reuse: "facts",
    },
    "openarm-repo": {
        title: "enactic/openarm: 7-DOF arm, US$6,500 bimanual, hardware CERN-OHL-S-2.0, software Apache-2.0",
        url: `${GH}/enactic/openarm`,
        reuse: "facts",
    },
    "openarm-hardware": {
        title: "enactic/openarm_hardware: CAD, STL and BOM, CERN-OHL-S-2.0",
        url: `${GH}/enactic/openarm_hardware`,
        reuse: "facts",
    },
    "openarm-description": {
        title: "enactic/openarm_description: URDF / xacro, Apache-2.0",
        url: `${GH}/enactic/openarm_description`,
        reuse: "facts",
    },
    "openarm-can": {
        title: "enactic/openarm_can: CAN motor control library, Apache-2.0",
        url: `${GH}/enactic/openarm_can`,
        reuse: "facts",
    },
    "openarm-motors": {
        title: "Robotics Center wiki: OpenArm joints (DM-J8009P J1-J2, DM-J4340P J3, DM-J4340 J4, DM-J4310 J5-J8), 4.1 kg nominal payload",
        url: "https://roboticscenter.ai/wiki/openarm/hardware",
        reuse: "facts",
    },
    "parol6-repo": {
        title: "PCrnjak/PAROL6-Desktop-robot-arm: STL, BOM, building instructions, control code, GPLv3",
        url: `${GH}/PCrnjak/PAROL6-Desktop-robot-arm`,
        reuse: "facts",
    },
    "parol6-hackaday": {
        title: "Hackaday.io: PAROL6, 6 axes, 400 mm reach, 1 kg payload, stepper driven",
        url: "https://hackaday.io/project/191860-parol6-desktop-robotic-arm",
        reuse: "facts",
    },
    "thor-repo": {
        title: "AngelLM/Thor: FreeCAD, STEP, STL, control PCB, 6 DOF, under EUR 350, CC-BY-SA-4.0",
        url: `${GH}/AngelLM/Thor`,
        reuse: "facts",
    },
    "thor-bom-forum": {
        title: "Maker Forums: Thor parts list with seven NEMA 17 steppers",
        url: "https://forum.makerforums.info/t/impressive-open-source-3d-printed-robotic-arm/33528",
        reuse: "facts",
    },
    // Humanoids
    "bhl-repo": {
        title: "HybridRobotics/Berkeley-Humanoid-Lite: URDF, MJCF, USD and low-level code; code MIT, other assets CC BY-SA 4.0",
        url: `${GH}/HybridRobotics/Berkeley-Humanoid-Lite`,
        reuse: "facts",
    },
    "bhl-paper": {
        title: "arXiv 2504.17249: Berkeley Humanoid Lite, 22 actuators with 3D-printed cycloidal gearboxes",
        url: "https://arxiv.org/abs/2504.17249",
        reuse: "facts",
    },
    "bhl-guide": {
        title: "Humanoid.guide: Berkeley Humanoid Lite uses 10 x 6512 (legs) and 12 x 5010 (arms, grippers)",
        url: "https://humanoid.guide/?p=19737",
        reuse: "facts",
    },
    "bhl-rdworld": {
        title: "R&D World: Berkeley Humanoid Lite parts total US$4,312",
        url: "https://www.rdworldonline.com/berkeley-debuts-5000-open-source-humanoid-built-with-desktop-3d-printers/",
        reuse: "facts",
    },
    "toddlerbot-repo": {
        title: "hshi74/toddlerbot: code MIT, design (Onshape, STL) CC BY-NC-SA 4.0",
        url: `${GH}/hshi74/toddlerbot`,
        reuse: "facts",
    },
    "toddlerbot-robotis": {
        title: "ROBOTIS ToddlerBot bundle: Dynamixel set and 30 active DOF (7 per arm, 6 per leg, 2 neck, 2 waist)",
        url: "https://www.robotis.us/toddlerbot-bundle-kit/",
        reuse: "facts",
    },
    "toddlerbot-makerworld": {
        title: "MakerWorld: ToddlerBot print files, 30 DOF, BOM about US$6,000",
        url: "https://makerworld.com/en/models/1733983",
        reuse: "facts",
    },
    "zeroth-repo": {
        title: "kscalelabs/zeroth-bot: hardware, SDK and sim, BOM from US$350, MIT",
        url: `${GH}/kscalelabs/zeroth-bot`,
        reuse: "facts",
    },
    "zeroth-circuitdigest": {
        title: "Circuit Digest: Zeroth Bot uses 16 STS3215 serial bus servos",
        url: "https://circuitdigest.com/news/zeroth-bot-an-opensource-risc-v-powered-humanoid-robot",
        reuse: "facts",
    },
    "kbot-repo": {
        title: "kscalelabs/kbot: mechanical and electrical folders, hardware CERN-OHL-S, software GPL-3.0",
        url: `${GH}/kscalelabs/kbot`,
        reuse: "facts",
    },
    "kbot-wiki": {
        title: "AI Wiki: K-Bot 20 DOF with 2 RS00, 6 RS02, 8 RS03 and 4 RS04 actuators",
        url: "https://aiwiki.ai/wiki/k_scale_k_bot",
        reuse: "facts",
    },
    "kbot-launch": {
        title: "Launch HN: K-Scale Labs, K-Bot base price US$8,999",
        url: "https://news.ycombinator.com/item?id=44456904",
        reuse: "facts",
    },
    "reachy-mini-repo": {
        title: "pollen-robotics/reachy_mini: software Apache-2.0, hardware design files CC BY-SA-NC",
        url: `${GH}/pollen-robotics/reachy_mini`,
        reuse: "facts",
    },
    "reachy-mini-site": {
        title: "Pollen Robotics: Reachy Mini Lite US$399, Wireless US$499, sold as a kit",
        url: "https://pollen-robotics.com/reachy-mini/",
        reuse: "facts",
    },
    "reachy-mini-seeed": {
        title: "Seeed wiki: Reachy Mini hardware (Dynamixel XL330 and XC330 servos)",
        url: "https://wiki.seeedstudio.com/reachymini_platforms_reachy_mini_hardware/",
        reuse: "facts",
    },
    "poppy-repo": {
        title: "poppy-project/poppy-humanoid: SolidWorks, STEP and STL, 25 Dynamixel, US$8,000 to 9,000; hardware CC BY-SA, software GPL v3",
        url: `${GH}/poppy-project/poppy-humanoid`,
        reuse: "facts",
    },
    "poppy-bom-uca": {
        title: "Polytech Clermont: Poppy uses 19 MX-28AT, 4 MX-64AT and 2 AX-12A",
        url: "https://forge.polytech.uca.fr/attachments/download/14493/Poppy_robot.pdf",
        reuse: "facts",
    },
    "inmoov-site": {
        title: "InMoov: printable life-size humanoid, STL files and build guides",
        url: "https://inmoov.fr/",
        reuse: "facts",
    },
    "inmoov-wiki": {
        title: "Wikipedia: InMoov files under Creative Commons BY-NC",
        url: "https://en.wikipedia.org/wiki/InMoov",
        reuse: "open",
    },
    "inmoov-servos-paper": {
        title: "CTU student paper: InMoov actuated by HK15298B, Hitec HS805BB and MG996 servos",
        url: "https://stc.fs.cvut.cz/history/2018/sbornik/papers/pdf/8504.pdf",
        reuse: "facts",
    },
    "duck-repo": {
        title: "apirrone/Open_Duck_Mini: Onshape CAD, BOM sheet, print and assembly guides, BOM target under US$400, Apache-2.0",
        url: `${GH}/apirrone/Open_Duck_Mini`,
        reuse: "facts",
    },
    "duck-runtime": {
        title: "apirrone/Open_Duck_Mini_Runtime: on-robot policy runtime (Raspberry Pi Zero 2W)",
        url: `${GH}/apirrone/Open_Duck_Mini_Runtime`,
        reuse: "facts",
    },
    "duck-kit": {
        title: "AIFitLab: Open Duck Mini kit with 14 Feetech STS3215 servos (7.4 V)",
        url: "https://aifitlab.com/products/openduckmini-open-source-version-of-the-bdx-droid",
        reuse: "facts",
    },
    "asimov-repo": {
        title: "menloresearch/asimov-1: mechanical CAD, electrical schematics and PCB, MuJoCo model; hardware CERN-OHL-S-2.0, software GPL-2.0",
        url: `${GH}/menloresearch/asimov-1`,
        reuse: "facts",
    },
    "asimov-bom": {
        title: "Asimov 1 manual: bill of materials",
        url: "https://manual.asimov.inc/v1/bom",
        reuse: "facts",
    },
    "asimov-mech": {
        title: "Menlo docs: Asimov 1 mechanical overview (joint motors)",
        url: "https://docs.menlo.ai/asimov/1/overview/system-tour/mechanical",
        reuse: "facts",
    },
    "asimov-order": {
        title: "Menlo: Asimov 1 DIY kit pricing",
        url: "https://menlo.ai/order",
        reuse: "facts",
    },
    // Legged
    "odri-hardware": {
        title: "open-dynamic-robot-initiative/open_robot_actuator_hardware: Solo-8 and Solo-12 mechanics, electronics and assembly, BSD-3-Clause",
        url: `${GH}/open-dynamic-robot-initiative/open_robot_actuator_hardware`,
        reuse: "facts",
    },
    "odri-solo12": {
        title: "ODRI Solo-12 README: 12 DOF, about 2.5 kg, SolidWorks and STL, BOM with suppliers",
        url: `${GH}/open-dynamic-robot-initiative/open_robot_actuator_hardware/blob/master/mechanics/quadruped_robot_12dof_v1/README.md`,
        reuse: "facts",
    },
    "odri-actuator": {
        title: "ODRI actuator module: T-Motor Antigravity 4004 300KV with a two-stage 9:1 belt",
        url: "https://www.mintlify.com/open-dynamic-robot-initiative/open_robot_actuator_hardware/actuator-modules/core-v1-1",
        reuse: "facts",
    },
    "odri-firmware": {
        title: "open-dynamic-robot-initiative/master-board: driver and master board firmware",
        url: `${GH}/open-dynamic-robot-initiative/master-board`,
        reuse: "facts",
    },
    "pupper-repo": {
        title: "stanfordroboticsclub/StanfordQuadruped: Pupper v1 control code, MIT",
        url: `${GH}/stanfordroboticsclub/StanfordQuadruped`,
        reuse: "facts",
    },
    "pupper-docs": {
        title: "Stanford Pupper docs: BOM and build guide",
        url: "https://pupper.readthedocs.io/en/latest/",
        reuse: "facts",
    },
    "pupper-hackster": {
        title: "Hackster: Stanford Pupper, 12 actuators, Raspberry Pi",
        url: "https://www.hackster.io/news/the-stanford-pupper-is-a-quadruped-robot-that-s-powered-by-pi-23c2de51adea",
        reuse: "facts",
    },
    "upkie-repo": {
        title: "upkie/upkie: wheeled biped software and build instructions, Apache-2.0, mjbots actuators",
        url: `${GH}/upkie/upkie`,
        reuse: "facts",
    },
    "upkie-description": {
        title: "upkie/upkie_description: URDF; hip and knee limits from the qdd100 spec",
        url: `${GH}/upkie/upkie_description`,
        reuse: "facts",
    },
    // Excluded candidates
    "hopejr-repo": {
        title: "TheRobotStudio/HOPEJr: URDF and arm work, no licence stated",
        url: `${GH}/TheRobotStudio/HOPEJr`,
        reuse: "facts",
    },
    "opencat-repo": {
        title: "PetoiCamp/OpenCat: Bittle and Nybble firmware, MIT; frames and boards not published",
        url: `${GH}/PetoiCamp/OpenCat`,
        reuse: "facts",
    },
    "mini-pupper-repo": {
        title: "mangdangroboticsclub/mini_pupper: software Apache-2.0, no hardware licence stated",
        url: `${GH}/mangdangroboticsclub/mini_pupper`,
        reuse: "facts",
    },
    "ar4-hackster": {
        title: "Hackster: Annin AR4 Mark 5, downloads on the Annin Robotics site",
        url: "https://www.hackster.io/news/chris-annin-calls-the-open-source-ar4-robot-arm-done-with-the-new-final-mark-5-revision-62b51e0ae555",
        reuse: "facts",
    },
    "reachy2-robots": {
        title: "actuatorlist robots: Reachy 2 (URDF and SDK open, CAD and BOM not)",
        url: "/robots",
        reuse: "open",
    },
} satisfies Record<string, Source>;

export type SourceId = keyof typeof SOURCES;

// "catalog:<id>" cites an actuatorlist catalog entry.
export function sourceOf(id: string): Source {
    if (id.startsWith("catalog:")) {
        const slug = id.slice("catalog:".length);
        return {
            title: `actuatorlist catalog: ${slug}`,
            url: `/actuators/${slug}`,
            reuse: "open",
        };
    }
    return (
        (SOURCES as Record<string, Source>)[id] ?? {
            title: id,
            url: id,
            reuse: "facts",
        }
    );
}

// Facts sources allowed to back more than FACTS_MAX_RECORDS records.
export const OPEN_SOURCE_FACTS_ALLOWLIST: ReuseAllowlist<SourceId> = {};
