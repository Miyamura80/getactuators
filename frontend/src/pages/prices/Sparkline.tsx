import { PRICES_PATH, PRICE_HISTORY, historyOf, priced, toTime } from "../../../../src/prices/history";
import "./prices.css";

// Small step line of one actuator's recorded price for its catalog page,
// linking to the full chart on /prices.

const SW = 120;
const SH = 28;

export function PriceSparkline({ id }: { id: string }) {
    const p = priced(historyOf(id));
    const first = p[0];
    if (!first) return null;
    const t0 = toTime(first.date);
    const t1 = Math.max(toTime(PRICE_HISTORY.updated), t0 + 86_400_000);
    const vals = p.map((q) => q.priceUsd);
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const x = (date: string) => 2 + ((toTime(date) - t0) / (t1 - t0)) * (SW - 4);
    const y = (v: number) => (hi === lo ? SH / 2 : SH - 3 - ((v - lo) / (hi - lo)) * (SH - 6));
    const d = p
        .map((q, i) => `${i ? "L" : "M"}${x(q.date).toFixed(1)},${y(q.priceUsd).toFixed(1)}H${x(p[i + 1]?.date ?? PRICE_HISTORY.updated).toFixed(1)}`)
        .join("");
    return <a className="pr-spark" href={`${PRICES_PATH}?actuator=${encodeURIComponent(id)}#history`}
        aria-label={`Price history: ${p.length} recorded price${p.length > 1 ? "s" : ""} since ${first.date}`}>
        <svg viewBox={`0 0 ${SW} ${SH}`} width={SW} height={SH} aria-hidden="true">
            <path d={d} />
            {p.map((q) => <circle key={`${q.date}-${q.method}`} cx={x(q.date)} cy={y(q.priceUsd)} r={2} />)}
        </svg>
        <span>Price history since {first.date}</span>
    </a>;
}
