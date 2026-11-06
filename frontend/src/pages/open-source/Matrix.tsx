import {
    OPENNESS_DIMENSIONS,
    OPENNESS_LABEL,
    type OpenRobot,
    opennessScore,
    opennessStatus,
} from "../../../../src/open-source";
import { STATUS_LABEL, StatusDot } from "./Score";

// Robots x openness dimensions. Every published cell links to the file or
// folder; the score column is the plain sum of the row, so it is never a
// black box.
export function Matrix({ robots }: { robots: OpenRobot[] }) {
    return (
        <div className="os-matrix-wrap">
            <table className="os-matrix" aria-labelledby="os-matrix">
                <thead>
                    <tr>
                        <th scope="col">Robot</th>
                        {OPENNESS_DIMENSIONS.map((d) => (
                            <th key={d} scope="col">
                                <span>{OPENNESS_LABEL[d]}</span>
                            </th>
                        ))}
                        <th scope="col">Score</th>
                    </tr>
                </thead>
                <tbody>
                    {robots.map((r) => {
                        const s = opennessScore(r);
                        return (
                            <tr key={r.id}>
                                <th scope="row">{r.name}</th>
                                {OPENNESS_DIMENSIONS.map((d) => {
                                    const status = opennessStatus(r, d);
                                    const link = d === "licence" ? undefined : r.openness[d];
                                    const title = d === "licence" ? r.licence.join(", ") || "No licence stated" : link?.note;
                                    return (
                                        <td key={d} title={title}>
                                            {link ? (
                                                <a href={link.url} target="_blank" rel="noopener" aria-label={`${r.name}: ${OPENNESS_LABEL[d]}, ${STATUS_LABEL[status]}`}>
                                                    <StatusDot status={status} />
                                                </a>
                                            ) : (
                                                <StatusDot status={status} />
                                            )}
                                        </td>
                                    );
                                })}
                                <td className="os-score" title={`${s.full} full + ${s.partial} partial / 2, of 8`}>
                                    {Math.round(s.score * 100)}%
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
