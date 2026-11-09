import { useEffect, useState } from "react";
import type { Robot, RobotKind } from "../types";
import { ROBOTS, ROBOT_CREDIT, ROBOT_MOTORS, liftRatio, motorCount, runtimeHours } from "../lib/robots";
import { hours, num, price } from "../lib/format";
import { navigate, useLocationKey } from "../lib/router";
import { BrandGlyph } from "./BrandGlyph";
import { CopyLinkButton } from "./CopyLinkButton";
import { RobotArt } from "./RobotArt";
import { CompanyLogo } from "./CompanyLogo";
import { CountryFlag } from "./CountryFlag";
import { RobotCharts } from "./robots/RobotCharts";
import { RobotFacts } from "./robots/RobotFacts";

// Price shown as a single value or a range when the product has variants.
function priceLabel(r: Robot): string {
    if (r.price_usd == null) return r.kind === "humanoid" || r.availability === "quote_only" ? "Quote" : "–";
    if (r.price_max_usd && r.price_max_usd !== r.price_usd) {
        return `${price(r.price_usd)}–${price(r.price_max_usd)}`;
    }
    return price(r.price_usd);
}

// Whole N·m for joint motors, but keep two places for hobby servos under 1 N·m,
// which would otherwise round to 0 or 1.
function torque(v: number | null): string {
    return num(v, v != null && v < 1 ? 2 : 0);
}

// Mains-powered machines read "Mains"; a battery robot with no published
// figure reads as a dash, with any note shown under the stats.
function runtimeLabel(r: Robot): string {
    if (r.power === "mains") return "Mains";
    const h = runtimeHours(r);
    return h == null ? "–" : hours(h);
}

const KIND_LABEL: Record<RobotKind, string> = {
    humanoid: "humanoid robot",
    robot_arm: "robot arm",
    quadruped: "quadruped robot",
};

// Section order and headings for the grouped grid.
const GROUPS: { kind: RobotKind; title: string }[] = [
    { kind: "humanoid", title: "Humanoids" },
    { kind: "robot_arm", title: "Robot arms" },
    { kind: "quadruped", title: "Quadrupeds" },
];

// Size stat by body plan: height for humanoids, top speed for quadrupeds,
// reach for arms.
function SizeStat({ robot }: { robot: Robot }) {
    if (robot.kind === "humanoid")
        return (
            <div>
                <dt>Height</dt>
                <dd>
                    {robot.height_m == null ? "–" : `${num(robot.height_m, 2)} m`}
                    {robot.reach_mm != null && <small className="robot-stat-note">{num(robot.reach_mm)} mm arm</small>}
                </dd>
            </div>
        );
    if (robot.kind === "quadruped")
        return (
            <div>
                <dt>Top speed</dt>
                <dd>{robot.top_speed_mps == null ? "–" : `${num(robot.top_speed_mps, 1)} m/s`}</dd>
            </div>
        );
    return (
        <div>
            <dt>Reach</dt>
            <dd>{robot.reach_mm == null ? "–" : `${num(robot.reach_mm)} mm`}</dd>
        </div>
    );
}

// Thumbnail: prefer the real product photo, but fall back to the 3D
// render if the (hotlinked) image is missing or fails to load, so a rotated
// or 404'd CDN URL never shows a broken-image icon.
function RobotThumb({ robot }: { robot: Robot }) {
    const [failed, setFailed] = useState(false);
    const showPhoto = Boolean(robot.image_url) && !failed;
    return (
        <div
            className="robot-thumb"
            data-photo={showPhoto ? "true" : "false"}
            data-fit={robot.image_fit ?? "contain"}
        >
            {showPhoto ? (
                <img
                    className="robot-photo"
                    src={robot.image_url ?? undefined}
                    alt={`${robot.name} ${KIND_LABEL[robot.kind]} by ${robot.brand}`}
                    loading="lazy"
                    decoding="async"
                    onError={() => setFailed(true)}
                />
            ) : (
                <RobotArt kind={robot.kind} framing="plain" />
            )}
            {robot.dof != null && <span className="robot-dof">{robot.dof}-DOF</span>}
        </div>
    );
}

function RobotCard({ robot, active }: { robot: Robot; active: boolean }) {
    const joints = robot.joints.map((j) => ({ ...j, motor: j.motor ? ROBOT_MOTORS[j.motor] : undefined }));
    const total = motorCount(robot);
    const lift = liftRatio(robot);
    return (
        <article id={`robot-${robot.id}`} className="robot-card" data-active={active}>
            <RobotThumb robot={robot} />

            <div className="robot-body">
                <div className="robot-head">
                    <h3 className="robot-name">{robot.name}</h3>
                    <div className="robot-head-right">
                        <span className="robot-price">{priceLabel(robot)}</span>
                        <CopyLinkButton
                            path={`/robots#${robot.id}`}
                            label={`Copy link to ${robot.name}`}
                        />
                    </div>
                </div>
                <p className="robot-brand with-logo">
                    <CompanyLogo name={robot.brand} size={20} />
                    <CountryFlag country={robot.country} />
                    {robot.brand}
                </p>
                <p className="robot-summary">{robot.summary}</p>

                <dl className="robot-stats">
                    <div>
                        <dt>Payload</dt>
                        <dd>
                            {robot.payload_kg == null ? "–" : `${num(robot.payload_kg, 1)} kg`}
                            {robot.payload_basis === "whole_body" && robot.kind !== "quadruped" && (
                                <small className="robot-stat-note">whole body</small>
                            )}
                        </dd>
                    </div>
                    <SizeStat robot={robot} />
                    <div>
                        <dt>Weight</dt>
                        <dd>{robot.weight_kg == null ? "–" : `${num(robot.weight_kg, 2)} kg`}</dd>
                    </div>
                    <div>
                        <dt>Actuators</dt>
                        <dd>{total > 0 ? total : "–"}</dd>
                    </div>
                    <div>
                        <dt>Runtime</dt>
                        <dd>{runtimeLabel(robot)}</dd>
                    </div>
                    <div>
                        <dt>Payload ÷ wt</dt>
                        <dd>{lift == null ? "–" : lift.toFixed(2)}</dd>
                    </div>
                </dl>

                {robot.runtime_note && <p className="robot-runtime-note">Runtime: {robot.runtime_note}</p>}

                <RobotFacts robot={robot} />

                <div className="robot-loadout">
                    <span className="robot-loadout-label">Actuator loadout</span>
                    {joints.length > 0 ? (
                        <ul className="motor-list">
                            {joints.map((j) => (
                                <li key={j.role} className="motor-row">
                                    {!j.motor ? (
                                        <span className="motor-name" data-unnamed="true">
                                            {j.count}× motor not named
                                        </span>
                                    ) : j.motor.actuator_id ? (
                                        <a
                                            className="motor-name"
                                            data-catalog="true"
                                            href={`/actuators/${encodeURIComponent(j.motor.actuator_id)}`}
                                            title="Open in the actuator catalog"
                                        >
                                            {j.count}× {j.motor.name}
                                        </a>
                                    ) : (
                                        <a
                                            className="motor-name"
                                            href={j.motor.product_url ?? "#"}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {j.count}× {j.motor.name}
                                        </a>
                                    )}
                                    <span className="motor-role">{j.role}</span>
                                    {j.motor && (
                                        <span className="motor-torque">
                                            {torque(j.motor.rated_torque_nm)}/{torque(j.motor.peak_torque_nm)} N·m
                                            {j.motor.gear_ratio ? ` · ${j.motor.gear_ratio}` : ""}
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="motor-unknown">
                            Per-joint motor list not published yet.
                        </p>
                    )}
                </div>

                {robot.notes && (
                    <details className="robot-notes">
                        <summary>Data notes</summary>
                        <p>{robot.notes}</p>
                    </details>
                )}

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

// Strip the leading "#robot-" from the current hash, if it points at a card.
function hashRobotId(): string | null {
    const h = window.location.hash;
    if (!h.startsWith("#")) return null;
    let id: string;
    try {
        id = decodeURIComponent(h.slice(1));
    } catch {
        // Malformed percent-encoding: ignore the target rather than throwing
        // out of the effect, matching main.tsx's handling of bad paths.
        return null;
    }
    return ROBOTS.some((r) => r.id === id) ? id : null;
}

// The ?kind= filter, when it names a known kind.
function kindParam(): RobotKind | null {
    const k = new URLSearchParams(window.location.search).get("kind");
    return GROUPS.some((g) => g.kind === k) ? (k as RobotKind) : null;
}

// /robots with the kind filter set (or cleared), keeping the rest of the query.
function kindHref(kind: RobotKind | null): string {
    const q = new URLSearchParams(window.location.search);
    if (kind) q.set("kind", kind);
    else q.delete("kind");
    const qs = q.toString();
    return `${window.location.pathname}${qs ? `?${qs}` : ""}`;
}

function KindFilter({ kind }: { kind: RobotKind | null }) {
    const options: { kind: RobotKind | null; title: string; n: number }[] = [
        { kind: null, title: "All", n: ROBOTS.length },
        ...GROUPS.map((g) => ({ ...g, n: ROBOTS.filter((r) => r.kind === g.kind).length })),
    ];
    return (
        <div className="chips robot-kind-filter" role="group" aria-label="Robot type">
            {options.map((o) => (
                <button
                    type="button"
                    key={o.kind ?? "all"}
                    className="chip"
                    aria-pressed={o.kind === kind}
                    data-on={o.kind === kind}
                    onClick={() => navigate(kindHref(o.kind), { keepScroll: true })}
                >
                    {o.title} <span className="chip-count">{o.n}</span>
                </button>
            ))}
        </div>
    );
}

export function RobotShowcase() {
    const locKey = useLocationKey();
    // A hash jump to a robot outside the filter shows every kind, so the
    // targeted card always exists.
    const hashed = ROBOTS.find((r) => r.id === hashRobotId());
    const param = kindParam();
    const kind = hashed && param && hashed.kind !== param ? null : param;
    const shown = kind ? ROBOTS.filter((r) => r.kind === kind) : ROBOTS;
    // The card the current hash points at, briefly highlighted after a jump.
    const [active, setActive] = useState<string | null>(null);

    // On any location change (hard load, back/forward, or a palette jump that
    // pushes /robots#<id>), scroll the targeted card into view and flash it.
    // biome-ignore lint/correctness/useExhaustiveDependencies: locKey is the trigger; the effect reads live location, not a stale closure.
    useEffect(() => {
        const id = hashRobotId();
        if (!id) {
            setActive(null);
            return;
        }
        setActive(id);
        const el = document.getElementById(`robot-${id}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        const t = setTimeout(() => setActive(null), 1800);
        return () => clearTimeout(t);
    }, [locKey]);

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

            <KindFilter kind={kind} />

            <RobotCharts robots={shown} />

            {GROUPS.map((g) => {
                const robots = shown.filter((r) => r.kind === g.kind);
                if (robots.length === 0) return null;
                return (
                    <div key={g.kind} className="robot-group">
                        <h3 className="robot-group-title">
                            {g.title} <span>{robots.length}</span>
                        </h3>
                        <div className="robot-grid">
                            {robots.map((r) => (
                                <RobotCard key={r.id} robot={r} active={active === r.id} />
                            ))}
                        </div>
                    </div>
                );
            })}

            <p className="robot-credit">
                YAM actuator loadout compiled with info from {ROBOT_CREDIT.name} (
                <a href={ROBOT_CREDIT.org_url} target="_blank" rel="noopener noreferrer" className="with-logo">
                    <CompanyLogo name={ROBOT_CREDIT.org} size={14} />
                    {ROBOT_CREDIT.org}
                </a>
                ), which uses the YAM arms. Arm specs from i2rt.com, doc.i2rt.com and
                Damiao datasheets. Humanoid lineup via{" "}
                <a href="https://humanoids.fyi/" target="_blank" rel="noopener noreferrer">
                    humanoids.fyi
                </a>
                , specs from each maker's own pages. Quadruped specs from maker pages,
                spec sheets, launch coverage and retailer listings; a joint reads
                "motor not named" when no source names its motor.
            </p>
        </section>
    );
}
