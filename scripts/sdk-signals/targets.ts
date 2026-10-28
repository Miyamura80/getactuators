// What the /sdk pipeline looks at, per catalog brand: the names developers
// use for it (the matcher's aliases) and the GitHub repositories that carry
// its SDK, drivers, docs or firmware. Every repo here was confirmed to exist
// with `git ls-remote`; `provenance` says why it counts as official (owned by
// the maker) or community (third party). Brands without a command interface
// (gearboxes, frameless motors) are not listed: the scorer marks them not
// applicable from the catalog alone.

export type RepoRole =
    | "sdk"
    | "ros2"
    | "firmware"
    | "config-tool"
    | "docs"
    | "manuals"
    | "examples";

export interface RepoTarget {
    slug: string;
    official: boolean;
    roles: RepoRole[];
    provenance: string;
    // Paths that hold a curated role (a config GUI, firmware sources) in the
    // tree; the collector checks each exists before citing it. "" is the
    // whole repo.
    rolePaths?: Partial<Record<RepoRole, string>>;
    // Vendored third-party folders to leave out of every count.
    ignore?: string[];
}

export interface BrandTarget {
    brand: string;
    aliases: string[];
    // A forum post that matches one of these is about something else with
    // the same name (the odrive cloud-sync app, say) and is dropped.
    exclude?: string[];
    repos: RepoTarget[];
}

const official = (
    slug: string,
    roles: RepoRole[],
    provenance: string,
    rolePaths?: RepoTarget["rolePaths"],
    ignore?: string[],
): RepoTarget => ({ slug, official: true, roles, provenance, rolePaths, ignore });

const community = (
    slug: string,
    roles: RepoRole[],
    provenance: string,
): RepoTarget => ({ slug, official: false, roles, provenance });

export const TARGETS: BrandTarget[] = [
    {
        brand: "robotis",
        aliases: ["dynamixel", "robotis"],
        repos: [
            official(
                "ROBOTIS-GIT/DynamixelSDK",
                ["sdk", "ros2", "examples"],
                "ROBOTIS-GIT is Robotis's GitHub organisation.",
            ),
            official(
                "ROBOTIS-GIT/dynamixel-workbench",
                ["sdk", "examples"],
                "ROBOTIS-GIT is Robotis's GitHub organisation.",
            ),
            official(
                "ROBOTIS-GIT/dynamixel_hardware_interface",
                ["ros2"],
                "ROBOTIS-GIT is Robotis's GitHub organisation.",
            ),
            official(
                "ROBOTIS-GIT/dynamixel_interfaces",
                ["ros2"],
                "ROBOTIS-GIT is Robotis's GitHub organisation.",
            ),
            official(
                "ROBOTIS-GIT/Dynamixel2Arduino",
                ["sdk", "examples"],
                "ROBOTIS-GIT is Robotis's GitHub organisation.",
            ),
            official(
                "ROBOTIS-GIT/emanual",
                ["docs", "config-tool"],
                "Source of emanual.robotis.com, Robotis's documentation site.",
                { "config-tool": "docs/en/software/dynamixel/dynamixel_wizard2.md" },
            ),
            community(
                "huggingface/lerobot",
                ["sdk"],
                "Hugging Face LeRobot ships a Dynamixel and a Feetech motor bus.",
            ),
        ],
    },
    {
        brand: "mjbots",
        aliases: ["moteus", "mjbots", "qdd100"],
        repos: [
            official(
                "mjbots/moteus",
                ["sdk", "firmware", "config-tool", "docs", "examples"],
                "mjbots is the maker's GitHub organisation.",
                {
                    firmware: "fw",
                    "config-tool": "utils/gui",
                },
            ),
            official(
                "mjbots/moteus_ros2",
                ["ros2"],
                "mjbots is the maker's GitHub organisation.",
            ),
            official(
                "mjbots/pi3hat",
                ["sdk"],
                "mjbots is the maker's GitHub organisation (Raspberry Pi CAN-FD hat).",
            ),
        ],
    },
    {
        brand: "odrive",
        aliases: ["odrive"],
        exclude: [
            "odrive\\.com",
            "sync",
            "cloud",
            "google drive",
            "dropbox",
            "amazon drive",
            "onedrive",
        ],
        repos: [
            official(
                "odriverobotics/ODrive",
                ["sdk", "firmware", "config-tool", "docs", "examples"],
                "odriverobotics is ODrive Robotics's GitHub organisation.",
                { firmware: "Firmware", "config-tool": "tools/odrive" },
            ),
            official(
                "odriverobotics/ros_odrive",
                ["ros2"],
                "odriverobotics is ODrive Robotics's GitHub organisation.",
            ),
        ],
    },
    {
        brand: "unitree",
        aliases: ["unitree go-m8010", "go-m8010", "unitree motor", "unitree m107"],
        repos: [
            official(
                "unitreerobotics/unitree_actuator_sdk",
                ["sdk", "examples"],
                "unitreerobotics is Unitree's GitHub organisation.",
            ),
        ],
    },
    {
        brand: "myactuator",
        aliases: ["myactuator", "rmd-x8", "rmd-x6", "rmd-x10", "rmd-l"],
        repos: [
            community(
                "2b-t/myactuator_rmd",
                ["sdk", "ros2", "examples"],
                "Third-party C++/Python driver with a ros2_control interface.",
            ),
        ],
    },
    {
        brand: "robstride",
        aliases: ["robstride"],
        repos: [
            official(
                "RobStride/Product_Information",
                ["manuals"],
                "RobStride's own repo; the catalog cites its manuals.",
            ),
            official(
                "RobStride/SampleProgram",
                ["sdk", "examples"],
                "Published under the RobStride GitHub organisation.",
            ),
            official(
                "RobStride/robstride_ros_sample",
                ["ros2", "examples"],
                "Published under the RobStride GitHub organisation.",
            ),
            community(
                "Seeed-Projects/RobStride_Control",
                ["sdk", "examples"],
                "Seeed Studio (a reseller) control examples.",
            ),
            community("sirwart/robstride", ["sdk"], "Third-party Python driver."),
        ],
    },
    {
        brand: "feetech",
        aliases: ["feetech", "sts3215", "sts3250", "scs15", "scservo"],
        repos: [
            official(
                "ftservo/FTServo_Python",
                ["sdk", "examples"],
                "Its README calls ftservo the official Feetech repository.",
            ),
            official(
                "ftservo/FTServo_Arduino",
                ["sdk", "examples"],
                "Same ftservo organisation as the Python SDK.",
            ),
            community(
                "Adam-Software/Feetech-Servo-SDK",
                ["sdk"],
                "Third-party packaging of the Feetech SDK.",
            ),
            community(
                "huggingface/lerobot",
                ["sdk"],
                "Hugging Face LeRobot drives Feetech STS servos in the SO-100/101 arms.",
            ),
            community(
                "TheRobotStudio/SO-ARM100",
                ["examples"],
                "Open SO-ARM100/101 arm built on Feetech STS3215 servos.",
            ),
        ],
    },
    {
        brand: "damiao",
        aliases: ["damiao", "dm-j4310", "dm-j4340", "dm-j8009", "dm4310", "dm4340"],
        repos: [
            official(
                "dmBots/DM-J4310-2EC",
                ["manuals", "examples"],
                "dmBots is the DAMIAO organisation the catalog cites for manuals.",
            ),
            official(
                "dmBots/DM-J4340-2EC",
                ["manuals", "examples"],
                "dmBots is the DAMIAO organisation the catalog cites for manuals.",
            ),
            official(
                "dmBots/DM-J8009-2EC",
                ["manuals", "examples"],
                "dmBots is the DAMIAO organisation the catalog cites for manuals.",
            ),
            community(
                "cmjang/DM_Control_Python",
                ["sdk", "examples"],
                "Third-party Python control library for DAMIAO motors.",
            ),
        ],
    },
    {
        brand: "cubemars",
        aliases: ["cubemars", "ak80-9", "ak70-10", "ak10-9", "ak60-6", "t-motor ak"],
        repos: [
            community(
                "neurobionics/TMotorCANControl",
                ["sdk", "examples"],
                "Open-source Python library for T-Motor/CubeMars AK actuators (University of Michigan Neurobionics Lab).",
            ),
            community(
                "dfki-ric-underactuated-lab/mini-cheetah-tmotor-python-can",
                ["sdk"],
                "DFKI driver for AK-series motors over the MIT mini cheetah CAN protocol.",
            ),
        ],
    },
    {
        brand: "xiaomi",
        aliases: ["cybergear", "cyber gear"],
        repos: [
            community(
                "belovictor/cybergear-docs",
                ["docs"],
                "English translation of the CyberGear manual; the catalog cites it.",
            ),
            community(
                "project-sternbergia/cybergear_m5",
                ["sdk", "examples"],
                "Third-party Arduino/M5Stack driver.",
            ),
        ],
    },
    {
        brand: "innfos",
        aliases: ["innfos", "mintasca"],
        repos: [
            official(
                "INNFOS/innfos-cpp-sdk",
                ["sdk", "examples"],
                "INNFOS GitHub organisation.",
            ),
            official(
                "mintasca/innfos-gluon-controller",
                ["sdk"],
                "Mintasca is INNFOS's parent; the catalog cites this repo.",
            ),
        ],
    },
    {
        brand: "vesc",
        aliases: ["vesc", "vesc_tool", "vesc tool"],
        repos: [
            official(
                "vedderb/bldc",
                ["firmware", "docs"],
                "Benjamin Vedder leads the VESC project; bldc is its firmware.",
                { firmware: "" },
            ),
            official(
                "vedderb/vesc_tool",
                ["config-tool"],
                "VESC Tool, the project's configuration GUI.",
                { "config-tool": "mainwindow.cpp" },
                ["QCodeEditor", "qmarkdowntextedit"],
            ),
            official(
                "vedderb/vesc_pkg",
                ["examples"],
                "VESC packages (scripts that run on the controller).",
            ),
            community("f1tenth/vesc", ["ros2"], "F1TENTH ROS driver for VESC."),
            community("sbgisen/vesc", ["ros2"], "Third-party ROS VESC driver fork."),
        ],
    },
    {
        brand: "trinamic",
        aliases: ["trinamic", "tmc4671"],
        repos: [
            official(
                "analogdevicesinc/TMC-API",
                ["sdk"],
                "Analog Devices owns Trinamic; TMC-API is its C register API.",
            ),
            official(
                "analogdevicesinc/PyTrinamic",
                ["sdk", "examples"],
                "Analog Devices owns Trinamic; PyTrinamic is its Python library.",
            ),
        ],
    },
    {
        brand: "hiwonder",
        aliases: ["hiwonder", "lx-16a", "lewansoul"],
        repos: [
            community("ethanlipson/PyLX-16A", ["sdk"], "Third-party Python driver."),
        ],
    },
    { brand: "steadywin", aliases: ["steadywin", "gim6010", "gim8108"], repos: [] },
    { brand: "waveshare", aliases: ["waveshare st3215", "st3215"], repos: [] },
    // "harmonic drive" alone is the generic name for strain-wave gearing.
    {
        brand: "harmonic-drive",
        aliases: ["harmonic drive llc", "harmonic drive se", "harmonicdrive"],
        repos: [],
    },
    { brand: "lkmtech", aliases: ["lkmtech", "lk motor", "mg5010"], repos: [] },
    { brand: "encos", aliases: ["encos"], repos: [] },
    { brand: "atar", aliases: ["atar robot"], repos: [] },
];
