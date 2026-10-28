import {
    OPENNESS_DIMENSIONS,
    OPENNESS_LABEL,
    type OpenRobot,
    opennessScore,
    opennessState,
} from "../../../../src/open-source";

// Robots x the eight openness dimensions. Filled, half or empty; each filled
// cell links to the repo or file it was judged from.

const SHORT: Record<(typeof OPENNESS_DIMENSIONS)[number], string> = {
    cad: "CAD",
    electronics: "Elec.",
    firmware: "FW",
    software: "SW",
    bom: "BOM",
    assembly: "Guide",
    sim: "Sim",
    licence: "Lic.",
};

export function Matrix({
    robots,
    selected,
    onPick,
}: {
    robots: readonly OpenRobot[];
    selected: string | null;
    onPick: (id: string) => void;
}) {
    const sorted = [...robots].sort((a, b) => opennessScore(b).score - opennessScore(a).score);
    return (
        <div className="os-matrix-wrap" role="region" aria-label="Openness matrix" tabIndex={0}>
            <table className="os-matrix">
                <thead>
                    <tr>
                        <th scope="col">Robot</th>
                        {OPENNESS_DIMENSIONS.map((d) => (
                            <th key={d} scope="col" title={OPENNESS_LABEL[d]}>
                                <abbr title={OPENNESS_LABEL[d]}>{SHORT[d]}</abbr>
                            </th>
                        ))}
                        <th scope="col">Score</th>
                    </tr>
                </thead>
                <tbody>
                    {sorted.map((r) => (
                        <tr key={r.id} className={selected === r.id ? "is-on" : undefined}>
                            <th scope="row">
                                <button type="button" className="os-link" onClick={() => onPick(r.id)}>
                                    {r.name}
                                </button>
                            </th>
                            {OPENNESS_DIMENSIONS.map((d) => {
                                const state = opennessState(r, d);
                                const link = r.openness[d];
                                const label = `${r.name}, ${OPENNESS_LABEL[d]}: ${state}${link?.note ? `. ${link.note}` : ""}`;
                                return (
                                    <td key={d} data-dim={d}>
                                        {link ? (
                                            <a href={link.url} target="_blank" rel="noreferrer" className={`os-cell is-${state}`} aria-label={label} title={label} />
                                        ) : (
                                            <span className="os-cell is-missing" role="img" aria-label={label} title={label} />
                                        )}
                                    </td>
                                );
                            })}
                            <td className="num">{Math.round(opennessScore(r).score * 100)}%</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
