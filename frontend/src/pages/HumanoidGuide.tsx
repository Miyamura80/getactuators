import { useEffect, useMemo, useState } from "react";
import { DraftingFigure, type Project } from "../components/DraftingFigure";
import { PublicHeader } from "../components/PublicHeader";
import type { CamSpec } from "../lib/robot-art/core";
import { humanoid } from "../lib/robot-art/models";
import type { Vec3 } from "../lib/robot-art/math";
import { registerPageTools, result } from "../lib/webmcp";
import {
    HUMANOID_GUIDE_PATH,
    JOINTS,
    type Joint,
    jointShortlist,
} from "../../../src/server/agent/humanoid-joints";
import "./tools.css";

// Same text as the guide's Markdown (the server fallback and the .md twin).
const GUIDE_H1 = "Humanoid robot actuators: what each joint needs and which catalog parts reach it";
const LEDE =
    "A humanoid has no single right actuator: each joint loads its motor differently. Pick a numbered joint for its static torque estimate and the catalog parts that reach it.";

const W = 400;
const H = 520;
// Front three-quarter view of the /robots G1-class humanoid.
const CAM: CamSpec = { yaw: 1.25, pitch: 0.1, dist: 5, target: [0, 0.65, 0] };
const BOX = { x: 118, y: 44, w: 164, h: 440 };
// Arms are called out on the left of the drawing, trunk and legs on the right.
const LEFT = new Set(["shoulder", "elbow", "wrist"]);
const MODEL_NAME: Record<string, string> = {
    shoulder: "SHOULDER",
    elbow: "ELBOW",
    wrist: "WRIST",
    waist: "WAIST",
    hip: "HIP",
    knee: "KNEE",
    ankle: "ANKLE",
};

// The joint on the drawing a balloon points at: the matching actuator (or the
// hand anchor for the wrist) on the side its column sits.
function anchorFor(j: Joint, scene: ReturnType<typeof humanoid>, project: Project): [number, number] {
    const name = MODEL_NAME[j.id];
    const points: Vec3[] = [
        ...scene.motors.filter((m) => m.jn === name).map((m) => m.c),
        ...scene.anchors.filter((a) => a.text === name).map((a) => a.p),
    ];
    const screen = points.map(project).sort((a, b) => a[0] - b[0]);
    const pick = LEFT.has(j.id) ? screen[0] : screen[screen.length - 1];
    return pick ?? [W / 2, H / 2];
}

// Which joint is under the pointer or keyboard focus, shared by the drawing
// and the bill of joints so pointing at one inks its twin.
interface Focus {
    focus: string | null;
    setFocus: (id: string | null) => void;
}

function focusHandlers(id: string, setFocus: Focus["setFocus"]) {
    return {
        onMouseEnter: () => setFocus(id),
        onMouseLeave: () => setFocus(null),
        onFocus: () => setFocus(id),
        onBlur: () => setFocus(null),
    };
}

function Callouts({
    scene,
    project,
    focus,
    setFocus,
}: { scene: ReturnType<typeof humanoid>; project: Project } & Focus) {
    const used: Record<"l" | "r", number[]> = { l: [], r: [] };
    return (
        <>
            <text className="jm-head" x={10} y={18}>
                {JOINTS.length} JOINTS
            </text>
            <text className="jm-sub" x={10} y={29}>
                STATIC ESTIMATES · 50 KG REFERENCE
            </text>
            {JOINTS.map((j) => {
                const [x, y] = anchorFor(j, scene, project);
                const left = LEFT.has(j.id);
                // Keep balloons at least 30 units apart down each column.
                const col = used[left ? "l" : "r"];
                let by = y;
                while (col.some((u) => Math.abs(u - by) < 30)) by += 30;
                col.push(by);
                const bx = left ? 22 : W - 22;
                const knee = left ? bx + 14 : bx - 14;
                return (
                    <a
                        key={j.id}
                        className={`jm-callout jm-${j.id}${focus === j.id ? " on" : ""}`}
                        href={`#${j.id}`}
                        {...focusHandlers(j.id, setFocus)}
                        aria-label={`${j.n}. ${j.name}: ${j.torqueNm.toFixed(1)} N·m static estimate`}
                    >
                        <path className="jm-leader" d={`M${x} ${y}L${x + (left ? -8 : 8)} ${by}H${knee}`} />
                        <circle className="jm-dot" cx={x} cy={y} r={2} />
                        <circle className="jm-ring" cx={x} cy={y} r={7} />
                        <text className="jm-name" x={left ? knee + 3 : knee - 3} y={by - 4} textAnchor={left ? "start" : "end"}>
                            {j.name.toUpperCase()}
                        </text>
                        <text className="jm-val-label" x={left ? knee + 3 : knee - 3} y={by + 10} textAnchor={left ? "start" : "end"}>
                            {j.torqueNm.toFixed(1)} N·m
                        </text>
                        <circle className="jm-balloon" cx={bx} cy={by} r={13} />
                        <text className="jm-n" x={bx} y={by + 4.5} textAnchor="middle">
                            {j.n}
                        </text>
                    </a>
                );
            })}
        </>
    );
}

// One pip per passing catalog entry: filled when its rated torque covers the
// joint, hollow when only its peak does. No rated fit gets a warning mark.
function ScreenPips({ total, rated }: { total: number; rated: number }) {
    const label = total
        ? `${total} pass: ${rated} rated, ${total - rated} peak only`
        : "No catalog entry documents this torque";
    const w = 7;
    return (
        <span className="jm-pips" title={label}>
            <svg viewBox={`0 0 ${Math.max(total, 1) * w + 18} 14`} height={14} width={Math.max(total, 1) * w + 18} role="img" aria-label={label}>
                {!rated && <path className="jm-warn" d="M6 1.5L11.5 12.5H0.5Z M6 5.5V8.5 M6 10.4V10.6" />}
                {Array.from({ length: total }, (_, i) => (
                    <rect
                        // biome-ignore lint/suspicious/noArrayIndexKey: pips are interchangeable marks.
                        key={i}
                        className={i < rated ? "jm-pip rated" : "jm-pip"}
                        x={(rated ? 0 : 16) + i * w}
                        y={2}
                        width={w - 2.5}
                        height={10}
                    />
                ))}
            </svg>
            <span className="jm-pips-n" aria-hidden="true">{total}</span>
        </span>
    );
}

function BillOfJoints({ focus, setFocus }: Focus) {
    return (
        <table className="jm-bom">
            <caption>Bill of joints · static estimates</caption>
            <thead>
                <tr>
                    <th scope="col">#</th>
                    <th scope="col">Joint</th>
                    <th scope="col">N·m</th>
                    <th scope="col">Catalog screen</th>
                </tr>
            </thead>
            <tbody>
                {JOINTS.map((j) => {
                    const list = jointShortlist(j, Number.POSITIVE_INFINITY);
                    const rated = list.rows.filter((r) => r.torque === "rated").length;
                    return (
                        <tr key={j.id} className={`jm-${j.id}${focus === j.id ? " on" : ""}`} {...focusHandlers(j.id, setFocus)}>
                            <td>
                                <a href={`#${j.id}`} className="jm-num" aria-label={`Joint ${j.n}`}>
                                    {j.n}
                                </a>
                            </td>
                            <th scope="row">
                                <a href={`#${j.id}`}>{j.name}</a>
                            </th>
                            <td className="jm-val">{j.torqueNm.toFixed(1)}</td>
                            <td>
                                <ScreenPips total={list.total} rated={rated} />
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}

export function HumanoidGuide({ menuOpen = false }: { menuOpen?: boolean }) {
    const scene = useMemo(() => humanoid(), []);
    const [focus, setFocus] = useState<string | null>(null);

    // WebMCP: let an in-browser agent bring a joint's section into view.
    useEffect(
        () =>
            registerPageTools([
                {
                    name: "show_humanoid_joint",
                    title: "Show a joint",
                    description:
                        "Scroll this guide to one joint's section (estimate, pose, working and shortlist) and highlight it on the joint map.",
                    annotations: { readOnlyHint: true },
                    inputSchema: {
                        type: "object",
                        properties: { joint: { type: "string", enum: JOINTS.map((j) => j.id) } },
                        required: ["joint"],
                    },
                    async execute(args) {
                        const j = JOINTS.find((x) => x.id === args.joint);
                        if (!j) return result({ error: "Unknown joint", joints: JOINTS.map((x) => x.id) }, true);
                        window.location.hash = j.id;
                        return result({ shown: j.id, section: window.location.href });
                    },
                },
            ]),
        [],
    );

    return (
        <div className="tool-page">
            <PublicHeader path={HUMANOID_GUIDE_PATH} initialOpen={menuOpen} />
            <main className="tool-main">
                <header className="tool-head">
                    <p className="tool-kicker">Guide · joint by joint</p>
                    <h1>{GUIDE_H1}</h1>
                    <p className="tool-lede">{LEDE}</p>
                </header>
                <div className="jm" data-focus={focus ?? undefined}>
                    <DraftingFigure
                        scene={scene}
                        cam={CAM}
                        box={BOX}
                        W={W}
                        H={H}
                        label="Humanoid joint map: seven numbered joints, each linking to its section"
                        overlay={(project) => <Callouts scene={scene} project={project} focus={focus} setFocus={setFocus} />}
                    />
                    <div className="jm-side">
                        <BillOfJoints focus={focus} setFocus={setFocus} />
                        <details className="req-key jm-key">
                            <summary>
                                <svg viewBox="0 0 16 16" width={14} height={14} aria-hidden="true">
                                    <circle cx="8" cy="8" r="6.5" />
                                    <path d="M8 7v4.5M8 4.6v.1" />
                                </svg>
                                Key
                            </summary>
                            <dl>
                                <div>
                                    <dt><ScreenPips total={3} rated={2} /></dt>
                                    <dd>One pip per humanoid-tagged entry that reaches the estimate: filled if its rated torque does, hollow if only its peak does.</dd>
                                </div>
                                <div>
                                    <dt><ScreenPips total={2} rated={0} /></dt>
                                    <dd>No rated fit: peak only, short duty.</dd>
                                </div>
                            </dl>
                            <p>
                                Estimates are static, for a hypothetical 1.5 m, 50 kg robot. Gait, stairs and impacts
                                add dynamic load on top. Undocumented values stay unknown.
                            </p>
                        </details>
                    </div>
                </div>
                <a className="tool-method-link" href="#how-to-read-this-guide">
                    Read the joint-by-joint guide ↓
                </a>
            </main>
        </div>
    );
}
