import { type Listing, frontier } from "./listings";
import { classColor, logScale, perNmText, usd, useWidth } from "./shared";
import type { Spec } from "./url-state";

// Price against peak torque for the whole catalog, both log scales, laid out
// in real pixels so labels stay legible on a phone. The spec's corner (at
// least this torque, at most this price) is shaded, the matches carry their
// class colour, the rest stay grey. The dashed step is the best value
// frontier: the cheapest way to buy at least a given torque. Diagonals are
// constant $/Nm.

const P = { l: 46, r: 12, t: 12, b: 36 };
const ISO = [2, 10, 50];

const money = (v: number) => (v >= 1000 ? `$${v / 1000}k` : `$${v}`);

export function ValueScatter({ all, matches, spec, hot, onPick }: {
    all: Listing[];
    matches: Listing[];
    spec: Spec;
    // Actuator to call out (hovered row or the selected one).
    hot: string;
    onPick: (id: string) => void;
}) {
    const [box, SW] = useWidth<HTMLElement>(420);
    const SH = Math.round(Math.min(380, Math.max(280, SW * 0.8)));
    const ts = all.map((l) => l.torque);
    const ps = all.map((l) => l.price);
    const xlo = Math.min(...ts) / 1.4;
    const xhi = Math.max(...ts) * 1.4;
    const ylo = Math.min(...ps) / 1.4;
    const yhi = Math.max(...ps) * 1.4;
    const { f: x, ticks: xTicks } = logScale(xlo, xhi, P.l, SW - P.r);
    const { f: y, ticks: yTicks } = logScale(ylo, yhi, SH - P.b, P.t);
    const matchIds = new Set(matches.map((l) => l.a.id));
    const front = frontier(all);
    const frontIds = new Set(front.map((l) => l.a.id));
    const step = front
        .map((l, i) => (i ? `V${y(l.price).toFixed(1)}H${x(l.torque).toFixed(1)}` : `M${x(l.torque).toFixed(1)},${y(l.price).toFixed(1)}`))
        .join("");
    const clampX = (v: number) => Math.min(Math.max(v, xlo), xhi);
    const clampY = (v: number) => Math.min(Math.max(v, ylo), yhi);
    const zone = spec.nm !== null || spec.budget !== null
        ? { x: x(clampX(spec.nm ?? xlo)), y: y(clampY(spec.budget ?? yhi)) }
        : null;
    const hotL = all.find((l) => l.a.id === hot);
    const order = [...all].sort((p, q) => Number(matchIds.has(p.a.id)) - Number(matchIds.has(q.a.id)));
    // Fewer x labels when narrow, so they never collide.
    const xLabels = SW < 400 ? xTicks.filter((v) => /^[15]/.test(String(v))) : xTicks;

    return <figure className="pr-scatter" ref={box}>
        <svg className="pr-chart" width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} role="img"
            aria-label={`Price against peak torque, log scales: ${matches.length} of ${all.length} actuators meet the spec; ${front.length} sit on the best value frontier`}>
            <defs>
                <clipPath id="pr-plot"><rect x={P.l} y={P.t} width={SW - P.l - P.r} height={SH - P.t - P.b} /></clipPath>
            </defs>
            {xTicks.map((v) => <g key={`x${v}`} className="pr-grid">
                <line x1={x(v)} x2={x(v)} y1={P.t} y2={SH - P.b} />
                {xLabels.includes(v) ? <text x={x(v)} y={SH - P.b + 14} textAnchor="middle">{v}</text> : null}
            </g>)}
            {yTicks.map((v) => <g key={`y${v}`} className="pr-grid">
                <line x1={P.l} x2={SW - P.r} y1={y(v)} y2={y(v)} />
                <text x={P.l - 5} y={y(v) + 3} textAnchor="end">{money(v)}</text>
            </g>)}
            <text className="pr-axis" x={SW - P.r} y={SH - 4} textAnchor="end">peak torque, Nm</text>
            <g clipPath="url(#pr-plot)">
                {zone ? <rect className="pr-zone" x={zone.x} y={zone.y} width={Math.max(0, SW - P.r - zone.x)} height={Math.max(0, SH - P.b - zone.y)} /> : null}
                {ISO.map((k) => {
                    const t0 = Math.max(xlo, ylo / k);
                    const t1 = Math.min(xhi, yhi / k);
                    if (t0 >= t1) return null;
                    return <g key={k} className="pr-iso">
                        <line x1={x(t0)} y1={y(k * t0)} x2={x(t1)} y2={y(k * t1)} />
                        <text x={x(t1) - 4} y={y(k * t1) + 12} textAnchor="end">${k}/Nm</text>
                    </g>;
                })}
                <path className="pr-frontier" d={step} />
                {order.map((l) => {
                    const on = matchIds.has(l.a.id);
                    return <circle key={l.a.id} data-id={l.a.id}
                        className={`pr-sc-dot${on ? " is-match" : ""}${frontIds.has(l.a.id) ? " is-front" : ""}`}
                        cx={x(l.torque)} cy={y(l.price)} r={on ? 4.5 : 3}
                        style={on ? { fill: classColor(l.a.category) } : undefined}
                        onClick={() => onPick(l.a.id)}>
                        <title>{`${l.a.name} (${l.a.brand}): ${usd(l.price)}, ${l.torque} Nm, ${perNmText(l.perNm)}`}</title>
                    </circle>;
                })}
                {hotL ? <g className="pr-hot" pointerEvents="none">
                    <circle cx={x(hotL.torque)} cy={y(hotL.price)} r={9} />
                    <text x={x(hotL.torque) + (x(hotL.torque) > SW * 0.6 ? -13 : 13)} y={y(hotL.price) + 4}
                        textAnchor={x(hotL.torque) > SW * 0.6 ? "end" : "start"}>{hotL.a.name}</text>
                </g> : null}
            </g>
        </svg>
        <figcaption className="pr-legend pr-sc-legend">
            <span><i className="pr-key-match" aria-hidden="true" />Meets spec</span>
            <span><i className="pr-key-front" aria-hidden="true" />Best value frontier</span>
        </figcaption>
    </figure>;
}
