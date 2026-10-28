import { RobotArt, type RobotKind } from "../../components/RobotArt";
import {
    OPENNESS_DIMENSIONS,
    OPENNESS_LABEL,
    type OpenRobot,
    type OpenRobotType,
    licenceLabel,
    opennessScore,
    opennessState,
} from "../../../../src/open-source";

// Small pieces shared by the gallery, the detail panel and the matrix.

const ART_KIND: Record<OpenRobotType, RobotKind> = {
    "mobile-manipulator": "robot_arm",
    arm: "robot_arm",
    humanoid: "humanoid",
    legged: "quadruped",
};

export function Photo({ robot }: { robot: OpenRobot }) {
    if (robot.image) {
        return <img src={robot.image.url} alt={robot.name} loading="lazy" decoding="async" />;
    }
    return (
        <div className="os-art" role="img" aria-label={`${robot.name} (no photo, drawing of a typical ${ART_KIND[robot.type].replace("_", " ")})`}>
            <RobotArt kind={ART_KIND[robot.type]} />
        </div>
    );
}

export function LicenceChips({ robot }: { robot: OpenRobot }) {
    if (robot.licence.length === 0) {
        return (
            <span className="os-chips">
                <span className="os-chip is-none">No licence stated</span>
            </span>
        );
    }
    return (
        <span className="os-chips">
            {robot.licence.map((id) => (
                <span key={id} className={`os-chip${/NC/.test(id) ? " is-nc" : ""}`} title={id}>
                    {licenceLabel(id)}
                </span>
            ))}
        </span>
    );
}

// Eight cells, one per dimension: filled, half or empty, then the score.
export function ScoreMeter({ robot }: { robot: OpenRobot }) {
    const s = opennessScore(robot);
    const pct = Math.round(s.score * 100);
    return (
        <span className="os-meter" aria-label={`Openness ${pct}%: ${s.full} full, ${s.partial} partial, ${s.missing} missing`}>
            <span className="os-meter-cells" aria-hidden="true">
                {OPENNESS_DIMENSIONS.map((d) => (
                    <i key={d} className={`is-${opennessState(robot, d)}`} title={`${OPENNESS_LABEL[d]}: ${opennessState(robot, d)}`} />
                ))}
            </span>
            <b>{pct}%</b>
        </span>
    );
}
