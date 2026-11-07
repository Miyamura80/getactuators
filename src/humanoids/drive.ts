import type { ActuatorType } from "./types";

// Reducer between the motor and the joint, per actuator design. The magnet
// sits in the motor, so the motor is sized from the torque it must make:
//   rotary: motor torque = output torque / (ratio x efficiency)
//   screw:  motor torque = force x lead / (2 pi x efficiency)
// `ratio` is n:1 for rotary designs and the screw lead in mm for screws.
// A joint with a published ratio (catalog record, reducer or part code) uses
// it; otherwise its design's typical band applies, marked modeled.

export interface DriveSpec {
    kind: "rotary" | "screw";
    label: string;
    ratio: number;
    ratioRange: readonly [number, number];
    efficiency: number;
    efficiencyRange: readonly [number, number];
    // Source ids for the ratio band and for the efficiency band.
    ratioSources: string[];
    efficiencySources: string[];
    note: string;
}

const PLANETARY: DriveSpec = {
    kind: "rotary",
    label: "multi-stage planetary",
    ratio: 22,
    ratioRange: [14, 36],
    efficiency: 0.9,
    efficiencyRange: [0.85, 0.94],
    ratioSources: ["g1-actuators", "asimov-joints", "catalog-ratios"],
    efficiencySources: ["eff-planetary-pelonis", "eff-reducers-guide"],
    note: "multi-stage planetary, 14 to 36:1 (Unitree G1 14.3 to 22.5:1, Asimov 25 and 36:1, catalog 20 to 36:1)",
};

export const TYPICAL_DRIVE: Record<Exclude<ActuatorType, "hydraulic">, DriveSpec> = {
    qdd: {
        kind: "rotary",
        label: "single-stage planetary (QDD)",
        ratio: 9,
        ratioRange: [6, 10],
        efficiency: 0.95,
        efficiencyRange: [0.9, 0.97],
        ratioSources: ["ratio-qdd-arxiv", "ratio-qdd-guide", "catalog-ratios"],
        efficiencySources: ["eff-planetary-pelonis", "eff-reducers-guide"],
        note: "single-stage planetary QDD, 6 to 10:1",
    },
    planetary: PLANETARY,
    harmonic: {
        kind: "rotary",
        label: "strain-wave reducer",
        ratio: 80,
        ratioRange: [50, 100],
        efficiency: 0.8,
        efficiencyRange: [0.7, 0.9],
        ratioSources: ["catalog-harmonic", "eff-harmonic-cone"],
        efficiencySources: [
            "eff-reducers-guide",
            "eff-harmonic-calc",
            "eff-harmonic-cone",
        ],
        note: "strain-wave, 50 to 100:1",
    },
    cycloidal: {
        kind: "rotary",
        label: "cycloidal reducer",
        ratio: 50,
        ratioRange: [30, 80],
        efficiency: 0.87,
        efficiencyRange: [0.8, 0.93],
        ratioSources: ["eff-reducers-guide"],
        efficiencySources: ["eff-reducers-guide"],
        note: "single-stage cycloidal, 30 to 80:1",
    },
    tendon: {
        ...PLANETARY,
        label: "geared tendon drive",
        efficiency: 0.82,
        efficiencyRange: [0.75, 0.9],
        note: "geared motor pulling a cable; reducer assumed planetary, 14 to 36:1, cable losses on top",
    },
    other: {
        kind: "rotary",
        label: "reducer of undisclosed type",
        ratio: 25,
        ratioRange: [14, 80],
        efficiency: 0.85,
        efficiencyRange: [0.75, 0.94],
        ratioSources: ["ratio-qdd-arxiv", "g1-actuators", "catalog-harmonic"],
        efficiencySources: ["eff-reducers-guide"],
        note: "undisclosed reducer, spans QDD to strain-wave (9 to 100:1)",
    },
    "linear-roller-screw": {
        kind: "screw",
        label: "planetary roller screw",
        ratio: 3,
        ratioRange: [2, 5],
        efficiency: 0.85,
        efficiencyRange: [0.8, 0.9],
        ratioSources: ["lead-roller-guide"],
        efficiencySources: ["optimus-firgelli", "screw-torque-formula"],
        note: "planetary roller screw driven directly, 2 to 5 mm lead",
    },
    "linear-ball-screw": {
        kind: "screw",
        label: "ball screw",
        ratio: 5,
        ratioRange: [4, 10],
        efficiency: 0.9,
        efficiencyRange: [0.85, 0.95],
        ratioSources: ["screw-ball-sizing"],
        efficiencySources: ["screw-ball-sizing", "screw-torque-formula"],
        note: "ball screw driven directly, 4 to 10 mm lead",
    },
};

// A force joint of undisclosed design (e.g. a small linear module) is taken
// as a ball-screw unit.
export function driveFor(type: ActuatorType, linear: boolean): DriveSpec | null {
    if (type === "hydraulic") return null;
    if (linear && TYPICAL_DRIVE[type].kind !== "screw")
        return TYPICAL_DRIVE["linear-ball-screw"];
    return TYPICAL_DRIVE[type];
}

// Motor-side torque, N·m, for an output torque (N·m) or force (N).
export function motorTorque(
    kind: DriveSpec["kind"],
    output: number,
    ratio: number,
    efficiency: number,
): number {
    if (kind === "screw") return (output * ratio) / 1000 / (2 * Math.PI * efficiency);
    return output / (ratio * efficiency);
}

// "9:1", "7.75:1", "51:1-101:1", "3D-printed cycloidal, 15:1": the first
// n:1 figure, or null.
export function parseRatio(text: string | null | undefined): number | null {
    const m = text ? /(\d+(?:\.\d+)?)\s*:\s*1\b/.exec(text) : null;
    if (!m) return null;
    const n = Number(m[1]);
    return n > 1 ? n : null;
}
