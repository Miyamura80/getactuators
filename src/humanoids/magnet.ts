import type { ActuatorType, Ree, SizeClass } from "./types";

// Magnet mass estimate, per actuator:
//   1. Pick a motor size class from the joint's peak output torque (rotary) or
//      force (linear). A class stands for a frameless motor of that size.
//   2. Magnet volume = pi x airgap diameter x active length x magnet thickness
//      x arc fill (the share of the rotor circumference covered by magnets).
//   3. Mass = volume x sintered NdFeB density.
// Thickness and arc fill are ranges, so every result is a range. Hydraulic
// joints carry no magnet at the joint (the pump motor is not counted).
//
// Rare-earth split by weight of the magnet, from grade compositions:
//   PrNd 29 to 32% (Pr about 20 to 25% of that), Dy 0.35 to 3%, Tb 0 to 1%.

export const NDFEB_DENSITY_G_CM3 = 7.5;
export const ARC_FILL: readonly [number, number] = [0.7, 0.9];

export interface SizeClassSpec {
    id: SizeClass;
    label: string;
    // Upper bound of the class (inclusive), N·m at the joint output.
    maxTorqueNm: number;
    // Upper bound for linear actuators, N.
    maxForceN: number;
    airgapDiameterMm: number;
    activeLengthMm: number;
    magnetThicknessMm: readonly [number, number];
    // Frameless motors of comparable size.
    comparable: string;
}

export const SIZE_CLASSES: readonly SizeClassSpec[] = [
    {
        id: "xs",
        label: "XS",
        maxTorqueNm: 10,
        maxForceN: 300,
        airgapDiameterMm: 22,
        activeLengthMm: 10,
        magnetThicknessMm: [1.5, 2.5],
        comparable: "finger and gimbal micro motors (28 mm class)",
    },
    {
        id: "s",
        label: "S",
        maxTorqueNm: 40,
        maxForceN: 1000,
        airgapDiameterMm: 40,
        activeLengthMm: 12,
        magnetThicknessMm: [2, 3],
        comparable: "50 mm frameless (5010 class, RobStride 00 to 02 size)",
    },
    {
        id: "m",
        label: "M",
        maxTorqueNm: 100,
        maxForceN: 4000,
        airgapDiameterMm: 60,
        activeLengthMm: 16,
        magnetThicknessMm: [2.5, 3.5],
        comparable: "70 to 80 mm frameless (CubeMars RI60 to RI80)",
    },
    {
        id: "l",
        label: "L",
        maxTorqueNm: 200,
        maxForceN: 9000,
        airgapDiameterMm: 80,
        activeLengthMm: 20,
        magnetThicknessMm: [3, 4],
        comparable: "85 to 100 mm frameless (TQ ILM85x26 class)",
    },
    {
        id: "xl",
        label: "XL",
        maxTorqueNm: Number.POSITIVE_INFINITY,
        maxForceN: Number.POSITIVE_INFINITY,
        airgapDiameterMm: 100,
        activeLengthMm: 25,
        magnetThicknessMm: [3.5, 4.5],
        comparable: "115 mm frameless (ILM115 class, Unitree M107 size)",
    },
];

const byId = new Map(SIZE_CLASSES.map((c) => [c.id, c]));

export function sizeSpec(id: SizeClass): SizeClassSpec {
    const spec = byId.get(id);
    if (!spec) throw new Error(`unknown size class ${id}`);
    return spec;
}

export function sizeClassForTorque(nm: number): SizeClass {
    return (SIZE_CLASSES.find((c) => nm <= c.maxTorqueNm) ?? SIZE_CLASSES[4])!.id;
}

export function sizeClassForForce(n: number): SizeClass {
    return (SIZE_CLASSES.find((c) => n <= c.maxForceN) ?? SIZE_CLASSES[4])!.id;
}

const round1 = (x: number) => Math.round(x * 10) / 10;

// Magnet mass of one motor of this class, grams: [low, high].
export function magnetRangeG(id: SizeClass): [number, number] {
    const c = sizeSpec(id);
    const ring = Math.PI * (c.airgapDiameterMm / 10) * (c.activeLengthMm / 10);
    const [t0, t1] = c.magnetThicknessMm;
    const lo = ring * (t0 / 10) * ARC_FILL[0] * NDFEB_DENSITY_G_CM3;
    const hi = ring * (t1 / 10) * ARC_FILL[1] * NDFEB_DENSITY_G_CM3;
    return [round1(lo), round1(hi)];
}

// Magnet mass at a joint node: count x per-motor range, zero for hydraulics.
export function jointMagnetG(
    id: SizeClass,
    count: number,
    type: ActuatorType,
): { value: number; range: [number, number] } {
    if (type === "hydraulic") return { value: 0, range: [0, 0] };
    const [lo, hi] = magnetRangeG(id);
    const range: [number, number] = [round1(lo * count), round1(hi * count)];
    return { value: round1((range[0] + range[1]) / 2), range };
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
