import { type DriveSpec, driveFor, motorTorque, parseRatio } from "./drive";
import type { Confidence, Sourced } from "./sourced";
import type { ActuatorType, MotorSizing, Ree, SizeClass } from "./types";

// Magnet mass estimate, per actuator:
//   1. Motor-side torque: the joint's peak output torque over gear ratio x
//      reducer efficiency, or for a screw its force x lead / (2 pi x
//      efficiency) (see ./drive). The magnet sits in the motor, before the
//      reducer, so a 150 N·m joint behind a 50:1 harmonic needs a ~4 N·m motor.
//   2. Pick a motor size class from that torque. A class stands for a
//      frameless motor of that size.
//   3. Magnet volume = pi x airgap diameter x active length x magnet thickness
//      x arc fill (the share of the rotor circumference covered by magnets).
//   4. Mass = volume x sintered NdFeB density.
// Ratio, efficiency, thickness and arc fill are ranges, so every result is a
// range. Hydraulic joints carry no magnet at the joint (the pump motor is not
// counted).
//
// Rare-earth split by weight of the magnet, from grade compositions:
//   PrNd 29 to 32% (Pr about 20 to 25% of that), Dy 0.35 to 3%, Tb 0 to 1%.

export const NDFEB_DENSITY_G_CM3 = 7.5;
export const ARC_FILL: readonly [number, number] = [0.7, 0.9];

export interface SizeClassSpec {
    id: SizeClass;
    label: string;
    // Upper bound of the class (inclusive): peak torque at the motor, N·m.
    maxMotorTorqueNm: number;
    airgapDiameterMm: number;
    activeLengthMm: number;
    magnetThicknessMm: readonly [number, number];
    // Frameless motors of comparable size, with their published peak torque.
    comparable: string;
}

// Class bounds sit just above the peak torque of the reference motors in the
// catalog (sources frameless-*), so a motor lands in the class of the
// frameless kit that could drive it.
export const SIZE_CLASSES: readonly SizeClassSpec[] = [
    {
        id: "xs",
        label: "XS",
        maxMotorTorqueNm: 0.5,
        airgapDiameterMm: 22,
        activeLengthMm: 10,
        magnetThicknessMm: [1.5, 2.5],
        comparable: "finger and gimbal micro motors (28 mm class)",
    },
    {
        id: "s",
        label: "S",
        maxMotorTorqueNm: 2,
        airgapDiameterMm: 40,
        activeLengthMm: 12,
        magnetThicknessMm: [2, 3],
        comparable: "60 mm frameless (CubeMars RI60, 1.63 N·m peak)",
    },
    {
        id: "m",
        label: "M",
        maxMotorTorqueNm: 8,
        airgapDiameterMm: 60,
        activeLengthMm: 16,
        magnetThicknessMm: [2.5, 3.5],
        comparable:
            "75 to 85 mm frameless (CubeMars RI80 4.1 N·m peak; Unitree N7520 ~6.9 N·m)",
    },
    {
        id: "l",
        label: "L",
        maxMotorTorqueNm: 12,
        airgapDiameterMm: 80,
        activeLengthMm: 20,
        magnetThicknessMm: [3, 4],
        comparable:
            "85 to 90 mm frameless (TQ ILM85x26 9.37, maxon EC 90 flat 9.76 N·m peak)",
    },
    {
        id: "xl",
        label: "XL",
        maxMotorTorqueNm: Number.POSITIVE_INFINITY,
        airgapDiameterMm: 100,
        activeLengthMm: 25,
        magnetThicknessMm: [3.5, 4.5],
        comparable: "115 mm frameless (ILM115 class, RobStride 04 motor at ~14 N·m)",
    },
];

const byId = new Map(SIZE_CLASSES.map((c) => [c.id, c]));

export function sizeSpec(id: SizeClass): SizeClassSpec {
    const spec = byId.get(id);
    if (!spec) throw new Error(`unknown size class ${id}`);
    return spec;
}

export function sizeClassForMotorTorque(nm: number): SizeClass {
    return (SIZE_CLASSES.find((c) => nm <= c.maxMotorTorqueNm) ?? SIZE_CLASSES[4])!.id;
}

// Joint load class from output torque or force: what an authored `size` hint
// means, and the joint's dot size and cost fallback. Not the motor class.
const LOAD_TORQUE_MAX_NM = [10, 40, 100, 200] as const;
const LOAD_FORCE_MAX_N = [300, 1000, 4000, 9000] as const;
const LOAD_IDS: readonly SizeClass[] = ["xs", "s", "m", "l", "xl"];
// Output a load class stands for when only the class is known.
export const LOAD_TORQUE_NM: Record<SizeClass, number> = {
    xs: 5,
    s: 25,
    m: 70,
    l: 150,
    xl: 250,
};
export const LOAD_FORCE_N: Record<SizeClass, number> = {
    xs: 150,
    s: 650,
    m: 2500,
    l: 6500,
    xl: 12000,
};

export function loadClass(kind: "torque" | "force", value: number): SizeClass {
    const caps = kind === "torque" ? LOAD_TORQUE_MAX_NM : LOAD_FORCE_MAX_N;
    const i = caps.findIndex((c) => value <= c);
    return LOAD_IDS[i === -1 ? 4 : i]!;
}

const round1 = (x: number) => Math.round(x * 10) / 10;
const round2 = (x: number) => Math.round(x * 100) / 100;

// Magnet mass of one motor of this class, grams: [low, high].
export function magnetRangeG(id: SizeClass): [number, number] {
    const c = sizeSpec(id);
    const ring = Math.PI * (c.airgapDiameterMm / 10) * (c.activeLengthMm / 10);
    const [t0, t1] = c.magnetThicknessMm;
    const lo = ring * (t0 / 10) * ARC_FILL[0] * NDFEB_DENSITY_G_CM3;
    const hi = ring * (t1 / 10) * ARC_FILL[1] * NDFEB_DENSITY_G_CM3;
    return [round1(lo), round1(hi)];
}

export interface KnownRatio {
    value: number;
    sources: string[];
    confidence: Confidence;
    note: string;
}

// The ratio a joint publishes, in order: an explicit authored ratio, the
// linked catalog record's gear_ratio, the reducer text.
export function knownRatio(
    explicit: KnownRatio | undefined,
    catalog: { id: string; gear_ratio: string | null } | undefined,
    reducer: string | undefined,
    sources: string[],
): KnownRatio | undefined {
    if (explicit) return explicit;
    const fromCatalog = parseRatio(catalog?.gear_ratio);
    if (catalog && fromCatalog) {
        return {
            value: fromCatalog,
            sources: [`catalog:${catalog.id}`],
            confidence: "reported",
            note: "Catalog gear ratio.",
        };
    }
    const fromReducer = parseRatio(reducer);
    if (fromReducer) {
        return {
            value: fromReducer,
            sources,
            confidence: "reported",
            note: "Reducer ratio from the joint's sources.",
        };
    }
    return undefined;
}

const AS_OF = "October 2026";

function sizedFigure(
    value: number,
    range: readonly [number, number],
    unit: string | undefined,
    sources: string[],
    confidence: Confidence,
    note: string,
): Sourced<number> {
    return {
        value: round2(value),
        ...(unit ? { unit } : {}),
        sources,
        asOf: AS_OF,
        confidence,
        note,
        range: [round2(range[0]), round2(range[1])],
    };
}

// Motor-side sizing of one actuator. Null for hydraulics.
export function sizeMotor(
    type: ActuatorType,
    basis: "torque" | "force",
    output: number,
    ratio: KnownRatio | undefined,
): MotorSizing | null {
    const d: DriveSpec | null = driveFor(type, basis === "force");
    if (!d) return null;
    const r = ratio?.value ?? d.ratio;
    const [rLo, rHi] = ratio ? [r, r] : d.ratioRange;
    const [eLo, eHi] = d.efficiencyRange;
    const typ = motorTorque(d.kind, output, r, d.efficiency);
    // Screws: a longer lead needs more torque; reducers: a higher ratio less.
    const lo =
        d.kind === "screw"
            ? motorTorque(d.kind, output, rLo, eHi)
            : motorTorque(d.kind, output, rHi, eHi);
    const hi =
        d.kind === "screw"
            ? motorTorque(d.kind, output, rHi, eLo)
            : motorTorque(d.kind, output, rLo, eLo);
    const screw = d.kind === "screw";
    const gearRatio = ratio
        ? sizedFigure(r, [r, r], ":1", ratio.sources, ratio.confidence, ratio.note)
        : sizedFigure(
              r,
              d.ratioRange,
              screw ? "mm lead" : ":1",
              d.ratioSources,
              "modeled",
              `Not published; typical ${d.note}.`,
          );
    return {
        basis,
        output,
        gearRatio,
        efficiency: sizedFigure(
            d.efficiency,
            d.efficiencyRange,
            undefined,
            d.efficiencySources,
            "modeled",
            `Typical efficiency of a ${d.label}.`,
        ),
        motorTorqueNm: sizedFigure(
            typ,
            [lo, hi],
            "N·m",
            [...gearRatio.sources, ...d.efficiencySources],
            "estimated",
            screw
                ? `${output} N x lead / (2 pi x efficiency).`
                : `${output} N·m / (ratio x efficiency).`,
        ),
        sizeClass: sizeClassForMotorTorque(typ),
        classRange: [sizeClassForMotorTorque(lo), sizeClassForMotorTorque(hi)],
    };
}

// Magnet mass at a joint node, count x per motor. The value is the middle of
// the typical motor's class; the range runs from the low end of the class at
// the lowest motor torque to the high end of the class at the highest.
export function jointMagnetG(
    sizing: MotorSizing | null,
    count: number,
): { value: number; range: [number, number] } {
    if (!sizing) return { value: 0, range: [0, 0] };
    const [mLo, mHi] = magnetRangeG(sizing.sizeClass);
    const lo = magnetRangeG(sizing.classRange[0])[0];
    const hi = magnetRangeG(sizing.classRange[1])[1];
    return {
        value: round1(((mLo + mHi) / 2) * count),
        range: [round1(lo * count), round1(hi * count)],
    };
}

// Mass fractions of the magnet, [low, high].
export const REE_FRACTION: Ree<readonly [number, number]> = {
    nd: [0.29 * 0.75, 0.32 * 0.8],
    pr: [0.29 * 0.2, 0.32 * 0.25],
    dy: [0.0035, 0.03],
    tb: [0, 0.01],
};

// Rare-earth content for a magnet mass range (any unit in, same unit out).
export function reeSplit(range: readonly [number, number]): Ree<[number, number]> {
    const part = (f: readonly [number, number]): [number, number] => [
        range[0] * f[0],
        range[1] * f[1],
    ];
    return {
        nd: part(REE_FRACTION.nd),
        pr: part(REE_FRACTION.pr),
        dy: part(REE_FRACTION.dy),
        tb: part(REE_FRACTION.tb),
    };
}
