import { useState } from "react";
import { DIMENSIONS, type BrandScore } from "../../../../src/sdk";
import { MAX_COMPARE } from "./url-state";
import { SLOT_COLORS, fmtScore } from "./shared";

const SIZE = 320;
const C = SIZE / 2;
const R = 112;

const point = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / DIMENSIONS.length;
    return [C + Math.cos(a) * R * (v / 10), C + Math.sin(a) * R * (v / 10)] as const;
};

// 03: one spider per brand, up to four overlaid. Unscored dimensions are
// drawn at the centre with an open marker, never as zero-by-default.
export function Radar({ brands, all, onChange }: {
    brands: BrandScore[];
    all: BrandScore[];
    onChange: (ids: string[]) => void;
}) {
    const [hover, setHover] = useState<string | null>(null);
    const ids = brands.map((b) => b.brand);
    const addable = all.filter((b) => !ids.includes(b.brand));
    return <div className="sdk-radar">
        <div className="sdk-tray" aria-label="Compared brands">
            <span aria-live="polite">{brands.length}/{MAX_COMPARE}</span>
            <ul>
                {brands.map((b, i) => <li key={b.brand}>
                    <i style={{ background: SLOT_COLORS[i] }} aria-hidden="true" />
                    <span>{b.name}</span>
                    {brands.length > 1 ? <button type="button" aria-label={`Remove ${b.name}`} onClick={() => onChange(ids.filter((x) => x !== b.brand))}>×</button> : null}
                </li>)}
            </ul>
            {brands.length < MAX_COMPARE ? <label className="sdk-add">
                <span className="sr-only">Add a brand</span>
                <select value="" onChange={(e) => e.target.value && onChange([...ids, e.target.value])}>
                    <option value="">+ Add brand</option>
                    {addable.map((b) => <option key={b.brand} value={b.brand}>{b.name}</option>)}
                </select>
            </label> : null}
        </div>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={`Radar of ${brands.map((b) => b.name).join(", ")} across seven SDK dimensions`}>
            {[2.5, 5, 7.5, 10].map((v) => <polygon key={v} className="sdk-grid" points={DIMENSIONS.map((_, i) => point(i, v).join(",")).join(" ")} />)}
            {DIMENSIONS.map((d, i) => {
                const [x, y] = point(i, 10);
                const [lx, ly] = point(i, 12.2);
                return <g key={d.id}>
                    <line className="sdk-grid" x1={C} y1={C} x2={x} y2={y} />
                    <text className="sdk-axis" x={lx} y={ly} textAnchor={Math.abs(lx - C) < 4 ? "middle" : lx > C ? "start" : "end"} dominantBaseline="middle">{d.short}</text>
                </g>;
            })}
            {brands.map((b, bi) => {
                const pts = DIMENSIONS.map((d, i) => point(i, b.dimensions[d.id].score ?? 0));
                const dim = hover !== null && hover !== b.brand;
                return <g key={b.brand} opacity={dim ? 0.25 : 1} onMouseEnter={() => setHover(b.brand)} onMouseLeave={() => setHover(null)}>
                    <polygon points={pts.map((p) => p.join(",")).join(" ")} fill={SLOT_COLORS[bi]} fillOpacity={0.08} stroke={SLOT_COLORS[bi]} strokeWidth={2} />
                    {DIMENSIONS.map((d, i) => {
                        const s = b.dimensions[d.id].score;
                        const [x, y] = pts[i] ?? [C, C];
                        return <circle key={d.id} cx={x} cy={y} r={4} fill={s === null ? "#000" : SLOT_COLORS[bi]} stroke={SLOT_COLORS[bi]} strokeWidth={s === null ? 1.5 : 0}>
                            <title>{`${b.name} · ${d.label}: ${fmtScore(s)}`}</title>
                        </circle>;
                    })}
                </g>;
            })}
        </svg>
        <p className="sdk-note">Open markers at the centre are dimensions with nothing to check yet.</p>
    </div>;
}
