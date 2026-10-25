import {
    ACTUATOR_TYPE_COLOR,
    ACTUATOR_TYPE_LABEL,
    type CanonicalJoint,
    dominantType,
    type Humanoid,
    jointLabel,
    jointsAt,
} from "../../../../src/humanoids";
import { LIMBS, NODES, RADIUS, VIEW } from "./layout";

interface Props {
    robot: Humanoid;
    selected: CanonicalJoint | null;
    onSelect: (j: CanonicalJoint | null) => void;
    // Joints of the BOM slice picked below the figure; the rest dim.
    highlight?: readonly CanonicalJoint[] | null;
}

const CX = VIEW.w / 2;

function Body() {
    return (
        <g className="hm-body" aria-hidden="true">
            <circle cx={CX} cy={34} r={19} />
            <path d={`M${CX - 8} 52 L${CX + 8} 52 L${CX + 8} 68 L${CX - 8} 68 Z`} />
            <path d={`M${CX - 40} 72 L${CX + 40} 72 L${CX + 28} 176 L${CX - 28} 176 Z`} />
            <path d={`M${CX - 30} 182 L${CX + 30} 182 L${CX + 36} 222 L${CX - 36} 222 Z`} />
            {LIMBS.map(([x1, y1, x2, y2]) => (
                <g key={`${x1}-${y1}`}>
                    <line className="hm-limb-edge" x1={x1} y1={y1} x2={x2} y2={y2} />
                    <line className="hm-limb" x1={x1} y1={y1} x2={x2} y2={y2} />
                </g>
            ))}
            {[-1, 1].map((s) => (
                <path key={s} d={`M${CX + s * 22} 372 L${CX + s * 42} 372 L${CX + s * 44} 380 L${CX + s * 20} 380 Z`} />
            ))}
        </g>
    );
}

export function Silhouette({ robot, selected, onSelect, highlight }: Props) {
    return (
        <svg
            className="hm-fig"
            viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
            role="group"
            aria-label={`${robot.name} joint map`}
        >
            <Body />
            {NODES.map((n) => {
                const joints = jointsAt(robot, n.id);
                const type = dominantType(joints);
                const sel = selected === n.id;
                const estimated = joints.every((j) => j.typeConfidence === "estimated");
                const count = joints.reduce((s, j) => s + j.count, 0);
                const big = joints.reduce((r, j) => Math.max(r, RADIUS[j.sizeClass]), 0);
                const r = type ? big : 2.4;
                const color = type ? ACTUATOR_TYPE_COLOR[type] : "var(--line-strong)";
                const label = type
                    ? `${jointLabel(n.id)}: ${count} x ${ACTUATOR_TYPE_LABEL[type]}${estimated ? " (estimated)" : ""}`
                    : `${jointLabel(n.id)}: not documented`;
                return (
                    <g
                        key={n.id}
                        className={`hm-node${sel ? " is-sel" : ""}${type ? "" : " is-empty"}${highlight && !highlight.includes(n.id) ? " is-dim" : ""}`}
                        role="button"
                        tabIndex={0}
                        aria-pressed={sel}
                        aria-label={label}
                        data-joint={n.id}
                        onClick={() => onSelect(sel ? null : n.id)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                onSelect(sel ? null : n.id);
                            }
                        }}
                    >
                        <title>{label}</title>
                        <circle className="hm-hit" cx={n.x} cy={n.y} r={9} />
                        {sel && <circle className="hm-sel" cx={n.x} cy={n.y} r={r + 3.5} />}
                        <circle
                            className="hm-dot"
                            cx={n.x}
                            cy={n.y}
                            r={estimated && type ? r - 0.8 : r}
                            fill={type && !estimated ? color : "var(--black)"}
                            stroke={color}
                            strokeWidth={estimated && type ? 1.6 : 0}
                        />
                        {n.id.endsWith("hand") && count > 1 && (
                            <text className="hm-count" x={n.x + (n.x > CX ? 10 : -10)} y={n.y + 3.5} textAnchor={n.x > CX ? "start" : "end"}>
                                x{count}
                            </text>
                        )}
                    </g>
                );
            })}
        </svg>
    );
}
