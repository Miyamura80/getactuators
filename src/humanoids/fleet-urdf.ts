import { robot } from "./build";
import type { Humanoid } from "./types";

// Unitree and Booster: joint torques read from the makers' published URDFs
// and spec pages, so these rows are mostly reported.

const G1_SRC = ["g1-urdf", "g1-actuators"];
const UNITREE_REDUCER =
    "motor-gearbox modules at a fixed ratio (Unitree RL Lab configs); Unitree does not name the reducer type, planetary assumed";

const g1 = robot({
    id: "unitree-g1",
    robotId: "unitree-g1",
    name: "G1",
    brand: "Unitree Robotics",
    country: "China",
    dof: 23,
    height_m: 1.32,
    weight_kg: 35,
    price_usd: 13500,
    price_max_usd: null,
    product_url: "https://www.unitree.com/g1/",
    summary:
        "Compact research humanoid on three Unitree motor sizes: N7520 at 14.3:1 and 22.5:1 in the hips and knees, N5020-16 everywhere else.",
    sources: [...G1_SRC, "g1-site"],
    joints: [
        {
            at: ["hip-pitch", "hip-yaw"],
            type: "planetary",
            inferredFrom: UNITREE_REDUCER,
            motor: "Unitree N7520-14.3",
            reducer: "14.3:1",
            torque: 88,
            src: G1_SRC,
        },
        {
            at: ["waist"],
            type: "planetary",
            inferredFrom: UNITREE_REDUCER,
            motor: "Unitree N7520-14.3",
            reducer: "14.3:1",
            torque: 88,
            src: G1_SRC,
        },
        {
            at: ["hip-roll", "knee"],
            type: "planetary",
            inferredFrom: UNITREE_REDUCER,
            motor: "Unitree N7520-22.5",
            reducer: "22.5:1",
            torque: 139,
            src: G1_SRC,
        },
        {
            at: ["ankle-pitch", "ankle-roll"],
            type: "planetary",
            inferredFrom: UNITREE_REDUCER,
            motor: "Unitree N5020-16 (parallel linkage)",
            reducer: "16:1",
            torque: 35,
            figureNote: "URDF effort limit at the joint, two motors through a linkage",
            src: G1_SRC,
        },
        {
            at: ["shoulder-pitch", "shoulder-roll", "shoulder-yaw", "elbow", "wrist"],
            type: "planetary",
            inferredFrom: UNITREE_REDUCER,
            motor: "Unitree N5020-16",
            reducer: "16:1",
            torque: 25,
            src: G1_SRC,
        },
    ],
});

const H1_SRC = ["h1-urdf", "h1-site"];

const h1 = robot({
    id: "unitree-h1",
    name: "H1",
    brand: "Unitree Robotics",
    country: "China",
    dof: 19,
    height_m: 1.8,
    weight_kg: 47,
    price_usd: 90000,
    price_max_usd: null,
    product_url: "https://www.unitree.com/h1/",
    summary:
        "Unitree's first full-size humanoid: M107 motors at the knees (about 360 N·m), 189 N·m/kg peak torque density, a single-axis ankle.",
    sources: [...H1_SRC, "h1-price"],
    joints: [
        {
            at: ["knee"],
            type: "planetary",
            inferredFrom: UNITREE_REDUCER,
            actuatorId: "unitree-m107",
            motor: "Unitree M107",
            torque: 360,
            figureNote: "Unitree spec page; the URDF effort limit is 300 N·m",
            src: H1_SRC,
        },
        {
            at: ["hip-yaw", "hip-roll", "hip-pitch"],
            type: "planetary",
            inferredFrom: UNITREE_REDUCER,
            torque: 220,
            figureNote: "Unitree spec page; the URDF effort limit is 200 N·m",
            src: H1_SRC,
        },
        {
            at: ["waist"],
            type: "planetary",
            inferredFrom: UNITREE_REDUCER,
            torque: 200,
            figureNote: "URDF effort limit (torso joint)",
            src: ["h1-urdf"],
        },
        {
            at: ["ankle-pitch"],
            type: "planetary",
            inferredFrom: UNITREE_REDUCER,
            torque: 59,
            figureNote: "Unitree spec page; the URDF effort limit is 40 N·m",
            src: H1_SRC,
        },
        {
            at: ["shoulder-pitch", "shoulder-roll"],
            type: "planetary",
            inferredFrom: UNITREE_REDUCER,
            torque: 40,
            figureNote: "URDF effort limit; Unitree quotes about 75 N·m for arm joints",
            src: H1_SRC,
        },
        {
            at: ["shoulder-yaw", "elbow"],
            type: "planetary",
            inferredFrom: UNITREE_REDUCER,
            torque: 18,
            figureNote: "URDF effort limit",
            src: ["h1-urdf"],
        },
    ],
});

const H2_SRC = ["h2-site", "h2-krasia"];
const H2_LAYOUT =
    "Unitree gives 31 DOF, 360 N·m legs and 120 N·m arms but no joint table; 6 per leg, 7 per arm, 3 waist and 2 neck assumed";

const h2 = robot({
    id: "unitree-h2",
    robotId: "unitree-h2",
    name: "H2",
    brand: "Unitree Robotics",
    country: "China",
    dof: 31,
    height_m: 1.82,
    weight_kg: 70,
    price_usd: 29900,
    price_max_usd: null,
    product_url: "https://www.unitree.com/H2/",
    summary:
        "Full-size 31-DOF successor to H1: up to 360 N·m at the leg joints and 120 N·m at the arms.",
    sources: H2_SRC,
    joints: [
        {
            at: ["hip-pitch", "knee"],
            type: "planetary",
            inferredFrom: `${UNITREE_REDUCER}. ${H2_LAYOUT}`,
            torque: 360,
            figure: "estimated",
            figureNote: "Unitree's leg peak; which leg joints reach it is not stated",
            src: H2_SRC,
        },
        {
            at: ["hip-yaw", "hip-roll", "ankle-pitch", "ankle-roll"],
            type: "planetary",
            inferredFrom: `${UNITREE_REDUCER}. ${H2_LAYOUT}`,
            size: "l",
            sizeFrom: "leg joint below the 360 N·m peak (class estimated)",
            src: H2_SRC,
        },
        {
            at: ["shoulder-pitch", "shoulder-roll"],
            type: "planetary",
            inferredFrom: `${UNITREE_REDUCER}. ${H2_LAYOUT}`,
            torque: 120,
            figure: "estimated",
            figureNote: "Unitree's arm peak; which arm joints reach it is not stated",
            src: H2_SRC,
        },
        {
            at: ["shoulder-yaw", "elbow"],
            type: "planetary",
            inferredFrom: `${UNITREE_REDUCER}. ${H2_LAYOUT}`,
            size: "m",
            sizeFrom: "arm joint below the 120 N·m peak (class estimated)",
            src: H2_SRC,
        },
        {
            at: ["wrist"],
            count: 3,
            type: "planetary",
            inferredFrom: `${UNITREE_REDUCER}. ${H2_LAYOUT}`,
            size: "s",
            sizeFrom: "wrist (class estimated)",
            src: H2_SRC,
        },
        {
            at: ["waist"],
            count: 3,
            type: "planetary",
            inferredFrom: `${UNITREE_REDUCER}. ${H2_LAYOUT}`,
            size: "l",
            sizeFrom: "waist (class estimated)",
            src: H2_SRC,
        },
        {
            at: ["neck"],
            count: 2,
            type: "other",
            inferredFrom: H2_LAYOUT,
            size: "xs",
            sizeFrom: "neck (class estimated)",
            src: H2_SRC,
        },
    ],
});

const BOOSTER_TYPE =
    "brushless DC joints with dual encoders; Booster does not name the reducer";
const T1_SRC = ["t1-urdf", "t1-robocup"];

const t1 = robot({
    id: "booster-t1",
    robotId: "booster-t1",
    name: "T1",
    brand: "Booster Robotics",
    country: "China",
    dof: 23,
    height_m: 1.18,
    weight_kg: 30,
    price_usd: null,
    price_max_usd: null,
    product_url: "https://www.booster.tech/booster-t1/",
    summary:
        "Adult-size RoboCup platform; knees reach 130.5 N·m. Joint torques from Booster's URDF.",
    sources: T1_SRC,
    joints: [
        {
            at: ["neck"],
            count: 2,
            type: "other",
            inferredFrom: BOOSTER_TYPE,
            torque: 7,
            src: T1_SRC,
        },
        {
            at: ["shoulder-pitch", "shoulder-roll", "shoulder-yaw", "elbow"],
            type: "other",
            inferredFrom: `${BOOSTER_TYPE}; the URDF's elbow yaw is mapped to shoulder yaw`,
            torque: 38.3,
            src: T1_SRC,
        },
        {
            at: ["waist"],
            type: "other",
            inferredFrom: BOOSTER_TYPE,
            torque: 68,
            src: T1_SRC,
        },
        {
            at: ["hip-roll", "hip-yaw"],
            type: "other",
            inferredFrom: BOOSTER_TYPE,
            torque: 68,
            src: T1_SRC,
        },
        {
            at: ["hip-pitch"],
            type: "other",
            inferredFrom: BOOSTER_TYPE,
            torque: 98.8,
            src: T1_SRC,
        },
        {
            at: ["knee"],
            type: "other",
            inferredFrom: BOOSTER_TYPE,
            torque: 130.5,
            src: T1_SRC,
        },
        {
            at: ["ankle-pitch"],
            type: "other",
            inferredFrom: BOOSTER_TYPE,
            torque: 73.1,
            src: T1_SRC,
        },
        {
            at: ["ankle-roll"],
            type: "other",
            inferredFrom: BOOSTER_TYPE,
            torque: 17.2,
            src: T1_SRC,
        },
    ],
});

const K1_SRC = ["k1-urdf"];

const k1 = robot({
    id: "booster-k1",
    robotId: "booster-k1",
    name: "K1",
    brand: "Booster Robotics",
    country: "China",
    dof: 22,
    height_m: 0.95,
    weight_kg: 19.5,
    price_usd: null,
    price_max_usd: null,
    product_url: "https://www.booster.tech/booster-k1/",
    summary:
        "Kid-size RoboCup champion platform: 6 joints per leg, 4 per arm, 2 in the head.",
    sources: K1_SRC,
    joints: [
        {
            at: ["neck"],
            count: 2,
            type: "other",
            inferredFrom: BOOSTER_TYPE,
            torque: 6,
            src: K1_SRC,
        },
        {
            at: ["shoulder-pitch", "shoulder-roll", "shoulder-yaw", "elbow"],
            type: "other",
            inferredFrom: `${BOOSTER_TYPE}; the URDF's elbow yaw is mapped to shoulder yaw`,
            torque: 14,
            src: K1_SRC,
        },
        {
            at: ["hip-pitch"],
            type: "other",
            inferredFrom: BOOSTER_TYPE,
            torque: 68,
            src: K1_SRC,
        },
        {
            at: ["hip-roll"],
            type: "other",
            inferredFrom: BOOSTER_TYPE,
            torque: 43,
            src: K1_SRC,
        },
        {
            at: ["hip-yaw", "ankle-pitch", "ankle-roll"],
            type: "other",
            inferredFrom: BOOSTER_TYPE,
            torque: 38.3,
            src: K1_SRC,
        },
        {
            at: ["knee"],
            type: "other",
            inferredFrom: BOOSTER_TYPE,
            torque: 112,
            src: K1_SRC,
        },
    ],
});

export const URDF_FLEET: Humanoid[] = [g1, h1, h2, t1, k1];
