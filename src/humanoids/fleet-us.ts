import { robot } from "./build";
import type { Humanoid } from "./types";

// US humanoids. Most of these makers publish no joint-level data, so their
// rows lean on estimated types and size classes; each says what it rests on.

const OPTIMUS_SRC = ["optimus-humanoid-guide", "optimus-firgelli", "optimus-optimusk"];
const OPTIMUS_ROTARY =
    "14 rotary units at shoulders, wrists, hips and waist with strain-wave reducers, per secondary accounts of AI Day 2022; Tesla has not published the per-joint layout";
const OPTIMUS_LINEAR =
    "14 inverted planetary roller screws: 2 in the elbows, 4 in the wrists, 8 in the legs, per secondary accounts; per-joint force class not published";
const optimusClass = (n: string) =>
    `Tesla's ${n} class from AI Day 2022; which class sits at this joint is not published`;

const optimus = robot({
    id: "tesla-optimus",
    name: "Optimus Gen 2",
    brand: "Tesla",
    country: "US",
    dof: 52,
    height_m: 1.73,
    weight_kg: 57,
    price_usd: null,
    price_max_usd: null,
    product_url: "https://www.tesla.com/AI",
    summary:
        "28 structural actuators built from six designs: rotary at 20, 110 and 180 N·m, roller-screw linear at 500, 3,900 and 8,000 N. DOF counts the 28, a 2-DOF neck and two 11-DOF hands.",
    sources: [...OPTIMUS_SRC, "optimus-gen2", "optimus-hand"],
    joints: [
        {
            at: ["shoulder-pitch", "shoulder-roll"],
            type: "harmonic",
            inferredFrom: OPTIMUS_ROTARY,
            torque: 110,
            figure: "estimated",
            figureNote: optimusClass("110 N·m"),
            src: OPTIMUS_SRC,
        },
        {
            at: ["shoulder-yaw", "wrist"],
            type: "harmonic",
            inferredFrom: OPTIMUS_ROTARY,
            torque: 20,
            figure: "estimated",
            figureNote: optimusClass("20 N·m"),
            src: OPTIMUS_SRC,
        },
        {
            at: ["hip-yaw", "hip-roll"],
            type: "harmonic",
            inferredFrom: OPTIMUS_ROTARY,
            torque: 180,
            figure: "estimated",
            figureNote: optimusClass("180 N·m"),
            src: OPTIMUS_SRC,
        },
        {
            at: ["waist"],
            count: 2,
            type: "harmonic",
            inferredFrom: OPTIMUS_ROTARY,
            torque: 180,
            figure: "estimated",
            figureNote: optimusClass("180 N·m"),
            src: OPTIMUS_SRC,
        },
        {
            at: ["elbow", "ankle-pitch", "ankle-roll"],
            type: "linear-roller-screw",
            inferredFrom: OPTIMUS_LINEAR,
            force: 3900,
            figure: "estimated",
            figureNote: optimusClass("3,900 N"),
            src: OPTIMUS_SRC,
        },
        {
            at: ["wrist"],
            count: 2,
            type: "linear-roller-screw",
            inferredFrom: OPTIMUS_LINEAR,
            force: 500,
            figure: "estimated",
            figureNote: optimusClass("500 N"),
            src: OPTIMUS_SRC,
        },
        {
            at: ["hip-pitch", "knee"],
            type: "linear-roller-screw",
            inferredFrom: OPTIMUS_LINEAR,
            force: 8000,
            figure: "estimated",
            figureNote: optimusClass("8,000 N"),
            src: OPTIMUS_SRC,
        },
        {
            at: ["neck"],
            count: 2,
            type: "other",
            inferredFrom: "Gen 2 added a 2-DOF neck; its actuator is not published",
            size: "xs",
            sizeFrom: "neck joint",
            src: ["optimus-gen2"],
        },
        {
            at: ["hand"],
            count: 6,
            type: "tendon",
            inferredFrom:
                "forearm motors pulling tendons, per Humanoid Atlas and Gen 3 hand coverage",
            size: "xs",
            sizeFrom: "6 active of 11 DOF per Gen 2 hand",
            src: ["optimus-hand", "humanoid-atlas"],
        },
    ],
});

const FIGURE_SRC = ["figure02-ie", "figure02-qviro"];
const FIGURE_TYPE =
    "Figure has not published its actuators; joint layout read from the launch video";

const figure = robot({
    id: "figure-02",
    name: "Figure 02",
    brand: "Figure AI",
    country: "US",
    dof: null,
    height_m: 1.68,
    weight_kg: 70,
    price_usd: null,
    price_max_usd: null,
    product_url: "https://www.figure.ai/",
    summary:
        "70 kg general-purpose humanoid with in-house electric actuators. The launch teaser showed joints up to 150 N·m and 16-DOF hands.",
    notCounted: "16-DOF hands: actuator count not published.",
    sources: FIGURE_SRC,
    joints: [
        {
            at: ["hip-pitch", "knee"],
            type: "other",
            inferredFrom: FIGURE_TYPE,
            torque: 150,
            figure: "estimated",
            figureNote:
                "150 N·m peak shown in the Figure 02 teaser; the joint is not named",
            src: FIGURE_SRC,
        },
        {
            at: ["hip-yaw", "hip-roll", "waist", "shoulder-pitch", "shoulder-roll"],
            type: "other",
            inferredFrom: FIGURE_TYPE,
            size: "l",
            sizeFrom: "70 kg robot, proximal joint (class estimated)",
            src: FIGURE_SRC,
        },
        {
            at: ["shoulder-yaw", "elbow", "ankle-pitch", "ankle-roll"],
            type: "other",
            inferredFrom: FIGURE_TYPE,
            size: "m",
            sizeFrom: "70 kg robot, mid-limb joint (class estimated)",
            src: FIGURE_SRC,
        },
        {
            at: ["wrist"],
            count: 2,
            type: "other",
            inferredFrom: FIGURE_TYPE,
            size: "s",
            sizeFrom: "wrist joint (class estimated)",
            src: FIGURE_SRC,
        },
    ],
});

const ATLAS_SRC = ["atlas-tc", "atlas-posco"];
const ATLAS_TYPE =
    "custom high-power rotary actuators at most joints; reducer types not published";

const atlas = robot({
    id: "boston-dynamics-atlas",
    name: "Atlas (electric)",
    brand: "Boston Dynamics",
    country: "US",
    dof: 56,
    height_m: 1.9,
    weight_kg: 90,
    price_usd: null,
    price_max_usd: null,
    product_url: "https://bostondynamics.com/atlas/",
    summary:
        "All-electric successor to hydraulic Atlas: 56 DOF, mostly fully rotational joints, 50 kg rated payload. Actuators co-developed with Hyundai Mobis.",
    notCounted: "Hands and extra rotation axes in the 56 DOF: actuators not published.",
    sources: ATLAS_SRC,
    joints: [
        {
            at: ["hip-pitch", "knee", "hip-roll"],
            type: "other",
            inferredFrom: ATLAS_TYPE,
            size: "xl",
            sizeFrom: "90 kg robot, main leg joint (class estimated)",
            src: ATLAS_SRC,
        },
        {
            at: ["hip-yaw", "waist", "shoulder-pitch", "shoulder-roll", "ankle-pitch"],
            type: "other",
            inferredFrom: ATLAS_TYPE,
            size: "l",
            sizeFrom: "90 kg robot, proximal joint (class estimated)",
            src: ATLAS_SRC,
        },
        {
            at: ["shoulder-yaw", "elbow", "ankle-roll"],
            type: "other",
            inferredFrom: ATLAS_TYPE,
            size: "m",
            sizeFrom: "mid-limb joint (class estimated)",
            src: ATLAS_SRC,
        },
        {
            at: ["wrist"],
            count: 2,
            type: "other",
            inferredFrom: ATLAS_TYPE,
            size: "s",
            sizeFrom: "wrist joint (class estimated)",
            src: ATLAS_SRC,
        },
        {
            at: ["neck"],
            type: "other",
            inferredFrom: ATLAS_TYPE,
            size: "s",
            sizeFrom: "head rotation (class estimated)",
            src: ATLAS_SRC,
        },
    ],
});

const DIGIT_SRC = ["digit-blog", "digit-sysid"];
const DIGIT_TYPE =
    "custom BLDC actuators with custom transmissions; reducer type not published";

const digit = robot({
    id: "agility-digit",
    name: "Digit",
    brand: "Agility Robotics",
    country: "US",
    dof: 20,
    height_m: 1.75,
    weight_kg: 65,
    price_usd: null,
    price_max_usd: null,
    product_url: "https://agilityrobotics.com/",
    summary:
        "Logistics biped with 20 actuators: 4 per arm, 6 per leg, four of them a larger design. Legs add 8 passive joints each (springs and linkages), so DOF counts actuated joints only.",
    sources: [...DIGIT_SRC, "digit-metavert"],
    joints: [
        {
            at: ["hip-pitch", "knee"],
            type: "other",
            inferredFrom: `${DIGIT_TYPE}; the four larger units are assumed at hip pitch and knee`,
            size: "l",
            sizeFrom: "one of the four larger actuators",
            src: DIGIT_SRC,
        },
        {
            at: [
                "hip-yaw",
                "hip-roll",
                "shoulder-pitch",
                "shoulder-roll",
                "shoulder-yaw",
                "elbow",
            ],
            type: "other",
            inferredFrom: DIGIT_TYPE,
            size: "m",
            sizeFrom: "standard Digit actuator (class estimated)",
            src: DIGIT_SRC,
        },
        {
            at: ["ankle-pitch", "ankle-roll"],
            type: "other",
            inferredFrom: `${DIGIT_TYPE}; toe A and toe B motors drive the foot`,
            size: "m",
            sizeFrom: "standard Digit actuator (class estimated)",
            src: DIGIT_SRC,
        },
    ],
});

const APOLLO_SRC = ["apollo-trr", "apollo-ieee"];
const APOLLO_ROTARY = "custom Apptronik rotary actuators; reducer types not published";

const apollo = robot({
    id: "apptronik-apollo",
    name: "Apollo",
    brand: "Apptronik",
    country: "US",
    dof: null,
    height_m: 1.73,
    weight_kg: 73,
    price_usd: null,
    price_max_usd: null,
    product_url: "https://apptronik.com/apollo",
    summary:
        "Mixes Apptronik's own linear actuators (elbows, knees) with custom rotary joints; no off-the-shelf rotary actuators. Lifts 25 kg.",
    notCounted: "Hands: actuator count not published.",
    sources: [...APOLLO_SRC, "apollo-patent", "apollo-engadget"],
    joints: [
        {
            at: ["knee"],
            type: "linear-ball-screw",
            inferredFrom:
                "linear actuator at the knee is reported; ball screw per Apptronik's humanoid linear actuator patent",
            size: "l",
            sizeFrom: "73 kg robot, knee (class estimated)",
            src: [...APOLLO_SRC, "apollo-patent"],
        },
        {
            at: ["elbow"],
            type: "linear-ball-screw",
            inferredFrom:
                "linear actuator at the elbow is reported; ball screw per Apptronik's humanoid linear actuator patent",
            size: "m",
            sizeFrom: "elbow (class estimated)",
            src: [...APOLLO_SRC, "apollo-patent"],
        },
        {
            at: [
                "hip-pitch",
                "hip-roll",
                "hip-yaw",
                "waist",
                "shoulder-pitch",
                "shoulder-roll",
            ],
            type: "other",
            inferredFrom: APOLLO_ROTARY,
            size: "l",
            sizeFrom: "73 kg robot, proximal joint (class estimated)",
            src: APOLLO_SRC,
        },
        {
            at: ["shoulder-yaw", "ankle-pitch", "ankle-roll"],
            type: "other",
            inferredFrom: APOLLO_ROTARY,
            size: "m",
            sizeFrom: "mid-limb joint (class estimated)",
            src: APOLLO_SRC,
        },
        {
            at: ["wrist"],
            count: 2,
            type: "other",
            inferredFrom: APOLLO_ROTARY,
            size: "s",
            sizeFrom: "wrist (class estimated)",
            src: APOLLO_SRC,
        },
    ],
});

export const US_FLEET: Humanoid[] = [optimus, figure, atlas, digit, apollo];
