import type { ResolvedJoint } from "../lib/robots";
import { num } from "../lib/format";
import "../pages/tools.css";

// A robot's documented joint loadout drawn in the arm diagram's vocabulary:
// a base, a chain of joint housings sized by motor mass, and a numbered
// balloon per joint group that matches the loadout list below it. Spacing is
// schematic; only reach and payload are dimensions from the data.

const X0 = 52;
const X1 = 316;
const Y = 58;

export function RobotJointChain({
    joints,
    reachMm,
    payloadKg,
    name,
}: {
    joints: ResolvedJoint[];
    reachMm: number | null;
    payloadKg: number | null;
    name: string;
}) {
    const expanded = joints.flatMap((j, g) => Array.from({ length: j.count }, () => ({ group: g, joint: j })));
    if (!expanded.length) return null;
    const step = (X1 - X0) / expanded.length;
    const heaviest = Math.max(...joints.map((j) => j.motor.weight_g ?? 0), 1);
    const xs = expanded.map((_, k) => X0 + step * (k + 0.25));
    const label = `${name} joint chain: ${joints.map((j, g) => `${g + 1}. ${j.count} × ${j.motor.name} (${j.role})`).join("; ")}`;
    return (
        <figure className="chain-fig">
            <svg viewBox="0 0 340 128" role="img" aria-label={label}>
                <path className="arm-pedestal" d={`M${X0 - 30} 104V${Y - 8}h22V104`} />
                <path className="arm-ground" d={`M${X0 - 38} 104H${X0}`} />
                {reachMm != null && (
                    <g className="arm-dim">
                        <path d={`M${X0} ${Y - 18}V${Y - 30}M${X1} ${Y - 18}V${Y - 30}M${X0} ${Y - 24}H${X1}`} />
                        <text x={(X0 + X1) / 2} y={Y - 30} textAnchor="middle">
                            {num(reachMm)} mm reach
                        </text>
                    </g>
                )}
                <rect className="arm-link" x={X0 - 8} y={Y - 5} width={X1 - X0 + 8} height={10} />
                {joints.map((j, g) => {
                    const ks = expanded.flatMap((e, k) => (e.group === g ? [k] : []));
                    const a = xs[ks[0] ?? 0] ?? X0;
                    const b = xs[ks[ks.length - 1] ?? 0] ?? X0;
                    const mid = (a + b) / 2;
                    return (
                        <g key={j.role} className="chain-group">
                            <path className="chain-bracket" d={`M${a - 6} ${Y + 18}v6H${b + 6}v-6M${mid} ${Y + 24}v8`} />
                            <circle className="jm-balloon" cx={mid} cy={Y + 44} r={10} />
                            <text className="chain-num" x={mid} y={Y + 48} textAnchor="middle">
                                {g + 1}
                            </text>
                        </g>
                    );
                })}
                {expanded.map((e, k) => {
                    const r = 4 + 7 * ((e.joint.motor.weight_g ?? 0) / heaviest);
                    return (
                        <g key={k}>
                            <circle className="arm-housing" cx={xs[k]} cy={Y} r={r} />
                            <circle className="arm-shaft" cx={xs[k]} cy={Y} r={2} />
                        </g>
                    );
                })}
                {payloadKg != null && (
                    <g className="chain-payload">
                        <rect className="arm-payload" x={X1 - 7} y={Y - 7} width={14} height={14} />
                        <text x={X1} y={Y + 24} textAnchor="middle">
                            {num(payloadKg, 1)} kg
                        </text>
                    </g>
                )}
            </svg>
            <figcaption>Schematic: joint spacing not to scale · housing size follows motor mass</figcaption>
        </figure>
    );
}
