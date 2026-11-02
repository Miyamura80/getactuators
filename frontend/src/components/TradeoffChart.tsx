import { useMemo, useState } from "react";
import type { Actuator } from "../types";
import { CATEGORY_MAP } from "../types";
import { activation } from "../lib/svg-link";
import { Legend } from "./Legend";
import {
    type TradeoffRow,
    tradeoffApplications,
    tradeoffRows,
} from "../../../src/catalog/tradeoff";

interface Props {
    actuators: Actuator[];
    onSelect?: (id: string) => void;
}

const W = 920;
const H = 560;
const M = { top: 28, right: 24, bottom: 56, left: 64 };

const PRICE_TICKS = [25, 50, 100, 200, 500, 1000, 2000, 5000];
const RATIO_TICKS = [1, 3, 10, 30, 100, 300];

// Reduction bands. Below ~10:1 the motor still feels the load (QDD, direct
// drive); from ~50:1 the joint is stiff and precise but no longer
// backdrivable in practice.
const BANDS = [
    { key: "compliant", lo: 0, hi: 12, label: "Compliant: backdrivable, force-transparent" },
    { key: "middle", lo: 12, hi: 50, label: "Middle: some feel, some stiffness" },
    { key: "precise", lo: 50, hi: Infinity, label: "Precise: stiff, low backlash, not backdrivable" },
] as const;

const categoryColor = (c: Actuator["category"]) => `hsl(${CATEGORY_MAP[c]?.hue ?? 210} 70% 60%)`;

function arcmin(r: TradeoffRow): string {
    return r.backlash == null ? "backlash not published" : `backlash ${r.backlash} arcmin`;
}

function backdriveText(r: TradeoffRow): string {
    if (r.backdrive === "unknown") return "backdrivability not published";
    return r.backdrive === "yes" ? "backdrivable" : "not backdrivable";
}

export function TradeoffChart({ actuators, onSelect }: Props) {
    const rows = useMemo(() => tradeoffRows(actuators), [actuators]);
    const apps = useMemo(() => tradeoffApplications(rows), [rows]);
    const [app, setApp] = useState<string | null>(null);
    if (rows.length === 0) return null;

    const prices = rows.map((r) => r.price);
    const ratios = rows.map((r) => r.ratio);
    const minP = Math.min(...prices, 25);
    const maxP = Math.max(...prices, 1000);
    const minR = 0.8;
    const maxR = Math.max(...ratios) * 1.3;
    const log = Math.log10;
    const lx = (p: number) =>
        M.left + ((log(p) - log(minP)) / (log(maxP) - log(minP))) * (W - M.left - M.right);
    const ly = (r: number) =>
        H - M.bottom - ((log(r) - log(minR)) / (log(maxR) - log(minR))) * (H - M.top - M.bottom);

    const on = (r: TradeoffRow) => app == null || r.applications.includes(app);
    const shown = rows.filter(on);

    // Label the cheapest actuator of each band among those shown, so every
    // band names its value pick without crowding the plot.
    const labelled = new Set(
        BANDS.map((b) =>
            shown
                .filter((r) => r.ratio >= b.lo && r.ratio < b.hi)
                .sort((a, z) => a.price - z.price)[0]?.id,
        ).filter(Boolean),
    );

    const legend = [...new Set(rows.map((r) => r.category))].map((c) => ({
        name: CATEGORY_MAP[c]?.label ?? c,
        color: categoryColor(c),
    }));

    return (
        <>
            <div className="chips tradeoff-chips" role="group" aria-label="Filter by application">
                <button type="button" className="chip" data-on={app == null} onClick={() => setApp(null)}>
                    All <span className="chip-count">{rows.length}</span>
                </button>
                {apps.map((g) => (
                    <button
                        type="button"
                        key={g.key}
                        className="chip"
                        data-on={app === g.key}
                        onClick={() => setApp(app === g.key ? null : g.key)}
                    >
                        {g.label} <span className="chip-count">{g.count}</span>
                    </button>
                ))}
            </div>
            <Legend entries={legend} />
            <div className="tradeoff-keys" aria-hidden="true">
                <span><svg width="12" height="12"><circle cx="6" cy="6" r="5" className="td-yes" /></svg>backdrivable</span>
                <span><svg width="12" height="12"><circle cx="6" cy="6" r="4.5" className="td-no" /></svg>not backdrivable</span>
                <span><svg width="12" height="12"><rect x="2" y="2" width="8" height="8" transform="rotate(45 6 6)" className="td-unknown" /></svg>not published</span>
            </div>
            <div className="chart-scroll">
                <svg className="scatter tradeoff" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Reduction ratio versus price">
                    {BANDS.map((b) => {
                        const y1 = ly(Math.min(b.hi, maxR));
                        const y2 = ly(Math.max(b.lo, minR));
                        return (
                            <g key={b.key}>
                                <rect x={M.left} y={y1} width={W - M.left - M.right} height={y2 - y1} className={`td-band td-band-${b.key}`} />
                                <text x={W - M.right - 8} y={y1 + 16} className="td-band-label" textAnchor="end">
                                    {b.label}
                                </text>
                            </g>
                        );
                    })}
                    {PRICE_TICKS.filter((t) => t >= minP && t <= maxP).map((t) => (
                        <g key={t}>
                            <line x1={lx(t)} x2={lx(t)} y1={M.top} y2={H - M.bottom} className="grid" />
                            <text x={lx(t)} y={H - M.bottom + 18} className="axis-tick" textAnchor="middle">
                                ${t >= 1000 ? `${t / 1000}k` : t}
                            </text>
                        </g>
                    ))}
                    {RATIO_TICKS.filter((t) => t <= maxR).map((t) => (
                        <g key={t}>
                            <line x1={M.left} x2={W - M.right} y1={ly(t)} y2={ly(t)} className="grid" />
                            <text x={M.left - 8} y={ly(t) + 4} className="axis-tick" textAnchor="end">
                                {t}:1
                            </text>
                        </g>
                    ))}
                    {[...rows]
                        .sort((a, b) => Number(on(a)) - Number(on(b)))
                        .map((r) => {
                            const x = lx(r.price);
                            const y = ly(r.ratio);
                            const fill = categoryColor(r.category);
                            const label = `${r.name}: $${r.price}, ${r.ratio}:1, ${backdriveText(r)}, ${arcmin(r)}`;
                            return (
                                <g
                                    key={r.id}
                                    className={on(r) ? "td-pt" : "td-pt td-off"}
                                    {...(onSelect ? activation(label, () => onSelect(r.id)) : {})}
                                >
                                    <title>{label}</title>
                                    {r.backdrive === "unknown" ? (
                                        <rect x={x - 4} y={y - 4} width="8" height="8" transform={`rotate(45 ${x} ${y})`} className="td-unknown" style={{ fill }} />
                                    ) : (
                                        <circle
                                            cx={x}
                                            cy={y}
                                            r={r.backdrive === "yes" ? 5.5 : 5}
                                            className={r.backdrive === "yes" ? "td-yes" : "td-no"}
                                            style={r.backdrive === "yes" ? { fill } : { stroke: fill }}
                                        />
                                    )}
                                    {labelled.has(r.id) && (
                                        <text
                                            x={x > W * 0.7 ? x - 9 : x + 9}
                                            y={y - 8}
                                            className="dot-label"
                                            textAnchor={x > W * 0.7 ? "end" : "start"}
                                        >
                                            {r.name}
                                            {r.backlash != null ? ` · ${r.backlash}′` : ""}
                                        </text>
                                    )}
                                </g>
                            );
                        })}
                    <text x={M.left} y={H - 8} className="axis-label">
                        Price (USD, log scale) {"→"} cheaper is left
                    </text>
                    <text x={16} y={M.top - 10} className="axis-label">
                        Reduction ratio (log) {"↑"} stiffer and more precise
                    </text>
                </svg>
            </div>
        </>
    );
}
