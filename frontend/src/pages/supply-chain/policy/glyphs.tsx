import type { MeasureScope, MeasureStatus, MeasureType } from "../../../../../src/supply-chain/policy/types";

// The /policy symbol set, one stroke weight on a 16-unit grid: a cross for an
// export control (a barrier), a diamond for a tariff (a price tag), a plus
// for a subsidy, a square for a standard (a spec sheet). Colour repeats the
// type; the ring around the mark carries the status, so neither relies on
// colour alone.

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
            return <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />;
        case "tariff":
            return <path d="M8 3l5 5-5 5-5-5z" />;
        case "subsidy":
            return <path d="M8 3.5v9M3.5 8h9" />;
        case "standard":
            return <rect x="4" y="4" width="8" height="8" />;
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
