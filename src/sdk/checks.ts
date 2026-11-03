import type { Capability, CapabilityState, SdkDimension } from "./types";

// Objective checks per brand: facts read off vendor docs, repositories and
// package indexes (src/sdk/sources.ts), not opinions. A check scores 1 when
// it passes, 0.5 when only partly (community-only, or some products only)
// and 0 when we found nothing public. The repository checks (activity and
// issue reply time) are computed from data/sdk-github.json in ./score.ts.

export interface SdkCheck {
    dimension: SdkDimension;
    label: string;
    value: 0 | 0.5 | 1;
    sources: string[];
}

type Row = [SdkDimension, string, 0 | 0.5 | 1, ...string[]];

const rows = (...r: Row[]): SdkCheck[] =>
    r.map(([dimension, label, value, ...sources]) => ({
        dimension,
        label,
        value,
        sources,
    }));

export const SDK_CHECKS: Record<string, SdkCheck[]> = {
    robotis: rows(
        [
            "protocol",
            "Packet format and control tables published",
            1,
            "sdk-robotis-protocol2",
        ],
        [
            "bindings",
            "Official SDK for C, C++ and Python",
            1,
            "sdk-robotis-dynamixel-sdk",
        ],
        ["bindings", "Rust crate (community)", 0.5, "sdk-crate-dynamixel2"],
        [
            "ros",
            "Official ros2_control hardware interface",
            1,
            "sdk-robotis-hardware-interface",
        ],
        ["ros", "URDF for the maker's own arm", 1, "sdk-robotis-openmanipulator"],
        [
            "ros",
            "MJCF model of a Dynamixel robot (third party)",
            0.5,
            "sdk-menagerie-robotis-op3",
        ],
        [
            "docs",
            "English manual with control tables and examples",
            1,
            "sdk-robotis-protocol2",
            "sdk-robotis-dynamixel-sdk",
        ],
        ["firmware", "Firmware source published", 0, "sdk-robotis-wizard"],
        [
            "firmware",
            "Config GUI with firmware update and recovery",
            1,
            "sdk-robotis-wizard",
        ],
        [
            "reliability",
            "Sync and bulk read/write for multi-joint loops",
            1,
            "sdk-robotis-protocol2",
        ],
    ),
    mjbots: rows(
        ["protocol", "CAN-FD register map published", 1, "sdk-mjbots-reference"],
        [
            "bindings",
            "Official Python and C++ libraries",
            1,
            "sdk-mjbots-moteus",
            "sdk-pypi-moteus",
        ],
        ["ros", "Official ROS 2 driver", 0, "sdk-mjbots-moteus"],
        ["ros", "URDF or MJCF models from the maker", 0, "sdk-mjbots-moteus"],
        ["docs", "Reference manual and runnable examples", 1, "sdk-mjbots-reference"],
        ["firmware", "Firmware source published (Apache 2.0)", 1, "sdk-mjbots-moteus"],
        ["firmware", "Config and tuning GUI (tview)", 1, "sdk-mjbots-moteus"],
        ["reliability", "Fast CAN-FD bitrates documented", 1, "sdk-mjbots-reference"],
    ),
    odrive: rows(
        ["protocol", "CAN protocol published", 1, "sdk-odrive-can-protocol"],
        ["bindings", "Official Python package", 1, "sdk-pypi-odrive"],
        ["bindings", "Official Arduino / C++ library", 1, "sdk-odrive-arduino"],
        ["ros", "Official ROS 2 node with ros2_control", 1, "sdk-odrive-ros"],
        ["docs", "Versioned documentation site", 1, "sdk-odrive-can-protocol"],
        [
            "firmware",
            "Firmware source published (v3 boards only)",
            0.5,
            "sdk-odrive-legacy-firmware",
        ],
        [
            "firmware",
            "Command-line config and firmware update tool",
            1,
            "sdk-pypi-odrive",
        ],
        ["reliability", "Cyclic CAN messages documented", 1, "sdk-odrive-can-protocol"],
    ),
    cubemars: rows(
        [
            "protocol",
            "MIT and servo mode CAN frames described by the maker",
            1,
            "sdk-cubemars-arduino-guide",
        ],
        ["bindings", "Python library (community)", 0.5, "sdk-cubemars-tmotorcan"],
        ["bindings", "Rust crate (community)", 0.5, "sdk-crate-kcan"],
        ["ros", "ROS 2 driver from the maker", 0, "sdk-cubemars-arduino-guide"],
        [
            "docs",
            "Maker tutorials with example code",
            0.5,
            "sdk-cubemars-arduino-guide",
        ],
        ["firmware", "Firmware source published", 0, "sdk-cubemars-arduino-guide"],
    ),
    myactuator: rows(
        [
            "protocol",
            "CAN protocol document used by the community SDK",
            0.5,
            "sdk-myactuator-rmd",
        ],
        [
            "bindings",
            "C++ SDK with Python bindings (community)",
            0.5,
            "sdk-myactuator-rmd",
        ],
        ["ros", "ros2_control integration (community)", 0.5, "sdk-myactuator-rmd-ros"],
        [
            "docs",
            "Getting-started guide from a reseller",
            0.5,
            "sdk-myactuator-seeed-wiki",
        ],
        ["firmware", "Firmware source published", 0, "sdk-myactuator-rmd"],
    ),
    robstride: rows(
        [
            "protocol",
            "Private CAN protocol used by the maker's sample",
            0.5,
            "sdk-robstride-python",
        ],
        ["bindings", "Official Python sample SDK", 1, "sdk-robstride-python"],
        [
            "bindings",
            "C++ and Rust libraries (community)",
            0.5,
            "sdk-robstride-control",
        ],
        ["ros", "ROS 2 driver package (community)", 0.5, "sdk-robstride-ros-index"],
        [
            "docs",
            "Community library READMEs with an API reference",
            0.5,
            "sdk-robstride-control",
        ],
        ["firmware", "Firmware source published", 0, "sdk-robstride-python"],
    ),
    steadywin: rows(
        ["protocol", "Protocol published by the maker", 0, "sdk-steadywin-simplefoc"],
        [
            "bindings",
            "Works with ODrive tooling on some models",
            0.5,
            "sdk-steadywin-zenn-ros2",
        ],
        [
            "ros",
            "ROS 2 through ros_odrive on some models",
            0.5,
            "sdk-steadywin-zenn-ros2",
        ],
        ["docs", "English manual available", 0, "sdk-steadywin-simplefoc"],
        ["firmware", "Firmware source published", 0, "sdk-steadywin-simplefoc"],
    ),
    feetech: rows(
        [
            "protocol",
            "Packet protocol shipped with the official SDK",
            1,
            "sdk-feetech-ftservo-python",
        ],
        ["bindings", "Official Python SDK", 1, "sdk-feetech-ftservo-python"],
        ["bindings", "Packaged on PyPI (community)", 0.5, "sdk-pypi-feetech"],
        ["ros", "ROS 2 driver from the maker", 0, "sdk-feetech-ftservo-python"],
        [
            "ros",
            "URDF and MJCF of the SO-ARM100 arm",
            1,
            "sdk-so-arm100",
            "sdk-menagerie-so-arm100",
        ],
        [
            "docs",
            "English docs and examples",
            0.5,
            "sdk-feetech-ftservo-python",
            "sdk-lerobot-feetech",
        ],
        ["firmware", "Firmware source published", 0, "sdk-feetech-ftservo-python"],
    ),
    waveshare: rows(
        [
            "protocol",
            "Servo protocol documented on the wiki",
            1,
            "sdk-waveshare-st3215",
        ],
        ["bindings", "Python and Arduino demos", 0.5, "sdk-waveshare-st3215"],
        ["ros", "ROS 2 driver from the maker", 0, "sdk-waveshare-st3215"],
        ["docs", "English wiki with demos", 1, "sdk-waveshare-st3215"],
        ["firmware", "Firmware source published", 0, "sdk-waveshare-st3215"],
    ),
    damiao: rows(
        [
            "protocol",
            "CAN frames implemented in open libraries",
            0.5,
            "sdk-openarm-can",
            "sdk-damiao-python",
        ],
        [
            "bindings",
            "C++ library from a robot maker using the motors",
            0.5,
            "sdk-openarm-can",
        ],
        [
            "bindings",
            "Python libraries (community)",
            0.5,
            "sdk-damiao-python",
            "sdk-pypi-pydamiao",
        ],
        ["ros", "ros2_control for an arm built on the motors", 0.5, "sdk-openarm-ros2"],
        [
            "ros",
            "URDF of an arm built on the motors (community)",
            0.5,
            "sdk-openarm-ros2",
        ],
        ["docs", "English docs from the maker", 0, "sdk-damiao-python"],
        ["firmware", "Firmware source published", 0, "sdk-damiao-python"],
    ),
    unitree: rows(
        [
            "protocol",
            "Motor protocol wrapped in a closed library",
            0,
            "sdk-unitree-opensource",
        ],
        ["bindings", "Official actuator SDK (C++)", 1, "sdk-unitree-actuator-sdk"],
        ["ros", "Official URDF models of its robots", 1, "sdk-unitree-ros"],
        ["ros", "Official MuJoCo simulation", 1, "sdk-unitree-mujoco"],
        ["docs", "Developer docs for the motor SDK", 0.5, "sdk-unitree-opensource"],
        ["firmware", "Firmware source published", 0, "sdk-unitree-actuator-sdk"],
    ),
    xiaomi: rows(
        [
            "protocol",
            "Manual describes the CAN frames (English translation by community)",
            0.5,
            "sdk-cybergear-manual-en",
        ],
        ["bindings", "Python library (community)", 0.5, "sdk-cybergear-python"],
        ["bindings", "ESP-IDF component (community)", 0.5, "sdk-cybergear-esp-idf"],
        ["ros", "ROS 2 driver", 0, "sdk-cybergear-python"],
        ["docs", "English manual from the maker", 0, "sdk-cybergear-manual-en"],
        ["firmware", "Firmware source published", 0, "sdk-cybergear-manual-en"],
    ),
    "harmonic-drive": rows(
        ["protocol", "Standard EtherCAT drive profile", 1, "sdk-hd-sha-ethercat"],
        ["bindings", "Maker libraries for Python or C++", 0, "sdk-hd-brochure"],
        ["ros", "ROS 2 driver from the maker", 0, "sdk-hd-brochure"],
        ["docs", "English product documentation", 1, "sdk-hd-brochure"],
        ["firmware", "Commissioning software", 1, "sdk-hd-brochure"],
    ),
    maxon: rows(
        [
            "protocol",
            "Standard CANopen and EtherCAT drive profiles",
            1,
            "sdk-maxon-ros2",
        ],
        [
            "bindings",
            "Command library usable from Python via ctypes",
            0.5,
            "sdk-maxon-python",
        ],
        ["ros", "ROS 2 setup guide from the maker", 0.5, "sdk-maxon-ros2"],
        ["ros", "ros2_control package (community)", 0.5, "sdk-maxon-noplab-epos"],
        [
            "docs",
            "English support articles and manuals",
            1,
            "sdk-maxon-python",
            "sdk-maxon-ros2",
        ],
        ["firmware", "Firmware source published", 0, "sdk-maxon-python"],
    ),
    vesc: rows(
        ["protocol", "Protocol defined in open firmware", 1, "sdk-vesc-bldc"],
        ["bindings", "Python package (community)", 0.5, "sdk-pyvesc"],
        ["ros", "ROS 2 driver (community)", 0.5, "sdk-vesc-ros"],
        ["docs", "Docs mostly in code and forum", 0.5, "sdk-vesc-bldc"],
        ["firmware", "Firmware source published (GPL)", 1, "sdk-vesc-bldc"],
        ["firmware", "Open config tool (VESC Tool)", 1, "sdk-vesc-tool"],
    ),
    trinamic: rows(
        ["protocol", "Register map and TMCL published", 1, "sdk-trinamic-tmc4671"],
        ["bindings", "Official Python library", 1, "sdk-trinamic-pytrinamic"],
        ["ros", "ROS 2 driver", 0, "sdk-trinamic-pytrinamic"],
        [
            "docs",
            "Datasheet and application notes in English",
            1,
            "sdk-trinamic-tmc4671",
        ],
        ["firmware", "Evaluation and tuning IDE", 1, "sdk-trinamic-tmc4671"],
    ),
    hiwonder: rows(
        [
            "protocol",
            "Serial protocol in the user manual",
            1,
            "sdk-hiwonder-lx16a-manual",
        ],
        ["bindings", "Python library (community)", 0.5, "sdk-hiwonder-pylx16a"],
        ["bindings", "Rust crate (community)", 0.5, "sdk-crate-lx16a"],
        ["ros", "ROS 2 driver", 0, "sdk-hiwonder-pylx16a"],
        ["docs", "English user manual", 1, "sdk-hiwonder-lx16a-manual"],
        ["firmware", "Firmware source published", 0, "sdk-hiwonder-lx16a-manual"],
    ),
    lkmtech: rows(
        ["protocol", "Maker CAN protocol PDF in circulation", 1, "sdk-lkmotor-python"],
        ["bindings", "Python library (community)", 0.5, "sdk-lkmotor-python"],
        ["ros", "ROS 2 driver", 0, "sdk-lkmotor-python"],
        ["docs", "English docs from the maker", 0, "sdk-lkmotor-python"],
        ["firmware", "Windows config tool from the maker", 1, "sdk-lkmotor-python"],
    ),
    innfos: rows(
        ["protocol", "Protocol published by the maker", 0, "sdk-innfos-gluon"],
        [
            "bindings",
            "C++ SDK inside the maker's arm controller",
            0.5,
            "sdk-innfos-gluon",
        ],
        ["ros", "ROS 2 driver", 0, "sdk-innfos-gluon"],
        ["docs", "English docs", 0, "sdk-innfos-gluon"],
        ["firmware", "Firmware source published", 0, "sdk-innfos-gluon"],
    ),
    encos: rows(
        ["protocol", "Protocol published", 0, "sdk-encos-product"],
        ["bindings", "Any public library", 0, "sdk-encos-product"],
        ["ros", "ROS 2 driver", 0, "sdk-encos-product"],
        ["docs", "English docs", 0, "sdk-encos-product"],
        ["firmware", "Firmware source published", 0, "sdk-encos-product"],
    ),
    atar: rows(
        ["protocol", "Standard EtherCAT or CANopen profile named", 0.5, "sdk-atar-arc"],
        ["bindings", "Any public library", 0, "sdk-atar-arc"],
        ["ros", "ROS 2 driver", 0, "sdk-atar-arc"],
        ["docs", "English product docs", 0.5, "sdk-atar-arc"],
        ["firmware", "Firmware source published", 0, "sdk-atar-arc"],
    ),
};

type Caps = Partial<Record<Capability, CapabilityState>>;

// Capability matrix: what ships, and whether the maker or the community
// ships it. Absent keys are "none". Sourced by the checks above.
export const SDK_CAPABILITIES: Record<string, Caps> = {
    robotis: {
        ros2: "official",
        python: "official",
        cpp: "official",
        rust: "community",
        urdf: "official",
        mjcf: "community",
        documentedProtocol: "official",
    },
    mjbots: {
        python: "official",
        cpp: "official",
        openFirmware: "official",
        documentedProtocol: "official",
    },
    odrive: {
        ros2: "official",
        python: "official",
        cpp: "official",
        openFirmware: "official",
        documentedProtocol: "official",
    },
    cubemars: {
        python: "community",
        rust: "community",
        documentedProtocol: "official",
    },
    myactuator: {
        ros2: "community",
        python: "community",
        cpp: "community",
        documentedProtocol: "community",
    },
    robstride: {
        ros2: "community",
        python: "official",
        cpp: "community",
        rust: "community",
        documentedProtocol: "community",
    },
    steadywin: { ros2: "community", python: "community" },
    feetech: {
        python: "official",
        urdf: "community",
        mjcf: "community",
        documentedProtocol: "official",
    },
    waveshare: { python: "official", cpp: "official", documentedProtocol: "official" },
    damiao: {
        ros2: "community",
        python: "community",
        cpp: "community",
        urdf: "community",
        documentedProtocol: "community",
    },
    unitree: { cpp: "official", urdf: "official", mjcf: "official" },
    xiaomi: { python: "community", cpp: "community", documentedProtocol: "community" },
    "harmonic-drive": { documentedProtocol: "official" },
    maxon: {
        ros2: "community",
        python: "community",
        cpp: "official",
        documentedProtocol: "official",
    },
    vesc: {
        ros2: "community",
        python: "community",
        openFirmware: "official",
        documentedProtocol: "official",
    },
    trinamic: { python: "official", documentedProtocol: "official" },
    hiwonder: {
        python: "community",
        rust: "community",
        documentedProtocol: "official",
    },
    lkmtech: { python: "community", documentedProtocol: "official" },
    innfos: { cpp: "official" },
    encos: {},
    atar: {},
};
