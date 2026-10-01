import { useMemo } from "react";
import { galleryCards, type GallerySize } from "../../../src/catalog/gallery";
import type { Actuator } from "../types";
import { CATEGORY_MAP } from "../types";
import { ACTUATORS } from "../lib/data";
import { num } from "../lib/format";
import { Link } from "../lib/router";
import { ActuatorThumb } from "../components/ActuatorThumb";
import { BrandMark } from "../components/BrandMark";
import { BrandGlyph } from "../components/BrandGlyph";

type Size = GallerySize;

export function ActuatorsGallery() {
    const cards = useMemo(() => galleryCards(ACTUATORS), []);

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
                    <a href="/guides" className="page-nav-link">
                        Guides
                    </a>
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
                {cards.map(({ a, size }, index) => (
                    <GalleryCard key={a.id} actuator={a} size={size} priority={index === 0} />
                ))}
            </div>

            <footer className="foot">
                Renders are schematic, generated from each part's category, not
                manufacturer photography. Specs link back to sources on the leaderboard.
            </footer>
        </div>
    );
}

function GalleryCard({ actuator, size, priority }: { actuator: Actuator; size: Size; priority: boolean }) {
    const cat = CATEGORY_MAP[actuator.category];
    return (
        <Link
            to={`/actuators/${encodeURIComponent(actuator.id)}`}
            className="bento-card"
            data-size={size}
        >
            <div className="bento-thumb">
                <ActuatorThumb actuator={actuator} className="thumb-svg" priority={priority} />
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
        </Link>
    );
}
