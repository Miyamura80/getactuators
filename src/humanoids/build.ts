import {
    jointMagnetG,
    sizeClassForForce,
    sizeClassForTorque,
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
    // Size class when neither torque nor force is published, and why.
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

function classOf(s: JointSpec): SizeClass {
    if (s.torque !== undefined) return sizeClassForTorque(s.torque);
    if (s.force !== undefined) return sizeClassForForce(s.force);
    if (s.size) return s.size;
    throw new Error(`joint ${s.at.join("+")} needs torque, force or size`);
}

function nodes(s: JointSpec): CanonicalJoint[] {
    const sides = s.side ? [s.side] : (["l", "r"] as const);
    return s.at.flatMap((j): CanonicalJoint[] =>
        (CENTRAL as readonly string[]).includes(j)
            ? [j as CentralJoint]
            : sides.map((side) => `${side}-${j as SidedJoint}` as const),
    );
}

function expand(s: JointSpec): HumanoidJoint[] {
    const sizeClass = classOf(s);
    const count = s.count ?? 1;
    const magnet = jointMagnetG(sizeClass, count, s.type);
    const basis =
        s.torque !== undefined
            ? `peak torque ${s.torque} N·m`
            : s.force !== undefined
              ? `peak force ${s.force} N`
              : (s.sizeFrom ?? "size class");
    const magnetMassG: Sourced<number> = {
        value: magnet.value,
        unit: "g",
        sources: ["fai-magnets", "frameless-ilm85", "frameless-ri80"],
        asOf: HUMANOIDS_AS_OF,
        confidence: "estimated",
        range: magnet.range,
        note:
            s.type === "hydraulic"
                ? "Hydraulic: no magnet at the joint; the pump motor is not counted."
                : `${sizeSpec(sizeClass).label} motor class from ${basis}, x${count}.`,
    };
    return nodes(s).map((canonical) => ({
        canonical,
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
        ...unitCost(s),
        magnetMassG,
        sources: s.src,
    }));
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
