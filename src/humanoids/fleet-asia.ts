import { robot } from "./build";
import type { Humanoid } from "./types";

// Humanoids from Asian groups better known for other products: Xiaomi
// (phones, cars) and Kawasaki Heavy Industries (industrial robots,
// motorcycles). Neither publishes a joint map, so the rows lean on the DOF
// breakdowns in launch coverage and on estimated size classes.

const CYBERONE_SRC = ["cyberone-engadget", "cyberone-qviro"];
const CYBERONE_TYPE =
    "Xiaomi's in-house electric joint actuators; reducer types not published";
const CYBERONE_LAYOUT =
    "21 DOF reported as neck 1, arms 4 each, legs 5 each, grippers 1 each; the axes of the 4 arm and 5 leg DOF are assumed";

const cyberone = robot({
    id: "xiaomi-cyberone",
    name: "CyberOne",
    brand: "Xiaomi",
    country: "CN",
    dof: 21,
    height_m: 1.77,
    weight_kg: 52,
    price_usd: null,
    price_max_usd: null,
    product_url: null,
    summary:
        "Xiaomi's 2022 research humanoid: 1.77 m, 52 kg and 21 DOF, driven by in-house actuators quoted at up to 300 N·m peak. Shown as a prototype; never sold.",
    sources: [...CYBERONE_SRC, "cyberone-primetel"],
    joints: [
        {
            at: ["hip-pitch"],
            type: "other",
            inferredFrom: `${CYBERONE_TYPE}; ${CYBERONE_LAYOUT}`,
            torque: 300,
            figure: "estimated",
            figureNote:
                "Xiaomi's quoted peak for its largest joint actuator; which joints use it is not published",
            src: [...CYBERONE_SRC, "cyberone-primetel"],
        },
        {
            at: ["knee"],
            type: "other",
            inferredFrom: `${CYBERONE_TYPE}; ${CYBERONE_LAYOUT}`,
            size: "l",
            sizeFrom: "52 kg robot, knee (class estimated; no torque published)",
            src: CYBERONE_SRC,
        },
        {
            at: ["hip-roll", "hip-yaw", "ankle-pitch"],
            type: "other",
            inferredFrom: `${CYBERONE_TYPE}; ${CYBERONE_LAYOUT}`,
            size: "m",
            sizeFrom: "52 kg robot, leg joint (class estimated)",
            src: CYBERONE_SRC,
        },
        {
            at: ["shoulder-pitch", "shoulder-roll", "shoulder-yaw", "elbow"],
            type: "other",
            inferredFrom: `${CYBERONE_TYPE}; ${CYBERONE_LAYOUT}`,
            size: "s",
            sizeFrom: "arm joint, 1.5 kg reported one-hand payload (class estimated)",
            src: CYBERONE_SRC,
        },
        {
            at: ["neck"],
            type: "other",
            inferredFrom: `${CYBERONE_TYPE}; ${CYBERONE_LAYOUT}`,
            size: "xs",
            sizeFrom: "head rotation (class estimated)",
            src: CYBERONE_SRC,
        },
        {
            at: ["hand"],
            type: "other",
            inferredFrom: `${CYBERONE_TYPE}; one gripper DOF per hand`,
            size: "xs",
            sizeFrom: "1-DOF gripper (class estimated)",
            src: CYBERONE_SRC,
        },
    ],
});

const KALEIDO_SRC = ["kaleido9-mynavi", "kaleido9-kalil"];
const KALEIDO_TYPE =
    "electric joints; Kawasaki has not published the motors, reducers or per-joint layout";

const kaleido = robot({
    id: "kawasaki-kaleido-9",
    name: "Kaleido 9",
    brand: "Kawasaki Heavy Industries",
    country: "JP",
    dof: 30,
    height_m: 1.9,
    weight_kg: 99,
    price_usd: null,
    price_max_usd: null,
    product_url: null,
    summary:
        "Ninth generation of Kawasaki's Robust Humanoid Platform, shown at iREX 2025: 1.9 m, 99 kg, 30 axes excluding the hands, aimed at disaster response and heavy industry. A research prototype with no sale date.",
    notCounted:
        "3 of the 30 published axes are not placed (Kawasaki gives no split), and the 30 exclude the hands.",
    sources: KALEIDO_SRC,
    joints: [
        {
            at: ["hip-pitch", "knee", "hip-roll"],
            type: "other",
            inferredFrom: KALEIDO_TYPE,
            size: "xl",
            sizeFrom: "99 kg robot, main leg joint (class estimated)",
            src: KALEIDO_SRC,
        },
        {
            at: ["hip-yaw", "ankle-pitch", "shoulder-pitch", "shoulder-roll", "waist"],
            type: "other",
            inferredFrom: KALEIDO_TYPE,
            size: "l",
            sizeFrom: "99 kg robot, proximal joint (class estimated)",
            src: KALEIDO_SRC,
        },
        {
            at: ["ankle-roll", "shoulder-yaw", "elbow"],
            type: "other",
            inferredFrom: KALEIDO_TYPE,
            size: "m",
            sizeFrom: "mid-limb joint (class estimated)",
            src: KALEIDO_SRC,
        },
        {
            at: ["wrist"],
            count: 2,
            type: "other",
            inferredFrom: KALEIDO_TYPE,
            size: "s",
            sizeFrom: "wrist joint (class estimated)",
            src: KALEIDO_SRC,
        },
        {
            at: ["neck"],
            count: 2,
            type: "other",
            inferredFrom: KALEIDO_TYPE,
            size: "s",
            sizeFrom: "head pan and tilt (class estimated)",
            src: KALEIDO_SRC,
        },
    ],
});

export const ASIA_FLEET: Humanoid[] = [cyberone, kaleido];
