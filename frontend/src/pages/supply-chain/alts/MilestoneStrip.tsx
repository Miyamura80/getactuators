import { ALT_TECHS, type AltFamily, MILESTONE_LABEL } from "../../../../../src/supply-chain/alts";
import { MilestoneShape } from "./glyphs";
import { onActivate } from "./Landscape";
import { FAMILY_KEY, NOW, YEAR_BREAK, placeMilestones, yearX } from "./landscape-model";

// Every dated milestone across the technologies on one broken time axis.
// Hollow and dashed is an announced target that has not happened yet.

const SW = 1072;
const LANE = 13;
const TICKS = [1900, 1950, 1990, 2000, 2010, 2020, 2030];
const { items, lanes } = placeMilestones(ALT_TECHS, SW);
const undated = ALT_TECHS.filter((t) => t.milestones.length === 0);

export function MilestoneStrip({ hidden, hover, focus, onHover, onPick }: {
    hidden: ReadonlySet<AltFamily>;
    hover: string | null;
    focus: string | null;
    onHover: (id: string | null) => void;
    onPick: (id: string) => void;
}) {
    const lit = hover ?? focus;
    const top = 10;
    const axisY = top + lanes * LANE + 4;
    return <figure className="al-strip">
        <figcaption>
            <span className="al-label">Dated milestones</span>
            <span className="al-strip-key" aria-hidden="true">
                {(["lab", "first-commercial", "volume"] as const).map((k) => <span key={k}>
                    <svg viewBox="-8 -8 16 16"><g className="al-ms"><MilestoneShape kind={k} size={4.5} /></g></svg>{MILESTONE_LABEL[k]}
                </span>)}
                <span><svg viewBox="-8 -8 16 16"><g className="al-ms is-announced"><circle r={4.5} /></g></svg>Announced</span>
            </span>
        </figcaption>
        <div className="al-strip-scroll">
            <svg viewBox={`0 0 ${SW} ${axisY + 22}`} role="group" aria-label="Milestones by year">
                <line className="al-strip-axis" x1={22} x2={SW - 22} y1={axisY} y2={axisY} />
                {TICKS.map((y) => <g key={y} className="al-strip-tick" transform={`translate(${yearX(y, SW)},${axisY})`}>
                    <line y2={4} /><text y={16}>{y}</text>
                </g>)}
                <path className="al-strip-break" transform={`translate(${yearX(YEAR_BREAK, SW) - 10},${axisY})`} d="M-3 -4L1 4M1 -4L5 4" />
                <line className="al-strip-now" x1={yearX(NOW, SW)} x2={yearX(NOW, SW)} y1={2} y2={axisY} />
                <text className="al-strip-nowt" x={yearX(NOW, SW)} y={axisY + 16}>today</text>
                {items.map(({ tech, m, x, lane }) => {
                    if (hidden.has(tech.family)) return null;
                    const cls = `al-ms al-f-${FAMILY_KEY[tech.family]}${m.announced ? " is-announced" : ""}${lit === tech.id ? " is-lit" : lit ? " is-dim" : ""}`;
                    const label = `${tech.short}: ${MILESTONE_LABEL[m.kind]}, ${m.announced ? "announced for " : ""}${m.year.value}. ${m.label}`;
                    return <g key={`${tech.id}-${m.kind}-${m.year.value}`} className={cls} transform={`translate(${x},${top + lane * LANE + 4})`}
                        role="button" tabIndex={-1} aria-label={label} data-tech={tech.id}
                        onMouseEnter={() => onHover(tech.id)} onMouseLeave={() => onHover(null)}
                        onClick={() => onPick(tech.id)} onKeyDown={onActivate(() => onPick(tech.id))}>
                        <title>{label}</title>
                        <MilestoneShape kind={m.kind} size={4.5} />
                    </g>;
                })}
            </svg>
        </div>
        {undated.length ? <p className="al-note">No dated milestone cited: {undated.map((t) => t.short).join(", ")}.</p> : null}
    </figure>;
}
