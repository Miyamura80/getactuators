import { useId } from "react";
import { fmt } from "../lib/motor-torque";

// A dimension line for one shortlist row: the solid bar is the documented
// rated torque, the hatched run beyond it the peak, and the tick is the
// requirement. A tick inside the solid bar is a continuous fit; inside the
// hatch it holds only for short duty.

const W = 168;
const H = 20;
const Y = 11;

export function FitGauge({
    need,
    rated,
    peak,
}: {
    need: number;
    rated: number | null;
    peak: number | null;
}) {
    const hatch = `fit-hatch-${useId().replace(/[^a-z0-9]/gi, "")}`;
    const top = Math.max(need, rated ?? 0, peak ?? 0) * 1.1;
    const x = (v: number) => 2 + (v / top) * (W - 4);
    const xr = rated != null ? x(rated) : 2;
    const xp = peak != null ? x(peak) : xr;
    const xn = x(need);
    const covered = rated != null && rated >= need;
    const label = covered
        ? `Rated ${fmt(rated)} N·m covers ${fmt(need)} N·m`
        : `Only peak ${fmt(peak ?? 0)} N·m reaches ${fmt(need)} N·m: short duty`;
    return (
        <svg
            className={covered ? "fit-gauge rated" : "fit-gauge peak"}
            viewBox={`0 0 ${W} ${H}`}
            width={W}
            height={H}
            role="img"
            aria-label={label}
        >
            <title>{label}</title>
            <defs>
                <pattern id={hatch} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="4" />
                </pattern>
            </defs>
            <line className="fit-axis" x1={2} y1={Y} x2={W - 2} y2={Y} />
            {xp > xr && <rect className="fit-peak" fill={`url(#${hatch})`} x={xr} y={Y - 4} width={xp - xr} height={8} />}
            {rated != null && <rect className="fit-rated" x={2} y={Y - 4} width={xr - 2} height={8} />}
            <path className="fit-need" d={`M${xn} ${Y - 7}V${Y + 7}M${xn - 3.5} 1L${xn} ${Y - 7}L${xn + 3.5} 1Z`} />
        </svg>
    );
}

// Small line glyphs in the gauge's stroke weight, each with a tooltip.
export function SpeedGlyph({ known, rpm }: { known: boolean; rpm?: number }) {
    const label = known
        ? `Max speed documented${rpm ? ` at or above ${fmt(rpm)} rpm` : ""}`
        : "Max speed not documented";
    return (
        <svg className={known ? "fit-glyph ok" : "fit-glyph unknown"} viewBox="0 0 20 20" width={20} height={20} role="img" aria-label={label}>
            <title>{label}</title>
            {/* A speedometer arc with its needle; dashed with no needle when unknown. */}
            <path d="M3.5 14a7 7 0 1 1 13 0" />
            {known ? <path d="M10 13l4-5" /> : <text x={10} y={15} textAnchor="middle">?</text>}
        </svg>
    );
}

export function DriverGlyph() {
    const label = "Drive electronics not included";
    return (
        <svg className="fit-glyph warn" viewBox="0 0 20 20" width={20} height={20} role="img" aria-label={label}>
            <title>{label}</title>
            {/* A plug with a slash through it. */}
            <path d="M7 3v4M13 3v4M5 7h10v3a5 5 0 0 1-10 0zM10 15v3M3 17L17 3" />
        </svg>
    );
}
