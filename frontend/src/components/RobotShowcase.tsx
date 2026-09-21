import type { Robot } from "../types";
import { ROBOTS, ROBOT_CREDIT, motorCount, resolveJoints } from "../lib/robots";
import { num, price } from "../lib/format";
import { BrandGlyph } from "./BrandGlyph";
import { RobotArt } from "./RobotArt";

// Price shown as a single value or a range when the product has variants.
function priceLabel(r: Robot): string {
    if (r.price_usd == null) return "–";
    if (r.price_max_usd && r.price_max_usd !== r.price_usd) {
        return `${price(r.price_usd)}–${price(r.price_max_usd)}`;
    }
    return price(r.price_usd);
}

function RobotCard({ robot }: { robot: Robot }) {
    const joints = resolveJoints(robot);
    const total = motorCount(robot);
    return (
        <article className="robot-card">
            <div className="robot-thumb">
                <RobotArt kind="robot_arm" hue={210} />
                <span className="robot-dof">{robot.dof}-DOF</span>
            </div>

            <div className="robot-body">
                <div className="robot-head">
                    <h3 className="robot-name">{robot.name}</h3>
                    <span className="robot-price">{priceLabel(robot)}</span>
                </div>
                <p className="robot-brand">
                    {robot.country_flag} {robot.brand}
                </p>
                <p className="robot-summary">{robot.summary}</p>

                <dl className="robot-stats">
                    <div>
                        <dt>Payload</dt>
                        <dd>{robot.payload_kg == null ? "–" : `${num(robot.payload_kg, 1)} kg`}</dd>
                    </div>
                    <div>
                        <dt>Reach</dt>
                        <dd>{robot.reach_mm == null ? "–" : `${num(robot.reach_mm)} mm`}</dd>
                    </div>
                    <div>
                        <dt>Weight</dt>
                        <dd>{robot.weight_kg == null ? "–" : `${num(robot.weight_kg, 2)} kg`}</dd>
                    </div>
                    <div>
                        <dt>Actuators</dt>
                        <dd>{total > 0 ? total : "–"}</dd>
                    </div>
                </dl>

                <div className="robot-loadout">
                    <span className="robot-loadout-label">Actuator loadout</span>
                    {joints.length > 0 ? (
                        <ul className="motor-list">
                            {joints.map((j) => (
                                <li key={j.role} className="motor-row">
                                    <a
                                        className="motor-name"
                                        href={j.motor.product_url ?? "#"}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {j.count}× {j.motor.name}
                                    </a>
                                    <span className="motor-role">{j.role}</span>
                                    <span className="motor-torque">
                                        {num(j.motor.rated_torque_nm)}/{num(j.motor.peak_torque_nm)} N·m
                                        {j.motor.gear_ratio ? ` · ${j.motor.gear_ratio}` : ""}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="motor-unknown">
                            Per-joint motor list not published yet.
                        </p>
                    )}
                </div>

                {robot.product_url && (
                    <a
                        className="robot-link"
                        href={robot.product_url}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Product page →
                    </a>
                )}
            </div>
        </article>
    );
}

export function RobotShowcase() {
    return (
        <section className="home-robots">
            <h2 className="block-title">
                <BrandGlyph className="block-tag" />
                Robots, down to their actuators
            </h2>
            <p className="block-sub">
                Real robots mapped to the parts that move them. Every joint links to
                the actuator that drives it.
            </p>

            <div className="robot-grid">
                {ROBOTS.map((r) => (
                    <RobotCard key={r.id} robot={r} />
                ))}
            </div>

            <p className="robot-credit">
                Actuator loadout compiled with info from {ROBOT_CREDIT.name} (
                <a href={ROBOT_CREDIT.org_url} target="_blank" rel="noopener noreferrer">
                    {ROBOT_CREDIT.org}
                </a>
                ), which uses the YAM arms. Specs from i2rt.com, doc.i2rt.com and
                Damiao datasheets.
            </p>
        </section>
    );
}
