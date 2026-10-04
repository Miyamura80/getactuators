import type { CSSProperties } from "react";
import type { Quantity, Shaft } from "../lib/motor-torque";
import { fmt } from "../lib/motor-torque";

// A three-scale power nomograph. Torque (left) and speed (right) are log
// scales with the same modulus; power sits midway at half the modulus, so one
// straight line through any torque and speed crosses the exact shaft power.
// log P = log T + log n - log(60 / 2π).

const W = 360;
const TOP = 40;
const BOTTOM = 440;
const X = { torque: 56, power: 180, speed: 304 } as const;
const T_MIN = -2; // 0.01 N·m
const N_MIN = 0; // 1 rpm
const DECADES = 5;
const K = (BOTTOM - TOP) / DECADES;
const C = Math.log10(60 / (2 * Math.PI));

const clamp = (y: number) => Math.min(BOTTOM, Math.max(TOP, y));
const yTorque = (t: number) => BOTTOM - K * (Math.log10(t) - T_MIN);
const ySpeed = (n: number) => BOTTOM - K * (Math.log10(n) - N_MIN);
const yPower = (p: number) => BOTTOM - (K / 2) * (Math.log10(p) + C - T_MIN - N_MIN);

function siPower(exp: number): string {
    const prefixes: [number, string][] = [[6, "MW"], [3, "kW"], [0, "W"], [-3, "mW"]];
    for (const [base, label] of prefixes) {
        if (exp >= base) return `${10 ** (exp - base)} ${label}`;
    }
    return `${10 ** exp} W`;
}

function Scale({ x, side, ticks }: { x: number; side: "l" | "r"; ticks: { y: number; label?: string }[] }) {
    const dir = side === "l" ? -1 : 1;
    return (
        <g className="nomo-scale">
            <line x1={x} x2={x} y1={TOP} y2={BOTTOM} />
            {ticks.map(({ y, label }) => (
                <g key={y}>
                    <line x1={x} x2={x + dir * (label ? 9 : 4)} y1={y} y2={y} className={label ? "major" : "minor"} />
                    {label && (
                        <text x={x + dir * 13} y={y + 3.5} textAnchor={side === "l" ? "end" : "start"}>
                            {label}
                        </text>
                    )}
                </g>
            ))}
        </g>
    );
}

function logTicks(y: (v: number) => number, from: number, to: number, label: (exp: number) => string) {
    const ticks: { y: number; label?: string }[] = [];
    for (let e = from; e <= to; e++) {
        ticks.push({ y: y(10 ** e), label: label(e) });
        if (e === to) break;
        for (let m = 2; m <= 9; m++) ticks.push({ y: y(m * 10 ** e) });
    }
    return ticks;
}

const TORQUE_TICKS = logTicks(yTorque, T_MIN, T_MIN + DECADES, (e) => `${10 ** e}`.replace(/^0\./, "."));
const SPEED_TICKS = logTicks(ySpeed, N_MIN, N_MIN + DECADES, (e) => (e >= 3 ? `${10 ** (e - 3)}k` : `${10 ** e}`));
const POWER_TICKS: { y: number; label?: string }[] = [];
for (let e = -2; e <= 7; e++) {
    const y = yPower(10 ** e);
    if (y >= TOP - 0.5 && y <= BOTTOM + 0.5) POWER_TICKS.push({ y, label: siPower(e) });
}

export function Nomograph({ shaft, solved }: { shaft: Shaft | null; solved: Quantity }) {
    const valid = shaft && shaft.torqueNm > 0 && shaft.speedRpm > 0;
    const yl = valid ? yTorque(shaft.torqueNm) : 0;
    const yr = valid ? ySpeed(shaft.speedRpm) : 0;
    const ym = valid ? yPower(shaft.powerW) : 0;
    const off = valid && [yl, yr].some((y) => y < TOP || y > BOTTOM);
    // Extend the straightedge past both scales like a ruler laid on paper.
    const slope = (yr - yl) / (X.speed - X.torque);
    const x0 = 20;
    const x1 = W - 20;
    const path = `M${x0} ${yl + slope * (x0 - X.torque)}L${x1} ${yl + slope * (x1 - X.torque)}`;
    const label = valid
        ? `Nomograph: ${fmt(shaft.torqueNm)} N·m at ${fmt(shaft.speedRpm)} rpm is ${fmt(shaft.powerW)} W`
        : "Nomograph: enter two values to draw the line";
    return (
        <figure className="nomo">
            <svg viewBox={`0 0 ${W} 470`} role="img" aria-label={label}>
                <defs>
                    <clipPath id="nomo-clip">
                        <rect x="0" y={TOP - 6} width={W} height={BOTTOM - TOP + 12} />
                    </clipPath>
                </defs>
                <text x={X.torque} y={20} className="nomo-title" textAnchor="middle">TORQUE N·m</text>
                <text x={X.power} y={20} className="nomo-title" textAnchor="middle">POWER</text>
                <text x={X.speed} y={20} className="nomo-title" textAnchor="middle">SPEED rpm</text>
                <Scale x={X.torque} side="l" ticks={TORQUE_TICKS} />
                <Scale x={X.power} side="r" ticks={POWER_TICKS} />
                <Scale x={X.speed} side="r" ticks={SPEED_TICKS} />
                {valid && (
                    <g clipPath="url(#nomo-clip)">
                        <path className="nomo-edge" d={path} style={{ d: `path("${path}")` } as CSSProperties} />
                        {(
                            [
                                ["torque", X.torque, yl],
                                ["power", X.power, ym],
                                ["speed", X.speed, yr],
                            ] as const
                        ).map(([q, x, y]) => (
                            <circle
                                key={q}
                                cx={x}
                                cy={clamp(y)}
                                r={q === solved ? 6 : 4.5}
                                className={q === solved ? "nomo-pin solved" : "nomo-pin"}
                            />
                        ))}
                        {(
                            [
                                ["torque", X.torque, yl, `${fmt(shaft.torqueNm)} N·m`],
                                ["power", X.power, ym, `${fmt(shaft.powerW)} W`],
                                ["speed", X.speed, yr, `${fmt(shaft.speedRpm)} rpm`],
                            ] as const
                        ).map(([q, x, y, text]) => {
                            const w = text.length * 6.2 + 10;
                            // Tags ride above the line on the sheet side of each scale:
                            // right of torque, centred on power, left of speed.
                            const tx = q === "torque" ? x + 10 : q === "power" ? x - w / 2 : x - 10 - w;
                            return (
                                <g key={`tag-${q}`} className={q === solved ? "nomo-tag solved" : "nomo-tag"}>
                                    <rect x={tx} y={clamp(y) - 19} width={w} height={14} />
                                    <text x={tx + 5} y={clamp(y) - 8.5}>{text}</text>
                                </g>
                            );
                        })}
                    </g>
                )}
                <text x={W / 2} y={464} className="nomo-foot" textAnchor="middle">
                    {off ? "Off scale: read the number, not the line" : "One straight line: T × n ÷ 9.549 = P"}
                </text>
            </svg>
        </figure>
    );
}
