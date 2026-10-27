import { useMemo, useState } from "react";
import { percent } from "../../../../../src/supply-chain/format";
import { METAL_EVENTS } from "../../../../../src/supply-chain/metals/events";
import {
    BASIS_LABEL,
    MARKET_LABEL,
    NDPR_PRICE_FLOOR,
    PRICE_SERIES,
    type PricePoint,
    type PriceSeries,
    priceSpreads,
    sortedPoints,
} from "../../../../../src/supply-chain/metals/prices";
import type { Sourced } from "../../../../../src/supply-chain/sourced";
import { getSource } from "../../../../../src/supply-chain/sources";
import { FootnoteRef, SourcedValue } from "../../../components/supply-chain/SourcedValue";

// 4. Prices: every cited point on one time axis, log scale by default, one
// colour per element. Solid lines are export (FOB China) or LME prices,
// dashed lines China domestic; event pins sit on the time axis.

type Group = PriceSeries["element"];

const PRICE_GROUPS: { id: Group; label: string; color: string }[] = [
    { id: "nd", label: "Nd", color: "#4dabf7" },
    { id: "ndpr", label: "NdPr", color: "#99e9f2" },
    { id: "pr", label: "Pr", color: "#a9e34b" },
    { id: "dy", label: "Dy", color: "#ff922b" },
    { id: "tb", label: "Tb", color: "#f783ac" },
    { id: "sm", label: "Sm", color: "#ffd43b" },
    { id: "co", label: "Co", color: "#9775fa" },
];
const DEFAULT_GROUPS: Group[] = ["nd", "dy", "tb"];

const W = 720;
const H = 300;
const M = { l: 46, r: 14, t: 12, b: 50 };
const X0 = Date.UTC(2011, 0, 1);
const X1 = Date.UTC(2027, 0, 1);
const LOG = [1, 5000] as const;

const colorOf = (g: Group) => PRICE_GROUPS.find((x) => x.id === g)?.color ?? "#8b95a1";

function when(p: PricePoint): number {
    if (p.basis === "annual-average") return Date.UTC(Number(p.date), 6, 1);
    const [y, m = 1, d = 1] = p.date.split("-").map(Number);
    return Date.UTC(y ?? 2011, m - 1, d);
}

function eventTime(date: string): number {
    const [y, m = 7, d = 1] = date.split("-").map(Number);
    return Date.UTC(y ?? 2011, m - 1, d);
}

const usd = (s: Sourced<number>) => `$${s.value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

function describe(s: PriceSeries, p: PricePoint): string {
    const src = p.value.sources.map((id) => getSource(id)?.publisher ?? id).join(", ");
    return `${s.label}, ${MARKET_LABEL[s.market]}, ${p.date}: ${usd(p.value)}/kg (${BASIS_LABEL[p.basis]}). ${src}`;
}

// /policy links here at a date: ?event=<id> lights that pin and opens the
// event list, ?at=YYYY-MM draws a cursor at that month.
function readLink(search: string): { event: string | null; at: number | null } {
    const q = new URLSearchParams(search);
    const at = /^\d{4}-(0[1-9]|1[0-2])$/.test(q.get("at") ?? "") ? eventTime(q.get("at") ?? "") : null;
    return { event: q.get("event"), at };
}

export function PriceChart() {
    const [link] = useState(() => readLink(typeof window === "undefined" ? "" : window.location.search));
    const [groups, setGroups] = useState<Group[]>(DEFAULT_GROUPS);
    const [log, setLog] = useState(true);
    const shown = PRICE_SERIES.filter((s) => groups.includes(s.element));
    const max = Math.max(110, ...shown.flatMap((s) => s.points.map((p) => p.value.value)));
    const x = (t: number) => M.l + ((t - X0) / (X1 - X0)) * (W - M.l - M.r);
    const y = useMemo(() => {
        const top = M.t;
        const bottom = H - M.b;
        if (log) {
            const [a, b] = LOG.map(Math.log10) as [number, number];
            return (v: number) => bottom - ((Math.log10(Math.max(v, LOG[0])) - a) / (b - a)) * (bottom - top);
        }
        return (v: number) => bottom - (v / (max * 1.05)) * (bottom - top);
    }, [log, max]);
    const yTicks = log ? [1, 10, 100, 1000] : [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * max * 1.05));
    const years = Array.from({ length: 9 }, (_, i) => 2011 + i * 2);
    const toggle = (g: Group) =>
        setGroups((cur) => (cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g]));
    const floorX = x(Date.UTC(2025, 6, 10));

    return <div className="mt-prices">
        <div className="mt-controls">
            <span className="mt-seg" role="group" aria-label="Series">
                {PRICE_GROUPS.map((g) => <button key={g.id} type="button" aria-pressed={groups.includes(g.id)}
                    className={groups.includes(g.id) ? "is-on" : undefined} onClick={() => toggle(g.id)}>
                    <i style={{ background: g.color }} aria-hidden="true" />{g.label}
                </button>)}
            </span>
            <span className="mt-seg" role="group" aria-label="Scale">
                <button type="button" aria-pressed={log} className={log ? "is-on" : undefined} onClick={() => setLog(true)}>Log</button>
                <button type="button" aria-pressed={!log} className={!log ? "is-on" : undefined} onClick={() => setLog(false)}>Linear</button>
            </span>
        </div>
        <svg className="mt-chart" viewBox={`0 0 ${W} ${H}`} role="img"
            aria-label={`Prices in US$ per kg, 2011 to 2026, ${log ? "log" : "linear"} scale: ${shown.map((s) => s.label).join(", ") || "no series"}`}>
            {yTicks.map((v) => <g key={v} className="mt-grid">
                <line x1={M.l} x2={W - M.r} y1={y(v)} y2={y(v)} />
                <text x={M.l - 6} y={y(v) + 4} textAnchor="end">${v.toLocaleString("en-US")}</text>
            </g>)}
            {years.map((yr) => <text key={yr} className="mt-axis" x={x(Date.UTC(yr, 0, 1))} y={H - M.b + 14} textAnchor="middle">{yr}</text>)}
            {groups.includes("nd") || groups.includes("ndpr") || groups.includes("pr")
                ? <g className="mt-floor">
                    <line x1={floorX} x2={W - M.r} y1={y(NDPR_PRICE_FLOOR.value)} y2={y(NDPR_PRICE_FLOOR.value)} />
                    <text x={floorX - 4} y={y(NDPR_PRICE_FLOOR.value) - 5} textAnchor="end">US floor $110</text>
                </g>
                : null}
            {shown.map((s) => {
                const pts = sortedPoints(s).map((p) => ({ p, cx: x(when(p)), cy: y(p.value.value) }));
                const d = pts.map((q, i) => `${i ? "L" : "M"}${q.cx.toFixed(1)},${q.cy.toFixed(1)}`).join("");
                return <g key={s.id} className={`mt-series mt-market-${s.market}`} data-series={s.id} style={{ color: colorOf(s.element) }}>
                    {pts.length > 1 ? <path d={d} /> : null}
                    {pts.map(({ p, cx, cy }) => <circle key={p.date} cx={cx} cy={cy} r={pts.length > 1 ? 2.5 : 4}>
                        <title>{describe(s, p)}</title>
                    </circle>)}
                </g>;
            })}
            {link.at !== null
                ? <g className="mt-cursor"><line x1={x(link.at)} x2={x(link.at)} y1={M.t} y2={H - M.b} /></g>
                : null}
            {METAL_EVENTS.map((e, i) => <g key={e.id} className={`mt-pin${link.event === e.id ? " is-hit" : ""}`} transform={`translate(${Math.max(M.l + 4, x(eventTime(e.date)))},${H - M.b})`}>
                <line y1={18} y2={24} />
                <text y={35} textAnchor="middle">{i + 1}</text>
                <title>{`${e.date}: ${e.title}`}</title>
            </g>)}
        </svg>
        <p className="mt-note">Solid: export (FOB China) or LME. Dashed: China domestic. Points: USGS annual averages and year-end ranges, 2026 monthly SMM readings.</p>
        <details className="mt-events" open={link.event !== null && METAL_EVENTS.some((e) => e.id === link.event)}>
            <summary>Events ({METAL_EVENTS.length})</summary>
            <ol>
                {METAL_EVENTS.map((e) => <li key={e.id} className={link.event === e.id ? "is-hit" : undefined}>
                    <span className="mt-ev-date">{e.date}</span>
                    <b>{e.measureId ? <a href={`/policy#measure=${e.measureId}`}>{e.title}</a> : e.title}</b>
                    <span>{e.detail}<FootnoteRef sources={e.sources} asOf={e.date} confidence="reported" /></span>
                </li>)}
            </ol>
        </details>
        <Spreads />
    </div>;
}

// China domestic against export on the same day.
function Spreads() {
    const rows = priceSpreads();
    return <figure className="mt-spread">
        <figcaption>Outside China pays more</figcaption>
        <ul>
            {rows.map((r) => <li key={r.label} data-element={r.element}>
                <span className="mt-spread-name">{r.label}</span>
                <span className="mt-spread-bars" aria-hidden="true">
                    <span className="mt-spread-cn" style={{ width: `${(r.domestic.value / r.export.value) * 100}%` }} />
                    <span className="mt-spread-ex" />
                </span>
                <span className="mt-spread-num"><SourcedValue value={r.domestic} format={usd} /> → <SourcedValue value={r.export} format={usd} /></span>
                <b className="mt-spread-pct" aria-label={`${percent(r.premium.value)} more outside China`}>+{percent(r.premium.value)}</b>
            </li>)}
        </ul>
    </figure>;
}
