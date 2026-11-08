import type { KeyboardEvent } from "react";
import { type AltFamily, MAGNET_USE_LABEL } from "../../../../../src/supply-chain/alts";
import { TechDot, TodayMark } from "./glyphs";
import { BASELINE_ID, FAMILY_KEY, GUTTER, type Layout, STAGES, W, splitLabel, stageOf } from "./landscape-model";

// The hero: every technology placed by readiness (x) and magnet use (y).

export const onActivate = (fn: () => void) => (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        fn();
    }
};

export function Landscape({ geo, hidden, hover, focus, onHover, onPick }: {
    geo: Layout;
    hidden: ReadonlySet<AltFamily>;
    hover: string | null;
    focus: string | null;
    onHover: (id: string | null) => void;
    onPick: (id: string) => void;
}) {
    const { columns, bands, nodes, height, plotBottom } = geo;
    const lit = hover ?? focus;
    const colOf = (trl: number) => columns[trl - 1];
    return <svg className="al-land-svg" viewBox={`0 0 ${W} ${height}`} role="group" aria-label="Readiness landscape: technology readiness level across, rare-earth dependence up">
        {bands.map(({ band, y, h }, i) => <g key={band.id} className={`al-band${i % 2 ? " is-alt" : ""}`}>
            <rect x={GUTTER} y={y} width={W - GUTTER} height={h} />
            <text className="al-band-label" x={GUTTER - 10} y={y + h / 2 - 2}>{band.label}</text>
            <text className="al-band-sub" x={GUTTER - 10} y={y + h / 2 + 11}>
                {band.sub.split("\n").map((l, j) => <tspan key={l} x={GUTTER - 10} dy={j ? 11 : 0}>{l}</tspan>)}
            </text>
        </g>)}
        <g className="al-yaxis" aria-hidden="true">
            <text x={GUTTER - 10} y={bands[0].y - 8}>More rare earth</text>
            <path d={`M${GUTTER - 4} ${bands[0].y - 12}l-3 4h6z`} />
        </g>
        {columns.map((c) => <g key={c.trl} className={`al-col${c.empty ? " is-empty" : ""}`} aria-hidden="true">
            <line x1={c.x} x2={c.x} y1={bands[0].y} y2={plotBottom} />
            {c.empty ? <rect className="al-col-gap" x={c.x + 3} y={bands[0].y + 3} width={c.w - 6} height={plotBottom - bands[0].y - 6} /> : null}
            <text className="al-trl-n" x={c.x + c.w / 2} y={plotBottom + 16}>{c.trl}</text>
        </g>)}
        <g className="al-stages" aria-hidden="true">
            {STAGES.map((s) => {
                const a = colOf(s.from);
                const b = colOf(s.to);
                const x1 = a.x + 4;
                const x2 = b.x + b.w - 4;
                return <g key={s.label}>
                    <path d={`M${x1} ${plotBottom + 24}v4H${x2}v-4`} />
                    <text x={(x1 + x2) / 2} y={plotBottom + 40}>{s.label}</text>
                </g>;
            })}
            <text className="al-trl-title" x={GUTTER - 10} y={plotBottom + 16}>TRL</text>
        </g>
        {nodes.map((n) => {
            if (n.id === BASELINE_ID) return <g key={n.id} className={`al-node is-baseline${focus === n.id ? " is-lit is-focus" : lit ? " is-dim" : ""}`} transform={`translate(${n.x},${n.y})`}
                data-tech={n.id} role="button" tabIndex={0} aria-pressed={focus === n.id}
                aria-label="Today's baseline: NdFeB permanent magnet motor, in mass production"
                onClick={() => onPick(n.id)} onKeyDown={onActivate(() => onPick(n.id))}>
                <rect className="al-hit" x={-14} y={-14} width={geo.subW - 6} height={28} />
                <TodayMark />
                <text className="al-node-label" x={16} y={4}>Today: NdFeB</text>
            </g>;
            const t = n.tech;
            if (!t || hidden.has(t.family)) return null;
            const lines = splitLabel(t.short);
            const cls = `al-node al-f-${FAMILY_KEY[t.family]}${lit === t.id ? " is-lit" : lit ? " is-dim" : ""}${focus === t.id ? " is-focus" : ""}`;
            const label = `${t.name}. TRL ${t.trl.value}, ${stageOf(t.trl.value)}. ${MAGNET_USE_LABEL[t.magnets]}. ${n.deployments || "No"} dated deployment${n.deployments === 1 ? "" : "s"} cited.`;
            return <g key={n.id} className={cls} transform={`translate(${n.x},${n.y})`} data-tech={t.id}
                role="button" tabIndex={0} aria-label={label} aria-pressed={focus === t.id}
                onMouseEnter={() => onHover(t.id)} onMouseLeave={() => onHover(null)}
                onFocus={() => onHover(t.id)} onBlur={() => onHover(null)}
                onClick={() => onPick(t.id)} onKeyDown={onActivate(() => onPick(t.id))}>
                <rect className="al-hit" x={-14} y={-14} width={geo.subW - 6} height={28} />
                <TechDot family={t.family} r={n.r} deployments={n.deployments} />
                <text className="al-node-label" x={16} y={lines.length > 1 ? -2 : 4}>
                    {lines.map((l, i) => <tspan key={l} x={16} dy={i ? 12 : 0}>{l}</tspan>)}
                </text>
            </g>;
        })}
    </svg>;
}
