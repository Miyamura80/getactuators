import type { Humanoid } from "../../../../src/humanoids";
import {
    ELEMENT_COLOR,
    ELEMENT_NAME,
    ELEMENT_SYMBOL,
    ELEMENTS,
    type Element,
    fleetGrams,
    type Grams,
    gramsByJoint,
    gramText,
    niceAxis,
    robotGrams,
    sum,
} from "./ree";
import { reeRadius } from "./Silhouette";

// Temporary: four ways to plot rare-earth grams, picked with ?reeviz=A|B|C|D.

export type ReeViz = "A" | "B" | "C" | "D";

export function readReeViz(): ReeViz | null {
    const v = new URLSearchParams(window.location.search).get("reeviz")?.toUpperCase();
    return v === "A" || v === "B" || v === "C" || v === "D" ? v : null;
}

function Key({ grams }: { grams?: Grams }) {
    return (
        <div className="ree-key">
            {ELEMENTS.map((el) => (
                <span key={el}>
                    <i style={{ background: ELEMENT_COLOR[el] }} />
                    {grams ? (
                        <>
                            <b>{ELEMENT_SYMBOL[el]}</b> {ELEMENT_NAME[el]} {gramText(grams[el].mid)}
                            <em>
                                {" "}
                                ({Math.round(grams[el].lo)}-{Math.round(grams[el].hi)} g)
                            </em>
                        </>
                    ) : (
                        <>
                            <b>{ELEMENT_SYMBOL[el]}</b> {ELEMENT_NAME[el]}
                        </>
                    )}
                </span>
            ))}
        </div>
    );
}

// One stacked bar: element segments at their mid estimate, then a light band
// out to the high estimate and a whisker from low to high.
function StackBar({ grams, max, height = 14 }: { grams: Grams; max: number; height?: number }) {
    const pct = (g: number) => `${(g / max) * 100}%`;
    const lo = sum(grams, "lo");
    const mid = sum(grams, "mid");
    const hi = sum(grams, "hi");
    return (
        <div className="ree-bar" style={{ height }}>
            <span className="ree-range" style={{ left: pct(mid), width: `calc(${pct(hi)} - ${pct(mid)})` }} />
            {ELEMENTS.map((el, i) => (
                <span
                    key={el}
                    className="ree-seg"
                    style={{
                        left: pct(ELEMENTS.slice(0, i).reduce((n, e) => n + grams[e].mid, 0)),
                        width: pct(grams[el].mid),
                        background: ELEMENT_COLOR[el],
                    }}
                />
            ))}
            <span className="ree-whisker" style={{ left: pct(lo), width: `calc(${pct(hi)} - ${pct(lo)})` }} />
        </div>
    );
}

function Axis({ max, ticks, label, sparse = false }: { max: number; ticks: number[]; label: string; sparse?: boolean }) {
    return (
        <div className="ree-axis">
            <div className="ree-ticks">
                {(sparse ? [ticks[0] ?? 0, max] : ticks).map((t) => (
                    <span key={t} style={{ left: `${(t / max) * 100}%` }}>
                        {gramText(t)}
                    </span>
                ))}
            </div>
            <p>{label}</p>
        </div>
    );
}

// A: the robot's rare earth as one bar, replacing the text line.
export function ReeRobotBar({ robot }: { robot: Humanoid }) {
    const g = robotGrams(robot);
    const { max, ticks } = niceAxis(sum(g, "hi"));
    return (
        <div className="ree ree-a">
            <p className="ree-title">
                Rare earth in the magnets: <b>{gramText(sum(g, "mid"))}</b>{" "}
                <em>
                    estimated, {gramText(sum(g, "lo"))} to {gramText(sum(g, "hi"))}
                </em>
            </p>
            <StackBar grams={g} max={max} height={16} />
            <Axis max={max} ticks={ticks} label="grams of rare earth (whisker: low to high estimate)" />
            <Key grams={g} />
        </div>
    );
}

// B: the element picker for the body heatmap.
export function ReeBodyPicker({ value, onChange }: { value: Element | "all"; onChange: (v: Element | "all") => void }) {
    return (
        <div className="ree ree-b">
            <p className="ree-title">Rare earth at each joint, estimated. Bigger dot, more grams.</p>
            <div className="ree-pick" role="group" aria-label="Element">
                {(["all", ...ELEMENTS] as const).map((el) => (
                    <button key={el} type="button" aria-pressed={value === el} onClick={() => onChange(el)}>
                        {el !== "all" && <i style={{ background: ELEMENT_COLOR[el] }} />}
                        {el === "all" ? "All four" : ELEMENT_NAME[el]}
                    </button>
                ))}
            </div>
        </div>
    );
}

// B: dot-size key under the figure, at round gram values.
export function ReeScale({ max, el }: { max: number; el: Element | "all" }) {
    const { ticks } = niceAxis(max);
    const marks = [ticks[1] ?? max / 4, ticks[Math.floor(ticks.length / 2)] ?? max / 2, ticks.at(-1) ?? max].filter(
        (v, i, a) => v > 0 && a.indexOf(v) === i,
    );
    const color = ELEMENT_COLOR[el === "all" ? "nd" : el];
    return (
        <div className="ree-scale" aria-hidden="true">
            {marks.map((m) => {
                const r = reeRadius(m, max);
                return (
                    <span key={m}>
                        <svg width={2 * r + 2} height={2 * r + 2}>
                            <circle cx={r + 1} cy={r + 1} r={r} fill={color} fillOpacity={0.9} />
                        </svg>
                        {gramText(m)}
                    </span>
                );
            })}
            <em>{el === "all" ? "of rare earth" : `of ${ELEMENT_NAME[el]}`} per joint</em>
        </div>
    );
}

// C: the whole fleet, one bar per robot, most rare earth first.
export function ReeFleet({ active, onPick }: { active: string; onPick: (id: string) => void }) {
    const rows = fleetGrams();
    const { max, ticks } = niceAxis(Math.max(...rows.map((r) => sum(r.grams, "hi"))));
    return (
        <section className="ree ree-c" aria-labelledby="ree-c-h">
            <h2 id="ree-c-h">Which robot holds the most rare earth?</h2>
            <Key />
            <div className="ree-rows">
                {rows.map(({ h, grams }) => (
                    <button
                        key={h.id}
                        type="button"
                        className={`ree-row${h.id === active ? " is-active" : ""}`}
                        onClick={() => onPick(h.id)}
                        title={ELEMENTS.map((el) => `${ELEMENT_SYMBOL[el]} ${gramText(grams[el].mid)}`).join(", ")}
                    >
                        <span className="ree-name">{h.name}</span>
                        <StackBar grams={grams} max={max} />
                        <span className="ree-val">{gramText(sum(grams, "mid"))}</span>
                    </button>
                ))}
            </div>
            <div className="ree-row ree-row-axis">
                <span />
                <Axis max={max} ticks={ticks} label="grams of rare earth per robot, estimated (light band: up to the high estimate)" />
                <span />
            </div>
        </section>
    );
}

// D: where in the body the grams sit, one bar per joint (both sides added).
export function ReeJoints({ robot }: { robot: Humanoid }) {
    const rows = gramsByJoint(robot).filter((r) => sum(r.grams, "mid") > 0);
    const { max, ticks } = niceAxis(Math.max(...rows.map((r) => sum(r.grams, "hi")), 1), 3);
    return (
        <div className="ree ree-d">
            <p className="ree-title">Rare earth by joint, estimated</p>
            <Key />
            <div className="ree-rows">
                {rows.map((r) => (
                    <div key={r.label} className="ree-row">
                        <span className="ree-name">
                            {r.label}
                            {r.sides > 1 && <em> x2</em>}
                        </span>
                        <StackBar grams={r.grams} max={max} height={10} />
                        <span className="ree-val">{gramText(sum(r.grams, "mid"))}</span>
                    </div>
                ))}
            </div>
            <div className="ree-row ree-row-axis">
                <span />
                <Axis max={max} ticks={ticks} sparse label="grams of rare earth (x2: left and right added)" />
                <span />
            </div>
        </div>
    );
}
