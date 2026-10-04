import type { Arm, JointLoad } from "../lib/arm-torque";
import { jointName, pointMasses } from "../lib/arm-torque";
import { fmt } from "../lib/motor-torque";

// A free-body diagram of the arm held horizontal: links to scale, a weight
// arrow at every point mass, and the holding moment at each joint. The
// drawing is the model: every arrow is one term of the torque sum.

const W = 640;
const X0 = 70;
const SPAN = 500;
const Y = 96;
const GROUND = 220;
const H = 246;
const BAR = 12;

export function ArmDiagram({
    arm,
    loads,
    active,
    onSelect,
}: {
    arm: Arm;
    loads: JointLoad[];
    active: number;
    onSelect: (i: number) => void;
}) {
    const total = arm.links.reduce((s, l) => s + l.length, 0) || 1;
    const k = SPAN / total;
    const px = (x: number) => X0 + x * k;
    const masses = pointMasses(arm);
    const heaviest = Math.max(...masses.map((m) => m.kg), 0.001);
    const tip = px(total);
    const weights: { m: (typeof masses)[number]; x: number; drop: number; last: boolean }[] = [];
    let prevX = Number.NEGATIVE_INFINITY;
    let prevDrop = 0;
    masses.forEach((m, i) => {
        if (m.kg <= 0) return;
        const x = px(m.x);
        const base = 16 + 40 * Math.sqrt(m.kg / heaviest);
        const drop = x - prevX < 48 ? Math.max(base, prevDrop + 20) : base;
        weights.push({ m, x, drop, last: i === masses.length - 1 });
        prevX = x;
        prevDrop = drop;
    });
    const n = arm.links.length;
    const label = `Free-body diagram: ${loads.map((l, i) => `${jointName(i, n)} ${fmt(l.torqueNm)} N·m`).join(", ")}`;

    return (
        <figure className="arm-fig">
            <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
                <defs>
                    <marker id="arm-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
                        <path d="M0 0L8 4L0 8z" className="arm-arrowhead" />
                    </marker>
                    <marker id="arm-turn" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                        <path d="M0 0L8 4L0 8z" className="arm-turnhead" />
                    </marker>
                </defs>

                {/* Ground and pedestal */}
                <path className="arm-ground" d={`M${X0 - 46} ${GROUND}H${X0 + 46}`} />
                {[0, 1, 2, 3, 4, 5].map((i) => (
                    <path key={i} className="arm-hatch" d={`M${X0 - 40 + i * 16} ${GROUND}l-10 10`} />
                ))}
                <path className="arm-pedestal" d={`M${X0 - 16} ${GROUND}V${Y + 16}h32V${GROUND}`} />

                {/* Length dimensions above the arm */}
                {arm.links.map((l, i) => {
                    const a = px(arm.links.slice(0, i).reduce((s, x) => s + x.length, 0));
                    const b = a + l.length * k;
                    return (
                        <g key={`dim-${i}`} className="arm-dim">
                            <path d={`M${a} ${Y - 30}V${Y - 44}M${b} ${Y - 30}V${Y - 44}M${a} ${Y - 38}H${b}`} />
                            <text x={(a + b) / 2} y={Y - 46} textAnchor="middle">{fmt(l.length)} m</text>
                        </g>
                    );
                })}

                {/* Links */}
                <rect className="arm-link" x={X0} y={Y - BAR / 2} width={SPAN} height={BAR} />

                {/* Weight arrows: one per point mass, length grows with mass.
                    Labels step down when masses crowd together. */}
                {weights.map(({ x, drop, last }, i) => (
                    <g key={`w-${i}`} className={last ? "arm-weight payload" : "arm-weight"}>
                        <circle cx={x} cy={Y} r={2.5} />
                        <path d={`M${x} ${Y + BAR}V${Y + BAR + drop}`} markerEnd="url(#arm-arrow)" />
                    </g>
                ))}
                {/* Labels after every arrow, with a halo, so no line strikes through them. */}
                {weights.map(({ m, x, drop, last }, i) => (
                    <text key={`wl-${i}`} className={last ? "arm-wlabel payload" : "arm-wlabel"} x={x + 5} y={Y + BAR + drop + 12}>
                        {fmt(m.kg)} kg
                    </text>
                ))}

                {/* Payload block at the tip */}
                <rect className="arm-payload" x={tip - 9} y={Y - 9} width={18} height={18} />

                {/* Joints with their holding moment */}
                {loads.map((l, i) => {
                    const cx = px(l.x);
                    const on = i === active;
                    return (
                        <g
                            key={`j-${i}`}
                            className={on ? "arm-joint on" : "arm-joint"}
                            role="button"
                            tabIndex={0}
                            aria-label={`${jointName(i, n)}: ${fmt(l.torqueNm)} N·m. Show actuators`}
                            aria-pressed={on}
                            onClick={() => onSelect(i)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    onSelect(i);
                                }
                            }}
                        >
                            <circle className="arm-hit" cx={cx} cy={Y} r={26} />
                            <path className="arm-moment" d={`M${cx - 17} ${Y - 9}A19 19 0 1 1 ${cx + 9} ${Y + 17}`} markerEnd="url(#arm-turn)" />
                            <circle className="arm-housing" cx={cx} cy={Y} r={11} />
                            <circle className="arm-shaft" cx={cx} cy={Y} r={3.5} />
                            <text className="arm-tau" x={cx} y={Y - 62} textAnchor="middle">
                                τ{i + 1} {fmt(l.torqueNm)} N·m
                            </text>
                        </g>
                    );
                })}
                <text className="arm-caption" x={W / 2} y={H - 4} textAnchor="middle">
                    Arm held horizontal · gravity only · link mass at {Math.round(arm.comFraction * 100)}% of each link
                </text>
            </svg>
        </figure>
    );
}
