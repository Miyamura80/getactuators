import {
    APPLICATION_GROUPS,
    applicationsOf,
    type GalleryGrouping,
    type GallerySection,
    type GallerySize,
} from "../../../../src/catalog/gallery";
import type { Actuator } from "../../types";
import { CATEGORY_MAP } from "../../types";
import { num } from "../../lib/format";
import { Link } from "../../lib/router";
import { ActuatorThumb } from "../../components/ActuatorThumb";
import { CompanyLogo } from "../../components/CompanyLogo";
import { CountryFlag } from "../../components/CountryFlag";

const APPLICATION_LABEL = new Map(APPLICATION_GROUPS.map((g) => [g.key, g.label]));

interface Props {
    sections: GallerySection<Actuator>[];
    by: GalleryGrouping;
    picked: string[];
    pickReady: boolean;
    onPick: (id: string) => void;
}

export function GalleryView({ sections, by, picked, pickReady, onPick }: Props) {
    let index = 0;
    return (
        <>
            {sections.map((s) => (
                <section key={`${by}-${s.key}`} className="gallery-section" id={`${by}-${s.key}`}>
                    <header className="gallery-section-head">
                        <h2>
                            {s.label} <span>{s.cards.length}</span>
                        </h2>
                        <p>{s.blurb}</p>
                    </header>
                    <div className="bento">
                        {s.cards.map(({ a, size }) => {
                            const priority = index++ === 0;
                            return (
                                <div key={a.id} className="bento-pick" data-size={size}>
                                    <GalleryCard actuator={a} size={size} priority={priority} by={by} />
                                    <label className="pick-control"><input type="checkbox" aria-label={`Compare ${a.name}`} checked={picked.includes(a.id)} disabled={!pickReady || (picked.length === 4 && !picked.includes(a.id))} onChange={() => onPick(a.id)} />Pick</label>
                                </div>
                            );
                        })}
                    </div>
                </section>
            ))}
        </>
    );
}

function GalleryCard({ actuator, size, priority, by }: { actuator: Actuator; size: GallerySize; priority: boolean; by: GalleryGrouping }) {
    const cat = CATEGORY_MAP[actuator.category];
    // Show the dimension the page is not grouped by, so each tile adds information.
    const uses = applicationsOf(actuator).map((key) => APPLICATION_LABEL.get(key) ?? key);
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
                {by === "type" ? (
                    <span className="bento-uses">
                        {uses.slice(0, 2).map((u) => (
                            <span key={u} className="use-chip">{u}</span>
                        ))}
                        {uses.length > 2 && <span className="use-chip">+{uses.length - 2}</span>}
                    </span>
                ) : (
                    <span
                        className="cat-chip"
                        style={{ ["--hue" as string]: String(cat?.hue ?? 210) }}
                    >
                        {cat?.label ?? actuator.category}
                    </span>
                )}
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
