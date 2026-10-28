import type { LeaderRow } from "../../../../src/sdk";
import { fmtScore } from "./shared";

// 01: brands by overall score under the chosen preset. Confidence is the
// evidence count and the share of the weight that could be scored.
export function SdkLeaderboard({ rows, selected, onSelect }: {
    rows: LeaderRow[];
    selected: string | null;
    onSelect: (brand: string) => void;
}) {
    return <ol className="sdk-board" aria-label="SDK leaderboard">
        {rows.map((r) => {
            const s = r.overall.score;
            return <li key={r.brand.brand} data-brand={r.brand.brand} className={selected === r.brand.brand ? "is-on" : ""}>
                <button type="button" onClick={() => onSelect(r.brand.brand)} aria-pressed={selected === r.brand.brand}
                    title={`${r.brand.name}: ${fmtScore(s)} of 10, ${Math.round(r.overall.coverage * 100)}% of the weight scored, ${r.brand.evidenceCount} evidence items`}>
                    <span className="sdk-rank">{r.rank}</span>
                    <span className="sdk-name">{r.brand.name}</span>
                    <span className="sdk-bar" aria-hidden="true"><i style={{ width: `${(s ?? 0) * 10}%` }} /></span>
                    <span className="sdk-score">{fmtScore(s)}</span>
                    <span className="sdk-conf">{r.brand.evidenceCount} items · {Math.round(r.overall.coverage * 100)}%</span>
                </button>
            </li>;
        })}
    </ol>;
}
