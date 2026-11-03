import type { BrandSummary } from "../../../../src/sdk";
import { scoreText } from "./state";

// 1. Leaderboard: overall score under the active preset, confidence from the
// number of evidence items, and a compare toggle per brand.
export function SdkLeaderboard({ rows, compare, toggleCompare, focus }: {
    rows: BrandSummary[];
    compare: string[];
    toggleCompare: (id: string) => void;
    focus: (id: string) => void;
}) {
    return <ol className="sdk-board" aria-label="SDK leaderboard">
        {rows.map((s) => {
            const on = compare.includes(s.brand.id);
            return <li key={s.brand.id} id={`sdk-brand-${s.brand.id}`} data-brand={s.brand.id}>
                <span className="sdk-rank">{s.rank}</span>
                <button type="button" className="sdk-name" onClick={() => focus(s.brand.id)}>{s.brand.name}</button>
                <span className="sdk-bar" aria-hidden="true"><span style={{ width: `${s.score.overall}%` }} /></span>
                <b className="sdk-score">{scoreText(s.score.overall)}</b>
                <span className={`sdk-conf sdk-conf-${s.confidence}`} title={`${s.score.evidenceCount} evidence items`}>
                    {s.confidence} <small>{s.score.evidenceCount}</small>
                </span>
                <button type="button" className="sdk-pick" aria-pressed={on}
                    disabled={!on && compare.length >= 4}
                    aria-label={`${on ? "Remove" : "Add"} ${s.brand.name} ${on ? "from" : "to"} compare`}
                    onClick={() => toggleCompare(s.brand.id)}>{on ? "−" : "+"}</button>
            </li>;
        })}
    </ol>;
}
