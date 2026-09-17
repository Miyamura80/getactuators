import { useEffect, useRef } from "react";
import { ACTUATORS } from "../lib/data";
import { num, price } from "../lib/format";
import { Link } from "../lib/router";
import { BrandMark } from "../components/BrandMark";

interface Props {
    id: string;
}

type Kind =
    | "flange"
    | "bearing"
    | "gear"
    | "wave"
    | "rotor"
    | "stator"
    | "encoder";

interface PartDef {
    kind: Kind;
    label: string;
    blurb: string;
}

// Front (output) to rear, the order you'd pull a strain-wave joint apart on the
// bench. Generic to rotary actuators; the specifics on the right come from data.
const PARTS: PartDef[] = [
    { kind: "flange", label: "Output flange", blurb: "Bolts to the load. Carries the joint's rated torque." },
    { kind: "bearing", label: "Cross-roller bearing", blurb: "Takes moment and axial load so the output stays true." },
    { kind: "gear", label: "Strain-wave gear", blurb: "The reduction stage. Sets ratio, backlash and stiffness." },
    { kind: "wave", label: "Wave generator", blurb: "Elliptical cam that flexes the spline to transmit torque." },
    { kind: "rotor", label: "Rotor", blurb: "Permanent-magnet ring. Its field chases the stator's." },
    { kind: "stator", label: "Stator", blurb: "Wound iron. Current here is torque at the output." },
    { kind: "encoder", label: "Encoder + rear cap", blurb: "Reads angle for commutation and closed-loop control." },
];

export function ExplodedView({ id }: Props) {
    const actuator = ACTUATORS.find((a) => a.id === id);
    const stageRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const scroll = scrollRef.current;
        const stage = stageRef.current;
        if (!scroll || !stage) return;
        let raf = 0;
        const update = () => {
            raf = 0;
            const rect = scroll.getBoundingClientRect();
            const total = rect.height - window.innerHeight;
            const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
            stage.style.setProperty("--p", p.toFixed(4));
        };
        const onScroll = () => {
            if (!raf) raf = requestAnimationFrame(update);
        };
        update();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
            if (raf) cancelAnimationFrame(raf);
        };
        // Re-run when the id changes: navigating from the missing-actuator
        // state to a valid one reuses this component, so the listener has to
        // re-attach to the newly rendered stage.
    }, [id]);

    if (!actuator) {
        return (
            <div className="exploded-page">
                <header className="page-bar">
                    <Link to="/actuators" className="page-brand">
                        <BrandMark size={24} />
                        <span>
                            get<b>actuators</b>.com
                        </span>
                    </Link>
                </header>
                <div className="xp-missing">
                    <p>No actuator with id "{id}".</p>
                    <Link to="/actuators" className="page-nav-link">
                        Back to the gallery
                    </Link>
                </div>
            </div>
        );
    }

    const mid = (PARTS.length - 1) / 2;

    return (
        <div className="exploded-page">
            <header className="page-bar">
                <Link to="/actuators" className="page-brand" aria-label="Back to gallery">
                    <BrandMark size={24} />
                    <span>
                        get<b>actuators</b>.com
                    </span>
                </Link>
                <nav className="page-nav">
                    <Link to="/actuators" className="page-nav-link">
                        ← Gallery
                    </Link>
                    <Link to="/" className="page-nav-link">
                        Leaderboard
                    </Link>
                </nav>
            </header>

            <div className="xp-scroll" ref={scrollRef}>
                <div className="xp-stage" ref={stageRef}>
                    <div className="xp-heading">
                        <p className="xp-eyebrow">
                            {actuator.country_flag} {actuator.brand}
                        </p>
                        <h1>{actuator.name}</h1>
                        <p className="xp-hint">Scroll to pull it apart</p>
                    </div>

                    <div className="xp-viewport">
                        <div className="xp-scene">
                            {PARTS.map((part, i) => (
                                <div
                                    key={part.kind}
                                    className="xp-part"
                                    style={{ ["--i" as string]: String(i - mid) }}
                                >
                                    <PartFace kind={part.kind} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <ol className="xp-callouts">
                        {PARTS.map((part, i) => (
                            <li
                                key={part.kind}
                                className="xp-callout"
                                style={{ ["--s" as string]: (i / PARTS.length).toFixed(3) }}
                            >
                                <span className="xp-callout-idx">
                                    {String(i + 1).padStart(2, "0")}
                                </span>
                                <div>
                                    <b>{part.label}</b>
                                    <span>{part.blurb}</span>
                                </div>
                            </li>
                        ))}
                    </ol>

                    <div className="xp-specs">
                        <Spec label="Peak torque" value={`${num(actuator.peak_torque_nm)} N·m`} />
                        <Spec label="Rated torque" value={`${num(actuator.rated_torque_nm)} N·m`} />
                        <Spec
                            label="Torque density"
                            value={`${num(actuator.torque_density_nm_per_kg)} N·m/kg`}
                        />
                        <Spec label="Reduction" value={actuator.gear_ratio ?? "–"} />
                        <Spec label="Weight" value={`${num(actuator.weight_g)} g`} />
                        <Spec label="Price" value={price(actuator.price_usd)} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function Spec({ label, value }: { label: string; value: string }) {
    return (
        <div className="xp-spec">
            <span className="xp-spec-label">{label}</span>
            <span className="xp-spec-value">{value}</span>
        </div>
    );
}

const R = 108;

function ring(count: number, inner: number, outer: number, stroke: string, w: number) {
    return Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2;
        const c = Math.cos(a);
        const s = Math.sin(a);
        return (
            <line
                key={i}
                x1={120 + inner * c}
                y1={120 + inner * s}
                x2={120 + outer * c}
                y2={120 + outer * s}
                stroke={stroke}
                strokeWidth={w}
            />
        );
    });
}

// Each face is drawn flat in the XY plane; the scene's tilt turns them into the
// ellipses that read as a stacked, exploded assembly.
function PartFace({ kind }: { kind: Kind }) {
    const common = (
        <>
            <circle cx="120" cy="120" r={R} fill="var(--panel)" stroke="var(--line-strong)" strokeWidth="1.5" />
            <circle cx="120" cy="120" r={R} fill="none" stroke="var(--cyan)" strokeWidth="2.4" />
        </>
    );
    let inner = null;
    if (kind === "flange") {
        inner = (
            <>
                {Array.from({ length: 6 }, (_, i) => {
                    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
                    return (
                        <circle
                            key={i}
                            cx={120 + 82 * Math.cos(a)}
                            cy={120 + 82 * Math.sin(a)}
                            r="7"
                            fill="var(--black)"
                            stroke="var(--cyan)"
                            strokeWidth="2"
                        />
                    );
                })}
                <circle cx="120" cy="120" r="34" fill="var(--black)" stroke="var(--cyan)" strokeWidth="2" />
                <rect x="112" y="112" width="16" height="16" fill="none" stroke="var(--cyan)" strokeWidth="2" />
            </>
        );
    } else if (kind === "bearing") {
        inner = (
            <>
                <circle cx="120" cy="120" r="86" fill="none" stroke="var(--cyan)" strokeWidth="1.4" />
                <circle cx="120" cy="120" r="58" fill="none" stroke="var(--cyan)" strokeWidth="1.4" />
                {ring(40, 62, 82, "var(--cyan-dim)", 3)}
            </>
        );
    } else if (kind === "gear") {
        inner = (
            <>
                {ring(64, 90, 100, "var(--green)", 2)}
                <circle cx="120" cy="120" r="90" fill="none" stroke="var(--green)" strokeWidth="1.6" />
                <circle cx="120" cy="120" r="52" fill="none" stroke="var(--cyan)" strokeWidth="1.4" />
            </>
        );
    } else if (kind === "wave") {
        inner = (
            <>
                <ellipse cx="120" cy="120" rx="92" ry="52" fill="none" stroke="var(--cyan)" strokeWidth="2.4" />
                <ellipse cx="120" cy="120" rx="60" ry="34" fill="var(--black)" stroke="var(--cyan-dim)" strokeWidth="1.6" />
                <circle cx="120" cy="120" r="16" fill="var(--black)" stroke="var(--cyan)" strokeWidth="2" />
            </>
        );
    } else if (kind === "rotor") {
        inner = (
            <>
                <circle cx="120" cy="120" r="88" fill="none" stroke="var(--cyan)" strokeWidth="1.4" />
                {Array.from({ length: 16 }, (_, i) => {
                    const a = (i / 16) * Math.PI * 2;
                    const c = Math.cos(a);
                    const s = Math.sin(a);
                    return (
                        <line
                            key={i}
                            x1={120 + 60 * c}
                            y1={120 + 60 * s}
                            x2={120 + 84 * c}
                            y2={120 + 84 * s}
                            stroke={i % 2 ? "var(--red)" : "var(--cyan)"}
                            strokeWidth="6"
                            opacity="0.85"
                        />
                    );
                })}
                <circle cx="120" cy="120" r="24" fill="var(--black)" stroke="var(--cyan)" strokeWidth="2" />
            </>
        );
    } else if (kind === "stator") {
        inner = (
            <>
                <circle cx="120" cy="120" r="88" fill="none" stroke="var(--cyan)" strokeWidth="1.4" />
                {ring(30, 46, 84, "var(--cyan)", 4)}
                <circle cx="120" cy="120" r="40" fill="var(--black)" stroke="var(--cyan)" strokeWidth="1.6" />
            </>
        );
    } else {
        inner = (
            <>
                {ring(120, 70, 88, "var(--cyan-dim)", 1.2)}
                <circle cx="120" cy="120" r="66" fill="var(--black)" stroke="var(--cyan)" strokeWidth="1.6" />
                <circle cx="120" cy="120" r="10" fill="var(--cyan)" />
            </>
        );
    }
    return (
        <svg viewBox="0 0 240 240" className="xp-face" aria-hidden="true">
            {common}
            {inner}
        </svg>
    );
}
