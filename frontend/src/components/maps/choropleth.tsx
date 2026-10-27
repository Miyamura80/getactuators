import { scaleQuantize } from "d3-scale";

// Choropleth: values bucket into five steps of one cyan ramp (BRAND.md keeps
// colour restrained; country hue is reserved for share bars). Step 0 is "no
// data", drawn as the plain land fill.

export const STEPS = 5;

export type ValueMap = Partial<Record<string, number>>;

export function choroplethScale(values: ValueMap, max?: number): (v: number | undefined) => number {
    const nums = Object.values(values).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    const top = max ?? Math.max(0, ...nums);
    const q = scaleQuantize<number>().domain([0, top || 1]).range([1, 2, 3, 4, 5]);
    return (v) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? q(v) : 0);
}

export function ChoroplethLegend({ label, min, max }: { label: string; min: string; max: string }) {
    return <div className="mk-legend">
        <span className="mk-legend-label">{label}</span>
        <span className="mk-legend-end">{min}</span>
        <span className="mk-ramp" aria-hidden="true">
            {Array.from({ length: STEPS }, (_, i) => <i key={i} data-step={i + 1} />)}
        </span>
        <span className="mk-legend-end">{max}</span>
    </div>;
}
