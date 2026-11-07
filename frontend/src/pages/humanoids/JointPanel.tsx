import type { CSSProperties } from "react";
import {
    ACTUATOR_TYPE_COLOR,
    ACTUATOR_TYPE_LABEL,
    type CanonicalJoint,
    type Confidence,
    type Humanoid,
    type HumanoidJoint,
    jointLabel,
    jointsAt,
    type Sourced,
    sourceOf,
} from "../../../../src/humanoids";
import { CompanyLogo } from "../../components/CompanyLogo";
import { MetricBar } from "../../components/MetricBar";

function Conf({ c }: { c: Confidence | "reported" | "estimated" }) {
    return <span className={`hm-conf is-${c}`}>{c}</span>;
}

function Figure({ s }: { s: Sourced<number> }) {
    return (
        <>
            {s.value.toLocaleString("en-US")} {s.unit} <Conf c={s.confidence} />
            {s.note && <small>{s.note}</small>}
        </>
    );
}

function Sources({ ids }: { ids: string[] }) {
    return (
        <ol className="hm-src">
            {ids.map((id) => {
                const s = sourceOf(id);
                return (
                    <li key={id}>
                        <a href={s.url} target={s.url.startsWith("/") ? undefined : "_blank"} rel="noopener">
                            {s.title}
                        </a>
                    </li>
                );
            })}
        </ol>
    );
}

function Entry({ j }: { j: HumanoidJoint }) {
    const m = j.magnetMassG;
    const ms = j.motorSizing;
    return (
        <div className="hm-entry">
            <div className="hm-type">
                <i style={{ background: ACTUATOR_TYPE_COLOR[j.actuatorType] }} />
                <b>
                    {j.count > 1 ? `${j.count} x ` : ""}
                    {ACTUATOR_TYPE_LABEL[j.actuatorType]}
                </b>
                <Conf c={j.typeConfidence} />
            </div>
            {j.inferredFrom && <p className="hm-inferred">{j.inferredFrom}</p>}
            <dl>
                {j.motor && (
                    <>
                        <dt>Motor</dt>
                        <dd>
                            {j.actuatorId ? <a href={`/actuators/${j.actuatorId}`}>{j.motor}</a> : j.motor}
                        </dd>
                    </>
                )}
                {j.reducer && (
                    <>
                        <dt>Reducer</dt>
                        <dd>{j.reducer}</dd>
                    </>
                )}
                {j.peakTorqueNm && (
                    <>
                        <dt>Peak torque</dt>
                        <dd>
                            <Figure s={j.peakTorqueNm} />
                        </dd>
                    </>
                )}
                {j.peakForceN && (
                    <>
                        <dt>Peak force</dt>
                        <dd>
                            <Figure s={j.peakForceN} />
                        </dd>
                    </>
                )}
                {ms && (
                    <>
                        <dt>At the motor</dt>
                        <dd>
                            {ms.motorTorqueNm.value} N·m via{" "}
                            {ms.gearRatio.unit === "mm lead" ? `${ms.gearRatio.value} mm lead` : `${ms.gearRatio.value}:1`},{" "}
                            {Math.round(ms.efficiency.value * 100)}% efficient <Conf c={ms.gearRatio.confidence} />
                        </dd>
                    </>
                )}
                <dt>Magnet</dt>
                <dd>
                    {m.range && m.range[1] > 0 ? `${m.range[0]} to ${m.range[1]} g NdFeB` : "0 g"} <Conf c="estimated" />
                    <small>{m.note}</small>
                </dd>
            </dl>
            <Sources ids={j.sources} />
        </div>
    );
}

// One row per actuator design and joint, left side standing for both sides.
function JointList({ robot, onSelect }: { robot: Humanoid; onSelect: (j: CanonicalJoint) => void }) {
    const rows = robot.joints.filter((j) => !j.canonical.startsWith("r-"));
    // Torque (N·m) and force (N) bars scale separately; magnet bars share one scale.
    const peakMax = (unit: string) =>
        Math.max(
            1e-9,
            ...rows.flatMap((j) => {
                const f = j.peakTorqueNm ?? j.peakForceN;
                return f && (f.unit ?? "") === unit ? [f.value] : [];
            }),
        );
    const magnetMax = Math.max(1e-9, ...rows.map((j) => j.magnetMassG.value / j.count));
    return (
        <table className="hm-list">
            <thead>
                <tr>
                    <th>Joint</th>
                    <th>Type</th>
                    <th className="num">Peak</th>
                    <th className="num">Magnet g</th>
                </tr>
            </thead>
            <tbody>
                {rows.map((j, i) => {
                    const sided = j.canonical.startsWith("l-");
                    const raw = jointLabel(j.canonical).replace(/^Left /, "");
                    const name = raw.charAt(0).toUpperCase() + raw.slice(1);
                    const n = j.count * (sided ? 2 : 1);
                    const fig = j.peakTorqueNm ?? j.peakForceN;
                    const est = j.typeConfidence === "estimated";
                    return (
                        <tr key={`${j.canonical}-${i}`}>
                            <td>
                                <button type="button" onClick={() => onSelect(j.canonical)}>
                                    {name}
                                </button>
                                {n > 1 && <span className="hm-n">x{n}</span>}
                            </td>
                            <td>
                                <i
                                    className={`hm-sw${est ? " is-est" : ""}`}
                                    style={{ "--c": ACTUATOR_TYPE_COLOR[j.actuatorType] } as CSSProperties}
                                />
                                {ACTUATOR_TYPE_LABEL[j.actuatorType]}
                            </td>
                            <td className="num">
                                <MetricBar
                                    value={fig?.value ?? null}
                                    max={fig ? peakMax(fig.unit ?? "") : 1}
                                    text={fig ? `${fig.value.toLocaleString("en-US")} ${fig.unit}${fig.confidence !== "reported" ? "ᵉ" : ""}` : ""}
                                    higherIsBetter
                                />
                            </td>
                            <td className="num">
                                <MetricBar
                                    value={j.magnetMassG.value / j.count}
                                    max={magnetMax}
                                    text={String(Math.round(j.magnetMassG.value / j.count))}
                                    higherIsBetter
                                />
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}

export function JointPanel({
    robot,
    joint,
    onSelect,
}: {
    robot: Humanoid;
    joint: CanonicalJoint | null;
    onSelect: (j: CanonicalJoint | null) => void;
}) {
    if (!joint) {
        return (
            <div className="hm-panel">
                <p className="hm-panel-k with-logo">
                    <CompanyLogo name={robot.brand} size={14} />
                    {robot.brand}
                </p>
                <h3>{robot.name}</h3>
                <p className="hm-summary">{robot.summary}</p>
                {robot.notCounted && <p className="hm-inferred">Not counted: {robot.notCounted}</p>}
                <JointList robot={robot} onSelect={onSelect} />
                <p className="hm-hint">
                    <sup>e</sup> estimated · magnet per actuator
                </p>
            </div>
        );
    }
    const entries = jointsAt(robot, joint);
    return (
        <div className="hm-panel">
            <p className="hm-panel-k">
                {robot.name}
                <button type="button" className="hm-back" onClick={() => onSelect(null)}>
                    All joints
                </button>
            </p>
            <h3>{jointLabel(joint)}</h3>
            {entries.length ? (
                entries.map((j, i) => <Entry key={`${j.actuatorType}-${i}`} j={j} />)
            ) : (
                <p className="hm-inferred">No actuator documented at this joint.</p>
            )}
        </div>
    );
}
