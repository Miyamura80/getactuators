import {
    ALT_FAMILIES,
    ALT_TECHS,
    FAMILY_LABEL,
    MILESTONE_LABEL,
    type Milestone,
    techsIn,
} from "../../../../../src/supply-chain/alts";
import { FootnoteRef, SourcedValue } from "../../../components/supply-chain/SourcedValue";

// Readiness: TRL as nine cells, then each dated milestone on a time axis.
// The axis is broken at 1990 so the century of induction motors and
// cycloids does not squash the last thirty years. An announced target is
// drawn hollow and dashed, joined to today by a dotted line.

const W = 520;
const BREAK = 1990;
const START = 1880;
const END = 2030;
const NOW = 2026;
const SPLIT = 0.24;

export function yearX(year: number): number {
    const y = Math.min(END, Math.max(START, year));
    const t = y < BREAK ? ((y - START) / (BREAK - START)) * SPLIT : SPLIT + ((y - BREAK) / (END - BREAK)) * (1 - SPLIT);
    return 6 + t * (W - 12);
}

const TICKS = [1900, 1950, 2000, 2010, 2020, 2030];

function Marker({ m }: { m: Milestone }) {
    const x = yearX(m.year.value);
    const title = `${MILESTONE_LABEL[m.kind]}: ${m.label} (${m.announced ? "announced for " : ""}${m.year.value})`;
    const cls = `al-ms al-ms-${m.kind}${m.announced ? " is-announced" : ""}`;
    return <g className={cls} transform={`translate(${x},14)`}>
        <title>{title}</title>
        {m.announced ? <line className="al-ms-lead" x1={yearX(NOW) - x} x2={0} y1={0} y2={0} /> : null}
        {m.kind === "lab" ? <circle r={5} /> : m.kind === "first-commercial" ? <rect x={-5} y={-5} width={10} height={10} /> : <path d="M0 -7 L7 0 L0 7 L-7 0 Z" />}
    </g>;
}

function Axis() {
    return <svg className="al-rd-axis" viewBox={`0 0 ${W} 22`} aria-hidden="true">
        <line x1={6} x2={W - 6} y1={4} y2={4} />
        {TICKS.map((y) => <g key={y} transform={`translate(${yearX(y)},4)`}><line y2={4} /><text y={17}>{y}</text></g>)}
        <g transform={`translate(${yearX(BREAK)},4)`} className="al-rd-break"><path d="M-4 -4 L0 4 M0 -4 L4 4" /></g>
    </svg>;
}

function TrlCells({ value }: { value: number }) {
    return <span className="al-trl" role="img" aria-label={`TRL ${value} of 9`}>
        {Array.from({ length: 9 }, (_, i) => <i key={i} className={i < value ? "is-on" : ""} />)}
    </span>;
}

export function Readiness({ tech, onTech }: { tech: string | null; onTech: (id: string) => void }) {
    return <div className="al-rd">
        <ul className="al-rd-key" aria-label="Milestone markers">
            <li><svg viewBox="-8 -8 16 16" aria-hidden="true"><circle className="al-ms-lab" r={5} /></svg>{MILESTONE_LABEL.lab}</li>
            <li><svg viewBox="-8 -8 16 16" aria-hidden="true"><rect className="al-ms-first" x={-5} y={-5} width={10} height={10} /></svg>{MILESTONE_LABEL["first-commercial"]}</li>
            <li><svg viewBox="-8 -8 16 16" aria-hidden="true"><path className="al-ms-volume" d="M0 -7 L7 0 L0 7 L-7 0 Z" /></svg>{MILESTONE_LABEL.volume}</li>
            <li className="is-announced"><svg viewBox="-8 -8 16 16" aria-hidden="true"><circle r={5} /></svg>Announced, not shipped</li>
        </ul>
        <div className="al-rd-grid">
            <div className="al-rd-head" aria-hidden="true"><span>Technology</span><span>TRL</span><Axis /></div>
            {ALT_FAMILIES.map((f) => <div key={f} className="al-rd-family" role="group" aria-label={FAMILY_LABEL[f]}>
                <p className="al-label">{FAMILY_LABEL[f]}</p>
                {techsIn(f).map((t) => <div key={t.id} className={`al-rd-row${t.id === tech ? " is-on" : ""}`}>
                    <button type="button" className="al-rd-name" aria-pressed={t.id === tech} onClick={() => onTech(t.id)}>{t.name}</button>
                    <span className="al-rd-trl">
                        <TrlCells value={t.trl.value} />
                        <FootnoteRef sources={t.trl.sources} asOf={t.trl.asOf} confidence={t.trl.confidence} note={t.trl.note} />
                    </span>
                    <svg className="al-rd-line" viewBox={`0 0 ${W} 28`} role="img"
                        aria-label={t.milestones.length ? t.milestones.map((m) => `${MILESTONE_LABEL[m.kind]} ${m.announced ? "announced for " : ""}${m.year.value}: ${m.label}`).join("; ") : "No dated milestone cited"}>
                        <line className="al-rd-today" x1={yearX(NOW)} x2={yearX(NOW)} y1={2} y2={26} />
                        {t.milestones.map((m) => <Marker key={`${m.kind}-${m.year.value}`} m={m} />)}
                        {t.milestones.length === 0 ? <text className="al-rd-none" x={yearX(2008)} y={18}>no dated milestone cited</text> : null}
                    </svg>
                </div>)}
            </div>)}
        </div>
        <p className="al-note">TRL is our reading of the cited evidence. A milestone year is the earliest dated source we cite; the event may be earlier. The vertical line is today.</p>
        <details className="al-more">
            <summary>Milestones and sources</summary>
            <table className="al-table">
                <thead><tr><th>Technology</th><th>Milestone</th><th>Year</th></tr></thead>
                <tbody>
                    {ALT_TECHS.flatMap((t) => t.milestones.map((m) => <tr key={`${t.id}-${m.kind}-${m.year.value}`}>
                        <th scope="row">{t.short}</th>
                        <td>{m.label}{m.announced ? <span className="al-flag">announced</span> : null}</td>
                        <td><SourcedValue value={m.year} /></td>
                    </tr>))}
                </tbody>
            </table>
        </details>
    </div>;
}
