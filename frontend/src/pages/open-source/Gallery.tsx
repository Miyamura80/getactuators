import {
    OPEN_ROBOT_TYPE_LABEL,
    type OpenRobot,
    repoStat,
} from "../../../../src/open-source";
import { LicenceChips, Photo, ScoreMeter } from "./bits";
import { costLabel } from "./format";

function stars(robot: OpenRobot): string | null {
    const s = repoStat(robot);
    if (!s) return null;
    return s.stars >= 1000 ? `${(s.stars / 1000).toFixed(1)}k` : String(s.stars);
}

export function Gallery({
    robots,
    selected,
    onPick,
}: {
    robots: readonly OpenRobot[];
    selected: string | null;
    onPick: (id: string) => void;
}) {
    if (robots.length === 0) return <p className="os-empty">No robot matches this filter.</p>;
    return (
        <ul className="os-gallery">
            {robots.map((r) => {
                const star = stars(r);
                return (
                    <li key={r.id}>
                        <button
                            type="button"
                            className={`os-card${selected === r.id ? " is-on" : ""}${r.meetsInclusionRule ? "" : " is-flagged"}`}
                            aria-pressed={selected === r.id}
                            data-robot={r.id}
                            onClick={() => onPick(r.id)}
                        >
                            <span className="os-photo">
                                <Photo robot={r} />
                            </span>
                            <span className="os-card-body">
                                <span className="os-card-head">
                                    <b>{r.name}</b>
                                    {star && <span className="os-stars" title="GitHub stars">★ {star}</span>}
                                </span>
                                <span className="os-card-meta">
                                    {OPEN_ROBOT_TYPE_LABEL[r.type]} · {r.dof === null ? "DOF n/a" : `${r.dof} DOF`} · {costLabel(r)}
                                </span>
                                <LicenceChips robot={r} />
                                <ScoreMeter robot={r} />
                            </span>
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}
