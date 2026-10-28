import type { MeasureScope, MeasureStatus, MeasureType } from "../../../../../src/supply-chain/policy/types";

// The /policy symbol set, one stroke weight on a 16-unit grid: a padlock for
// an export control, a percent sign for a tariff (a duty rate), a dollar sign
// for a subsidy, a shield with a check for a standard (safety and
// conformity). Colour repeats the type; the ring around the mark carries the
// status, so neither relies on colour alone.

export const TYPE_COLOR: Record<MeasureType, string> = {
    "export-control": "#ff922b",
    tariff: "#ffd43b",
    subsidy: "#4dabf7",
    standard: "#b197fc",
};

export const SCOPE_SIZE: Record<MeasureScope, number> = { product: 12, sector: 15, economy: 19 };

function Shape({ type }: { type: MeasureType }) {
    switch (type) {
        case "export-control":
            return <>
                <path d="M5.6 7.4V6.1a2.4 2.4 0 0 1 4.8 0v1.3" />
                <rect x="4.3" y="7.4" width="7.4" height="5" />
            </>;
        case "tariff":
            return <>
                <path d="M11 4.6 5 11.4" />
                <circle cx="5.4" cy="5.6" r="1.25" />
                <circle cx="10.6" cy="10.4" r="1.25" />
            </>;
        case "subsidy":
            return <path d="M8 3.3v9.4M10.2 5.7c-.4-.6-1.1-.9-2.2-.9-1.3 0-2.1.6-2.1 1.5 0 2 4.4 1.2 4.4 3.3 0 1-.9 1.6-2.3 1.6-1.1 0-1.9-.4-2.3-1.1" />;
        case "standard":
            return <>
                <path d="M8 3.2l4.2 1.5v3.2c0 2.5-1.7 4.1-4.2 4.9-2.5-.8-4.2-2.4-4.2-4.9V4.7z" />
                <path d="M6.1 8.1l1.4 1.4 2.5-2.7" />
            </>;
    }
}

// Ring styles: solid for in force, dotted for announced and draft, dashed for
// suspended, none for expired (the mark itself fades).
const RING: Partial<Record<MeasureStatus, string>> = {
    "in-force": "",
    announced: "1 2",
    draft: "1 2",
    suspended: "3 2",
};

export function TypeGlyph({ type, status = "in-force", size = 16, ring = true }: {
    type: MeasureType;
    status?: MeasureStatus;
    size?: number;
    ring?: boolean;
}) {
    const dash = RING[status];
    return <svg className={`pl-glyph pl-st-${status}`} width={size} height={size} viewBox="0 0 16 16"
        aria-hidden="true" style={{ color: TYPE_COLOR[type] }}>
        {ring && dash !== undefined
            ? <circle cx="8" cy="8" r="7.2" className="pl-ring" strokeDasharray={dash || undefined} />
            : null}
        <g className="pl-mark"><Shape type={type} /></g>
    </svg>;
}

// The status key on its own: the ring around a plain dot.
export function StatusGlyph({ status, size = 14 }: { status: MeasureStatus; size?: number }) {
    const dash = RING[status];
    return <svg className={`pl-glyph pl-st-${status}`} width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
        {dash !== undefined ? <circle cx="8" cy="8" r="7.2" className="pl-ring" strokeDasharray={dash || undefined} /> : null}
        <circle cx="8" cy="8" r="2.2" className="pl-dot" />
    </svg>;
}

export function FeedIcon() {
    return <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" className="pl-feed-icon">
        <path d="M3 3a10 10 0 0 1 10 10M3 7a6 6 0 0 1 6 6" />
        <circle cx="4" cy="12" r="1.3" />
    </svg>;
}
