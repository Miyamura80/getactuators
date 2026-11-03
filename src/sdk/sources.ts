// Documents behind the /sdk objective checks: vendor docs, repositories,
// package indexes and community libraries, read on the day the dataset was
// built. Spread into the supply-chain SOURCES so the shared citation UI and
// the licence audit cover them. Community posts are not sources here: they
// live in data/sdk-evidence.json with their own links.

// Structural copy of SourceRef: importing it from ../supply-chain/sources
// would make an import cycle, since that file spreads this list.
type Kind = "company-site" | "reference" | "press";
type Reuse = "open" | "facts" | "restricted";

interface SdkSource {
    id: string;
    title: string;
    publisher: string;
    url: string;
    accessed: string;
    kind: Kind;
    reuse: Reuse;
}

const ACCESSED = "2026-11-03";

// Vendor docs, repositories and package pages are copyrighted pages we take
// single facts from (does a driver exist, is the protocol documented).
function s(
    id: string,
    publisher: string,
    title: string,
    url: string,
    kind: Kind = "company-site",
): SdkSource {
    return { id, publisher, title, url, kind, reuse: "facts", accessed: ACCESSED };
}

const ref = (id: string, publisher: string, title: string, url: string) =>
    s(id, publisher, title, url, "reference");

export const SDK_SOURCES: SdkSource[] = [
    // Robotis Dynamixel
    s(
        "sdk-robotis-protocol2",
        "ROBOTIS",
        "DYNAMIXEL Protocol 2.0 (e-Manual)",
        "https://emanual.robotis.com/docs/en/dxl/protocol2/",
    ),
    s(
        "sdk-robotis-dynamixel-sdk",
        "ROBOTIS",
        "DynamixelSDK repository",
        "https://github.com/ROBOTIS-GIT/DynamixelSDK",
    ),
    s(
        "sdk-robotis-hardware-interface",
        "ROBOTIS",
        "dynamixel_hardware_interface (ros2_control)",
        "https://github.com/ROBOTIS-GIT/dynamixel_hardware_interface",
    ),
    s(
        "sdk-robotis-wizard",
        "ROBOTIS",
        "DYNAMIXEL Wizard 2.0 (e-Manual)",
        "https://emanual.robotis.com/docs/en/software/dynamixel/dynamixel_wizard2/",
    ),
    s(
        "sdk-robotis-openmanipulator",
        "ROBOTIS",
        "OpenMANIPULATOR-X specification and URDF (e-Manual)",
        "https://emanual.robotis.com/docs/en/platform/openmanipulator_x/specification/",
    ),
    ref(
        "sdk-menagerie-robotis-op3",
        "Google DeepMind",
        "MuJoCo Menagerie: ROBOTIS OP3",
        "https://github.com/google-deepmind/mujoco_menagerie/tree/main/robotis_op3",
    ),
    ref(
        "sdk-crate-dynamixel2",
        "crates.io",
        "dynamixel2 crate (Rust, Protocol 2.0)",
        "https://crates.io/crates/dynamixel2",
    ),
    // mjbots
    s(
        "sdk-mjbots-moteus",
        "mjbots",
        "moteus repository (firmware, Python and C++ libraries, tview)",
        "https://github.com/mjbots/moteus",
    ),
    s(
        "sdk-mjbots-reference",
        "mjbots",
        "moteus reference manual",
        "https://github.com/mjbots/moteus/blob/main/docs/reference.md",
    ),
    ref(
        "sdk-pypi-moteus",
        "PyPI",
        "moteus package",
        "https://pypi.org/project/moteus/",
    ),
    // ODrive
    s(
        "sdk-odrive-can-protocol",
        "ODrive Robotics",
        "CAN Protocol (ODrive documentation)",
        "https://docs.odriverobotics.com/v/latest/manual/can-protocol.html",
    ),
    s(
        "sdk-odrive-ros",
        "ODrive Robotics",
        "ros_odrive repository (ROS 2 node and ros2_control)",
        "https://github.com/odriverobotics/ros_odrive",
    ),
    s(
        "sdk-odrive-legacy-firmware",
        "ODrive Robotics",
        "ODrive repository (open firmware for ODrive v3)",
        "https://github.com/odriverobotics/ODrive",
    ),
    ref(
        "sdk-pypi-odrive",
        "PyPI",
        "odrive package",
        "https://pypi.org/project/odrive/",
    ),
    s(
        "sdk-odrive-arduino",
        "ODrive Robotics",
        "ODriveArduino library",
        "https://github.com/odriverobotics/ODriveArduino",
    ),
    // CubeMars
    s(
        "sdk-cubemars-arduino-guide",
        "CubeMars",
        "Control a CubeMars AK motor with Arduino (MIT mode over CAN)",
        "https://www.cubemars.com/de/control-cubemars-ak45-36-motor-with-arduino.html",
    ),
    ref(
        "sdk-cubemars-tmotorcan",
        "Neurobionics Lab",
        "TMotorCANControl (Python, community)",
        "https://github.com/neurobionics/TMotorCANControl",
    ),
    ref(
        "sdk-crate-kcan",
        "docs.rs",
        "kcan crate (Rust, AK series MIT frames)",
        "https://docs.rs/crate/kcan/latest",
    ),
    // MyActuator
    ref(
        "sdk-myactuator-rmd",
        "Tobit Flatscher",
        "myactuator_rmd (C++ SDK with Python bindings, community)",
        "https://github.com/2b-t/myactuator_rmd",
    ),
    ref(
        "sdk-myactuator-rmd-ros",
        "Tobit Flatscher",
        "myactuator_rmd_ros (ros2_control, community)",
        "https://github.com/2b-t/myactuator_rmd_ros",
    ),
    ref(
        "sdk-myactuator-seeed-wiki",
        "Seeed Studio",
        "MyActuator X series getting started",
        "https://wiki.seeedstudio.com/myactuator_series/",
    ),
    // RobStride
    s(
        "sdk-robstride-python",
        "RobStride",
        "RobStride Python_Sample repository",
        "https://github.com/RobStride/Python_Sample",
    ),
    ref(
        "sdk-robstride-control",
        "tianrking",
        "RobStride_Control (Python, C++, Rust, Arduino; community)",
        "https://github.com/tianrking/RobStride_Control",
    ),
    ref(
        "sdk-robstride-ros-index",
        "ROS Index",
        "robstride_driver package",
        "https://index.ros.org/p/robstride_driver/",
    ),
    // Steadywin
    ref(
        "sdk-steadywin-zenn-ros2",
        "Zenn",
        "Driving a Steadywin GIM8108-8 from ROS 2 through ODrive-compatible firmware",
        "https://zenn.dev/nexis_r/articles/4697e25ca87c76",
    ),
    ref(
        "sdk-steadywin-simplefoc",
        "SimpleFOC Community",
        "Steadywin new cheap gear motor (thread)",
        "https://community.simplefoc.com/t/steadywin-new-cheap-gear-motor/4509",
    ),
    // Feetech and Waveshare
    s(
        "sdk-feetech-ftservo-python",
        "Feetech",
        "FTServo_Python repository (scservo_sdk)",
        "https://github.com/ftservo/FTServo_Python",
    ),
    ref(
        "sdk-pypi-feetech",
        "PyPI",
        "feetech-servo-sdk package",
        "https://pypi.org/project/feetech-servo-sdk/",
    ),
    ref(
        "sdk-lerobot-feetech",
        "Hugging Face",
        "LeRobot Feetech motor bus",
        "https://github.com/huggingface/lerobot/tree/main/src/lerobot/motors/feetech",
    ),
    ref(
        "sdk-menagerie-so-arm100",
        "Google DeepMind",
        "MuJoCo Menagerie: SO-ARM100",
        "https://github.com/google-deepmind/mujoco_menagerie/tree/main/trs_so_arm100",
    ),
    ref(
        "sdk-so-arm100",
        "The Robot Studio",
        "SO-ARM100 repository (URDF and simulation files)",
        "https://github.com/TheRobotStudio/SO-ARM100",
    ),
    s(
        "sdk-waveshare-st3215",
        "Waveshare",
        "ST3215 Servo wiki",
        "https://www.waveshare.com/wiki/ST3215_Servo",
    ),
    // DAMIAO
    ref(
        "sdk-openarm-can",
        "Enactic",
        "openarm_can (DAMIAO CAN library for OpenArm)",
        "https://github.com/enactic/openarm_can",
    ),
    ref(
        "sdk-openarm-ros2",
        "Enactic",
        "openarm_ros2 (ros2_control for DAMIAO motors)",
        "https://github.com/enactic/openarm_ros2",
    ),
    ref(
        "sdk-damiao-python",
        "cmjang",
        "DM_Control_Python (community)",
        "https://github.com/cmjang/DM_Control_Python",
    ),
    ref(
        "sdk-pypi-pydamiao",
        "PyPI",
        "pydamiao package",
        "https://pypi.org/project/pydamiao/",
    ),
    // Unitree
    s(
        "sdk-unitree-actuator-sdk",
        "Unitree",
        "unitree_actuator_sdk repository",
        "https://github.com/unitreerobotics/unitree_actuator_sdk",
    ),
    s(
        "sdk-unitree-opensource",
        "Unitree",
        "Unitree open source page",
        "https://www.unitree.com/mobile/opensource",
    ),
    s(
        "sdk-unitree-mujoco",
        "Unitree",
        "unitree_mujoco repository",
        "https://github.com/unitreerobotics/unitree_mujoco",
    ),
    s(
        "sdk-unitree-ros",
        "Unitree",
        "unitree_ros repository (URDF)",
        "https://github.com/unitreerobotics/unitree_ros",
    ),
    // Xiaomi CyberGear
    ref(
        "sdk-cybergear-python",
        "blanck",
        "cybergear (pycybergear, community)",
        "https://github.com/blanck/cybergear",
    ),
    ref(
        "sdk-cybergear-esp-idf",
        "Espressif Component Registry",
        "cybergear-robotics/cybergear ESP-IDF component",
        "https://components.espressif.com/components/cybergear-robotics/cybergear",
    ),
    // Harmonic Drive
    ref(
        "sdk-hd-sha-ethercat",
        "EtherCAT Technology Group",
        "SHA rotary actuator with integrated servo drive",
        "https://www.ethercat.org/en/products/C964F53A03D7411191AB43DDDEF93C22.htm",
    ),
    s(
        "sdk-hd-brochure",
        "Harmonic Drive LLC",
        "Integrated products brochure",
        "https://www.harmonicdrive.net/media/3305/group-integrated-brochure-2.pdf",
    ),
    // maxon
    s(
        "sdk-maxon-python",
        "maxon",
        "EPOS Command Library from Python (support article)",
        "https://support.maxongroup.com/hc/en-us/articles/360012695739",
    ),
    s(
        "sdk-maxon-ros2",
        "maxon",
        "EPOS4 with ROS 2 (support article)",
        "https://support.maxongroup.com/hc/en-us/articles/4414984147730",
    ),
    ref(
        "sdk-maxon-noplab-epos",
        "NOPLAB",
        "epos (ros2_control for EPOS4, community)",
        "https://github.com/NOPLAB/epos",
    ),
    // VESC
    s(
        "sdk-vesc-bldc",
        "VESC Project",
        "bldc firmware repository",
        "https://github.com/vedderb/bldc",
    ),
    s(
        "sdk-vesc-tool",
        "VESC Project",
        "VESC Tool repository",
        "https://github.com/vedderb/vesc_tool",
    ),
    ref(
        "sdk-vesc-ros",
        "F1TENTH",
        "vesc ROS 2 driver (community)",
        "https://github.com/f1tenth/vesc",
    ),
    ref(
        "sdk-pyvesc",
        "PyPI",
        "pyvesc package (community)",
        "https://pypi.org/project/pyvesc/",
    ),
    // Trinamic
    s(
        "sdk-trinamic-pytrinamic",
        "Analog Devices",
        "PyTrinamic repository",
        "https://github.com/analogdevicesinc/PyTrinamic",
    ),
    s(
        "sdk-trinamic-tmc4671",
        "Analog Devices",
        "TMC4671 product page and datasheet",
        "https://www.analog.com/en/products/tmc4671.html",
    ),
    // Hiwonder
    ref(
        "sdk-hiwonder-pylx16a",
        "ethanlipson",
        "PyLX-16A (community)",
        "https://github.com/ethanlipson/PyLX-16A",
    ),
    ref(
        "sdk-crate-lx16a",
        "lib.rs",
        "lx16a-servo crate (Rust, community)",
        "https://lib.rs/crates/lx16a-servo",
    ),
    // LKMTech
    ref(
        "sdk-lkmotor-python",
        "han-xudong",
        "pyLKMotor (community, ships the LK CAN protocol PDF)",
        "https://github.com/han-xudong/pyLKMotor",
    ),
    // Xiaomi manual, Hiwonder manual, INNFOS
    ref(
        "sdk-cybergear-manual-en",
        "belovictor",
        "CyberGear instruction manual, English translation (community)",
        "https://github.com/belovictor/cybergear-docs/blob/main/instructionmanual/instructionmanual.md",
    ),
    s(
        "sdk-hiwonder-lx16a-manual",
        "Hiwonder",
        "LX-16A serial bus servo user manual",
        "https://cdn.robotshop.com/rbm/a5e9ab51-86bc-497b-adac-003de3088fb7/9/92896585-5e83-4c7c-a663-650b81e5978b/67e9729b_lx-16a-serial-bus-servo-user-manual.pdf",
    ),
    s(
        "sdk-innfos-gluon",
        "Mintasca (INNFOS)",
        "innfos-gluon-controller repository",
        "https://github.com/mintasca/innfos-gluon-controller",
    ),
    // ENCOS and ATAR: product pages only, no public SDK found
    s(
        "sdk-atar-arc",
        "ATAR Robot",
        "ARC cycloidal joint actuators",
        "https://www.atarrobot.com/cycloidal-robot/arc-serie/Arc-cycloidal-joint-actuators.html",
    ),
    ref(
        "sdk-encos-product",
        "AIFitLab",
        "ENCOS EC-A4310-P2-36 product listing",
        "https://aifitlab.com/collections/encos-motor/products/encos-ec-a4310-p2-36-motor",
    ),
];
