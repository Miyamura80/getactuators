import { useMemo } from "react";
import type { Arm, JointLoad } from "../../../src/engineering/arm-torque";
import { jointName, pointMasses } from "../../../src/engineering/arm-torque";
import type { CamSpec } from "../lib/robot-art/core";
import { freeBodyArm } from "../lib/robot-art/free-body";
import { fmt } from "../lib/motor-torque";
import { DraftingFigure, type Project } from "./DraftingFigure";

// The arm held horizontal, drawn by the /robots X-ray renderer from the
// calculator's own model. The overlay uses the humanoid map's language:
// numbered joint callouts with their holding torque above, link dimensions
// on top, and one load arrow per point mass dropping to a label rail below.

const W = 640;
const H = 300;
const BOX = { x: 48, y: 126, w: 544, h: 120, ay: 0.5 };
const CAM_BASE = { yaw: 0.3, pitch: 0.16 };

interface Load {
    kg: number;
    x: number;
    y: number;
    payload: boolean;
}

// Labels sit on rails under the arm: each takes the first rail where it
// clears every label already there, so crowded wrists stack neatly.
function railLoads(loads: Load[], rail: number) {
    const rows: number[][] = [];
    return loads
        .filter((p) => p.kg > 0)
        .map((l) => {
            let row = rows.findIndex((xs) => xs.every((x) => Math.abs(l.x - x) >= 46));
            if (row < 0) row = rows.push([]) - 1;
            rows[row]?.push(l.x);
            return { ...l, labelY: rail + row * 15 };
        });
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
    const joints = geo.joints.map(project);
    const tipX = project(geo.tip)[0];
    const armTop = Math.min(...joints.map(([, y]) => y));
    const dimY = armTop - 92;
    const balloonY = armTop - 54;
    const below = project([geo.length / 2, geo.underside, 0])[1];
    const masses = pointMasses(arm);
    const rail = railLoads(
        masses.map((m, i) => {
            const [x, y] = project([m.x, geo.height, 0]);
            return { kg: m.kg, x, y, payload: i === masses.length - 1 };
        }),
        below + 44,
    );
    const stations = [...joints.map(([x]) => x), tipX];

    return (
        <>
            <text className="jm-head" x={12} y={20}>
                {n} PITCH JOINTS · HELD HORIZONTAL
            </text>
            <text className="jm-sub" x={12} y={31}>
                GRAVITY ONLY · LINK MASS AT {Math.round(arm.comFraction * 100)}% OF EACH LINK
            </text>

            {arm.links.map((l, i) => {
                const a = stations[i] ?? 0;
                const b = stations[i + 1] ?? a;
                return (
                    <g key={`dim-${i}`} className="fb-dim">
                        <path d={`M${a} ${dimY + 5}V${dimY - 5}M${b} ${dimY + 5}V${dimY - 5}M${a} ${dimY}H${b}`} />
                        <text x={(a + b) / 2} y={dimY - 5} textAnchor="middle">
                            {fmt(l.length)} m
                        </text>
                    </g>
                );
            })}

            {rail.map((l, i) => (
                <g key={`load-${i}`} className={l.payload ? "fb-load payload" : "fb-load"}>
                    <circle cx={l.x} cy={l.y} r={2} />
                    <path d={`M${l.x} ${l.y + 3}V${l.labelY - 12}m-3 -5l3 5l3 -5`} />
                </g>
            ))}
            {rail.map((l, i) => (
                <text key={`load-label-${i}`} className={l.payload ? "fb-load-label payload" : "fb-load-label"} x={l.x} y={l.labelY} textAnchor="middle">
                    {fmt(l.kg)} kg
                </text>
            ))}

            {loads.map((l, i) => {
                const [cx, cy] = joints[i] ?? [0, 0];
                const on = i === active;
                const name = jointName(i, n).toUpperCase();
                // Flip the label left when the next joint's balloon is close.
                const nextX = joints[i + 1]?.[0];
                const left = nextX !== undefined && nextX - cx < 110;
                const lx = left ? cx - 17 : cx + 17;
                const anchor = left ? "end" : "start";
                return (
                    // biome-ignore lint/a11y/useSemanticElements: an SVG group cannot be a <button>; it carries role, tabIndex and key handling.
                    <g
                        key={`j-${i}`}
                        className={on ? "jm-callout fb-joint on" : "jm-callout fb-joint"}
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
                        <circle className="fb-hit" cx={cx} cy={(cy + balloonY) / 2} r={30} />
                        <path className="jm-leader" d={`M${cx} ${balloonY + 12}V${cy}`} />
                        <circle className="jm-dot" cx={cx} cy={cy} r={2} />
                        <circle className="jm-balloon" cx={cx} cy={balloonY} r={12} />
                        <text className="jm-n" x={cx} y={balloonY + 4.5} textAnchor="middle">
                            {i + 1}
                        </text>
                        <text className="jm-name" x={lx} y={balloonY - 2} textAnchor={anchor}>
                            {name}
                        </text>
                        <text className="jm-val-label" x={lx} y={balloonY + 10} textAnchor={anchor}>
                            {fmt(l.torqueNm)} N·m
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
        const span = Math.max(geo.length, 0.35);
        return { ...CAM_BASE, dist: span * 3.2, target: [span * 0.45, geo.height * 0.7, 0] };
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
