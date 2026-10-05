import { useMemo } from "react";
import type { Arm, JointLoad } from "../../../src/engineering/arm-torque";
import { jointName, pointMasses } from "../../../src/engineering/arm-torque";
import type { CamSpec } from "../lib/robot-art/core";
import { freeBodyArm } from "../lib/robot-art/free-body";
import { fmt } from "../lib/motor-torque";
import { DraftingFigure, type Project } from "./DraftingFigure";

// The arm held horizontal, drawn by the /robots X-ray renderer from the
// calculator's own model, with the free-body diagram on top: a weight arrow
// at every point mass and the holding moment at each joint. Each arrow is one
// term of the torque sum.

const W = 640;
const H = 320;
const BOX = { x: 40, y: 112, w: 560, h: 196, ay: 0.4 };

interface Weight {
    kg: number;
    x: number;
    y: number;
    last: boolean;
}

// Arrow length grows with mass; crowded arrows step down, and a label runs
// left of its arrow when the next arrow would cross it.
function layoutWeights(points: Weight[]) {
    const shown = points.filter((p) => p.kg > 0);
    const heaviest = Math.max(...shown.map((p) => p.kg), 0.001);
    const out: (Weight & { drop: number; left: boolean })[] = [];
    for (const [i, p] of shown.entries()) {
        const prev = out[i - 1];
        const base = 18 + 34 * Math.sqrt(p.kg / heaviest);
        const drop = prev && p.x - prev.x < 46 ? Math.max(base, prev.drop + 18) : base;
        const next = shown[i + 1];
        out.push({ ...p, drop, left: Boolean(next && next.x - p.x < 46) });
    }
    return out;
}

function Overlay({
    arm,
    loads,
    active,
    onSelect,
    project,
    geo,
}: {
    arm: Arm;
    loads: JointLoad[];
    active: number;
    onSelect: (i: number) => void;
    project: Project;
    geo: ReturnType<typeof freeBodyArm>;
}) {
    const n = arm.links.length;
    const at = (x: number) => project([x, geo.height, 0]);
    const masses = pointMasses(arm);
    const top = Math.min(...geo.joints.map((j) => project(j)[1])) - 66;
    // Dimension stations: every joint, then the tip.
    const stations = [...geo.joints.map((j) => project(j)[0]), project(geo.tip)[0]];
    const weights = layoutWeights(
        masses.map((m, i) => {
            const last = i === masses.length - 1;
            const [x, y] = last ? project(geo.payload) : at(m.x);
            return { kg: m.kg, x, y, last };
        }),
    );
    return (
        <>
            <text className="jm-head" x={12} y={20}>
                {n} PITCH JOINTS · HELD HORIZONTAL
            </text>
            <text className="jm-sub" x={12} y={32}>
                GRAVITY ONLY · LINK MASS AT {Math.round(arm.comFraction * 100)}% OF EACH LINK
            </text>
            {arm.links.map((l, i) => {
                const a = stations[i] ?? 0;
                const b = stations[i + 1] ?? a;
                return (
                    <g key={`dim-${i}`} className="fb-dim">
                        <path d={`M${a} ${top + 6}V${top - 6}M${b} ${top + 6}V${top - 6}M${a} ${top}H${b}`} />
                        <text x={(a + b) / 2} y={top - 5} textAnchor="middle">
                            {fmt(l.length)} m
                        </text>
                    </g>
                );
            })}
            {weights.map((w, i) => (
                <g key={`w-${i}`} className={w.last ? "fb-weight payload" : "fb-weight"}>
                    <circle cx={w.x} cy={w.y} r={1.8} />
                    <path d={`M${w.x} ${w.y + 4}V${w.y + w.drop}m-3.5 -6l3.5 6l3.5 -6`} />
                </g>
            ))}
            {weights.map((w, i) => (
                <text
                    key={`wl-${i}`}
                    className={w.last ? "fb-wlabel payload" : "fb-wlabel"}
                    x={w.left ? w.x - 5 : w.x + 5}
                    y={w.y + w.drop + 11}
                    textAnchor={w.left ? "end" : "start"}
                >
                    {fmt(w.kg)} kg
                </text>
            ))}
            {loads.map((l, i) => {
                const [cx, cy] = project(geo.joints[i] ?? [0, 0, 0]);
                const on = i === active;
                return (
                    // biome-ignore lint/a11y/useSemanticElements: an SVG group cannot be a <button>; it carries role, tabIndex and key handling.
                    <g
                        key={`j-${i}`}
                        className={on ? "fb-joint on" : "fb-joint"}
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
                        <circle className="fb-hit" cx={cx} cy={cy} r={24} />
                        <circle className="fb-ring" cx={cx} cy={cy} r={20} />
                        <path className="fb-lead" d={`M${cx} ${cy - 20}V${top + 32}`} />
                        <text className="fb-tau" x={cx} y={top + 26} textAnchor="middle">
                            τ{i + 1} {fmt(l.torqueNm)} N·m
                        </text>
                    </g>
                );
            })}
        </>
    );
}

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
    const geo = useMemo(() => freeBodyArm(arm), [arm]);
    const cam = useMemo<CamSpec>(() => {
        const span = Math.max(geo.length, 0.4);
        return { yaw: 0.32, pitch: 0.14, dist: span * 2.8, target: [span / 2, geo.height * 0.6, 0] };
    }, [geo]);
    const n = arm.links.length;
    const label = `Free-body diagram: ${loads.map((l, i) => `${jointName(i, n)} ${fmt(l.torqueNm)} N·m`).join(", ")}`;
    return (
        <div className="arm-fig">
            <DraftingFigure
                scene={geo.scene}
                cam={cam}
                box={BOX}
                W={W}
                H={H}
                label={label}
                overlay={(project) => (
                    <Overlay arm={arm} loads={loads} active={active} onSelect={onSelect} project={project} geo={geo} />
                )}
            />
        </div>
    );
}
