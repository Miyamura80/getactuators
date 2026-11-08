import { type TrendChart, type TrendPoint, formatValue } from "../../../../src/trends";

// One number that sums a chart up for its thumbnail, computed from the data
// so it never drifts from the registry.
export interface Headline {
    value: string;
    label: string;
    // True when a point the headline rests on is estimated or modeled.
    estimated: boolean;
}

const pct = (from: number, to: number) => {
    const d = Math.round(((to - from) / from) * 100);
    return `${d > 0 ? "+" : ""}${d}%`;
};

function median(xs: number[]): number {
    const s = [...xs].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? (s[m] as number) : ((s[m - 1] as number) + (s[m] as number)) / 2;
}

// The value plus the points it rests on: the baselines of a change, or the
// one point a single value reads.
interface Raw {
    value: string;
    label: string;
    basis: TrendPoint[];
    change?: boolean;
}

function raw(c: TrendChart): Raw {
    const first = c.series[0];
    const pts = first?.points ?? [];
    const last = pts.at(-1);
    switch (c.id) {
        case "actuator-prices": {
            const changes = c.series
                .filter((s) => s.points.length > 1)
                .map((s) => ((s.points.at(-1)?.value ?? 0) - (s.points[0]?.value ?? 1)) / (s.points[0]?.value ?? 1));
            const m = Math.round(median(changes) * 100);
            const basis = c.series.filter((s) => s.points.length > 1).flatMap((s) => s.points.slice(0, 1));
            return { value: `${m > 0 ? "+" : ""}${m}%`, label: "median list price change", basis, change: true };
        }
        case "rotary-vs-linear": {
            const linear = c.series.filter((s) => (s.points[0]?.value ?? 0) > 0).length;
            return { value: `${linear} of ${c.series.length}`, label: "humanoids use screws", basis: [] };
        }
        case "roller-screw-cost":
            return {
                value: pct(pts[0]?.value ?? 1, last?.value ?? 1),
                label: `China, since ${pts[0]?.date.slice(0, 4)}`,
                basis: pts.slice(0, 1),
                change: true,
            };
        case "battery-runtime": {
            const vs = pts.map((p) => p.value);
            return { value: `${formatValue(Math.min(...vs))} to ${formatValue(Math.max(...vs))} h`, label: "per charge", basis: [] };
        }
        case "price-of-ai":
            return { value: `${formatValue(last?.value ?? 0)}×`, label: "AI cheaper per year", basis: last ? [last] : [] };
        case "price-per-rd":
            return { value: formatValue(last?.value ?? 0), label: "AI, mid-pack per R&D", basis: last ? [last] : [] };
        case "rated-life": {
            const top = c.series.at(-1)?.points[0];
            return { value: `${formatValue(top?.value ?? 0)} h`, label: "newest gear series", basis: top ? [top] : [] };
        }
        default:
            return {
                value: `${formatValue(last?.value ?? 0)}${c.unit.startsWith("%") ? "%" : ""}`,
                label: `${first?.label ?? ""}, ${last?.date.slice(0, 4) ?? ""}`,
                basis: last ? [last] : [],
            };
    }
}

// A headline resting on an estimated or modeled point says so: "~" before the
// value and "est. baseline" (for a change) or "estimated" after the label.
export function headline(c: TrendChart): Headline {
    const r = raw(c);
    const estimated = r.basis.some((p) => p.confidence !== "reported");
    if (!estimated) return { value: r.value, label: r.label, estimated };
    return { value: `~${r.value}`, label: `${r.label}, ${r.change ? "est. baseline" : "estimated"}`, estimated };
}
