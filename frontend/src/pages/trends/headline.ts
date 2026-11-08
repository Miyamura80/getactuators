import { type TrendChart, formatValue } from "../../../../src/trends";

// One number that sums a chart up for its thumbnail, computed from the data
// so it never drifts from the registry.
export interface Headline {
    value: string;
    label: string;
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

export function headline(c: TrendChart): Headline {
    const first = c.series[0];
    const pts = first?.points ?? [];
    const last = pts.at(-1);
    switch (c.id) {
        case "actuator-prices": {
            const changes = c.series
                .filter((s) => s.points.length > 1)
                .map((s) => ((s.points.at(-1)?.value ?? 0) - (s.points[0]?.value ?? 1)) / (s.points[0]?.value ?? 1));
            const m = Math.round(median(changes) * 100);
            return { value: `${m > 0 ? "+" : ""}${m}%`, label: "median list price change" };
        }
        case "rotary-vs-linear": {
            const linear = c.series.filter((s) => (s.points[0]?.value ?? 0) > 0).length;
            return { value: `${linear} of ${c.series.length}`, label: "humanoids use screws" };
        }
        case "roller-screw-cost":
            return { value: pct(pts[0]?.value ?? 1, last?.value ?? 1), label: `China, since ${pts[0]?.date.slice(0, 4)}` };
        case "battery-runtime": {
            const vs = pts.map((p) => p.value);
            return { value: `${formatValue(Math.min(...vs))} to ${formatValue(Math.max(...vs))} h`, label: "per charge" };
        }
        case "price-of-ai":
            return { value: `${formatValue(last?.value ?? 0)}×`, label: "AI cheaper per year" };
        case "price-per-rd":
            return { value: formatValue(last?.value ?? 0), label: "AI, mid-pack per R&D" };
        case "rated-life": {
            const top = c.series.at(-1)?.points[0];
            return { value: `${formatValue(top?.value ?? 0)} h`, label: "newest gear series" };
        }
        default:
            return {
                value: `${formatValue(last?.value ?? 0)}${c.unit.startsWith("%") ? "%" : ""}`,
                label: `${first?.label ?? ""}, ${last?.date.slice(0, 4) ?? ""}`,
            };
    }
}
