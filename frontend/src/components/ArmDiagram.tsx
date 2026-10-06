import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import type { Arm, JointLoad } from "../../../src/engineering/arm-torque";
import { jointName, pointMasses } from "../../../src/engineering/arm-torque";
import type { CamSpec } from "../lib/robot-art/core";
import { freeBodyArm } from "../lib/robot-art/free-body";
import { fmt } from "../lib/motor-torque";
import { DraftingFigure, type Project } from "./DraftingFigure";

// The arm held horizontal, drawn by the /robots X-ray renderer from the
// calculator's own model. The overlay uses the humanoid map's language:
// numbered joint callouts with their holding torque, link dimensions on top,
// and one load arrow per point mass dropping to label rails below.

const W = 640;
const H = 320;
const BOX = { x: 48, y: 140, w: 544, h: 150, ay: 0.4 };

type Geo = ReturnType<typeof freeBodyArm>;

interface Props {
    arm: Arm;
    loads: JointLoad[];
    active: number;
    onSelect: (i: number) => void;
}

interface Load {
    kg: number;
    x: number;
    y: number;
    payload: boolean;
}

// Each label takes the first rail where it clears every label already there,
// so crowded wrists stack neatly.
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

function JointButton({
    i,
    n,
    load,
    active,
    onSelect,
    children,
}: {
    i: number;
    n: number;
    load: JointLoad;
    active: number;
    onSelect: (i: number) => void;
    children: ReactNode;
}) {
    return (
        // biome-ignore lint/a11y/useSemanticElements: an SVG group cannot be a <button>; it carries role, tabIndex and key handling.
        <g
            className={i === active ? "jm-callout fb-joint on" : "jm-callout fb-joint"}
            role="button"
            tabIndex={0}
            aria-label={`${jointName(i, n)}: ${fmt(load.torqueNm)} N·m. Show actuators`}
            aria-pressed={i === active}
            onClick={() => onSelect(i)}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(i);
                }
            }}
        >
            {children}
        </g>
    );
}

// Numbered balloon above a joint, name and torque beside it. The label flips
// left when the next joint's balloon is close.
function Balloon({
    cx,
    cy,
    by,
    i,
    n,
    load,
    left,
}: {
    cx: number;
    cy: number;
    by: number;
    i: number;
    n: number;
    load: JointLoad;
    left: boolean;
}) {
    const lx = left ? cx - 17 : cx + 17;
    const anchor = left ? "end" : "start";
    return (
        <>
            <circle className="fb-hit" cx={cx} cy={(cy + by) / 2} r={28} />
            <path className="jm-leader" d={`M${cx} ${by + 12}V${cy}`} />
            <circle className="jm-dot" cx={cx} cy={cy} r={2} />
            <circle className="jm-balloon" cx={cx} cy={by} r={12} />
            <text className="jm-n" x={cx} y={by + 4.5} textAnchor="middle">
                {i + 1}
            </text>
            <text className="jm-name" x={lx} y={by - 2} textAnchor={anchor}>
                {jointName(i, n).toUpperCase()}
            </text>
            <text className="jm-val-label" x={lx} y={by + 10} textAnchor={anchor}>
                {fmt(load.torqueNm)} N·m
            </text>
        </>
    );
}

function Overlay({ arm, loads, active, onSelect, project, geo }: Props & { project: Project; geo: Geo }) {
    const n = arm.links.length;
    const joints = geo.joints.map(project);
    const tipX = project(geo.tip)[0];
    const top = Math.min(...joints.map(([, y]) => y));
    const below = project([geo.length / 2, geo.underside, 0])[1];
    const stations = [...joints.map(([x]) => x), tipX];
    const masses = pointMasses(arm);
    const rail = railLoads(
        masses.map((m, i) => {
            const [x, y] = project([m.x, geo.height, 0]);
            return { kg: m.kg, x, y, payload: i === masses.length - 1 };
        }),
        below + 40,
    );
    return (
        <>
            <text className="jm-head" x={12} y={20}>
                {n} PITCH JOINTS · HELD HORIZONTAL
            </text>

            {arm.links.map((l, i) => {
                const a = stations[i] ?? 0;
                const b = stations[i + 1] ?? a;
                const y = top - 100;
                return (
                    <g key={`dim-${i}`} className="fb-dim">
                        <path d={`M${a} ${y + 5}V${y - 5}M${b} ${y + 5}V${y - 5}M${a} ${y}H${b}`} />
                        <text x={(a + b) / 2} y={y - 5} textAnchor="middle">
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
                <text
                    key={`load-label-${i}`}
                    className={l.payload ? "fb-load-label payload" : "fb-load-label"}
                    x={l.x}
                    y={l.labelY}
                    textAnchor="middle"
                >
                    {fmt(l.kg)} kg
                </text>
            ))}

            {loads.map((l, i) => {
                const [cx, cy] = joints[i] ?? [0, 0];
                const next = joints[i + 1]?.[0];
                return (
                    <JointButton key={i} i={i} n={n} load={l} active={active} onSelect={onSelect}>
                        <Balloon cx={cx} cy={cy} by={top - 58} i={i} n={n} load={l} left={next !== undefined && next - cx < 110} />
                    </JointButton>
                );
            })}
        </>
    );
}

export function ArmDiagram({ arm, loads, active, onSelect }: Props) {
    const geo = useMemo(() => freeBodyArm(arm), [arm]);
    const cam = useMemo<CamSpec>(() => {
        const span = Math.max(geo.length, 0.35);
        return { yaw: 0.3, pitch: 0.16, dist: span * 3.2, target: [span * 0.45, geo.height * 0.7, 0] };
    }, [geo]);
    const n = arm.links.length;
    const label = `Free-body diagram: ${loads.map((l, i) => `${jointName(i, n)} ${fmt(l.torqueNm)} N·m`).join(", ")}`;
    // On narrow screens the drawing keeps its scale and scrolls sideways; the
    // edges fade where more of the arm lies beyond them.
    const scroller = useRef<HTMLDivElement>(null);
    const [edges, setEdges] = useState({ left: false, right: false });
    useEffect(() => {
        const el = scroller.current;
        if (!el) return;
        const update = () =>
            setEdges({ left: el.scrollLeft > 2, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2 });
        update();
        el.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", update);
        return () => {
            el.removeEventListener("scroll", update);
            window.removeEventListener("resize", update);
        };
    }, []);
    const cls = ["arm-fig", edges.left && "more-left", edges.right && "more-right"].filter(Boolean).join(" ");
    return (
        <div className="arm-fig-frame">
        {/* biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region must be reachable by keyboard. */}
        <div className={cls} ref={scroller} tabIndex={edges.left || edges.right ? 0 : undefined} role="region" aria-label="Arm diagram, scrolls sideways">
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
            {edges.right && !edges.left && (
                <span className="arm-swipe" aria-hidden="true">
                    <svg viewBox="0 0 24 12" width={24} height={12}>
                        <path d="M1 6h21M17 1.5l5 4.5l-5 4.5" />
                    </svg>
                </span>
            )}
        </div>
    );
}
