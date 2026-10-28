import { type LandscapeSnapshot, leaderboard } from "../../../../../src/patents/landscape";
import { percent } from "../../../../../src/supply-chain/format";
import { Flag } from "../../../components/Flag";

// 04. Top 15 assignees for the picked technology: families, share, 3-year
// growth, and how much the top five hold.

const growth = (g: number | null) => (g === null ? "n/a" : `${g >= 0 ? "+" : ""}${(g * 100).toFixed(0)}%`);

export function Leaderboard({ tech, snapshot }: { tech: string; snapshot: LandscapeSnapshot }) {
    const board = leaderboard(tech, snapshot);
    if (!board || board.rows.length === 0) return <p className="pt-note">No assignees in the snapshot.</p>;
    const max = board.rows[0]?.families ?? 1;
    return <div className="pt-board">
        {board.top5Share === null ? null : <p className="pt-top5">Top 5 hold <b>{percent(board.top5Share)}</b></p>}
        <table>
            <thead>
                <tr>
                    <th scope="col">#</th>
                    <th scope="col">Assignee</th>
                    <th scope="col">Families</th>
                    <th scope="col">Share</th>
                    <th scope="col" title={board.window ? `${board.window[0]} to ${board.window[1]}` : undefined}>3-yr CAGR</th>
                </tr>
            </thead>
            <tbody>
                {board.rows.map((r) => <tr key={r.key} data-key={r.key}>
                    <td>{r.rank}</td>
                    <td className="pt-who">
                        {r.country ? <Flag code={r.country} /> : null}
                        <span>{r.name}</span>
                        {r.companyId ? <abbr className="pt-reg" title="In the supply-chain company registry" data-company={r.companyId}>reg</abbr> : null}
                    </td>
                    <td className="pt-num">
                        <span className="pt-bar" style={{ width: `${(r.families / max) * 100}%` }} aria-hidden="true" />
                        {r.families.toLocaleString("en-US")}
                    </td>
                    <td className="pt-num">{percent(r.share)}</td>
                    <td className={`pt-num${r.cagr !== null && r.cagr < 0 ? " is-down" : ""}`}>{growth(r.cagr)}</td>
                </tr>)}
            </tbody>
        </table>
    </div>;
}
