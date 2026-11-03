// The SDK registry: one entry per brand in the catalog, keyed by the exact
// brand strings frontend/src/data/actuators.json uses. Most SDKs are shared
// across a brand's actuators, so scores live here and map to actuator ids.
//
//   aliases      terms the seeding matcher looks for (word-bounded, lowercase)
//   searchTerms  queries sent to Reddit, HN, ROS Discourse and GitHub search
//   repos        repositories the objective checks read (official or not)
//   kind "none"  a reducer or bare frameless motor: no software to score

export interface SdkRepo {
    repo: string;
    official: boolean;
}

export interface SdkBrand {
    id: string;
    name: string;
    catalogBrands: string[];
    kind: "sdk" | "none";
    noneReason?: string;
    aliases: string[];
    searchTerms: string[];
    repos: SdkRepo[];
}

const REDUCER = "Mechanical reducer: no electronics, so no SDK to score.";
const FRAMELESS =
    "Frameless motor sold without a drive: the SDK is whichever controller you pair it with.";

function brand(
    id: string,
    name: string,
    catalogBrands: string[],
    aliases: string[],
    searchTerms: string[],
    repos: SdkRepo[] = [],
): SdkBrand {
    return { id, name, catalogBrands, kind: "sdk", aliases, searchTerms, repos };
}

function none(
    id: string,
    name: string,
    catalogBrands: string[],
    noneReason: string,
): SdkBrand {
    return {
        id,
        name,
        catalogBrands,
        kind: "none",
        noneReason,
        aliases: [],
        searchTerms: [],
        repos: [],
    };
}

const official = (repo: string): SdkRepo => ({ repo, official: true });
const community = (repo: string): SdkRepo => ({ repo, official: false });

export const SDK_BRANDS: readonly SdkBrand[] = [
    brand(
        "robotis",
        "Robotis Dynamixel",
        ["Robotis (Dynamixel)"],
        ["dynamixel", "robotis", "dxl"],
        ["dynamixel sdk", "dynamixel"],
        [
            official("ROBOTIS-GIT/DynamixelSDK"),
            official("ROBOTIS-GIT/dynamixel_hardware_interface"),
        ],
    ),
    brand(
        "cubemars",
        "CubeMars",
        ["CubeMars (T-Motor)"],
        ["cubemars", "ak80-9", "ak80-6", "ak60-6", "ak70-10", "ak10-9", "ak80-64"],
        ["cubemars", "ak80-9"],
        [community("neurobionics/TMotorCANControl")],
    ),
    brand(
        "myactuator",
        "MyActuator",
        ["MyActuator"],
        ["myactuator", "rmd-x8", "rmd-x6", "rmd-x10", "rmd-l", "rmd x8"],
        ["myactuator", "rmd-x8"],
        [community("2b-t/myactuator_rmd"), community("2b-t/myactuator_rmd_ros")],
    ),
    brand(
        "robstride",
        "RobStride",
        ["RobStride"],
        ["robstride"],
        ["robstride"],
        [
            official("RobStride/Python_Sample"),
            community("Seeed-Projects/RobStride_Control"),
        ],
    ),
    brand(
        "steadywin",
        "Steadywin",
        ["Steadywin", "SteadyWin"],
        [
            "steadywin",
            "steady win",
            "gim8108",
            "gim6010",
            "gim8115",
            "gim4310",
            "gim3505",
        ],
        ["steadywin", "gim8108"],
    ),
    brand(
        "feetech",
        "Feetech",
        ["Feetech"],
        ["feetech", "sts3215", "sts3250", "scservo", "ftservo", "scs0009", "scs15"],
        ["feetech", "sts3215"],
        [official("ftservo/FTServo_Python")],
    ),
    brand(
        "waveshare",
        "Waveshare (Feetech OEM)",
        ["Waveshare (Feetech OEM)"],
        ["waveshare st3215", "st3215", "waveshare servo", "waveshare bus servo"],
        ["waveshare st3215", "waveshare bus servo"],
    ),
    brand(
        "mjbots",
        "mjbots moteus",
        ["mjbots"],
        ["moteus", "mjbots", "qdd100"],
        ["moteus", "mjbots"],
        [official("mjbots/moteus")],
    ),
    brand(
        "odrive",
        "ODrive",
        ["ODrive Robotics"],
        ["odrive", "odrivetool", "odrive s1", "odrive pro"],
        ["odrive", "odrivetool"],
        [official("odriverobotics/ODrive"), official("odriverobotics/ros_odrive")],
    ),
    brand(
        "damiao",
        "DAMIAO",
        ["DAMIAO (DMBots)"],
        ["damiao", "dm4310", "dm-j4310", "dm4340", "dm-j4340", "dm8009", "dm-j8009"],
        ["damiao motor", "dm4310"],
        [community("cmjang/DM_Control_Python"), community("enactic/openarm_can")],
    ),
    brand(
        "unitree",
        "Unitree",
        ["Unitree", "Unitree Robotics"],
        ["unitree", "go-m8010", "go m8010", "a1 motor", "unitree motor"],
        ["unitree sdk", "unitree_actuator_sdk"],
        [official("unitreerobotics/unitree_actuator_sdk")],
    ),
    brand(
        "xiaomi",
        "Xiaomi CyberGear",
        ["Xiaomi"],
        ["cybergear", "cyber gear", "cyberdog motor"],
        ["cybergear"],
        [community("cybergear-robotics/cybergear"), community("blanck/cybergear")],
    ),
    brand(
        "harmonic-drive",
        "Harmonic Drive",
        ["Harmonic Drive LLC", "Harmonic Drive (Harmonic Drive SE / LLC)"],
        ["harmonic drive llc", "hdl-ide", "harmonic drive actuator"],
        ["harmonic drive servo"],
    ),
    brand(
        "maxon",
        "maxon EPOS",
        ["maxon"],
        ["maxon", "epos4", "epos2", "epos studio", "escon"],
        ["maxon epos", "epos4"],
        [community("NOPLAB/epos")],
    ),
    brand(
        "innfos",
        "INNFOS",
        ["INNFOS (Mintasca)"],
        ["innfos", "mintasca"],
        ["innfos"],
        [official("mintasca/innfos-gluon-controller")],
    ),
    brand(
        "hiwonder",
        "Hiwonder",
        ["Hiwonder (LewanSoul)"],
        ["hiwonder", "lewansoul", "lx-16a", "lx16a"],
        ["lx-16a", "hiwonder servo"],
        [community("ethanlipson/PyLX-16A")],
    ),
    brand(
        "lkmtech",
        "LKMTech",
        ["LKMTech (LKTECH / Shanghai Lingkong)"],
        ["lkmtech", "lktech", "lk motor", "lkmotor", "lingkong", "mg5010", "mf9025"],
        ["lkmtech", "lk motor can"],
        [community("han-xudong/pyLKMotor")],
    ),
    brand("encos", "ENCOS", ["ENCOS"], ["encos"], ["encos actuator"]),
    brand(
        "vesc",
        "VESC",
        ["Trampa / VESC Project"],
        ["vesc", "vesc tool", "vesc_tool", "pyvesc"],
        ["vesc", "vesc tool"],
        [
            official("vedderb/bldc"),
            official("vedderb/vesc_tool"),
            community("f1tenth/vesc"),
        ],
    ),
    brand(
        "trinamic",
        "Trinamic",
        ["Trinamic (Analog Devices)"],
        ["trinamic", "tmc4671", "pytrinamic", "tmcl"],
        ["trinamic", "tmc4671"],
        [official("analogdevicesinc/PyTrinamic")],
    ),
    brand(
        "atar",
        "ATAR Robot",
        ["ATAR Robot"],
        ["atar robot"],
        ["atar robot actuator"],
    ),
    none("tq", "TQ RoboDrive", ["TQ-Systems (RoboDrive)"], FRAMELESS),
    none("allied-motion", "Allied Motion", ["Allied Motion / Allient"], FRAMELESS),
    none("ipower", "iPower", ["iPower Motor (iFlight)"], FRAMELESS),
    none("nabtesco", "Nabtesco", ["Nabtesco"], REDUCER),
    none("spinea", "Spinea", ["Spinea (Cone Drive)"], REDUCER),
    none(
        "leaderdrive",
        "Leaderdrive",
        ["Leaderdrive (Suzhou Leader Harmonic Drive)"],
        REDUCER,
    ),
    none("nidec", "Nidec", ["Nidec Drive Technology (Nidec-Shimpo)"], REDUCER),
];

const byCatalogBrand = new Map(
    SDK_BRANDS.flatMap((b) => b.catalogBrands.map((c) => [c, b] as const)),
);
const byId = new Map(SDK_BRANDS.map((b) => [b.id, b]));

export function sdkBrandForCatalogBrand(brandName: string): SdkBrand | undefined {
    return byCatalogBrand.get(brandName);
}

export function getSdkBrand(id: string): SdkBrand | undefined {
    return byId.get(id);
}

// Brands with software to score, in registry order.
export const SCORED_BRANDS = SDK_BRANDS.filter((b) => b.kind === "sdk");
