import type { Humanoid } from "../../../../src/humanoids";
import {
    ELEMENT_COLOR,
    ELEMENT_NAME,
    ELEMENT_SYMBOL,
    ELEMENTS,
    type Grams,
    gramsByDesign,
    gramText,
    niceAxis,
    robotGrams,
    sum,
} from "./ree";

// One stacked bar: element segments at their mid estimate, a light band out
// to the high estimate and a whisker from low to high.
function StackBar({ grams, max }: { grams: Grams; max: number }) {
    const pct = (g: number) => `${(g / max) * 100}%`;
    const lo = sum(grams, "lo");
    const mid = sum(grams, "mid");
    const hi = sum(grams, "hi");
    return (
        <div className="ree-bar">
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

// Rare-earth grams by actuator design, with the robot's per-element totals
// as the legend.
export function ReeByActuator({ robot }: { robot: Humanoid }) {
    const rows = gramsByDesign(robot);
    const total = robotGrams(robot);
    const { max } = niceAxis(Math.max(...rows.map((r) => sum(r.grams, "hi")), 1));
    return (
        <div className="ree">
            <p className="ree-title">Rare earth by actuator, estimated</p>
            <div className="ree-key">
                {ELEMENTS.map((el) => (
                    <span key={el}>
                        <i style={{ background: ELEMENT_COLOR[el] }} />
                        <b>{ELEMENT_SYMBOL[el]}</b> {ELEMENT_NAME[el]}
                        <em>
                            {Math.round(total[el].lo)}-{Math.round(total[el].hi)} g
                        </em>
                    </span>
                ))}
            </div>
            <div className="ree-rows">
                {rows.map((r) => (
                    <div key={r.key} className="ree-row">
                        <span className="ree-name" title={`${r.label} x${r.count}`}>
                            {r.label} <em>x{r.count}</em>
                        </span>
                        <StackBar grams={r.grams} max={max} />
                        <span className="ree-val">{gramText(sum(r.grams, "mid"))}</span>
                    </div>
                ))}
                <div className="ree-row ree-row-axis">
                    <span />
                    <div className="ree-ticks">
                        {[0, max].map((t) => (
                            <span key={t} style={{ left: `${(t / max) * 100}%` }}>
                                {gramText(t)}
                            </span>
                        ))}
                    </div>
                    <span />
                </div>
            </div>
            <p className="ree-caption">
                grams, all units per design (hatch: high estimate)
            </p>
        </div>
    );
}
