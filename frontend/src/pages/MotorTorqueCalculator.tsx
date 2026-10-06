import { useEffect, useMemo, useState } from "react";
import { PublicHeader } from "../components/PublicHeader";
import { Nomograph } from "../components/Nomograph";
import { RequirementShortlist } from "../components/RequirementShortlist";
import {
    type CalcState,
    type Quantity,
    UNITS,
    fmt,
    gearboxFrom,
    inUnit,
    knownSi,
    motorSide,
    solve,
    stateFromQuery,
    stateToQuery,
} from "../lib/motor-torque";
import "./tools.css";

export const MOTOR_TORQUE_PATH = "/tools/motor-torque-calculator";

const LABEL: Record<Quantity, string> = { torque: "Torque", power: "Power", speed: "Speed" };
const ORDER: readonly Quantity[] = ["torque", "power", "speed"];

// Example inputs for common robot sizing questions. Inputs only: not
// published specifications of any robot.
const EXAMPLES: { label: string; state: Pick<CalcState, "solve" | "values"> }[] = [
    {
        label: "Arm shoulder: 7.85 N·m at 20 rpm",
        state: { solve: "power", values: { torque: "7.85", power: "", speed: "20" } },
    },
    {
        label: "Leg joint: 18 N·m at 200 rpm",
        state: { solve: "power", values: { torque: "18", power: "", speed: "200" } },
    },
    {
        label: "Drive motor: 200 W at 3000 rpm",
        state: { solve: "torque", values: { torque: "", power: "200", speed: "3000" } },
    },
];

function Field({
    q,
    state,
    onValue,
    onUnit,
}: {
    q: Quantity;
    state: CalcState;
    onValue: (v: string) => void;
    onUnit: (u: string) => void;
}) {
    const id = `calc-${q}`;
    return (
        <div className="calc-field">
            <label htmlFor={id}>{LABEL[q]}</label>
            <div className="calc-input">
                <input
                    id={id}
                    inputMode="decimal"
                    autoComplete="off"
                    value={state.values[q]}
                    placeholder="0"
                    onChange={(e) => onValue(e.target.value.replace(",", "."))}
                />
                <select aria-label={`${LABEL[q]} unit`} value={state.units[q]} onChange={(e) => onUnit(e.target.value)}>
                    {UNITS[q].map((u) => (
                        <option key={u.id} value={u.id}>{u.label}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}

export function MotorTorqueCalculator({ menuOpen = false }: { menuOpen?: boolean }) {
    const [state, setState] = useState<CalcState>(() => stateFromQuery(window.location.search));

    useEffect(() => {
        const next = `${window.location.pathname}${stateToQuery(state)}${window.location.hash}`;
        window.history.replaceState(window.history.state, "", next);
    }, [state]);

    const result = useMemo(() => solve(state.solve, knownSi(state)), [state]);
    const shaft = result.ok ? result.shaft : null;
    const gear = gearboxFrom(state);
    const motor = shaft && gear ? motorSide(shaft, gear) : null;

    const set = (patch: Partial<CalcState>) => setState((s) => ({ ...s, ...patch }));
    const solvedSi = shaft
        ? { torque: shaft.torqueNm, power: shaft.powerW, speed: shaft.speedRpm }[state.solve]
        : null;
    const solvedUnit = UNITS[state.solve].find((u) => u.id === state.units[state.solve]);

    return (
        <div className="tool-page">
            <PublicHeader path={MOTOR_TORQUE_PATH} initialOpen={menuOpen} />
            <main className="tool-main">
                <header className="tool-head">
                    <p className="tool-kicker">Tool · P = T × ω</p>
                    <h1>Motor torque calculator</h1>
                    <p className="tool-lede">
                        Solve shaft torque, power or speed from the other two. Then see which catalog
                        actuators reach that operating point.
                    </p>
                </header>

                <div className="calc-sheet">
                    <section className="calc-controls" aria-label="Calculator">
                        <fieldset className="calc-solve">
                            <legend>Solve for</legend>
                            <div className="calc-solve-opts">
                            {ORDER.map((q) => (
                                <label key={q} className={q === state.solve ? "on" : ""}>
                                    <input
                                        type="radio"
                                        name="solve"
                                        value={q}
                                        checked={q === state.solve}
                                        onChange={() => {
                                            // Keep the displayed answer as the new input.
                                            const values = { ...state.values };
                                            if (shaft && solvedSi != null) values[state.solve] = String(Number(inUnit(state.solve, solvedSi, state.units[state.solve]).toPrecision(4)));
                                            values[q] = "";
                                            set({ solve: q, values });
                                        }}
                                    />
                                    {LABEL[q]}
                                </label>
                            ))}
                            </div>
                        </fieldset>

                        {ORDER.filter((q) => q !== state.solve).map((q) => (
                            <Field
                                key={q}
                                q={q}
                                state={state}
                                onValue={(v) => set({ values: { ...state.values, [q]: v } })}
                                onUnit={(u) => set({ units: { ...state.units, [q]: u } })}
                            />
                        ))}

                        <div className="calc-readout" aria-live="polite">
                            <div className="calc-readout-row">
                                <span className="calc-readout-label">{LABEL[state.solve]}</span>
                                <select
                                    aria-label={`${LABEL[state.solve]} result unit`}
                                    value={state.units[state.solve]}
                                    onChange={(e) => set({ units: { ...state.units, [state.solve]: e.target.value } })}
                                >
                                    {UNITS[state.solve].map((u) => (
                                        <option key={u.id} value={u.id}>{u.label}</option>
                                    ))}
                                </select>
                            </div>
                            {result.ok && solvedSi != null ? (
                                <output className="calc-value">
                                    {fmt(inUnit(state.solve, solvedSi, state.units[state.solve]))}
                                    <span>{solvedUnit?.label}</span>
                                </output>
                            ) : (
                                <p className="calc-error">{result.ok ? "" : result.reason}</p>
                            )}
                            {shaft && (
                                <p className="calc-formula">
                                    {fmt(shaft.torqueNm)} N·m × {fmt(shaft.speedRpm)} rpm ÷ 9.549 = {fmt(shaft.powerW)} W
                                </p>
                            )}
                        </div>

                        <details className="calc-gear" open={Boolean(state.ratio)}>
                            <summary>Behind a gearbox</summary>
                            <p>Treat the values above as the gearbox output. Find what the motor shaft must supply.</p>
                            <div className="calc-gear-inputs">
                                <label>
                                    Ratio
                                    <span className="calc-input">
                                        <input inputMode="decimal" value={state.ratio} placeholder="9" onChange={(e) => set({ ratio: e.target.value })} />
                                        <span className="calc-suffix">: 1</span>
                                    </span>
                                </label>
                                <label>
                                    Efficiency
                                    <span className="calc-input">
                                        <input inputMode="decimal" value={state.efficiency} placeholder="100" onChange={(e) => set({ efficiency: e.target.value })} />
                                        <span className="calc-suffix">%</span>
                                    </span>
                                </label>
                            </div>
                            {motor ? (
                                <p className="calc-motor">
                                    Motor shaft: <b>{fmt(motor.torqueNm)} N·m</b> at <b>{fmt(motor.speedRpm)} rpm</b>, <b>{fmt(motor.powerW)} W</b>
                                </p>
                            ) : (
                                state.ratio && <p className="calc-error">Ratio must be above 0 and efficiency 1 to 100%.</p>
                            )}
                            <p className="calc-note">You set the efficiency. Blank means an ideal 100%.</p>
                        </details>

                        <div className="calc-examples">
                            <span>Examples</span>
                            {EXAMPLES.map((ex) => (
                                <button
                                    key={ex.label}
                                    type="button"
                                    onClick={() => set({ ...ex.state, units: { torque: "Nm", power: "W", speed: "rpm" } })}
                                >
                                    {ex.label}
                                </button>
                            ))}
                        </div>
                    </section>

                    <Nomograph shaft={shaft} solved={state.solve} />
                </div>

                <p className="calc-boundary">
                    Shaft power and a torque requirement. Check both against the motor's rating.
                </p>

                {shaft && shaft.torqueNm > 0 && (
                    <RequirementShortlist
                        torqueNm={shaft.torqueNm}
                        speedRpm={shaft.speedRpm}
                        heading="Actuators for this requirement"
                    />
                )}
                <a className="tool-method-link" href="#catalog-content">How the calculation works ↓</a>
            </main>
        </div>
    );
}
