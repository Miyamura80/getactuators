import { useState } from "react";
import type { BomHero, BomUse } from "../../../../../src/supply-chain/bom/used-in";

// A case's hero image and its "Used in" line. Every image sits on the same
// light studio tile the robot gallery uses for product photos (photos are
// shot on white): photos are contained with even padding, and the dark 3D
// render is inverted to a teal line drawing on the same tile, so a row of
// cards reads as one set. Robots without an in-repo photo are plain names,
// never placeholders.

export function BomHeroImage({ hero, size = "card" }: { hero: BomHero; size?: "card" | "head" }) {
    const [failed, setFailed] = useState(false);
    const img = failed ? null : <img src={hero.src} alt={hero.alt} decoding="async" onError={() => setFailed(true)} />;
    const body = <>
        <span className="bm-hero-img">{img}</span>
        <span className="bm-hero-cap">{hero.caption}</span>
    </>;
    const cls = `bm-hero is-${hero.kind} is-${size}`;
    return hero.href ? <a className={cls} href={hero.href}>{body}</a> : <figure className={cls}>{body}</figure>;
}

const countText = (u: BomUse) =>
    `${u.brand} ${u.name}${u.count ? `: ${u.count} ${u.relation === "this" ? "joints use this actuator" : "joints of the same design"}` : ""}`;

// "Unitree Go1", "AgiBot X1": the brand too, unless the name carries it.
const fullName = (u: BomUse) =>
    u.name.toLowerCase().includes(u.brand.toLowerCase().split(" ")[0] ?? "") ? u.name : `${u.brand.split(" ")[0]} ${u.name}`;

function Name({ use, link, full = true }: { use: BomUse; link: boolean; full?: boolean }) {
    const inner = <>
        {use.image ? <img className="bm-avatar" src={use.image} alt="" decoding="async" /> : null}
        <span>{full ? fullName(use) : use.name}</span>
    </>;
    return link && use.href
        ? <a className="bm-used-item" href={use.href} title={countText(use)}>{inner}</a>
        : <span className="bm-used-item" title={countText(use)}>{inner}</span>;
}

// "Used in: [photo] Asimov 1 · Optimus Gen 2 · +1 more", for robots that
// use this very actuator, or (relation "same-design") robots with a joint
// of its design. Robots with a photo come first; the line never wraps.
export function UsedInLine({ uses, relation = "this", max = 3, link = true, full = true }: { uses: readonly BomUse[]; relation?: BomUse["relation"]; max?: number; link?: boolean; full?: boolean }) {
    const robots = uses
        .filter((u) => u.kind === "robot" && u.relation === relation)
        .map((u, i) => ({ u, i }))
        .sort((a, b) => Number(!a.u.image) - Number(!b.u.image) || a.i - b.i)
        .map(({ u }) => u);
    if (robots.length === 0) return null;
    const shown = robots.slice(0, max);
    const rest = robots.slice(max);
    return <p className="bm-used">
        <span className="bm-used-k">{relation === "this" ? "Used in" : "Same design in"}</span>
        {shown.map((u, i) => <span key={u.key} className="bm-used-slot">{i > 0 ? <span className="bm-used-dot" aria-hidden="true">·</span> : null}<Name use={u} link={link} full={full} /></span>)}
        {rest.length ? <span className="bm-used-more" title={rest.map(countText).join("\n")}>+{rest.length} more</span> : null}
    </p>;
}

// The card's one line: robots using this actuator, else its design.
export function CardUsedIn({ uses }: { uses: readonly BomUse[] }) {
    const own = uses.some((u) => u.kind === "robot" && u.relation === "this");
    return <UsedInLine uses={uses} relation={own ? "this" : "same-design"} max={2} full={false} />;
}

// Catalog actuators of the same design, as text links (case page only).
export function SameDesign({ uses }: { uses: readonly BomUse[] }) {
    const acts = uses.filter((u) => u.kind === "actuator" && u.relation === "same-design");
    if (acts.length === 0) return null;
    return <p className="bm-used">
        <span className="bm-used-k">Catalog, same design</span>
        {acts.map((u, i) => <span key={u.key} className="bm-used-slot">{i > 0 ? <span className="bm-used-dot" aria-hidden="true">·</span> : null}<Name use={u} link /></span>)}
    </p>;
}
