import { historyFor, isPriced, pricesUrl, yearFraction } from "../../../../src/prices";
import "./price-sparkline.css";

const W = 72;
const H = 22;

// Listed price over time as a step line, linking to the full chart on
// /prices. Nothing when the actuator has no dated price; a link without the
// line when it has only one.
export function PriceSparkline({ id }: { id: string }) {
    const points = historyFor(id).filter(isPriced);
    if (points.length === 0) return null;
    const xs = points.map((p) => yearFraction(p.date));
    const vs = points.map((p) => p.priceUsd);
    const x0 = Math.min(...xs);
    const x1 = Math.max(...xs);
    const lo = Math.min(...vs);
    const hi = Math.max(...vs);
    const sx = (x: number) => 2 + ((x - x0) / (x1 - x0 || 1)) * (W - 4);
    const sy = (v: number) => (hi === lo ? H / 2 : H - 3 - ((v - lo) / (hi - lo)) * (H - 6));
    const d = points
        .map((p, i) => (i === 0 ? `M${sx(xs[i] as number)},${sy(p.priceUsd)}` : `H${sx(xs[i] as number)}V${sy(p.priceUsd)}`))
        .join("");
    const first = points[0];
    const last = points.at(-1);
    const label =
        points.length > 1 && first && last
            ? `Price history: $${first.priceUsd} in ${first.date.slice(0, 4)} to $${last.priceUsd} in ${last.date.slice(0, 4)}`
            : "Price history";
    return (
        <a className="pr-spark-link" href={pricesUrl(id)} aria-label={label}>
            {points.length > 1 && (
                <svg className="pr-spark" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
                    <path d={d} fill="none" stroke="var(--cyan-dim)" strokeWidth={1.4} />
                    {last && <circle cx={sx(x1)} cy={sy(last.priceUsd)} r={2} fill="var(--cyan-dim)" />}
                </svg>
            )}
            <span>{points.length > 1 ? `${points.length} prices` : "history"}</span>
        </a>
    );
}
