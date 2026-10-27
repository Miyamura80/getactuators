import { useEffect, useRef } from "react";
import { countryFlag } from "../../../../../src/country-flag";
import {
    MEASURE_STATUS_LABEL,
    MEASURE_TYPE_LABEL,
    POLICY_LANES,
    POLICY_LANE_LABEL,
    type PolicyLane,
    type PolicyMeasure,
    laneOf,
    startDate,
} from "../../../../../src/supply-chain/policy";
import { placeLane, yearOf } from "../../../../../src/supply-chain/policy/timeline";
import { SCOPE_SIZE, TYPE_COLOR, TypeGlyph } from "./glyphs";

// The headline view: one lane per jurisdiction on a shared time axis, one
// marker per measure. The bar of a measure's status history is drawn only
// for the measure in focus; everything else fades back.

const X0 = 2011;
const X1 = 2027.5;
const TRACK = 24;
const YEARS = Array.from({ length: X1 - X0 + 0.5 }, (_, i) => X0 + i);

const pos = (year: number) => `${(((year - X0) / (X1 - X0)) * 100).toFixed(3)}%`;

const LANE_MARK: Record<PolicyLane, string> = {
    CN: countryFlag("CN"),
    US: countryFlag("US"),
    EU: countryFlag("EU"),
    JP: countryFlag("JP"),
    KR: countryFlag("KR"),
    OTHER: "\u22ef",
    INTL: "ISO",
};

const LANE_SHORT: Record<PolicyLane, string> = {
    CN: "China",
    US: "US",
    EU: "EU",
    JP: "Japan",
    KR: "Korea",
    OTHER: "Others",
    INTL: "Intl",
};

function describe(m: PolicyMeasure): string {
    return `${m.title}. ${MEASURE_TYPE_LABEL[m.type]}, ${MEASURE_STATUS_LABEL[m.status].toLowerCase()}, ${startDate(m)}`;
}

export function Swimlane({ measures, today, focus, onFocus }: {
    measures: readonly PolicyMeasure[];
    today: string;
    focus: string | null;
    onFocus: (id: string | null) => void;
}) {
    const now = yearOf(today);
    const scroller = useRef<HTMLDivElement>(null);
    // Narrow screens scroll the chart sideways: start at the recent end, or
    // at the measure in focus.
    useEffect(() => {
        const el = scroller.current;
        if (!el || el.scrollWidth <= el.clientWidth) return;
        const mark = focus ? el.querySelector<HTMLElement>(`[data-measure="${focus}"] .pl-marker`) : null;
        el.scrollLeft = mark ? mark.offsetLeft - el.clientWidth / 2 : el.scrollWidth;
    }, [focus]);
    return <div ref={scroller} className={`pl-scroll${focus ? " has-focus" : ""}`}>
        <div className="pl-chart" role="group" aria-label="Measures by jurisdiction over time">
            <div className="pl-axis" aria-hidden="true">
                <span className="pl-lane-head" />
                <div className="pl-axis-track">
                    {YEARS.map((y) => <span key={y} style={{ left: pos(y) }}>{y % 5 === 0 || y === X0 ? y : `'${String(y).slice(2)}`}</span>)}
                </div>
            </div>
            {POLICY_LANES.map((lane) => {
                const inLane = measures.filter((m) => laneOf(m) === lane);
                const { placed, tracks } = placeLane(inLane, today);
                return <div key={lane} className="pl-lane" data-lane={lane}>
                    <div className="pl-lane-head" title={POLICY_LANE_LABEL[lane]}>
                        <span className="pl-lane-mark" aria-hidden="true">{LANE_MARK[lane]}</span>
                        <span className="pl-lane-name">{LANE_SHORT[lane]}</span>
                        <span className="pl-lane-n">{inLane.length}</span>
                    </div>
                    <div className="pl-lane-track" style={{ height: tracks * TRACK + 8 }}>
                        {YEARS.map((y) => <i key={y} className="pl-tick" style={{ left: pos(y) }} aria-hidden="true" />)}
                        <i className="pl-now" style={{ left: pos(now) }} aria-hidden="true" />
                        {placed.map((p) => {
                            const m = p.measure;
                            const on = focus === m.id;
                            const top = 4 + p.track * TRACK;
                            const size = SCOPE_SIZE[m.scope];
                            return <span key={m.id} className={`pl-item${on ? " is-on" : ""}`} data-measure={m.id}>
                                {on
                                    ? p.segments.map((s) => <i key={`${s.from}-${s.status}`} aria-hidden="true"
                                        className={`pl-bar pl-bar-${s.status}`}
                                        style={{ left: pos(s.from), width: `calc(${pos(s.to)} - ${pos(s.from)})`, top: top + TRACK / 2 - 1, color: TYPE_COLOR[m.type] }} />)
                                    : null}
                                <button type="button" className="pl-marker" aria-pressed={on}
                                    aria-label={describe(m)} data-tip={m.title}
                                    style={{ left: pos(p.start), top }}
                                    onClick={() => onFocus(on ? null : m.id)}>
                                    <TypeGlyph type={m.type} status={m.status} size={size} />
                                </button>
                            </span>;
                        })}
                    </div>
                </div>;
            })}
        </div>
    </div>;
}
