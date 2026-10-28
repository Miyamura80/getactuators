import { DIMENSIONS, type DimensionId, type LeaderRow, checkDef, evidenceById } from "../../../../src/sdk";
import type { Evidence } from "../../../../src/sdk/types";
import { EvidenceLink, STATUS_LABEL, STATUS_MARK, fmtScore, heat } from "./shared";

// 02: brands x dimensions. A cell opens the checks and evidence behind it.
export function Heatmap({ rows, brand, dim, onCell }: {
    rows: LeaderRow[];
    brand: string | null;
    dim: DimensionId | null;
    onCell: (brand: string, dim: DimensionId | null) => void;
}) {
    const open = rows.find((r) => r.brand.brand === brand);
    return <div className="sdk-heat-wrap">
        <div className="sdk-scroll" role="region" aria-label="SDK scores by dimension" tabIndex={0}>
            <table className="sdk-heat">
                <thead><tr><th scope="col">Brand</th>{DIMENSIONS.map((d) => <th key={d.id} scope="col" title={d.question}>{d.short}</th>)}</tr></thead>
                <tbody>
                    {rows.map((r) => <tr key={r.brand.brand}>
                        <th scope="row">{r.brand.name}</th>
                        {DIMENSIONS.map((d) => {
                            const s = r.brand.dimensions[d.id].score;
                            const on = brand === r.brand.brand && dim === d.id;
                            return <td key={d.id}>
                                <button type="button" className={on ? "is-on" : ""} style={heat(s)} aria-pressed={on}
                                    aria-label={`${r.brand.name}, ${d.label}: ${fmtScore(s)}`} title={`${r.brand.name} · ${d.label}: ${fmtScore(s)}`}
                                    data-cell={`${r.brand.brand}:${d.id}`} onClick={() => onCell(r.brand.brand, on ? null : d.id)}>
                                    {fmtScore(s)}
                                </button>
                            </td>;
                        })}
                    </tr>)}
                </tbody>
            </table>
        </div>
        {open && dim ? <CellDetail row={open} dim={dim} onClose={() => onCell(open.brand.brand, null)} /> : null}
    </div>;
}

function CellDetail({ row, dim, onClose }: { row: LeaderRow; dim: DimensionId; onClose: () => void }) {
    const d = DIMENSIONS.find((x) => x.id === dim);
    const score = row.brand.dimensions[dim];
    return <div className="sdk-cell" role="region" aria-label={`${row.brand.name} ${d?.label} evidence`}>
        <div className="sdk-cell-head">
            <h3>{row.brand.name} · {d?.label} <b>{fmtScore(score.score)}</b></h3>
            <button type="button" onClick={onClose} aria-label="Close evidence">×</button>
        </div>
        <p className="sdk-note">{d?.question} Community signal to watch: {d?.community}.</p>
        <ul className="sdk-checks">
            {score.checks.map((c) => {
                const items = c.evidence.map(evidenceById).filter((e): e is Evidence => !!e);
                return <li key={c.id} className={`sdk-check is-${c.status}`}>
                    <div className="sdk-check-head">
                        <span aria-hidden="true">{STATUS_MARK[c.status]}</span>
                        <span>{checkDef(c.id)?.label}</span>
                        <span className="sdk-check-pts">{STATUS_LABEL[c.status]} · {c.points}/{c.max}</span>
                    </div>
                    {items.length ? <ul>{items.slice(0, 6).map((e) => <EvidenceLink key={e.id} e={e} />)}</ul> : null}
                    {items.length > 6 ? <p className="sdk-note">and {items.length - 6} more in the API.</p> : null}
                </li>;
            })}
        </ul>
    </div>;
}
