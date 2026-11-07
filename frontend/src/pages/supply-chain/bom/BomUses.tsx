import { useState } from "react";
import type { BomUse } from "../../../../../src/supply-chain/bom/used-in";

// Thumbnails of the robots (and catalog actuators) that use a case's
// actuator or one of its design. Photos are the catalog's own in-repo
// images, shown the way the robot and actuator galleries show them (whole
// part on a light tile); a robot with no photo gets a drawn placeholder,
// never a hotlinked picture.

function Placeholder({ use }: { use: BomUse }) {
    return <svg className="bm-use-ph" viewBox="0 0 60 60" role="img" aria-label={`No photo of ${use.name}`}>
        {use.kind === "robot"
            ? <g fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="30" cy="14" r="6" />
                <path d="M21 24h18l-2 16h-14z" />
                <path d="M21 26l-5 12M39 26l5 12M25 40l-2 14M35 40l2 14" />
            </g>
            : <g fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="30" cy="30" r="18" />
                <circle cx="30" cy="30" r="7" />
            </g>}
    </svg>;
}

function Photo({ use }: { use: BomUse }) {
    const [failed, setFailed] = useState(false);
    if (!use.image || failed) return <Placeholder use={use} />;
    return <img src={use.image} alt={`${use.brand} ${use.name}`} decoding="async" onError={() => setFailed(true)} />;
}

function Tile({ use, compact }: { use: BomUse; compact: boolean }) {
    const tag = use.relation === "this" ? (use.kind === "actuator" ? "this actuator" : "uses it") : "same design";
    const body = <>
        <span className="bm-use-img" data-photo={use.image ? "true" : "false"}><Photo use={use} /></span>
        <span className="bm-use-name">{use.name}{use.count ? <span className="bm-use-count"> ×{use.count}</span> : null}</span>
        {compact ? null : <span className={`bm-use-tag is-${use.relation}`}>{tag}</span>}
    </>;
    const title = `${use.brand} ${use.name}: ${use.how}${use.image ? "" : " No photo on the site."}`;
    return <li className="bm-use" title={title}>
        {use.href ? <a href={use.href}>{body}</a> : <span>{body}</span>}
    </li>;
}

export function BomUses({ uses, compact = false, max }: { uses: readonly BomUse[]; compact?: boolean; max?: number }) {
    if (uses.length === 0) return null;
    const shown = max ? uses.slice(0, max) : uses;
    const more = uses.length - shown.length;
    return <ul className={`bm-uses${compact ? " is-compact" : ""}`} aria-label="Used in">
        {shown.map((u) => <Tile key={u.key} use={u} compact={compact} />)}
        {more > 0 ? <li className="bm-use is-more"><span>+{more}</span></li> : null}
    </ul>;
}
