import { ACTUATORS } from "../catalog";
import { HUMANOIDS_AS_OF } from "./build";
import { sizeSpec } from "./magnet";
import { type RestPart, restOfRobotCost, restOfRobotMass } from "./robot-bom";
import type { Confidence, Sourced } from "./sourced";
import {
    ACTUATOR_TYPE_LABEL,
    type ActuatorType,
    type CanonicalJoint,
    type Humanoid,
    type HumanoidJoint,
    type SizeClass,
} from "./types";

// Actuator bill of materials per robot, by cost, actuator mass or magnet mass.
//
// Unit cost, in order of preference:
//   1. the linked catalog actuator's list price (reported);
//   2. Optimus: published analyst BOM estimates per actuator kind (estimated);
//   3. a curve fitted to catalog prices against peak torque (modeled), or for
//      linear units the Optimus per-unit estimate applied as a proxy.
// Joints with no defensible number (hydraulics, micro motors below the fit
// range) are left out and listed, so totals read as a floor.

export type BomMetric = "cost" | "mass" | "magnet";
export const BOM_UNIT: Record<BomMetric, string> = {
    cost: "USD",
    mass: "kg",
    magnet: "kg",
};

const CNY_PER_USD = 7.2;
const FIT_CATEGORIES = new Set([
    "qdd_proprioceptive",
    "integrated_joint",
    "cycloidal_premium",
]);
// Peak torque a joint is assumed to have when only its size class is known.
const CLASS_TORQUE: Record<SizeClass, number | null> = {
    xs: null,
    s: 25,
    m: 70,
    l: 150,
    xl: 250,
};

export interface PowerFit {
    // y = coef x torque^exp, range = y x exp(-/+ sigma).
    coef: number;
    exp: number;
    sigma: number;
    minTorque: number;
    maxTorque: number;
    ids: string[];
}

function fitPower(key: "price_usd" | "weight_g"): PowerFit {
    const pts = ACTUATORS.filter(
        (a) => FIT_CATEGORIES.has(a.category) && a.peak_torque_nm && a[key],
    ).map((a) => ({ id: a.id, t: a.peak_torque_nm as number, y: a[key] as number }));
    const xs = pts.map((p) => Math.log(p.t));
    const ys = pts.map((p) => Math.log(p.y));
    const n = pts.length;
    const mx = xs.reduce((s, x) => s + x, 0) / n;
    const my = ys.reduce((s, y) => s + y, 0) / n;
    let sxy = 0;
    let sxx = 0;
    for (let i = 0; i < n; i++) {
        sxy += (xs[i]! - mx) * (ys[i]! - my);
        sxx += (xs[i]! - mx) ** 2;
    }
    const exp = sxy / sxx;
    const a = my - exp * mx;
    const sse = xs.reduce((s, x, i) => s + (ys[i]! - (a + exp * x)) ** 2, 0);
    return {
        coef: Math.exp(a),
        exp,
        sigma: Math.sqrt(sse / (n - 2)),
        minTorque: Math.min(...pts.map((p) => p.t)),
        maxTorque: Math.max(...pts.map((p) => p.t)),
        ids: pts.map((p) => p.id),
    };
}

export const COST_FIT = fitPower("price_usd");
export const MASS_FIT = fitPower("weight_g");

type Unit = Sourced<number>;
type Excluded = { reason: string };

const r2 = (x: number) => Math.round(x * 100) / 100;

function unit(
    value: number,
    range: readonly [number, number],
    confidence: Confidence,
    sources: string[],
    note: string,
    unitName: string,
): Unit {
    return {
        value: r2(value),
        unit: unitName,
        sources,
        asOf: HUMANOIDS_AS_OF,
        confidence,
        range: [r2(range[0]), r2(range[1])],
        note,
    };
}

function fromFit(
    fit: PowerFit,
    torque: number,
    scale: number,
    unitName: string,
    what: string,
): Unit | Excluded {
    if (torque < fit.minTorque) {
        return { reason: `below the catalog ${what} fit range (${fit.minTorque} N·m)` };
    }
    const y = fit.coef * torque ** fit.exp * scale;
    const k = Math.exp(fit.sigma);
    const beyond =
        torque > fit.maxTorque ? `, extrapolated past ${fit.maxTorque} N·m` : "";
    return unit(
        y,
        [y / k, y * k],
        "modeled",
        ["catalog-fit"],
        `Catalog ${what} curve at ${torque} N·m${beyond}.`,
        unitName,
    );
}

const jointTorque = (j: HumanoidJoint) =>
    j.peakTorqueNm?.value ?? CLASS_TORQUE[j.sizeClass];
const isLinear = (t: ActuatorType) =>
    t === "linear-roller-screw" || t === "linear-ball-screw";

// Optimus per-actuator estimates from published BOM breakdowns. Low end:
// Huibo's CNY totals per kind over the unit count; high end: Morgan Stanley's
// $55k BOM x 56% over 28 body actuators, or its $9.5k for both hands.
const MS_PER_BODY_ACTUATOR = (55000 * 0.56) / 28;
const OPTIMUS_COST = {
    rotary: [57000 / 14 / CNY_PER_USD, MS_PER_BODY_ACTUATOR],
    linear: [44000 / 14 / CNY_PER_USD, MS_PER_BODY_ACTUATOR],
    hand: [20000 / 12 / CNY_PER_USD, 9500 / 12],
} as const;
const OPTIMUS_SRC = ["huibo-optimus-bom", "ms-optimus-bom"];

function optimusCost(j: HumanoidJoint): Unit {
    const kind = j.canonical.endsWith("hand")
        ? "hand"
        : isLinear(j.actuatorType)
          ? "linear"
          : "rotary";
    const [lo, hi] = OPTIMUS_COST[kind];
    return unit(
        lo,
        [lo, hi],
        "estimated",
        OPTIMUS_SRC,
        `Optimus ${kind} unit: Huibo (at ${CNY_PER_USD} CNY/USD) to Morgan Stanley per-unit share.`,
        "USD",
    );
}

const catalog = new Map(ACTUATORS.map((a) => [a.id, a]));

export function unitCost(h: Humanoid, j: HumanoidJoint): Unit | Excluded {
    const a = j.actuatorId ? catalog.get(j.actuatorId) : undefined;
    if (a?.price_usd) {
        return unit(
            a.price_usd,
            [a.price_usd, a.price_usd],
            "reported",
            [`catalog:${a.id}`],
            "Catalog list price.",
            "USD",
        );
    }
    if (j.unitCostUsd) {
        const v = j.unitCostUsd.value;
        return { ...j.unitCostUsd, range: [v, v] };
    }
    if (h.id === "tesla-optimus" && j.actuatorType !== "other") return optimusCost(j);
    if (j.actuatorType === "hydraulic")
        return { reason: "hydraulic: no per-actuator cost published" };
    if (isLinear(j.actuatorType)) {
        const [lo, hi] = OPTIMUS_COST.linear;
        return unit(
            lo,
            [lo, hi],
            "modeled",
            OPTIMUS_SRC,
            "Optimus linear-unit estimate used as a proxy.",
            "USD",
        );
    }
    const t = jointTorque(j);
    if (t === null) return { reason: "micro motor: no defensible unit cost" };
    return fromFit(COST_FIT, t, 1, "USD", "price");
}

export function unitMass(j: HumanoidJoint): Unit | Excluded {
    const a = j.actuatorId ? catalog.get(j.actuatorId) : undefined;
    if (a?.weight_g) {
        const kg = a.weight_g / 1000;
        return unit(
            kg,
            [kg, kg],
            "reported",
            [`catalog:${a.id}`],
            "Catalog mass.",
            "kg",
        );
    }
    if (j.actuatorType === "hydraulic" || isLinear(j.actuatorType)) {
        return { reason: "no published actuator mass" };
    }
    const t = jointTorque(j);
    if (t === null) return { reason: "micro motor: no defensible mass" };
    return fromFit(MASS_FIT, t, 1 / 1000, "kg", "mass");
}

function unitMagnet(j: HumanoidJoint): Unit | Excluded {
    const m = j.magnetMassG;
    if (m.value === 0) return { reason: "no magnet at the joint" };
    const per = (g: number) => g / j.count / 1000;
    const [lo, hi] = m.range ?? [m.value, m.value];
    return unit(
        per(m.value),
        [per(lo), per(hi)],
        "estimated",
        m.sources,
        m.note ?? "",
        "kg",
    );
}

// One part on the robot, with every node it sits at.
export interface BomItem {
    key: string;
    label: string;
    type: ActuatorType;
    count: number;
    unit: Unit;
    joints: CanonicalJoint[];
}

export type BomCategory = "actuator" | "non-actuator";

export interface BomSlice extends Omit<BomItem, "unit"> {
    category: BomCategory;
    unit: Unit | null;
    value: number;
    range: [number, number];
    share: number;
    // A non-actuator total the source does not break into categories.
    lumped?: boolean;
}

type Total = { value: number; range: [number, number] };

export interface Bom {
    metric: BomMetric;
    unit: string;
    slices: BomSlice[];
    total: Total;
    actuators: Total;
    // Null when no source covers the rest of the robot.
    rest: Total | null;
    excluded: { label: string; count: number; reason: string }[];
}

function partLabel(j: HumanoidJoint): string {
    if (j.canonical.endsWith("hand"))
        return `Hand (${ACTUATOR_TYPE_LABEL[j.actuatorType].toLowerCase()})`;
    if (j.motor) return j.motor;
    const type = ACTUATOR_TYPE_LABEL[j.actuatorType];
    if (j.peakTorqueNm)
        return `${type} ${j.peakTorqueNm.value.toLocaleString("en-US")} N·m`;
    if (j.peakForceN) return `${type} ${j.peakForceN.value.toLocaleString("en-US")} N`;
    return `${type}, ${sizeSpec(j.sizeClass).label} class`;
}

const withShares = (slices: Omit<BomSlice, "share">[]): BomSlice[] => {
    const total = slices.reduce((n, s) => n + s.value, 0);
    return slices.map((s) => ({ ...s, share: total ? s.value / total : 0 }));
};

// Group actuator parts into at most `max` slices by value, the rest summed as
// "Other". Shares are of the actuator total.
export function groupSlices(items: BomItem[], max = 6): BomSlice[] {
    const sized = items
        .map((it) => ({
            ...it,
            category: "actuator" as const,
            value: r2(it.unit.value * it.count),
            range: [
                r2((it.unit.range?.[0] ?? it.unit.value) * it.count),
                r2((it.unit.range?.[1] ?? it.unit.value) * it.count),
            ] as [number, number],
        }))
        .filter((s) => s.value > 0)
        .sort((a, b) => b.value - a.value);
    const head: Omit<BomSlice, "share">[] =
        sized.length > max + 1 ? sized.slice(0, max) : sized;
    const tail = sized.slice(head.length);
    if (tail.length) {
        head.push({
            key: "other",
            label: "Other",
            type: "other",
            category: "actuator",
            count: tail.reduce((n, s) => n + s.count, 0),
            unit: null,
            joints: tail.flatMap((s) => s.joints),
            value: r2(tail.reduce((n, s) => n + s.value, 0)),
            range: [
                r2(tail.reduce((n, s) => n + s.range[0], 0)),
                r2(tail.reduce((n, s) => n + s.range[1], 0)),
            ],
        });
    }
    return withShares(head);
}

const sumOf = (
    slices: readonly { value: number; range: [number, number] }[],
): Total => ({
    value: r2(slices.reduce((n, s) => n + s.value, 0)),
    range: [
        r2(slices.reduce((n, s) => n + s.range[0], 0)),
        r2(slices.reduce((n, s) => n + s.range[1], 0)),
    ],
});

function restSlices(parts: RestPart[]): Omit<BomSlice, "share">[] {
    return parts.map((p) => ({
        key: `rest:${p.key}`,
        label: p.label,
        type: "other",
        category: "non-actuator",
        count: 1,
        unit: p.value,
        joints: [],
        value: r2(p.value.value),
        range: [
            r2(p.value.range?.[0] ?? p.value.value),
            r2(p.value.range?.[1] ?? p.value.value),
        ],
        ...(p.lumped ? { lumped: true } : {}),
    }));
}

// `maxSlices` caps the actuator slices before the rest fold into "Other".
export function humanoidBom(h: Humanoid, metric: BomMetric, maxSlices = 6): Bom {
    const items = new Map<string, BomItem>();
    const excluded = new Map<
        string,
        { label: string; count: number; reason: string }
    >();
    for (const j of h.joints) {
        const u =
            metric === "cost"
                ? unitCost(h, j)
                : metric === "mass"
                  ? unitMass(j)
                  : unitMagnet(j);
        const label = partLabel(j);
        const key = `${j.actuatorType}|${label}`;
        if ("reason" in u) {
            const e = excluded.get(key) ?? { label, count: 0, reason: u.reason };
            e.count += j.count;
            excluded.set(key, e);
            continue;
        }
        const it = items.get(key) ?? {
            key,
            label,
            type: j.actuatorType,
            count: 0,
            unit: u,
            joints: [],
        };
        it.count += j.count;
        it.joints.push(j.canonical);
        items.set(key, it);
    }
    const actuatorSlices = groupSlices([...items.values()], maxSlices);
    const actuators = sumOf(actuatorSlices);
    const restParts =
        metric === "cost"
            ? restOfRobotCost(h)
            : metric === "mass"
              ? restOfRobotMass(h, actuators)
              : [];
    const rest = restSlices(restParts);
    const slices = withShares([...actuatorSlices, ...rest]);
    return {
        metric,
        unit: BOM_UNIT[metric],
        slices,
        total: sumOf(slices),
        actuators,
        rest: rest.length ? sumOf(rest) : null,
        excluded: [...excluded.values()],
    };
}

// Actuator cost as a share of the robot's list price, when both exist.
export function bomPriceShare(
    h: Humanoid,
    bom: Bom,
): { value: number; range: [number, number] } | null {
    if (bom.metric !== "cost" || !h.price_usd || !bom.actuators.value) return null;
    const p = h.price_usd;
    return {
        value: bom.actuators.value / p,
        range: [bom.actuators.range[0] / p, bom.actuators.range[1] / p],
    };
}
