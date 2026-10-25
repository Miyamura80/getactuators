import { PublicHeader } from "../components/PublicHeader";
import { PublicFooter } from "../components/PublicFooter";
import { useMemo } from "react";
import { useCompareSelection } from "../lib/compare-selection";
import { CompareTray } from "../components/CompareTray";
import { galleryCards, type GallerySize } from "../../../src/catalog/gallery";
import type { Actuator } from "../types";
import { CATEGORY_MAP } from "../types";
import { ACTUATORS } from "../lib/data";
import { num } from "../lib/format";
import { Link } from "../lib/router";
import { ActuatorThumb } from "../components/ActuatorThumb";
import { BrandGlyph } from "../components/BrandGlyph";
import { CompanyLogo } from "../components/CompanyLogo";
import { CountryFlag } from "../components/CountryFlag";

type Size = GallerySize;

export function ActuatorsGallery({ menuOpen = false }: { menuOpen?: boolean }) {
    const cards = useMemo(() => galleryCards(ACTUATORS), []);
    const selection = useCompareSelection();

    return (
        <div className="gallery-page">
            <PublicHeader path="/actuators" initialOpen={menuOpen} />

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
                    <div key={a.id} className="bento-pick" data-size={size}>
                        <GalleryCard actuator={a} size={size} priority={index === 0} />
                        <label className="pick-control"><input type="checkbox" aria-label={`Compare ${a.name}`} checked={selection.ids.includes(a.id)} disabled={!selection.ready || (selection.ids.length === 4 && !selection.ids.includes(a.id))} onChange={() => selection.toggle(a.id)} />Pick</label>
                    </div>
                ))}
            </div>

            <p className="foot">
                Renders are schematic, generated from each part's category, not
                manufacturer photography. Specs link back to sources on the leaderboard.
            </p>
                <CompareTray rows={selection.rows} remove={selection.toggle} clear={() => selection.update([])} />
                <noscript>Picking requires JavaScript. Open product links for specifications, or use a shared /compare?compare=id,id URL.</noscript>
                <PublicFooter />
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
                    <CountryFlag country={actuator.country} />
                    {actuator.name}
                </h3>
                <p className="bento-brand with-logo">
                    <CompanyLogo name={actuator.brand} size={20} />
                    {actuator.brand}
                </p>
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
