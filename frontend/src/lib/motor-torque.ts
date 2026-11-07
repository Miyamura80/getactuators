// Shaft power, torque and speed: P = T × ω, with ω in rad/s.
// Pure functions so the page, the nomograph and the tests share one formula.

export type Quantity = "torque" | "power" | "speed";

interface Unit {
    id: string;
    label: string;
    // Multiply a value in this unit by `si` to get N·m, W or rpm.
    si: number;
}

export const TORQUE_UNITS: readonly Unit[] = [
    { id: "Nm", label: "N·m", si: 1 },
    { id: "Ncm", label: "N·cm", si: 0.01 },
    { id: "kgfcm", label: "kgf·cm", si: 0.0980665 },
    { id: "lbfft", label: "lbf·ft", si: 1.3558179483314 },
    { id: "lbfin", label: "lbf·in", si: 0.1129848290276 },
    { id: "ozin", label: "oz·in", si: 0.0070615518 },
];

export const POWER_UNITS: readonly Unit[] = [
    { id: "W", label: "W", si: 1 },
    { id: "kW", label: "kW", si: 1000 },
    { id: "hp", label: "hp", si: 745.69987158227 },
];

export const SPEED_UNITS: readonly Unit[] = [
    { id: "rpm", label: "rpm", si: 1 },
    { id: "rads", label: "rad/s", si: 60 / (2 * Math.PI) },
    { id: "rps", label: "rev/s", si: 60 },
];

export const UNITS: Record<Quantity, readonly Unit[]> = {
    torque: TORQUE_UNITS,
    power: POWER_UNITS,
    speed: SPEED_UNITS,
};

export function unitFor(q: Quantity, id: string): Unit {
    const list = UNITS[q];
    return list.find((u) => u.id === id) ?? (list[0] as Unit);
}

const RPM_TO_RADS = (2 * Math.PI) / 60;

export interface Shaft {
    torqueNm: number;
    powerW: number;
    speedRpm: number;
}

export type SolveResult = { ok: true; shaft: Shaft } | { ok: false; reason: string };

// Solve the missing quantity from the other two (all SI). Zero speed or zero
// torque cannot be inverted: stall torque is a motor rating, not a formula output.
export function solve(target: Quantity, known: Partial<Shaft>): SolveResult {
    const { torqueNm: t, powerW: p, speedRpm: n } = known;
    const bad = [t, p, n].some((v) => v !== undefined && (!Number.isFinite(v) || v < 0));
    if (bad) return { ok: false, reason: "Enter positive numbers." };
    if (target === "power") {
        if (t === undefined || n === undefined) return { ok: false, reason: "Enter torque and speed." };
        return { ok: true, shaft: { torqueNm: t, speedRpm: n, powerW: t * n * RPM_TO_RADS } };
    }
    if (target === "torque") {
        if (p === undefined || n === undefined) return { ok: false, reason: "Enter power and speed." };
        if (n === 0)
            return {
                ok: false,
                reason: "At zero speed, power is zero for any torque. Stall torque is a motor rating, not something this formula can give you.",
            };
        return { ok: true, shaft: { powerW: p, speedRpm: n, torqueNm: p / (n * RPM_TO_RADS) } };
    }
    if (p === undefined || t === undefined) return { ok: false, reason: "Enter power and torque." };
    if (t === 0) return { ok: false, reason: "Speed is undefined at zero torque: the shaft carries no load." };
    return { ok: true, shaft: { powerW: p, torqueNm: t, speedRpm: p / (t * RPM_TO_RADS) } };
}

export interface Gearbox {
    // Reduction ratio, motor turns per output turn (e.g. 9 for 9:1).
    ratio: number;
    // Mechanical efficiency of the stage, 0 < eta ≤ 1.
    efficiency: number;
}

// Reflect an output-side requirement back to the motor shaft of a gearbox:
// the motor turns `ratio` times faster and must also cover the stage losses.
export function motorSide(output: Shaft, g: Gearbox): Shaft | null {
    if (!Number.isFinite(g.ratio) || !(g.ratio > 0) || !(g.efficiency > 0) || g.efficiency > 1) return null;
    return {
        torqueNm: output.torqueNm / (g.ratio * g.efficiency),
        speedRpm: output.speedRpm * g.ratio,
        powerW: output.powerW / g.efficiency,
    };
}

// Engineering display: 3 significant figures, no exponent for everyday sizes.
export function fmt(v: number): string {
    if (!Number.isFinite(v)) return "n/a";
    if (v === 0) return "0";
    const abs = Math.abs(v);
    if (abs >= 1e6 || abs < 1e-3) return v.toExponential(2);
    const digits = Math.max(0, 2 - Math.floor(Math.log10(abs)));
    return Number(v.toFixed(digits)).toLocaleString("en-US", { maximumFractionDigits: digits });
}

export function inUnit(q: Quantity, si: number, unitId: string): number {
    return si / unitFor(q, unitId).si;
}

export interface CalcState {
    solve: Quantity;
    // Raw text as typed, keyed by quantity, so partial input survives.
    values: Record<Quantity, string>;
    units: Record<Quantity, string>;
    ratio: string;
    efficiency: string;
}

export const DEFAULT_STATE: CalcState = {
    solve: "torque",
    values: { torque: "", power: "100", speed: "300" },
    units: { torque: "Nm", power: "W", speed: "rpm" },
    ratio: "",
    efficiency: "",
};

const KEYS: Record<Quantity, [string, string]> = {
    torque: ["t", "tu"],
    power: ["p", "pu"],
    speed: ["n", "nu"],
};

const QUANTITIES: readonly Quantity[] = ["torque", "power", "speed"];

function num(raw: string | null): string {
    return raw !== null && raw.length <= 24 && (raw === "" || /^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(raw)) ? raw : "";
}

export function stateFromQuery(search: string): CalcState {
    const p = new URLSearchParams(search);
    const solveParam = p.get("solve");
    const target = QUANTITIES.find((q) => q === solveParam) ?? DEFAULT_STATE.solve;
    const touched = QUANTITIES.some((q) => p.has(KEYS[q][0]));
    const values = { ...DEFAULT_STATE.values };
    const units = { ...DEFAULT_STATE.units };
    for (const q of QUANTITIES) {
        const [vk, uk] = KEYS[q];
        if (touched) values[q] = num(p.get(vk));
        const u = p.get(uk);
        if (u && UNITS[q].some((x) => x.id === u)) units[q] = u;
    }
    values[target] = "";
    return { solve: target, values, units, ratio: num(p.get("ratio")), efficiency: num(p.get("eff")) };
}

export function stateToQuery(s: CalcState): string {
    const p = new URLSearchParams();
    p.set("solve", s.solve);
    for (const q of QUANTITIES) {
        if (q === s.solve) continue;
        const [vk, uk] = KEYS[q];
        if (s.values[q]) p.set(vk, s.values[q]);
        if (s.units[q] !== DEFAULT_STATE.units[q]) p.set(uk, s.units[q]);
    }
    if (s.units[s.solve] !== DEFAULT_STATE.units[s.solve]) p.set(KEYS[s.solve][1], s.units[s.solve]);
    if (s.ratio) p.set("ratio", s.ratio);
    if (s.efficiency) p.set("eff", s.efficiency);
    return `?${p.toString()}`;
}

// The two known inputs of a state, converted to SI.
export function knownSi(s: CalcState): Partial<Shaft> {
    const out: Partial<Shaft> = {};
    const read = (q: Quantity) => {
        const raw = s.values[q].trim();
        return raw === "" ? undefined : Number(raw) * unitFor(q, s.units[q]).si;
    };
    if (s.solve !== "torque") out.torqueNm = read("torque");
    if (s.solve !== "power") out.powerW = read("power");
    if (s.solve !== "speed") out.speedRpm = read("speed");
    return out;
}

export function gearboxFrom(s: CalcState): Gearbox | null {
    const ratio = Number(s.ratio);
    if (!s.ratio || !(ratio > 0)) return null;
    const pct = s.efficiency ? Number(s.efficiency) : 100;
    return { ratio, efficiency: pct / 100 };
}
