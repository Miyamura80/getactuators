import { useEffect, useMemo, useState } from "react";
import { PublicHeader } from "../components/PublicHeader";
import { ArmDiagram } from "../components/ArmDiagram";
import { RequirementShortlist } from "../components/RequirementShortlist";
import {
    type Arm,
    type Link,
    MAX_LINKS,
    PRESETS,
    armFromQuery,
    armToQuery,
    jointLoads,
    jointName,
    validArm,
} from "../lib/arm-torque";
import { fmt } from "../lib/motor-torque";
import "./tools.css";

export const ARM_TORQUE_PATH = "/tools/robot-arm-torque-calculator";

// A numeric input that keeps the visitor's text ("0.", "") while typing and
// follows the value when it changes from outside (a preset or "use mass").
function NumberField({
    value,
    onValue,
    label,
    suffix,
    caption,
}: {
    value: number;
    onValue: (v: number) => void;
    label: string;
    suffix: string;
    // Shown above the field on narrow screens, where the column headers hide.
    caption?: string;
}) {
    const [text, setText] = useState(String(value));
    const [seen, setSeen] = useState(value);
    if (seen !== value) {
        setSeen(value);
        if (Number(text) !== value) setText(String(value));
    }
    const field = (
        <span className="calc-input arm-num">
            <input
                aria-label={label}
                inputMode="decimal"
                autoComplete="off"
                value={text}
                onChange={(e) => {
                    const raw = e.target.value.replace(",", ".");
                    setText(raw);
                    const v = Number(raw);
                    if (raw.trim() !== "" && Number.isFinite(v) && v >= 0) {
                        setSeen(v);
                        onValue(v);
                    }
                }}
            />
            <span className="calc-suffix">{suffix}</span>
        </span>
    );
    return caption ? (
        <span className="arm-cell">
            <span className="arm-cap" aria-hidden="true">{caption}</span>
            {field}
        </span>
    ) : (
        field
    );
}

export function ArmTorqueCalculator({ menuOpen = false }: { menuOpen?: boolean }) {
    const [arm, setArm] = useState<Arm>(() => armFromQuery(window.location.search));
    const [active, setActive] = useState(0);

    useEffect(() => {
        window.history.replaceState(window.history.state, "", `${window.location.pathname}${armToQuery(arm)}${window.location.hash}`);
    }, [arm]);

    const ok = validArm(arm);
    const loads = useMemo(() => (ok ? jointLoads(arm) : []), [arm, ok]);
    const n = arm.links.length;
    const joint = Math.min(active, n - 1);
    const need = loads[joint]?.torqueNm ?? 0;

    const setLink = (i: number, patch: Partial<Link>) =>
        setArm((a) => ({ ...a, links: a.links.map((l, j) => (j === i ? { ...l, ...patch } : l)) }));
    const setCount = (count: number) =>
        setArm((a) => {
            const links = a.links.slice(0, count);
            while (links.length < count) links.push({ length: 0.1, mass: 0.2, actuatorMass: 0 });
            // The new last link carries the payload, not another actuator.
            return { ...a, links: links.map((l, i) => (i === count - 1 ? { ...l, actuatorMass: 0 } : l)) };
        });

    return (
        <div className="tool-page">
            <PublicHeader path={ARM_TORQUE_PATH} initialOpen={menuOpen} />
            <main className="tool-main">
                <header className="tool-head">
                    <p className="tool-kicker">Tool · τ = g · Σ m · x</p>
                    <h1>Robot arm torque calculator</h1>
                    <p className="tool-lede">
                        Holding torque at every joint of an arm held horizontal, from link lengths, masses and
                        payload. Then pick actuators per joint and feed their mass back in.
                    </p>
                </header>

                <div className="arm-sheet">
                    <ArmDiagram arm={arm} loads={loads} active={joint} onSelect={setActive} />

                    <section className="arm-inputs" aria-label="Arm model">
                        <div className="arm-row arm-head" aria-hidden="true">
                            <span>Link</span>
                            <span>Length</span>
                            <span>Link mass</span>
                            <span>Actuator at far end</span>
                        </div>
                        {arm.links.map((l, i) => (
                            <div className="arm-row" key={i}>
                                <span className="arm-link-name">
                                    {i + 1}
                                    <small>{jointName(i, n)} → {i === n - 1 ? "tip" : jointName(i + 1, n)}</small>
                                </span>
                                <NumberField label={`Link ${i + 1} length`} suffix="m" caption="Length" value={l.length} onValue={(v) => setLink(i, { length: v })} />
                                <NumberField label={`Link ${i + 1} mass`} suffix="kg" caption="Link mass" value={l.mass} onValue={(v) => setLink(i, { mass: v })} />
                                {i === n - 1 ? (
                                    <span className="arm-na">Payload sits here</span>
                                ) : (
                                    <NumberField label={`${jointName(i + 1, n)} actuator mass`} suffix="kg" caption={`${jointName(i + 1, n)} actuator`} value={l.actuatorMass} onValue={(v) => setLink(i, { actuatorMass: v })} />
                                )}
                            </div>
                        ))}
                        <div className="arm-row arm-foot">
                            <label className="arm-field">
                                <span>Payload + gripper</span>
                                <NumberField label="Payload mass" suffix="kg" value={arm.payload} onValue={(v) => setArm((a) => ({ ...a, payload: v }))} />
                            </label>
                            <label className="arm-field">
                                <span>Link mass acts at</span>
                                <NumberField label="Link center of mass" suffix="% of length" value={Math.round(arm.comFraction * 100)} onValue={(v) => setArm((a) => ({ ...a, comFraction: Math.min(v, 100) / 100 }))} />
                            </label>
                            <fieldset className="arm-count">
                                <legend>Links</legend>
                                {[2, 3, MAX_LINKS].map((c) => (
                                    <button key={c} type="button" aria-pressed={c === n} className={c === n ? "on" : ""} onClick={() => setCount(c)}>
                                        {c}
                                    </button>
                                ))}
                            </fieldset>
                        </div>
                        <div className="calc-examples">
                            <span>Examples</span>
                            {PRESETS.map((p) => (
                                <button key={p.label} type="button" onClick={() => setArm(p.arm)}>
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </section>
                </div>

                {ok ? (
                    <table className="arm-results">
                        <caption>Static holding torque, arm horizontal</caption>
                        <thead>
                            <tr>
                                <th scope="col">Joint</th>
                                <th scope="col">Holding</th>
                                <th scope="col">Motion</th>
                                <th scope="col"><span className="sr-only">Actuators</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loads.map((l, i) => (
                                <tr key={i} className={i === joint ? "on" : ""}>
                                    <th scope="row">τ{i + 1} {jointName(i, n)}</th>
                                    <td className="arm-val">{fmt(l.torqueNm)} N·m</td>
                                    <td className="arm-motion">Not modeled</td>
                                    <td>
                                        <button type="button" aria-pressed={i === joint} onClick={() => setActive(i)}>
                                            {i === joint ? "Showing actuators" : "Show actuators"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="calc-error">Lengths must be above zero and masses zero or more.</p>
                )}
                <p className="calc-boundary">
                    Holding torque is a continuous requirement: compare it with rated torque, not peak. Moving the arm
                    adds inertia × acceleration and friction on top, and a multiplier is your design decision, not a
                    safety certificate.
                </p>

                {ok && need > 0 && (
                    <RequirementShortlist
                        torqueNm={need}
                        heading={`Actuators for τ${joint + 1} ${jointName(joint, n)}`}
                        limit={5}
                        onUse={
                            joint === 0
                                ? undefined
                                : {
                                      label: (a) => `Use ${fmt((a.weight_g ?? 0) / 1000)} kg at ${jointName(joint, n)}`,
                                      act: (a) => setLink(joint - 1, { actuatorMass: (a.weight_g ?? 0) / 1000 }),
                                  }
                        }
                    />
                )}
                <a className="tool-method-link" href="#catalog-content">How the calculation works ↓</a>
            </main>
        </div>
    );
}
