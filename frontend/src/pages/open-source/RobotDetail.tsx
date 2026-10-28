import {
    OPENNESS_DIMENSIONS,
    OPENNESS_LABEL,
    REPO_STATS,
    type OpenRobot,
    getOpenRobot,
    jointMotor,
    motorCount,
    opennessState,
    repoStat,
    repoUrl,
} from "../../../../src/open-source";
import { LicenceChips, ScoreMeter } from "./bits";
import { costLabel } from "./format";

const STATE_TEXT = { full: "Full", partial: "Partial", missing: "Missing" } as const;

function Openness({ robot }: { robot: OpenRobot }) {
    return (
        <ul className="os-dims">
            {OPENNESS_DIMENSIONS.map((d) => {
                const link = robot.openness[d];
                const state = opennessState(robot, d);
                return (
                    <li key={d} className={`is-${state}`}>
                        <i aria-hidden="true" />
                        <span>{OPENNESS_LABEL[d]}</span>
                        {link ? (
                            <a href={link.url} target="_blank" rel="noreferrer">
                                {STATE_TEXT[state]}
                            </a>
                        ) : (
                            <em>{STATE_TEXT[state]}</em>
                        )}
                        {link?.note && <small>{link.note}</small>}
                    </li>
                );
            })}
        </ul>
    );
}

function Joints({ robot }: { robot: OpenRobot }) {
    return (
        <table className="os-joints">
            <thead>
                <tr>
                    <th>Joint</th>
                    <th>Count</th>
                    <th>Actuator</th>
                </tr>
            </thead>
            <tbody>
                {robot.joints.map((j) => {
                    const m = jointMotor(j);
                    return (
                        <tr key={`${j.role}-${j.motor}`}>
                            <td>{j.role}</td>
                            <td className="num">{j.count ?? "n/a"}</td>
                            <td>
                                {j.actuatorId ? <a href={`/actuators/${j.actuatorId}`}>{m.name}</a> : <span>{m.name}</span>}
                                <small>
                                    {m.brand}
                                    {m.listed ? "" : " · not in catalog"}
                                    {j.note ? ` · ${j.note}` : ""}
                                </small>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}

export function RobotDetail({ robot, onPick }: { robot: OpenRobot; onPick: (id: string) => void }) {
    const repo = repoUrl(robot);
    const stat = repoStat(robot);
    const parents = (robot.derivedFrom ?? []).map((id) => getOpenRobot(id)).filter((r): r is OpenRobot => !!r);
    return (
        <article className="os-detail" aria-label={`${robot.name} details`}>
            <header>
                <h3>{robot.name}</h3>
                <p>{robot.summary}</p>
                <p className="os-detail-meta">
                    {robot.maintainers.join(", ")} · {robot.dof === null ? "DOF n/a" : `${robot.dof} DOF`} · {motorCount(robot)} motors ·{" "}
                    {costLabel(robot)}
                    {robot.bomCost?.note ? ` (${robot.bomCost.note})` : ""}
                </p>
                <p className="os-detail-links">
                    {repo && (
                        <a href={repo} target="_blank" rel="noreferrer">
                            {robot.repo}
                        </a>
                    )}
                    {stat && (
                        <span>
                            ★ {stat.starsRounded ? "~" : ""}
                            {stat.stars.toLocaleString("en-US")} · last commit {stat.lastCommit} (snapshot {REPO_STATS.asOf})
                        </span>
                    )}
                    {robot.homepage && (
                        <a href={robot.homepage} target="_blank" rel="noreferrer">
                            Project site
                        </a>
                    )}
                    {robot.catalogRobotId && <a href="/robots">In the robots catalog</a>}
                    {parents.map((p) => (
                        <button key={p.id} type="button" className="os-link" onClick={() => onPick(p.id)}>
                            Derived from {p.name}
                        </button>
                    ))}
                </p>
                <LicenceChips robot={robot} />
                {robot.inclusionNote && (
                    <p className={`os-note${robot.meetsInclusionRule ? "" : " is-flagged"}`}>
                        {robot.meetsInclusionRule ? "" : "Does not yet meet the inclusion rule. "}
                        {robot.inclusionNote}
                    </p>
                )}
                {robot.image && <p className="os-credit">Photo: {robot.image.credit}</p>}
            </header>
            <div className="os-detail-grid">
                <section>
                    <h4>
                        How open <ScoreMeter robot={robot} />
                    </h4>
                    <Openness robot={robot} />
                </section>
                <section>
                    <h4>Actuators by joint</h4>
                    <Joints robot={robot} />
                    {robot.dofNote && <p className="os-credit">{robot.dofNote}</p>}
                </section>
            </div>
        </article>
    );
}
