import {
    type OpenRobot,
    type OpenRobotType,
    ROBOT_TYPE_LABEL,
    formatUsd,
    isNonCommercial,
    opennessScore,
    repoStat,
    repoUrl,
    totalActuators,
} from "../../../../src/open-source";
import { Flag } from "../../components/Flag";
import { ScoreRing } from "./Score";

// Line glyph per robot type, shown when there is no photo.
function TypeGlyph({ type }: { type: OpenRobotType }) {
    const paths: Record<OpenRobotType, string> = {
        arm: "M8 40h20M18 40V30l8-12 10 4M36 22l4-6",
        "mobile-manipulator": "M8 36h32v6H8zM14 36V20h8l6 -8M22 20h10M12 44a2 2 0 1 0 0 .1M36 44a2 2 0 1 0 0 .1",
        humanoid: "M24 8a4 4 0 1 0 0 .1M24 14v14M16 18h16M24 28l-6 14M24 28l6 14",
        legged: "M10 20h28v8H10zM14 28l-4 12M20 28l2 12M30 28l-2 12M36 28l4 12M38 20l4-6",
    };
    return (
        <svg viewBox="0 0 48 48" className="os-glyph" aria-hidden="true">
            <path d={paths[type]} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function Card({ robot, active }: { robot: OpenRobot; active: boolean }) {
    const score = opennessScore(robot);
    const stars = repoStat(robot)?.stars;
    const repo = repoUrl(robot);
    return (
        <li className={`os-card${active ? " is-active" : ""}`} id={`robot-${robot.id}`}>
            <div className="os-photo">
                {robot.image ? <img src={robot.image} alt={robot.name} loading="lazy" /> : <TypeGlyph type={robot.type} />}
            </div>
            <div className="os-card-head">
                <div>
                    <h3>{robot.name}</h3>
                    <p className="os-meta">
                        {ROBOT_TYPE_LABEL[robot.type]}
                        {robot.country && (
                            <>
                                {" · "}
                                <Flag code={robot.country} />
                            </>
                        )}
                    </p>
                </div>
                <ScoreRing score={score.score} />
            </div>
            <dl className="os-facts">
                <div>
                    <dt>DOF</dt>
                    <dd>{robot.dof ?? "n/a"}</dd>
                </div>
                <div>
                    <dt>{robot.bomCostUsd?.basis === "kit" ? "Kit" : "BOM"}</dt>
                    <dd>{robot.bomCostUsd ? formatUsd(robot.bomCostUsd.value) : "n/a"}</dd>
                </div>
                <div>
                    <dt>Stars</dt>
                    <dd>{stars == null ? "n/a" : stars.toLocaleString("en-US")}</dd>
                </div>
            </dl>
            <p className="os-chips">
                {robot.licence.length === 0 ? (
                    <span className="os-chip is-none">No licence</span>
                ) : (
                    robot.licence.map((l) => (
                        <span key={l} className={`os-chip${isNonCommercial(l) ? " is-nc" : ""}`}>
                            {l.replace(/^LicenseRef-/, "")}
                        </span>
                    ))
                )}
            </p>
            <details className="os-more">
                <summary>{totalActuators(robot)} actuators</summary>
                <p>{robot.summary}</p>
                <ul className="os-joints">
                    {robot.joints.map((j) => (
                        <li key={j.role}>
                            <b>{j.count}x</b> {j.role}:{" "}
                            {j.actuatorId ? <a href={`/actuators/${j.actuatorId}`}>{j.name}</a> : <span>{j.name}</span>}
                        </li>
                    ))}
                </ul>
                {robot.jointsNote && <p className="os-note">{robot.jointsNote}</p>}
                <p className="os-links">
                    <a href={robot.homepage} target="_blank" rel="noopener">
                        Project
                    </a>
                    {repo && (
                        <a href={repo} target="_blank" rel="noopener">
                            Repository
                        </a>
                    )}
                    {robot.robotId && <a href="/robots">Catalog robot</a>}
                </p>
            </details>
        </li>
    );
}

export function Gallery({ robots, active }: { robots: OpenRobot[]; active: string | null }) {
    if (robots.length === 0) return <p className="os-empty">No robot matches these filters.</p>;
    return (
        <ul className="os-gallery" aria-label="Open robots">
            {robots.map((r) => (
                <Card key={r.id} robot={r} active={r.id === active} />
            ))}
        </ul>
    );
}
