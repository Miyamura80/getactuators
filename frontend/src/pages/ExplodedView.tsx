import { PublicHeader } from "../components/PublicHeader";
import { evidenceFor, fieldCaveat } from "../../../src/catalog/evidence";
import { useEffect, useRef } from "react";
import { ACTUATORS } from "../lib/data";
import { num, price } from "../lib/format";
import { Link } from "../lib/router";

interface Props {
    id: string;
    menuOpen?: boolean;
}

type Kind = "outline" | "interface" | "boundary";

interface PartDef {
    kind: Kind;
    label: string;
    blurb: string;
}

// Abstract panels deliberately do not depict unverified internal geometry.
const PARTS: PartDef[] = [
    { kind: "outline", label: "Product envelope", blurb: "Illustrative silhouette; dimensions and mounting geometry are not to scale." },
    { kind: "interface", label: "Mechanical interface", blurb: "Confirm the selected model drawing, reduction and load support before design use." },
    { kind: "boundary", label: "System boundary", blurb: "Motor, sensing and drive integration require model-specific confirmation." },
];

export function ExplodedView({ id, menuOpen = false }: Props) {
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
                <PublicHeader path="/actuators" initialOpen={menuOpen} />
                <div className="xp-missing">
                    <p>No actuator with id "{id}".</p>
                    <Link to="/actuators" className="page-nav-link">
                        Back to the gallery
                    </Link>
                </div>
            </div>
        );
    }

    const reducerFamily = ["leaderdrive-lcs", "leaderdrive-lhd", "leaderdrive-lhs", "nidec-flexwave-wpg", "nidec-smart-flexwave-srh"].includes(id);
    const parts = PARTS.map((part) => part.kind === "boundary" ? {
        ...part,
        blurb: reducerFamily
            ? "Reducer only; select motor and drive separately. Sensor electronics are not a motor driver."
            : actuator.category === "frameless_driver"
                ? "Frameless motor / drive offering; enclosure, load support and integration depend on configuration."
                : "Motor, sensing and drive integration require model-specific confirmation.",
    } : part);
    const mid = (parts.length - 1) / 2;

    return (
        <div className="exploded-page">
            <PublicHeader path="/actuators" initialOpen={menuOpen} />

            <div className="xp-scroll" ref={scrollRef}>
                <div className="xp-stage" ref={stageRef}>
                    <div className="xp-heading">
                        <p className="xp-eyebrow">
                            {actuator.country_flag} {actuator.brand}
                        </p>
                        <h1>{actuator.name}</h1>
                        <p className="xp-evidence">{evidenceFor(actuator).label}</p>
                        <p className="xp-hint">{"Conceptual silhouette: not CAD or model-specific internals."} {reducerFamily ? "Generic reducer illustration. No motor included." : "Scroll to separate the illustrative panels."}</p>
                        <a className="xp-specs-jump" href="#catalog-content">
                            Jump to specifications
                        </a>
                    </div>

                    <div className="xp-viewport">
                        <div className="xp-scene">
                            {parts.map((part, i) => (
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
                        {parts.map((part, i) => (
                            <li
                                key={part.kind}
                                className="xp-callout"
                                style={{ ["--s" as string]: (i / parts.length).toFixed(3) }}
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
                        <Spec label="Peak torque" value={`${num(actuator.peak_torque_nm)} N·m`} caveat={fieldCaveat(actuator, "peak_torque_nm")} />
                        <Spec label="Rated torque" value={`${num(actuator.rated_torque_nm)} N·m`} caveat={fieldCaveat(actuator, "rated_torque_nm")} />
                        <Spec
                            label="Torque density"
                            value={`${num(actuator.torque_density_nm_per_kg)} N·m/kg`}
                            caveat={fieldCaveat(actuator, "torque_density_nm_per_kg")}
                        />
                        <Spec label="Reduction" value={actuator.gear_ratio ?? "–"} caveat={fieldCaveat(actuator, "gear_ratio")} />
                        <Spec label="Weight" value={`${num(actuator.weight_g)} g`} caveat={fieldCaveat(actuator, "weight_g")} />
                        <Spec label="Price" value={price(actuator.price_usd)} caveat={fieldCaveat(actuator, "price_usd")} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function Spec({ label, value, caveat }: { label: string; value: string; caveat?: string }) {
    return (
        <div className="xp-spec">
            <span className="xp-spec-label">{label}</span>
            <span className="xp-spec-value">{value}</span>
            {caveat && <small>{caveat}</small>}
        </div>
    );
}

// Neutral silhouettes preserve the animated stacked visual without fake CAD.
function PartFace({ kind }: { kind: Kind }) {
    return (
        <svg viewBox="0 0 240 240" className="xp-face" aria-hidden="true">
            <circle cx="120" cy="120" r="108" fill="var(--panel)" stroke="var(--cyan)" strokeWidth="2.4" />
            <circle cx="120" cy="120" r={kind === "outline" ? 86 : 64} fill="none" stroke="var(--cyan-dim)" strokeWidth="1.6" />
            <circle cx="120" cy="120" r="28" fill="var(--black)" stroke="var(--line-strong)" strokeWidth="1.5" />
        </svg>
    );
}
