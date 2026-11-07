import type { Actuator } from "../types";
import { colorForBrand } from "../lib/brands";
import { frontierPath, paretoFront } from "../lib/pareto";
import { activation } from "../lib/svg-link";

interface Props {
    actuators: Actuator[]; // should already be filtered to those with price + density
    onSelect?: (id: string) => void;
}

const W = 920;
const H = 540;
const M = { top: 24, right: 24, bottom: 56, left: 64 };

interface P {
    a: Actuator;
    price: number;
    dens: number;
    x: number;
    y: number;
    front: boolean;
}

const PRICE_TICKS = [25, 50, 100, 200, 500, 1000];

export function Scatter({ actuators, onSelect }: Props) {
    const rows = actuators
        .map((a) => ({ a, price: a.price_usd as number, dens: a.torque_density_nm_per_kg as number }))
        .filter((r) => r.price > 0 && r.dens > 0);
    if (rows.length === 0) return null;

    const prices = rows.map((r) => r.price);
    const denss = rows.map((r) => r.dens);
    const minP = Math.min(...prices, 25);
    const maxP = Math.max(...prices, 1000);
    const maxD = Math.max(...denss) * 1.08;
    const lx = (p: number) =>
        M.left + ((Math.log10(p) - Math.log10(minP)) / (Math.log10(maxP) - Math.log10(minP))) * (W - M.left - M.right);
    const ly = (d: number) => H - M.bottom - (d / maxD) * (H - M.top - M.bottom);

    const front = paretoFront(
        rows,
        (r) => r.price,
        (r) => r.dens,
    );
    const pts: P[] = rows.map((r, i) => ({
        ...r,
        x: lx(r.price),
        y: ly(r.dens),
        front: front[i],
    }));
    const frontPath = frontierPath(pts.filter((p) => p.front));

    // "Best value" region: cheaper than the median price, denser than the median.
    const medP = [...prices].sort((a, b) => a - b)[Math.floor(prices.length / 2)];
    const medD = [...denss].sort((a, b) => a - b)[Math.floor(denss.length / 2)];

    return (
        <svg className="scatter" viewBox={`0 0 ${W} ${H}`} role="img">
            <rect
                x={M.left}
                y={M.top}
                width={lx(medP) - M.left}
                height={ly(medD) - M.top}
                className="quadrant"
            />
            {PRICE_TICKS.filter((t) => t >= minP && t <= maxP).map((t) => (
                <g key={t}>
                    <line x1={lx(t)} x2={lx(t)} y1={M.top} y2={H - M.bottom} className="grid" />
                    <text x={lx(t)} y={H - M.bottom + 18} className="axis-tick" textAnchor="middle">
                        ${t}
                    </text>
                </g>
            ))}
            {[0.25, 0.5, 0.75, 1].map((g) => (
                <g key={g}>
                    <line x1={M.left} x2={W - M.right} y1={ly(maxD * g)} y2={ly(maxD * g)} className="grid" />
                    <text x={M.left - 8} y={ly(maxD * g) + 4} className="axis-tick" textAnchor="end">
                        {Math.round(maxD * g)}
                    </text>
                </g>
            ))}
            {frontPath && <path d={frontPath} className="pareto" />}
            {pts.map((p) => (
                <g key={p.a.id} {...(onSelect ? activation(p.a.name, () => onSelect(p.a.id)) : {})}>
                    <circle
                        cx={p.x}
                        cy={p.y}
                        r={p.front ? 6.5 : 5}
                        className={p.front ? "dot dot-front" : "dot"}
                        style={{ fill: colorForBrand(p.a.brand) }}
                    />
                    {p.front && (
                        <text x={p.x + 9} y={p.y + 4} className="dot-label">
                            {p.a.name} {p.a.country_flag ?? ""}
                        </text>
                    )}
                </g>
            ))}
            <text x={M.left} y={H - 8} className="axis-label">
                Price (USD, log scale) {"→"} cheaper is left
            </text>
            <text x={16} y={M.top - 8} className="axis-label">
                Torque density (N{"·"}m/kg) {"↑"}
            </text>
        </svg>
    );
}
