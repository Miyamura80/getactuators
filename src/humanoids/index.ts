// Joint-by-joint actuator map of notable humanoids, shared by the /humanoids
// page, its markdown twin, the REST API and the MCP tool. Relative imports
// only: the browser bundle reuses this module.

import { HUMANOIDS_AS_OF } from "./build";
import { CHINA_FLEET } from "./fleet-china";
import { OPEN_FLEET } from "./fleet-open";
import { URDF_FLEET } from "./fleet-urdf";
import { US_FLEET } from "./fleet-us";
import { REE_FRACTION, reeSplit } from "./magnet";
import type { Sourced } from "./sourced";
import {
    ACTUATOR_TYPES,
    type ActuatorType,
    type CanonicalJoint,
    type Humanoid,
    type HumanoidJoint,
    type HumanoidTotals,
    type Ree,
} from "./types";

export { HUMANOIDS_AS_OF } from "./build";
export * from "./types";
export type { Confidence, Sourced } from "./sourced";
export { TYPICAL_DRIVE, type DriveSpec } from "./drive";
export {
    SIZE_CLASSES,
    magnetRangeG,
    REE_FRACTION,
    NDFEB_DENSITY_G_CM3,
    ARC_FILL,
} from "./magnet";
export { SOURCES, sourceOf, type Source } from "./sources";
export { REE_METAL_PRICE } from "./ree-prices";
export {
    REE_ELEMENTS,
    metalValue,
    reeByDesign,
    spanTotal,
    type DesignRee,
    type Span,
} from "./ree-design";
export {
    BOM_UNIT,
    COST_FIT,
    MASS_FIT,
    bomPriceShare,
    humanoidBom,
    type Bom,
    type BomMetric,
    type BomCategory,
    type BomSlice,
} from "./bom";

export const HUMANOIDS_PATH = "/humanoids";

export const HUMANOIDS: readonly Humanoid[] = [
    ...US_FLEET,
    ...OPEN_FLEET.slice(0, 2),
    ...URDF_FLEET,
    ...CHINA_FLEET,
    ...OPEN_FLEET.slice(2),
];

export function getHumanoid(id: string): Humanoid | undefined {
    return HUMANOIDS.find((h) => h.id === id);
}

const SIDE_LABEL = { l: "Left", r: "Right" } as const;

// "l-shoulder-pitch" -> "Left shoulder pitch".
export function jointLabel(c: CanonicalJoint): string {
    const m = /^([lr])-(.+)$/.exec(c);
    if (!m) return c.charAt(0).toUpperCase() + c.slice(1);
    return `${SIDE_LABEL[m[1] as "l" | "r"]} ${m[2]?.replace("-", " ")}`;
}

// Joints at one canonical node (a node can mix designs, e.g. Optimus wrists).
export function jointsAt(h: Humanoid, c: CanonicalJoint): HumanoidJoint[] {
    return h.joints.filter((j) => j.canonical === c);
}

// The type that drives most actuators at a node, for its color.
export function dominantType(joints: readonly HumanoidJoint[]): ActuatorType | null {
    let best: HumanoidJoint | null = null;
    for (const j of joints) if (!best || j.count > best.count) best = j;
    return best?.actuatorType ?? null;
}

const kg = (g: number) => Math.round(g) / 1000;
const r3 = (x: number) => Math.round(x * 1000) / 1000;
const pct = (x: number) => Number((x * 100).toFixed(2));

function estimate(
    value: number,
    range: readonly [number, number],
    note: string,
): Sourced<number> {
    return {
        value: r3(value),
        unit: "kg",
        sources: ["fai-magnets", "jda-ndfeb", "crystals-gbd"],
        asOf: HUMANOIDS_AS_OF,
        confidence: "estimated",
        range: [r3(range[0]), r3(range[1])],
        note,
    };
}

export function humanoidTotals(h: Humanoid): HumanoidTotals {
    const byType: Partial<Record<ActuatorType, number>> = {};
    let actuators = 0;
    let reported = 0;
    let lo = 0;
    let hi = 0;
    let mid = 0;
    for (const j of h.joints) {
        byType[j.actuatorType] = (byType[j.actuatorType] ?? 0) + j.count;
        actuators += j.count;
        if (j.typeConfidence === "reported") reported += j.count;
        lo += j.magnetMassG.range?.[0] ?? j.magnetMassG.value;
        hi += j.magnetMassG.range?.[1] ?? j.magnetMassG.value;
        mid += j.magnetMassG.value;
    }
    const magnetRange: [number, number] = [kg(lo), kg(hi)];
    const split = reeSplit(magnetRange);
    const ree = Object.fromEntries(
        (Object.keys(split) as (keyof Ree<unknown>)[]).map((el) => {
            const [a, b] = split[el];
            const f = REE_FRACTION[el];
            return [
                el,
                estimate(
                    (kg(mid) * (f[0] + f[1])) / 2,
                    [a, b],
                    `${pct(f[0])} to ${pct(f[1])}% of magnet mass`,
                ),
            ];
        }),
    ) as unknown as Ree<Sourced<number>>;
    return {
        actuators,
        actuatorCountByType: Object.fromEntries(
            ACTUATOR_TYPES.filter((t) => byType[t]).map((t) => [t, byType[t]]),
        ),
        magnetMassKg: estimate(
            kg(mid),
            magnetRange,
            "Sum of per-joint magnet estimates; see the method.",
        ),
        reeKg: ree,
        reportedShare: actuators ? reported / actuators : 0,
    };
}

export type DataGrade = "reported" | "mixed" | "estimated";

// Share of joint fields (actuator type, and peak torque or force) taken from
// maker data rather than estimated, 0 to 1, with a three-step grade.
export function dataConfidence(h: Humanoid): { share: number; grade: DataGrade } {
    let reported = 0;
    for (const j of h.joints) {
        if (j.typeConfidence === "reported") reported++;
        if ((j.peakTorqueNm ?? j.peakForceN)?.confidence === "reported") reported++;
    }
    const share = h.joints.length ? reported / (2 * h.joints.length) : 0;
    const grade = share >= 0.75 ? "reported" : share >= 0.25 ? "mixed" : "estimated";
    return { share, grade };
}

// Total rare-earth (Nd + Pr + Dy + Tb) for a totals record, kg.
export function reeTotalKg(t: HumanoidTotals): {
    value: number;
    range: [number, number];
} {
    const els = [t.reeKg.nd, t.reeKg.pr, t.reeKg.dy, t.reeKg.tb];
    const sum = (f: (s: Sourced<number>) => number) =>
        r3(els.reduce((n, s) => n + f(s), 0));
    return {
        value: sum((s) => s.value),
        range: [
            sum((s) => s.range?.[0] ?? s.value),
            sum((s) => s.range?.[1] ?? s.value),
        ],
    };
}
