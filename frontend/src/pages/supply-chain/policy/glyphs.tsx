import type { MeasureScope, MeasureStatus, MeasureType } from "../../../../../src/supply-chain/policy/types";
import { ObjectTile } from "../../../components/glyphs/ObjectTile";

// The /policy symbol set: each type is the object it acts like, knocked out
// of a solid colour tile on a 24-unit grid. A boom gate for an export
// control, a price tag with a percent sign for a tariff, a banknote for a
// subsidy, a rosette with a check for a standard. Colour repeats the type.
// The tile itself carries the status (solid in force, dashed outline when
// announced or draft, a pause badge when suspended, faded once expired), so
// neither type nor status relies on colour alone.

export const TYPE_COLOR: Record<MeasureType, string> = {
    "export-control": "#ff922b",
    tariff: "#ffd43b",
    subsidy: "#4dabf7",
    standard: "#b197fc",
};

export const SCOPE_SIZE: Record<MeasureScope, number> = { product: 14, sector: 17, economy: 21 };

function Shape({ type }: { type: MeasureType }) {
    switch (type) {
        case "export-control":
            return <>
                <path d="M4.5 21.5V7.5h3.2v14M2.5 21.5h7.5" />
                <rect x="7.7" y="8.6" width="13.8" height="4.2" />
                <path d="M10.4 8.6h2.6v4.2h-2.6zM15.6 8.6h2.6v4.2h-2.6z" className="ot-solid" />
            </>;
        case "tariff":
            return <>
                <path d="M3 12.5 11.5 4H20v8.5L11.5 21z" />
                <path d="M9.6 15.6l5.2-5.2" />
                <circle cx="10" cy="11" r="1.2" />
                <circle cx="14.4" cy="15.2" r="1.2" />
            </>;
        case "subsidy":
            return <>
                <rect x="2.5" y="6.5" width="19" height="11" rx="1" />
                <circle cx="12" cy="12" r="2.8" />
                <path d="M5.5 9.5v5M18.5 9.5v5" />
            </>;
        case "standard":
            return <>
                <circle cx="12" cy="9.5" r="6" />
                <path d="M8.6 14.4 7 21.5l5-2.4 5 2.4-1.6-7.1" />
                <path d="M9.4 9.6l1.8 1.8 3.4-3.6" />
            </>;
    }
}

const HOLLOW: ReadonlySet<MeasureStatus> = new Set(["announced", "draft"]);

function PauseBadge() {
    return <g className="pl-pause">
        <circle cx="21.5" cy="21.5" r="3.8" />
        <path d="M20.3 19.9v3.2M22.7 19.9v3.2" />
    </g>;
}

export function TypeGlyph({ type, status = "in-force", size = 16 }: {
    type: MeasureType;
    status?: MeasureStatus;
    size?: number;
}) {
    // The tile is solid, or a dashed outline while not yet in force.
    return <ObjectTile className={`pl-glyph pl-st-${status}`} size={size} color={TYPE_COLOR[type]} hollow={HOLLOW.has(status)}
        after={status === "suspended" ? <PauseBadge /> : null}>
        <Shape type={type} />
    </ObjectTile>;
}

// The status key on its own: the same tile treatment in neutral grey.
export function StatusGlyph({ status, size = 14 }: { status: MeasureStatus; size?: number }) {
    return <ObjectTile className={`pl-glyph pl-st-${status} is-key`} size={size} hollow={HOLLOW.has(status)}
        after={status === "suspended" ? <PauseBadge /> : null} />;
}

export function FeedIcon() {
    return <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" className="pl-feed-icon">
        <path d="M3 3a10 10 0 0 1 10 10M3 7a6 6 0 0 1 6 6" />
        <circle cx="4" cy="12" r="1.3" />
    </svg>;
}
