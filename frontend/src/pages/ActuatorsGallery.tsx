import { useMemo } from "react";
import type { Actuator } from "../types";
import { CATEGORY_MAP } from "../types";
import { ACTUATORS } from "../lib/data";
import { num } from "../lib/format";
import { Link, navigate } from "../lib/router";
import { ActuatorThumb } from "../components/ActuatorThumb";
import { BrandMark } from "../components/BrandMark";
import { BrandGlyph } from "../components/BrandGlyph";

type Size = "lg" | "wide" | "sm";

// Bento rhythm: the densest and highest-torque parts earn the big tiles so the
// grid has a focal point, everything else fills in around them.
function sizeFor(rankByDensity: number, rankByTorque: number): Size {
    if (rankByDensity < 4) return "lg";
    if (rankByTorque < 10) return "wide";
    return "sm";
}

export function ActuatorsGallery() {
    const cards = useMemo(() => {
        const byDensity = [...ACTUATORS]
            .filter((a) => a.torque_density_nm_per_kg != null)
            .sort(
                (a, b) =>
                    (b.torque_density_nm_per_kg ?? 0) - (a.torque_density_nm_per_kg ?? 0),
            )
            .map((a) => a.id);
        const byTorque = [...ACTUATORS]
            .filter((a) => a.peak_torque_nm != null)
            .sort((a, b) => (b.peak_torque_nm ?? 0) - (a.peak_torque_nm ?? 0))
            .map((a) => a.id);
        const dRank = new Map(byDensity.map((id, i) => [id, i]));
        const tRank = new Map(byTorque.map((id, i) => [id, i]));

        return ACTUATORS.map((a) => ({
            a,
            size: sizeFor(dRank.get(a.id) ?? 999, tRank.get(a.id) ?? 999),
        })).sort((x, y) => {
            const order: Record<Size, number> = { lg: 0, wide: 1, sm: 2 };
            return order[x.size] - order[y.size];
        });
    }, []);

    return (
        <div className="gallery-page">
            <header className="page-bar">
                <Link to="/" className="page-brand" aria-label="actuatorlist home">
                    <BrandMark size={24} />
                    <span>
                        <b>actuator</b>list.com
                    </span>
                </Link>
                <nav className="page-nav">
                    <Link to="/" className="page-nav-link">
                        Leaderboard
                    </Link>
                    <Link to="/robots" className="page-nav-link">
                        Robot types
                    </Link>
                    <Link to="/all" className="page-nav-link">
                        All actuators
                    </Link>
                    <Link to="/actuators" className="page-nav-link" data-on={true}>
                        Gallery
                    </Link>
                    <Link to="/agents" className="page-nav-link">
                        Agents
                    </Link>
                </nav>
            </header>

            <section className="gallery-hero">
                <h1>
                    <BrandGlyph className="block-tag" />
                    Actuator gallery
                </h1>
                <p>
                    {ACTUATORS.length} rotary actuators, each drawn end-on in the house
                    line style. Tap any part to pull it apart in 3D.
                </p>
            </section>

            <div className="bento">
                {cards.map(({ a, size }) => (
                    <GalleryCard key={a.id} actuator={a} size={size} />
                ))}
            </div>

            <footer className="foot">
                Renders are schematic, generated from each part's category, not
                manufacturer photography. Specs link back to sources on the leaderboard.
            </footer>
        </div>
    );
}

function GalleryCard({ actuator, size }: { actuator: Actuator; size: Size }) {
    const cat = CATEGORY_MAP[actuator.category];
    return (
        <button
            type="button"
            className="bento-card"
            data-size={size}
            onClick={() => navigate(`/actuators/${actuator.id}`)}
        >
            <div className="bento-thumb">
                <ActuatorThumb actuator={actuator} className="thumb-svg" />
            </div>
            <div className="bento-meta">
                <span
                    className="cat-chip"
                    style={{ ["--hue" as string]: String(cat?.hue ?? 210) }}
                >
                    {cat?.label ?? actuator.category}
                </span>
                <h3 className="bento-name">
                    <span className="flag">{actuator.country_flag ?? ""}</span>
                    {actuator.name}
                </h3>
                <p className="bento-brand">{actuator.brand}</p>
                <div className="bento-stats">
                    <span>
                        <b>{num(actuator.peak_torque_nm)}</b> N{"·"}m peak
                    </span>
                    {actuator.torque_density_nm_per_kg != null && (
                        <span>
                            <b>{num(actuator.torque_density_nm_per_kg)}</b> N{"·"}m/kg
                        </span>
                    )}
                </div>
            </div>
            <span className="bento-go">Explode →</span>
        </button>
    );
}
