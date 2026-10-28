import { PRICES_PATH, PRICE_HISTORY, type PricedPoint, historyOf, priced, toTime } from "../../../../src/prices/history";
import "./prices.css";

// Small step line of one actuator's recorded price (a price holds until the
// next reading). PriceSparkline is the catalog page's link to /prices;
// SparkSvg is the bare line the /prices match list draws on a shared time
// span, so rows line up.

const SW = 120;
const SH = 28;

export function SparkSvg({ points, from, width = SW, height = SH }: {
    points: PricedPoint[];
    // Left edge of the time span; defaults to the first point.
    from?: string;
    width?: number;
    height?: number;
}) {
    const first = points[0];
    if (!first) return null;
    const t0 = toTime(from ?? first.date);
    const t1 = Math.max(toTime(PRICE_HISTORY.updated), t0 + 86_400_000);
    const vals = points.map((q) => q.priceUsd);
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const x = (date: string) => 2 + ((toTime(date) - t0) / (t1 - t0)) * (width - 4);
    const y = (v: number) => (hi === lo ? height / 2 : height - 3 - ((v - lo) / (hi - lo)) * (height - 6));
    const d = points
        .map((q, i) => `${i ? "L" : "M"}${x(q.date).toFixed(1)},${y(q.priceUsd).toFixed(1)}H${x(points[i + 1]?.date ?? PRICE_HISTORY.updated).toFixed(1)}`)
        .join("");
    return <svg className="pr-spark-svg" viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
        <path d={d} />
        {points.map((q) => <circle key={`${q.date}-${q.method}`} cx={x(q.date)} cy={y(q.priceUsd)} r={2} />)}
    </svg>;
}

export function PriceSparkline({ id }: { id: string }) {
    const p = priced(historyOf(id));
    const first = p[0];
    if (!first) return null;
    return <a className="pr-spark" href={`${PRICES_PATH}?actuator=${encodeURIComponent(id)}#history`}
        aria-label={`Price history: ${p.length} recorded price${p.length > 1 ? "s" : ""} since ${first.date}`}>
        <SparkSvg points={p} />
        <span>Price history since {first.date}</span>
    </a>;
}
