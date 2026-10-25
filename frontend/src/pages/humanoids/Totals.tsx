import {
    ACTUATOR_TYPE_COLOR,
    ACTUATOR_TYPE_LABEL,
    ACTUATOR_TYPES,
    type HumanoidTotals,
    reeTotalKg,
} from "../../../../src/humanoids";

const kgText = (s: { value: number; range?: readonly [number, number] }) =>
    s.range ? `${s.range[0].toFixed(2)} to ${s.range[1].toFixed(2)}` : s.value.toFixed(2);

// One horizontal bar, a segment per actuator type, widths by count.
export function MixBar({ totals, compact = false }: { totals: HumanoidTotals; compact?: boolean }) {
    const parts = ACTUATOR_TYPES.filter((t) => totals.actuatorCountByType[t]);
    const label = parts.map((t) => `${totals.actuatorCountByType[t]} ${ACTUATOR_TYPE_LABEL[t]}`).join(", ");
    return (
        <div className={`hm-mix${compact ? " is-compact" : ""}`} role="img" aria-label={`Actuator mix: ${label}`}>
            {parts.map((t) => {
                const n = totals.actuatorCountByType[t] ?? 0;
                return (
                    <span
                        key={t}
                        className={t === "other" ? "is-other" : undefined}
                        style={{ flexGrow: n, flexBasis: 0, background: t === "other" ? undefined : ACTUATOR_TYPE_COLOR[t] }}
                        title={`${n} ${ACTUATOR_TYPE_LABEL[t]}`}
                    >
                        {!compact && n >= 3 ? n : ""}
                    </span>
                );
            })}
        </div>
    );
}

export function Totals({ totals, dof }: { totals: HumanoidTotals; dof: number | null }) {
    const ree = reeTotalKg(totals);
    return (
        <div className="hm-totals">
            <div className="hm-stats">
                <div>
                    <span className="hm-k">Actuators</span>
                    <b>{totals.actuators}</b>
                </div>
                <div>
                    <span className="hm-k">DOF</span>
                    <b>{dof ?? "n/a"}</b>
                </div>
                <div>
                    <span className="hm-k">Magnet kg</span>
                    <b>{totals.magnetMassKg.value.toFixed(2)}</b>
                    <small>{kgText(totals.magnetMassKg).replace(" to ", "-")}</small>
                </div>
                <div>
                    <span className="hm-k">REE kg</span>
                    <b>{ree.value.toFixed(2)}</b>
                    <small>{kgText(ree).replace(" to ", "-")}</small>
                </div>
            </div>
            <MixBar totals={totals} />
        </div>
    );
}
