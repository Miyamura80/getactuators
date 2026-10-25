import { useState } from "react";
import { type Humanoid, metalValue, reeByDesign } from "../../../../src/humanoids";
import {
    ELEMENT_COLOR,
    ELEMENT_NAME,
    ELEMENT_SYMBOL,
    ELEMENTS,
    type Grams,
    gramText,
    niceMax,
    robotGrams,
    sum,
    usdText,
} from "./ree";

type Unit = "grams" | "usd";
const UNITS: { id: Unit; label: string }[] = [
    { id: "grams", label: "Grams" },
    { id: "usd", label: "Cost $" },
];
const CAPTION: Record<Unit, string> = {
    grams: "grams, all units per design (hatch: high estimate)",
    usd: "US$ of rare-earth metal, all units per design",
};

// One stacked bar: element segments at their mid estimate, a light band out
// to the high estimate and a whisker from low to high.
function StackBar({ values, max }: { values: Grams; max: number }) {
    const pct = (v: number) => `${(v / max) * 100}%`;
    const lo = sum(values, "lo");
    const mid = sum(values, "mid");
    const hi = sum(values, "hi");
    return (
        <div className="ree-bar">
            <span className="ree-range" style={{ left: pct(mid), width: `calc(${pct(hi)} - ${pct(mid)})` }} />
            {ELEMENTS.map((el, i) => (
                <span
                    key={el}
                    className="ree-seg"
                    style={{
                        left: pct(ELEMENTS.slice(0, i).reduce((n, e) => n + values[e].mid, 0)),
                        width: pct(values[el].mid),
                        background: ELEMENT_COLOR[el],
                    }}
                />
            ))}
            <span className="ree-whisker" style={{ left: pct(lo), width: `calc(${pct(hi)} - ${pct(lo)})` }} />
        </div>
    );
}

// Rare earth by actuator design, in grams or in raw-metal US$, with the
// robot's per-element totals as the legend.
export function ReeByActuator({ robot }: { robot: Humanoid }) {
    const [unit, setUnit] = useState<Unit>("grams");
    const designs = reeByDesign(robot);
    const rows = designs.map((d) => ({ ...d, values: unit === "grams" ? d.grams : d.usd }));
    const grams = robotGrams(robot);
    const total = unit === "grams" ? grams : metalValue(grams);
    const fmt = unit === "grams" ? gramText : usdText;
    const range = (lo: number, hi: number) =>
        unit === "grams" ? `${Math.round(lo)}-${Math.round(hi)} g` : `${usdText(lo)}-${usdText(hi)}`;
    const max = niceMax(Math.max(...rows.map((r) => sum(r.values, "hi")), unit === "grams" ? 1 : 0.01));
    return (
        <div className="ree">
            <p className="ree-title">Rare earth by actuator, estimated</p>
            <div className="hm-bom-tabs ree-tabs" role="group" aria-label="Rare earth shown as">
                {UNITS.map((u) => (
                    <button key={u.id} type="button" aria-pressed={unit === u.id} onClick={() => setUnit(u.id)}>
                        {u.label}
                    </button>
                ))}
            </div>
            <div className="ree-key">
                {ELEMENTS.map((el) => (
                    <span key={el}>
                        <i style={{ background: ELEMENT_COLOR[el] }} />
                        <b>{ELEMENT_SYMBOL[el]}</b> {ELEMENT_NAME[el]}
                        <em>{range(total[el].lo, total[el].hi)}</em>
                    </span>
                ))}
            </div>
            <div className="ree-rows">
                {rows.map((r) => (
                    <div key={r.key} className="ree-row">
                        <span className="ree-name" title={`${r.label} x${r.count}`}>
                            {r.label} <em>x{r.count}</em>
                        </span>
                        <StackBar values={r.values} max={max} />
                        <span className="ree-val">{fmt(sum(r.values, "mid"))}</span>
                    </div>
                ))}
                <div className="ree-row ree-row-axis">
                    <span />
                    <div className="ree-ticks">
                        {[0, max].map((t) => (
                            <span key={t} style={{ left: `${(t / max) * 100}%` }}>
                                {fmt(t)}
                            </span>
                        ))}
                    </div>
                    <span />
                </div>
            </div>
            <p className="ree-caption">{CAPTION[unit]}</p>
        </div>
    );
}
