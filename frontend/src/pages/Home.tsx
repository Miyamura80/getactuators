import { useMemo, useState } from "react";
import { ACTUATORS } from "../lib/data";
import { num } from "../lib/format";
import { Link } from "../lib/router";
import { BrandMark } from "../components/BrandMark";
import { BrandGlyph } from "../components/BrandGlyph";

type CatKey = "humanoid" | "quadruped" | "robot_arm";

interface Cat {
    key: CatKey;
    label: string;
    useCase: string;
    hue: number;
    blurb: string;
    // Photorealistic thumbnail hotlinked from Pexels (free license, commercial
    // use, no attribution required). null falls back to the rendered tile.
    photo: string | null;
    feature?: boolean;
}

const PEXELS = (id: number) =>
    `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop`;

const CATS: Cat[] = [
    {
        key: "robot_arm",
        label: "Robot arms",
        useCase: "robot_arm",
        hue: 210,
        blurb: "Precision joints for cobots, manipulators and pick-and-place cells.",
        photo: PEXELS(34207359),
        feature: true,
    },
    {
        key: "humanoid",
        label: "Humanoids",
        useCase: "humanoid_joint",
        hue: 262,
        blurb: "Hip, knee and shoulder joints for bipedal robots.",
        photo: PEXELS(18799044),
    },
    {
        key: "quadruped",
        label: "Quadrupeds",
        useCase: "quadruped_leg",
        hue: 152,
        blurb: "High-torque proprioceptive legs for legged robots.",
        photo: null,
    },
];

export function Home() {
    const counts = useMemo(() => {
        const m = new Map<string, number>();
        for (const a of ACTUATORS)
            for (const u of a.use_cases ?? []) m.set(u, (m.get(u) ?? 0) + 1);
        return m;
    }, []);

    return (
        <div className="home-page">
            <header className="page-bar">
                <Link to="/" className="page-brand" aria-label="getactuators home">
                    <BrandMark size={24} />
                    <span>
                        get<b>actuators</b>.com
                    </span>
                </Link>
                <nav className="page-nav">
                    <Link to="/" className="page-nav-link" data-on={true}>
                        Home
                    </Link>
                    <Link to="/all" className="page-nav-link">
                        All actuators
                    </Link>
                    <Link to="/actuators" className="page-nav-link">
                        Gallery
                    </Link>
                </nav>
            </header>

            <section className="home-hero">
                <BrandMark size={54} className="hero-mark" />
                <h1>
                    Independent analysis
                    <br />
                    of actuators
                </h1>
                <p className="home-hero-sub">
                    Compare rotary actuators for robot builders. Pick a robot type to
                    jump straight to the joints that fit, or browse the full ranked
                    dataset.
                </p>
            </section>

            <section className="home-cats">
                <h2 className="block-title">
                    <BrandGlyph className="block-tag" />
                    Browse by robot type
                </h2>
                <div className="cat-bento">
                    {CATS.map((cat) => (
                        <CatCard
                            key={cat.key}
                            cat={cat}
                            count={counts.get(cat.useCase) ?? 0}
                        />
                    ))}
                </div>
            </section>

            <Link to="/all" className="all-cta">
                <span className="all-cta-kicker">The full dataset</span>
                <span className="all-cta-title">
                    Browse all {ACTUATORS.length} actuators →
                </span>
                <span className="all-cta-sub">
                    Sort and filter every rotary actuator by torque, density, price,
                    speed and more. Every row links back to its source.
                </span>
            </Link>

            <footer className="foot">
                Community dataset {"·"} v1 sourced from manufacturer pages via web
                search {"·"} category photos are illustrative stock imagery, not the
                listed hardware {"·"} verify against datasheets before engineering use.
            </footer>
        </div>
    );
}

function CatCard({ cat, count }: { cat: Cat; count: number }) {
    const [failed, setFailed] = useState(cat.photo == null);
    return (
        <Link
            to={`/all?use=${cat.useCase}`}
            className={`cat-card${cat.feature ? " cat-card-lg" : ""}`}
            aria-label={`${cat.label}: ${count} actuators`}
        >
            <div className="cat-thumb" style={{ ["--hue" as string]: String(cat.hue) }}>
                {failed ? (
                    <CatFallback catKey={cat.key} />
                ) : (
                    <img
                        className="cat-img"
                        src={cat.photo ?? ""}
                        alt=""
                        loading="lazy"
                        onError={() => setFailed(true)}
                    />
                )}
                <span className="cat-scrim" />
            </div>
            <div className="cat-meta">
                <div className="cat-meta-top">
                    <h3 className="cat-name">{cat.label}</h3>
                    <span className="cat-count">{num(count)}</span>
                </div>
                <p className="cat-blurb">{cat.blurb}</p>
                <span className="cat-go">Explore {cat.label.toLowerCase()} →</span>
            </div>
        </Link>
    );
}

// Rendered fallback for a category with no photo (or a failed hotlink): a
// tinted gradient plate with a simple line glyph of the robot type. Keeps the
// grid intact and on-brand rather than showing a broken image.
function CatFallback({ catKey }: { catKey: CatKey }) {
    return (
        <div className="cat-fallback">
            <svg viewBox="0 0 120 120" className="cat-glyph" aria-hidden="true">
                {catKey === "humanoid" && (
                    <g fill="none" stroke="var(--cyan)" strokeWidth="4" strokeLinecap="round">
                        <circle cx="60" cy="26" r="12" />
                        <line x1="60" y1="38" x2="60" y2="78" />
                        <line x1="60" y1="48" x2="38" y2="66" />
                        <line x1="60" y1="48" x2="82" y2="66" />
                        <line x1="60" y1="78" x2="44" y2="104" />
                        <line x1="60" y1="78" x2="76" y2="104" />
                    </g>
                )}
                {catKey === "quadruped" && (
                    <g fill="none" stroke="var(--cyan)" strokeWidth="4" strokeLinecap="round">
                        <rect x="34" y="44" width="52" height="24" rx="5" />
                        <line x1="86" y1="50" x2="100" y2="40" />
                        <circle cx="103" cy="37" r="4" fill="var(--cyan)" />
                        <line x1="42" y1="68" x2="38" y2="96" />
                        <line x1="56" y1="68" x2="54" y2="96" />
                        <line x1="70" y1="68" x2="72" y2="96" />
                        <line x1="82" y1="68" x2="86" y2="96" />
                    </g>
                )}
                {catKey === "robot_arm" && (
                    <g fill="none" stroke="var(--cyan)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="34" y="96" width="40" height="12" rx="3" />
                        <line x1="54" y1="96" x2="54" y2="64" />
                        <line x1="54" y1="64" x2="86" y2="44" />
                        <line x1="86" y1="44" x2="82" y2="22" />
                        <circle cx="54" cy="64" r="6" fill="var(--cyan)" />
                        <circle cx="86" cy="44" r="6" fill="var(--cyan)" />
                    </g>
                )}
            </svg>
        </div>
    );
}
