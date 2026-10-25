import { robot } from "./build";
import type { Humanoid } from "./types";

// UBTech, AgiBot, Fourier, Kepler and XPeng. Fourier and AgiBot publish URDFs
// and actuator families; the rest publish DOF counts only.

const WALKER_SRC = ["walker-sdk", "walker-press"];
const WALKER_TYPE =
    "UBTECH integrated servo joint motors; reducer types and leg torques not released";

const walker = robot({
    id: "ubtech-walker-s2",
    name: "Walker S2",
    brand: "UBTECH Robotics",
    country: "China",
    dof: 52,
    height_m: 1.76,
    weight_kg: 70,
    price_usd: null,
    price_max_usd: null,
    product_url: "https://www.ubtrobot.com/en/humanoid/products/walker",
    summary:
        "Factory humanoid that swaps its own battery. The SDK lists 42 integrated joint motors with 6-DOF hands; marketing quotes 52 DOF with 11-DOF hands.",
    sources: WALKER_SRC,
    joints: [
        {
            at: ["neck"],
            count: 2,
            type: "other",
            inferredFrom: WALKER_TYPE,
            torque: 4.5,
            figureNote: "head pitch motor in the SDK joint table (3 N·m rated)",
            src: ["walker-sdk"],
        },
        {
            at: ["hip-pitch", "knee"],
            type: "other",
            inferredFrom: `${WALKER_TYPE}; 6 per leg, 7 per arm, 2 waist assumed from the 42-motor count`,
            size: "l",
            sizeFrom: "70 kg robot, main leg joint (class estimated)",
            src: WALKER_SRC,
        },
        {
            at: [
                "hip-yaw",
                "hip-roll",
                "ankle-pitch",
                "ankle-roll",
                "shoulder-pitch",
                "shoulder-roll",
                "shoulder-yaw",
                "elbow",
            ],
            type: "other",
            inferredFrom: WALKER_TYPE,
            size: "m",
            sizeFrom: "70 kg robot (class estimated)",
            src: WALKER_SRC,
        },
        {
            at: ["waist"],
            count: 2,
            type: "other",
            inferredFrom: WALKER_TYPE,
            size: "l",
            sizeFrom: "waist (class estimated)",
            src: WALKER_SRC,
        },
        {
            at: ["wrist"],
            count: 3,
            type: "other",
            inferredFrom: WALKER_TYPE,
            size: "s",
            sizeFrom: "wrist (class estimated)",
            src: WALKER_SRC,
        },
        {
            at: ["hand"],
            count: 6,
            type: "other",
            inferredFrom: WALKER_TYPE,
            size: "xs",
            sizeFrom: "6-DOF hand in the SDK",
            src: ["walker-sdk"],
        },
    ],
});

const X1_LEG = ["x1-urdf", "x1-guide", "x1-leobotics"];
const X1_ARM = ["x1-guide", "x1-product", "x1-leobotics"];
const X1_QDD =
    "PowerFlow modules described as QDD with planetary reducers under 10:1 (third-party listing)";
const X1_ARM_FIT =
    "the guide lists the units but not their joints; 3 spare R86-2 assumed at waist and shoulder pitch, R52 at the other arm joints and neck";

const x1 = robot({
    id: "agibot-x1",
    name: "X1",
    brand: "AgiBot",
    country: "China",
    dof: 34,
    height_m: 1.3,
    weight_kg: 33,
    price_usd: null,
    price_max_usd: null,
    product_url: "https://agibot.com/products/X1",
    summary:
        "Open-source full-stack humanoid: 29 body joints from four PowerFlow units (R86-3 x6, R86-2 x9, R52 x10, L28 linear x4).",
    sources: [...X1_LEG, "x1-product"],
    joints: [
        {
            at: ["hip-pitch", "hip-roll", "knee"],
            type: "qdd",
            inferredFrom: X1_QDD,
            motor: "PowerFlow R86-3",
            torque: 150,
            figureNote: "URDF effort limit; AgiBot pages quote 150 and 200 N·m peak",
            src: X1_LEG,
        },
        {
            at: ["hip-yaw"],
            type: "qdd",
            inferredFrom: X1_QDD,
            motor: "PowerFlow R86-2",
            torque: 50,
            src: X1_LEG,
        },
        {
            at: ["ankle-pitch", "ankle-roll"],
            type: "qdd",
            inferredFrom: X1_QDD,
            motor: "PowerFlow R86-2",
            torque: 80,
            src: X1_LEG,
        },
        {
            at: ["waist", "shoulder-pitch"],
            type: "qdd",
            inferredFrom: `${X1_QDD}; ${X1_ARM_FIT}`,
            motor: "PowerFlow R86-2",
            torque: 80,
            figure: "estimated",
            figureNote:
                "R86-2 peak (AgiBot pages give 50 and 80 N·m); placement estimated",
            src: X1_ARM,
        },
        {
            at: ["shoulder-roll", "shoulder-yaw", "elbow", "wrist"],
            type: "qdd",
            inferredFrom: `${X1_QDD}; ${X1_ARM_FIT}`,
            motor: "PowerFlow R52",
            torque: 25,
            figure: "estimated",
            figureNote: "R52 peak from the product page; placement estimated",
            src: X1_ARM,
        },
        {
            at: ["neck"],
            count: 2,
            type: "qdd",
            inferredFrom: `${X1_QDD}; ${X1_ARM_FIT}`,
            motor: "PowerFlow R52",
            torque: 25,
            figure: "estimated",
            figureNote: "R52 peak from the product page; placement estimated",
            src: X1_ARM,
        },
        {
            at: ["wrist"],
            count: 2,
            type: "other",
            inferredFrom: `L28 linear actuator, screw type not published; ${X1_ARM_FIT}`,
            motor: "PowerFlow L28 (linear)",
            force: 110,
            src: ["x1-product", "x1-guide"],
        },
    ],
});

const FSA_TYPE =
    "Fourier FSA smart actuator modules; the reducer type is not confirmed in the sources found";
const GR1_SRC = ["gr1-urdf", "grx-readme"];

const gr1 = robot({
    id: "fourier-gr1",
    name: "GR-1",
    brand: "Fourier",
    country: "China",
    dof: 44,
    height_m: 1.65,
    weight_kg: 55,
    price_usd: null,
    price_max_usd: null,
    product_url: "https://www.fftai.com/",
    summary:
        "Fourier's first general-purpose humanoid, on its own FSA actuators; 225 N·m at hip pitch and knee in the published URDF.",
    sources: [...GR1_SRC, "gr1-sacra", "gr1-db"],
    joints: [
        {
            at: ["hip-pitch", "knee"],
            type: "other",
            inferredFrom: FSA_TYPE,
            torque: 225,
            src: GR1_SRC,
        },
        {
            at: ["hip-yaw"],
            type: "other",
            inferredFrom: FSA_TYPE,
            torque: 66,
            src: GR1_SRC,
        },
        {
            at: ["hip-roll"],
            type: "other",
            inferredFrom: FSA_TYPE,
            torque: 48,
            src: GR1_SRC,
        },
        {
            at: ["ankle-pitch"],
            type: "other",
            inferredFrom: FSA_TYPE,
            torque: 15,
            src: GR1_SRC,
        },
        {
            at: ["ankle-roll"],
            type: "other",
            inferredFrom: FSA_TYPE,
            torque: 30,
            src: GR1_SRC,
        },
        {
            at: ["waist"],
            count: 3,
            type: "other",
            inferredFrom: FSA_TYPE,
            torque: 66,
            src: GR1_SRC,
        },
        {
            at: ["shoulder-pitch", "shoulder-roll"],
            type: "other",
            inferredFrom: FSA_TYPE,
            torque: 38,
            src: GR1_SRC,
        },
        {
            at: ["shoulder-yaw", "elbow"],
            type: "other",
            inferredFrom: FSA_TYPE,
            torque: 30,
            src: GR1_SRC,
        },
        {
            at: ["wrist"],
            type: "other",
            inferredFrom: FSA_TYPE,
            torque: 10.2,
            src: GR1_SRC,
        },
        {
            at: ["wrist"],
            count: 2,
            type: "other",
            inferredFrom: FSA_TYPE,
            torque: 3.95,
            src: GR1_SRC,
        },
        {
            at: ["neck"],
            count: 3,
            type: "other",
            inferredFrom: FSA_TYPE,
            torque: 3.95,
            src: GR1_SRC,
        },
        {
            at: ["hand"],
            count: 6,
            type: "other",
            inferredFrom: "6-DOF Fourier hand variant of the URDF; drive not published",
            size: "xs",
            sizeFrom: "6-DOF hand",
            src: ["grx-readme"],
        },
    ],
});

const GR2_SRC = ["gr2-urdf", "gr2-technode"];

const gr2 = robot({
    id: "fourier-gr2",
    name: "GR-2",
    brand: "Fourier",
    country: "China",
    dof: 53,
    height_m: 1.75,
    weight_kg: 63,
    price_usd: null,
    price_max_usd: null,
    product_url: "https://www.fftai.com/",
    summary:
        "Second-generation Fourier humanoid on FSA 2.0 actuators; the URDF puts hip pitch and knee at 366 N·m.",
    notCounted: "Dexterous hands: actuator count not published.",
    sources: [...GR2_SRC, "gr2-support"],
    joints: [
        {
            at: ["hip-pitch", "knee"],
            type: "other",
            inferredFrom: FSA_TYPE,
            torque: 366,
            src: GR2_SRC,
        },
        {
            at: ["hip-roll"],
            type: "other",
            inferredFrom: FSA_TYPE,
            torque: 95.5,
            src: GR2_SRC,
        },
        {
            at: ["hip-yaw", "ankle-pitch"],
            type: "other",
            inferredFrom: FSA_TYPE,
            torque: 54.3,
            src: GR2_SRC,
        },
        {
            at: ["ankle-roll"],
            type: "other",
            inferredFrom: FSA_TYPE,
            torque: 29.8,
            src: GR2_SRC,
        },
        {
            at: ["waist"],
            type: "other",
            inferredFrom: FSA_TYPE,
            torque: 74.5,
            src: GR2_SRC,
        },
        {
            at: ["shoulder-pitch", "shoulder-roll"],
            type: "other",
            inferredFrom: FSA_TYPE,
            torque: 74.5,
            src: GR2_SRC,
        },
        {
            at: ["shoulder-yaw", "elbow"],
            type: "other",
            inferredFrom: FSA_TYPE,
            torque: 42.8,
            src: GR2_SRC,
        },
        {
            at: ["wrist"],
            count: 3,
            type: "other",
            inferredFrom: FSA_TYPE,
            torque: 17.3,
            src: GR2_SRC,
        },
        {
            at: ["neck"],
            count: 2,
            type: "other",
            inferredFrom: FSA_TYPE,
            torque: 17.3,
            src: GR2_SRC,
        },
    ],
});

const K2_SRC = ["k2-trr", "k2-ie"];
const K2_LINEAR =
    "Kepler reports planetary roller screw actuators in the arms and legs; which joints is not published, an Optimus-style split is assumed";
const K2_ROTARY = "rotary at waist and shoulders, as on the K1; drive not published";

const k2 = robot({
    id: "kepler-k2",
    name: "Forerunner K2",
    brand: "Kepler",
    country: "China",
    dof: 52,
    height_m: 1.75,
    weight_kg: 75,
    price_usd: null,
    price_max_usd: null,
    product_url: null,
    summary:
        "Industrial humanoid on in-house planetary roller screw linear actuators in the limbs; 15 kg per arm, 11-DOF hands.",
    notCounted: "11-DOF hands: actuator count not published.",
    sources: K2_SRC,
    joints: [
        {
            at: ["hip-pitch", "knee"],
            type: "linear-roller-screw",
            inferredFrom: K2_LINEAR,
            size: "l",
            sizeFrom: "75 kg robot, main leg joint (class estimated)",
            src: K2_SRC,
        },
        {
            at: ["elbow", "ankle-pitch", "ankle-roll"],
            type: "linear-roller-screw",
            inferredFrom: K2_LINEAR,
            size: "m",
            sizeFrom: "mid-limb joint (class estimated)",
            src: K2_SRC,
        },
        {
            at: ["shoulder-pitch", "shoulder-roll", "hip-yaw", "hip-roll", "waist"],
            type: "other",
            inferredFrom: K2_ROTARY,
            size: "l",
            sizeFrom: "75 kg robot, proximal joint (class estimated)",
            src: K2_SRC,
        },
        {
            at: ["shoulder-yaw"],
            type: "other",
            inferredFrom: K2_ROTARY,
            size: "m",
            sizeFrom: "shoulder yaw (class estimated)",
            src: K2_SRC,
        },
        {
            at: ["wrist"],
            count: 2,
            type: "other",
            inferredFrom: K2_ROTARY,
            size: "s",
            sizeFrom: "wrist (class estimated)",
            src: K2_SRC,
        },
        {
            at: ["neck"],
            count: 2,
            type: "other",
            inferredFrom: "rotating and tilting head module; drive not published",
            size: "xs",
            sizeFrom: "neck (class estimated)",
            src: K2_SRC,
        },
    ],
});

const IRON_SRC = ["iron-ie", "iron-cleantechnica"];
const IRON_TYPE =
    "XPeng describes bionic-muscle style actuators but has not published actuator types";

const iron = robot({
    id: "xpeng-iron",
    name: "IRON",
    brand: "XPeng",
    country: "China",
    dof: 82,
    height_m: 1.78,
    weight_kg: 70,
    price_usd: null,
    price_max_usd: null,
    product_url: "https://www.xpeng.com/",
    summary:
        "Carmaker's humanoid with 82 DOF, 22-DOF hands and an all-solid-state battery, slated for mass production.",
    notCounted: "22-DOF hands and spine axes: actuators not published.",
    sources: IRON_SRC,
    joints: [
        {
            at: ["hip-pitch", "knee", "hip-roll", "waist"],
            type: "other",
            inferredFrom: IRON_TYPE,
            size: "l",
            sizeFrom: "70 kg robot, main joint (class estimated)",
            src: IRON_SRC,
        },
        {
            at: [
                "hip-yaw",
                "ankle-pitch",
                "ankle-roll",
                "shoulder-pitch",
                "shoulder-roll",
                "shoulder-yaw",
                "elbow",
            ],
            type: "other",
            inferredFrom: IRON_TYPE,
            size: "m",
            sizeFrom: "70 kg robot (class estimated)",
            src: IRON_SRC,
        },
        {
            at: ["wrist"],
            count: 2,
            type: "other",
            inferredFrom: IRON_TYPE,
            size: "s",
            sizeFrom: "wrist (class estimated)",
            src: IRON_SRC,
        },
        {
            at: ["neck"],
            count: 2,
            type: "other",
            inferredFrom: IRON_TYPE,
            size: "xs",
            sizeFrom: "neck (class estimated)",
            src: IRON_SRC,
        },
    ],
});

export const CHINA_FLEET: Humanoid[] = [walker, x1, gr1, gr2, k2, iron];
