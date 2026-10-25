import { robot } from "./build";
import type { Humanoid } from "./types";

// Humanoids with open hardware or published joint tables (K-Bot, Berkeley
// Humanoid Lite, Asimov 1), plus 1X NEO and Sanctuary Phoenix.

const NEO_SRC = ["neo-site", "neo-hands"];
const NEO_BODY =
    "1X describes NEO as tendon-driven throughout; per-joint motor sizes are not published";

const neo = robot({
    id: "1x-neo",
    robotId: "1x-neo",
    name: "NEO",
    brand: "1X Technologies",
    country: "US",
    dof: 75,
    height_m: 1.68,
    weight_kg: 30,
    price_usd: 20000,
    price_max_usd: null,
    product_url: "https://www.1x.tech/neo",
    summary:
        "Home humanoid where high-torque-density motors pull polymer tendons at about 5:1 to 15:1, so joints stay backdrivable. Hands: 22 actuated DOF plus a 3-DOF wrist.",
    notCounted: "75 DOF in total: axes beyond the canonical joint set are not counted.",
    sources: NEO_SRC,
    joints: [
        {
            at: ["hip-pitch", "knee", "hip-roll"],
            type: "tendon",
            inferredFrom: NEO_BODY,
            size: "m",
            sizeFrom: "30 kg robot, main leg joint (class estimated)",
            src: NEO_SRC,
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
            type: "tendon",
            inferredFrom: NEO_BODY,
            size: "s",
            sizeFrom: "30 kg robot (class estimated)",
            src: NEO_SRC,
        },
        {
            at: ["waist"],
            type: "tendon",
            inferredFrom: NEO_BODY,
            size: "m",
            sizeFrom: "waist (class estimated)",
            src: NEO_SRC,
        },
        {
            at: ["neck"],
            count: 2,
            type: "tendon",
            inferredFrom: NEO_BODY,
            size: "xs",
            sizeFrom: "neck (class estimated)",
            src: NEO_SRC,
        },
        {
            at: ["wrist"],
            count: 3,
            type: "tendon",
            torque: 17.75,
            figure: "estimated",
            figureNote:
                "17.75 N·m wrist peak from a secondary summary of the 2026 hand launch",
            src: ["neo-hands"],
        },
        {
            at: ["hand"],
            count: 22,
            type: "tendon",
            torque: 3.5,
            figure: "estimated",
            figureNote:
                "3.5 N·m thumb peak (secondary); one motor per actuated DOF assumed",
            src: ["neo-hands"],
        },
    ],
});

const PHOENIX_SRC = ["phoenix-gen7", "phoenix-hands"];

const phoenix = robot({
    id: "sanctuary-phoenix",
    name: "Phoenix Gen 7",
    brand: "Sanctuary AI",
    country: "CA",
    dof: null,
    height_m: 1.7,
    weight_kg: 70,
    price_usd: null,
    price_max_usd: null,
    product_url: "https://sanctuary.ai/",
    summary:
        "General-purpose humanoid built around 21-DOF hands driven by coin-sized hydraulic valves, which Sanctuary says give an order of magnitude more power density than cable or electromechanical hands.",
    notCounted: "Leg actuation not documented.",
    sources: [...PHOENIX_SRC, "phoenix-21dof", "phoenix-moov"],
    joints: [
        {
            at: ["hand"],
            count: 21,
            type: "hydraulic",
            size: "xs",
            sizeFrom: "21 DOF per hand, one actuator per DOF assumed",
            src: ["phoenix-hands", "phoenix-21dof"],
        },
        {
            at: ["shoulder-pitch", "shoulder-roll", "shoulder-yaw", "elbow", "waist"],
            type: "other",
            inferredFrom:
                "Sanctuary has not published how the arm and torso joints are driven",
            size: "m",
            sizeFrom: "70 kg robot, arm joint (class estimated)",
            src: PHOENIX_SRC,
        },
        {
            at: ["wrist"],
            count: 2,
            type: "other",
            inferredFrom: "Gen 7 widened wrist range of motion; drive not published",
            size: "s",
            sizeFrom: "wrist (class estimated)",
            src: PHOENIX_SRC,
        },
    ],
});

const KBOT_SRC = ["kbot-docs", "kbot-deepwiki"];

const kbot = robot({
    id: "kscale-kbot",
    name: "K-Bot",
    brand: "K-Scale Labs",
    country: "US",
    dof: 20,
    height_m: 1.4,
    weight_kg: 34,
    price_usd: null,
    price_max_usd: null,
    product_url: "https://www.kscale.dev/",
    summary:
        "Open-source 20-DOF humanoid built entirely from four RobStride QDD sizes (6:1 to 10:1 planetary).",
    sources: KBOT_SRC,
    joints: [
        {
            at: ["hip-pitch", "knee"],
            type: "qdd",
            actuatorId: "robstride-04",
            motor: "RobStride 04",
            reducer: "9:1 planetary",
            torque: 120,
            src: KBOT_SRC,
        },
        {
            at: ["shoulder-pitch", "shoulder-roll", "hip-roll", "hip-yaw"],
            type: "qdd",
            actuatorId: "robstride-03",
            motor: "RobStride 03",
            reducer: "9:1 planetary",
            torque: 60,
            src: KBOT_SRC,
        },
        {
            at: ["shoulder-yaw", "elbow", "ankle-pitch"],
            type: "qdd",
            actuatorId: "robstride-02",
            motor: "RobStride 02",
            reducer: "7.75:1 planetary",
            torque: 17,
            src: KBOT_SRC,
        },
        {
            at: ["wrist"],
            type: "qdd",
            actuatorId: "robstride-00",
            motor: "RobStride 00",
            reducer: "10:1 planetary",
            torque: 14,
            src: KBOT_SRC,
        },
    ],
});

const BHL_SRC = ["bhl-urdf", "bhl-paper", "bhl-orobot"];

const bhl = robot({
    id: "berkeley-humanoid-lite",
    name: "Berkeley Humanoid Lite",
    brand: "UC Berkeley Hybrid Robotics",
    country: "US",
    dof: 22,
    height_m: 1,
    weight_kg: 16,
    price_usd: null,
    price_max_usd: null,
    product_url: "https://lite.berkeley-humanoid.org/",
    summary:
        "Open-source, sub-$5,000 research humanoid. Every joint is a drone-class BLDC behind a 3D-printed cycloidal gearbox, in two sizes.",
    sources: [...BHL_SRC, "bhl-commonality"],
    joints: [
        {
            at: [
                "hip-yaw",
                "hip-roll",
                "hip-pitch",
                "knee",
                "ankle-pitch",
                "ankle-roll",
            ],
            type: "cycloidal",
            motor: "6512 BLDC",
            reducer: "3D-printed cycloidal",
            torque: 20,
            figureNote: "URDF effort limit",
            src: BHL_SRC,
        },
        {
            at: ["shoulder-pitch", "shoulder-roll", "shoulder-yaw", "elbow", "wrist"],
            type: "cycloidal",
            motor: "5010 BLDC",
            reducer: "3D-printed cycloidal, 15:1",
            torque: 20,
            figureNote:
                "URDF effort limit; Humanoid.guide gives about 12 N·m for the 5010 unit",
            src: [...BHL_SRC, "bhl-commonality"],
        },
    ],
});

const ASIMOV_SRC = ["asimov-joints", "asimov-mech"];
const ASIMOV_P =
    "part code P2-25 / P2-36 read as a two-stage planetary at that ratio; Menlo does not spell it out";
const ASIMOV_H =
    "part code H17 / H14 read as a strain-wave reducer of that size; Menlo does not spell it out";

const asimov = robot({
    id: "menlo-asimov-1",
    robotId: "menlo-asimov-1",
    name: "Asimov 1",
    brand: "Menlo Research",
    country: "SG",
    dof: 25,
    height_m: 1.2,
    weight_kg: 35,
    price_usd: 15000,
    price_max_usd: 20000,
    product_url: "https://menlo.ai/asimov-1",
    summary:
        "Open-source DIY-kit biped: 23 actuated joints from five EC-A actuator sizes plus 2 passive toes, with a parallel RSU ankle.",
    sources: ASIMOV_SRC,
    joints: [
        {
            at: ["hip-pitch"],
            type: "planetary",
            inferredFrom: ASIMOV_P,
            motor: "EC-A6416-P2-25",
            torque: 120,
            src: ASIMOV_SRC,
        },
        {
            at: ["waist"],
            type: "planetary",
            inferredFrom: ASIMOV_P,
            motor: "EC-A6416-P2-25",
            torque: 120,
            src: ASIMOV_SRC,
        },
        {
            at: ["hip-roll", "shoulder-pitch"],
            type: "harmonic",
            inferredFrom: ASIMOV_H,
            motor: "EC-A5013-H17-100",
            torque: 90,
            src: ASIMOV_SRC,
        },
        {
            at: ["hip-yaw", "shoulder-yaw"],
            type: "harmonic",
            inferredFrom: ASIMOV_H,
            motor: "EC-A3814-H14-107",
            torque: 60,
            src: ASIMOV_SRC,
        },
        {
            at: ["knee", "shoulder-roll"],
            type: "planetary",
            inferredFrom: ASIMOV_P,
            motor: "EC-A4315-P2-36",
            torque: 75,
            src: ASIMOV_SRC,
        },
        {
            at: ["ankle-pitch", "ankle-roll", "elbow", "wrist"],
            type: "planetary",
            inferredFrom: ASIMOV_P,
            motor: "EC-A4310-P2-36",
            torque: 36,
            src: ASIMOV_SRC,
        },
        {
            at: ["neck"],
            count: 2,
            type: "planetary",
            inferredFrom: ASIMOV_P,
            motor: "EC-A4310-P2-36",
            torque: 36,
            src: ASIMOV_SRC,
        },
    ],
});

export const OPEN_FLEET: Humanoid[] = [neo, phoenix, kbot, bhl, asimov];
