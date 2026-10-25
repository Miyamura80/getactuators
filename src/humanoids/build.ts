import { ACTUATORS } from "../catalog";
import {
    type KnownRatio,
    LOAD_FORCE_N,
    LOAD_TORQUE_NM,
    jointMagnetG,
    knownRatio,
    loadClass,
    sizeMotor,
    sizeSpec,
} from "./magnet";
import type { Confidence, Sourced } from "./sourced";
import {
    type ActuatorType,
    CENTRAL,
    type CanonicalJoint,
    type CentralJoint,
    type Humanoid,
    type HumanoidJoint,
    type MotorSizing,
    type SidedJoint,
    type SizeClass,
} from "./types";

export const HUMANOIDS_AS_OF = "October 2026";

// One authoring row: an actuator design used at one or more canonical nodes,
// mirrored left and right unless `side` says otherwise.
export interface JointSpec {
    at: (SidedJoint | CentralJoint)[];
    side?: "l" | "r";
    // Actuators per node.
    count?: number;
    type: ActuatorType;
    // Omitted means the type is reported by the sources.
    inferredFrom?: string;
    motor?: string;
    reducer?: string;
    actuatorId?: string;
    torque?: number;
    force?: number;
    // Confidence and note for the torque or force figure.
    figure?: Confidence;
    figureNote?: string;
    // Published unit price (USD) and where it comes from.
    cost?: number;
    costSrc?: string[];
    costNote?: string;
    // Gear ratio (n:1) or screw lead (mm) when the sources give one beyond
    // the catalog record and reducer text, with its confidence and basis.
    ratio?: number;
    ratioFigure?: Confidence;
    ratioNote?: string;
    // Load class (from output torque or force) when neither is published,
    // and why.
    size?: SizeClass;
    sizeFrom?: string;
    src: string[];
}

export type RobotSpec = Omit<Humanoid, "joints"> & { joints: JointSpec[] };

function sourced(value: number, unit: string, s: JointSpec): Sourced<number> {
    return {
        value,
        unit,
        sources: s.src,
        asOf: HUMANOIDS_AS_OF,
        confidence: s.figure ?? "reported",
        ...(s.figureNote ? { note: s.figureNote } : {}),
    };
}

function loadOf(s: JointSpec): SizeClass {
    if (s.torque !== undefined) return loadClass("torque", s.torque);
    if (s.force !== undefined) return loadClass("force", s.force);
    if (s.size) return s.size;
    throw new Error(`joint ${s.at.join("+")} needs torque, force or size`);
}

const catalog = new Map(ACTUATORS.map((a) => [a.id, a]));
const isScrew = (s: JointSpec) =>
    s.type === "linear-roller-screw" || s.type === "linear-ball-screw";

// Output the motor is sized from: the figure, or the load class's nominal
// value. Screw types without a force figure size from force.
function outputOf(s: JointSpec, load: SizeClass): ["torque" | "force", number] {
    if (s.torque !== undefined) return ["torque", s.torque];
    if (s.force !== undefined) return ["force", s.force];
    return isScrew(s)
        ? ["force", LOAD_FORCE_N[load]]
        : ["torque", LOAD_TORQUE_NM[load]];
}

function explicitRatio(s: JointSpec): KnownRatio | undefined {
    if (s.ratio === undefined) return undefined;
    return {
        value: s.ratio,
        sources: s.src,
        confidence: s.ratioFigure ?? "reported",
        note: s.ratioNote ?? "Ratio from the joint's sources.",
    };
}

function nodes(s: JointSpec): CanonicalJoint[] {
    const sides = s.side ? [s.side] : (["l", "r"] as const);
    return s.at.flatMap((j): CanonicalJoint[] =>
        (CENTRAL as readonly string[]).includes(j)
            ? [j as CentralJoint]
            : sides.map((side) => `${side}-${j as SidedJoint}` as const),
    );
}

const MAGNET_SOURCES = [
    "fai-magnets",
    "frameless-ri60",
    "frameless-ri80",
    "frameless-ilm85",
];

function magnetNote(s: JointSpec, load: SizeClass, sizing: MotorSizing): string {
    const unitOf = sizing.basis === "torque" ? "N·m" : "N";
    const out = `${sizing.output.toLocaleString("en-US")} ${unitOf}`;
    const figure =
        s.torque !== undefined || s.force !== undefined
            ? out
            : `${sizeSpec(load).label} load class taken as ${out} (${s.sizeFrom ?? "estimated"})`;
    const r = sizing.gearRatio;
    const via = r.unit === "mm lead" ? `${r.value} mm lead` : `${r.value}:1`;
    const typical = r.confidence === "modeled" ? " (typical)" : "";
    return `${sizeSpec(sizing.sizeClass).label} motor: ${figure} through ${via}${typical} is ${sizing.motorTorqueNm.value} N·m at the motor, x${s.count ?? 1}.`;
}

function magnetOf(
    s: JointSpec,
    load: SizeClass,
    sizing: MotorSizing | null,
): Sourced<number> {
    const magnet = jointMagnetG(sizing, s.count ?? 1);
    return {
        value: magnet.value,
        unit: "g",
        sources: [...MAGNET_SOURCES, ...(sizing?.motorTorqueNm.sources ?? [])].filter(
            (id, i, all) => all.indexOf(id) === i,
        ),
        asOf: HUMANOIDS_AS_OF,
        confidence: "estimated",
        range: magnet.range,
        note: sizing
            ? magnetNote(s, load, sizing)
            : "Hydraulic: no magnet at the joint; the pump motor is not counted.",
    };
}

function sizingOf(s: JointSpec, load: SizeClass): MotorSizing | null {
    const [basis, output] = outputOf(s, load);
    const ratio = knownRatio(
        explicitRatio(s),
        s.actuatorId ? catalog.get(s.actuatorId) : undefined,
        s.reducer,
        s.src,
    );
    return sizeMotor(s.type, basis, output, ratio);
}

function expand(s: JointSpec): HumanoidJoint[] {
    const load = loadOf(s);
    const count = s.count ?? 1;
    const sizing = sizingOf(s, load);
    const sizeClass = sizing?.sizeClass ?? load;
    const magnetMassG = magnetOf(s, load, sizing);
    const shared: Omit<HumanoidJoint, "canonical"> = {
        count,
        actuatorType: s.type,
        typeConfidence: s.inferredFrom ? "estimated" : "reported",
        ...(s.inferredFrom ? { inferredFrom: s.inferredFrom } : {}),
        ...(s.actuatorId ? { actuatorId: s.actuatorId } : {}),
        ...(s.motor ? { motor: s.motor } : {}),
        ...(s.reducer ? { reducer: s.reducer } : {}),
        ...(s.torque !== undefined
            ? { peakTorqueNm: sourced(s.torque, "N·m", s) }
            : {}),
        ...(s.force !== undefined ? { peakForceN: sourced(s.force, "N", s) } : {}),
        sizeClass,
        loadClass: load,
        ...(sizing ? { motorSizing: sizing } : {}),
        ...unitCost(s),
        magnetMassG,
        sources: s.src,
    };
    return nodes(s).map((canonical) => ({ canonical, ...shared }));
}

function unitCost(s: JointSpec): Pick<HumanoidJoint, "unitCostUsd"> {
    if (s.cost === undefined) return {};
    return {
        unitCostUsd: {
            value: s.cost,
            unit: "USD",
            sources: s.costSrc ?? s.src,
            asOf: HUMANOIDS_AS_OF,
            confidence: "reported",
            ...(s.costNote ? { note: s.costNote } : {}),
        },
    };
}

export function robot(spec: RobotSpec): Humanoid {
    return { ...spec, joints: spec.joints.flatMap(expand) };
}
