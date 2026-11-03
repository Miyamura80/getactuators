import { type BrandSummary, DIMENSION_SHORT, SDK_DIMENSIONS } from "../../../../src/sdk";
import { MISSING_SCORE } from "../../../../src/sdk/score";

const R = 110;
const C = 150;
const N = SDK_DIMENSIONS.length;

function point(i: number, v: number): [number, number] {
    const a = (Math.PI * 2 * i) / N - Math.PI / 2;
    return [C + Math.cos(a) * R * v, C + Math.sin(a) * R * v];
}

const path = (vals: number[]) =>
    `${vals.map((v, i) => point(i, v).map((n) => n.toFixed(1)).join(",")).join(" ")}`;

// 3. Radar per brand with compare mode: up to four brands over the seven
// dimensions, picked in the leaderboard or the tray (the /compare pattern).
// A dimension with no data sits at the neutral score the overall uses. Each
// brand keeps its colour while others are added or removed (colorOf).
export function SdkRadar({ brands, colorOf, remove, clear }: {
    brands: BrandSummary[];
    colorOf: (id: string) => string;
    remove: (id: string) => void;
    clear: () => void;
}) {
    return <div className="sdk-radar">
        <svg viewBox="-50 -10 400 320" role="img" aria-label={`SDK profile of ${brands.map((b) => b.brand.name).join(", ") || "no brands"}`}>
            {[0.25, 0.5, 0.75, 1].map((r) => <polygon key={r} className="sdk-radar-ring" points={path(SDK_DIMENSIONS.map(() => r))} />)}
            {SDK_DIMENSIONS.map((d, i) => {
                const [x, y] = point(i, 1);
                const [lx, ly] = point(i, 1.18);
                return <g key={d}>
                    <line className="sdk-radar-axis" x1={C} y1={C} x2={x} y2={y} />
                    <text x={lx} y={ly} textAnchor={Math.abs(lx - C) < 8 ? "middle" : lx > C ? "start" : "end"} dominantBaseline="middle">{DIMENSION_SHORT[d]}</text>
                </g>;
            })}
            {brands.map((b) => <polygon key={b.brand.id} className="sdk-radar-shape" data-brand={b.brand.id}
                style={{ stroke: colorOf(b.brand.id), fill: colorOf(b.brand.id) }}
                points={path(SDK_DIMENSIONS.map((d) => (b.score.dimensions[d]?.score ?? MISSING_SCORE) / 100))} />)}
        </svg>
        <section className="pick-tray sdk-tray" aria-label="Brands in compare">
            <span aria-live="polite">{brands.length}/4 selected</span>
            <ul>
                {brands.map((b) => <li key={b.brand.id}>
                    <span className="sdk-swatch" style={{ background: colorOf(b.brand.id) }} />
                    <span>{b.brand.name}</span>
                    <button type="button" aria-label={`Remove ${b.brand.name}`} onClick={() => remove(b.brand.id)}>×</button>
                </li>)}
            </ul>
            <button type="button" onClick={clear} disabled={!brands.length}>Clear</button>
            <p className="sdk-muted">A dimension with no data plots at {MISSING_SCORE}, as in the overall.</p>
        </section>
    </div>;
}
