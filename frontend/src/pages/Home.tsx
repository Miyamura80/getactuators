import { PublicHeader } from "../components/PublicHeader";
import { PublicFooter } from "../components/PublicFooter";
import { useMemo } from "react";
import { ACTUATORS } from "../lib/data";
import { num } from "../lib/format";
import { Link } from "../lib/router";
import { BrandMark } from "../components/BrandMark";
import { BrandGlyph } from "../components/BrandGlyph";
import { RobotArt } from "../components/RobotArt";
import type { RobotKind } from "../components/RobotArt";
import { RobotShowcase } from "../components/RobotShowcase";

interface Cat {
    key: RobotKind;
    label: string;
    useCase: string;
    hue: number;
    blurb: string;
    feature?: boolean;
}

const CATS: Cat[] = [
    {
        key: "robot_arm",
        label: "Robot arms",
        useCase: "robot_arm",
        hue: 210,
        blurb: "Precision joints for cobots, manipulators and pick-and-place cells.",
        feature: true,
    },
    {
        key: "humanoid",
        label: "Humanoids",
        useCase: "humanoid_joint",
        hue: 262,
        blurb: "Hip, knee and shoulder joints for bipedal robots.",
    },
    {
        key: "quadruped",
        label: "Quadrupeds",
        useCase: "quadruped_leg",
        hue: 152,
        blurb: "High-torque proprioceptive legs for legged robots.",
    },
];

export function Home({ menuOpen = false }: { menuOpen?: boolean }) {
    const counts = useMemo(() => {
        const m = new Map<string, number>();
        for (const a of ACTUATORS)
            for (const u of a.use_cases ?? []) m.set(u, (m.get(u) ?? 0) + 1);
        return m;
    }, []);

    return (
        <div className="home-page">
            <PublicHeader path="/robots" initialOpen={menuOpen} />

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

            <RobotShowcase />

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

            <p className="foot">
                Community dataset {"·"} v1 sourced from manufacturer pages via web
                search {"·"} category art is illustrative, not the listed hardware {"·"}
                verify against datasheets before engineering use.
            </p>
                <PublicFooter />
        </div>
    );
}

function CatCard({ cat, count }: { cat: Cat; count: number }) {
    return (
        <Link
            to={`/all?use=${cat.useCase}`}
            className={`cat-card${cat.feature ? " cat-card-lg" : ""}`}
            aria-label={`${cat.label}: ${count} actuators`}
        >
            <div className="cat-thumb">
                <RobotArt kind={cat.key} framing={cat.feature ? "card-lg" : "card"} />
                <span className="cat-scrim" />
            </div>
            <div className="cat-meta" style={{ ["--hue" as string]: String(cat.hue) }}>
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
