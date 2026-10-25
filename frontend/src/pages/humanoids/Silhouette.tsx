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
import { ELEMENT_COLOR, ELEMENT_NAME, type Element, type Grams, gramText, sum } from "./ree";

// Temporary rare-earth mode (?reeviz=B): dots sized by grams at the joint.
export interface ReeMode {
    el: Element | "all";
    grams: Map<CanonicalJoint, Grams>;
    max: number;
}

export const reeRadius = (g: number, max: number) => (g > 0 ? 2.2 + 9 * Math.sqrt(g / max) : 1.6);
export const reeOf = (g: Grams | undefined, el: Element | "all") => (!g ? 0 : el === "all" ? sum(g, "mid") : g[el].mid);

interface Props {
    robot: Humanoid;
    selected: CanonicalJoint | null;
    onSelect: (j: CanonicalJoint | null) => void;
    // Joints of the BOM slice picked below the figure; the rest dim.
    highlight?: readonly CanonicalJoint[] | null;
    ree?: ReeMode | null;
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

export function Silhouette({ robot, selected, onSelect, highlight, ree }: Props) {
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
                const reeG = ree ? reeOf(ree.grams.get(n.id), ree.el) : 0;
                const label = ree
                    ? `${jointLabel(n.id)}: ${gramText(reeG)} of ${ree.el === "all" ? "rare earth" : ELEMENT_NAME[ree.el]}, estimated`
                    : type
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
                        {ree ? (
                            <circle
                                className="hm-dot"
                                cx={n.x}
                                cy={n.y}
                                r={reeRadius(reeG, ree.max)}
                                fill={reeG > 0 ? ELEMENT_COLOR[ree.el === "all" ? "nd" : ree.el] : "var(--line-strong)"}
                                fillOpacity={0.9}
                            />
                        ) : (
                            <circle
                                className="hm-dot"
                                cx={n.x}
                                cy={n.y}
                                r={estimated && type ? r - 0.8 : r}
                                fill={type && !estimated ? color : "var(--black)"}
                                stroke={color}
                                strokeWidth={estimated && type ? 1.6 : 0}
                            />
                        )}
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
