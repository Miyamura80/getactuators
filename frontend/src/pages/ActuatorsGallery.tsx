import { PublicHeader } from "../components/PublicHeader";
import { PublicFooter } from "../components/PublicFooter";
import { useEffect, useMemo, useState } from "react";
import { useCompareSelection } from "../lib/compare-selection";
import { CompareTray } from "../components/CompareTray";
import {
    APPLICATION_GROUPS,
    applicationsOf,
    galleryGroups,
    type GalleryGrouping,
    type GallerySize,
} from "../../../src/catalog/gallery";
import type { Actuator } from "../types";
import { CATEGORY_MAP } from "../types";
import { ACTUATORS } from "../lib/data";
import { num } from "../lib/format";
import { Link } from "../lib/router";
import { ActuatorThumb } from "../components/ActuatorThumb";
import { BrandGlyph } from "../components/BrandGlyph";

type Size = GallerySize;

const GROUPINGS: { key: GalleryGrouping; label: string }[] = [
    { key: "type", label: "Actuator type" },
    { key: "application", label: "Application" },
];
const APPLICATION_LABEL = new Map(APPLICATION_GROUPS.map((g) => [g.key, g.label]));

// The prerendered page is always grouped by type; ?by=application is applied
// after hydration so server and client markup match.
function readGrouping(): GalleryGrouping {
    return new URLSearchParams(window.location.search).get("by") === "application"
        ? "application"
        : "type";
}

export function ActuatorsGallery({ menuOpen = false }: { menuOpen?: boolean }) {
    const [by, setBy] = useState<GalleryGrouping>("type");
    useEffect(() => {
        // Back/forward can land on an entry with a different ?by value.
        const restore = () => setBy(readGrouping());
        restore();
        window.addEventListener("popstate", restore);
        return () => window.removeEventListener("popstate", restore);
    }, []);
    const sections = useMemo(() => galleryGroups(ACTUATORS, by), [by]);
    const selection = useCompareSelection();
    const choose = (next: GalleryGrouping) => {
        setBy(next);
        const url = new URL(window.location.href);
        if (next === "type") url.searchParams.delete("by");
        else url.searchParams.set("by", next);
        url.hash = "";
        window.history.replaceState(window.history.state, "", url);
    };
    let index = 0;

    return (
        <div className="gallery-page">
            <PublicHeader path="/actuators" initialOpen={menuOpen} />

            <section className="gallery-hero">
                <h1>
                    <BrandGlyph className="block-tag" />
                    Actuator gallery
                </h1>
                <p>
                    {ACTUATORS.length} rotary actuators, grouped by how they are built
                    or what they are built for. Tap any part to pull it apart in 3D.
                </p>
            </section>

            <div className="gallery-toolbar">
                <div className="gallery-group-by" role="group" aria-label="Group actuators by">
                    <span>Group by</span>
                    {GROUPINGS.map((g) => (
                        <button
                            key={g.key}
                            type="button"
                            aria-pressed={by === g.key}
                            onClick={() => choose(g.key)}
                        >
                            {g.label}
                        </button>
                    ))}
                </div>
                <nav className="gallery-jump" aria-label="Jump to section">
                    {sections.map((s) => (
                        <a key={s.key} href={`#${by}-${s.key}`}>
                            {s.label} <b>{s.cards.length}</b>
                        </a>
                    ))}
                </nav>
            </div>

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
                                    <label className="pick-control"><input type="checkbox" aria-label={`Compare ${a.name}`} checked={selection.ids.includes(a.id)} disabled={!selection.ready || (selection.ids.length === 4 && !selection.ids.includes(a.id))} onChange={() => selection.toggle(a.id)} />Pick</label>
                                </div>
                            );
                        })}
                    </div>
                </section>
            ))}

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

function GalleryCard({ actuator, size, priority, by }: { actuator: Actuator; size: Size; priority: boolean; by: GalleryGrouping }) {
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
