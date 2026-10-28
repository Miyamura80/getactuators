import { type KeyboardEvent, useRef, useState } from "react";
import { type NmPoint, boxStats } from "../../../../src/prices/trends";
import { beeswarm } from "./beeswarm";
import { CLASSES, byId, classColor, logAxis, perNmText, useWidth } from "./shared";

// 01: today's $/Nm for every priced actuator as a strip per class (or
// country) on one log axis. Each dot is an actuator: hover or focus names it,
// click, tap or Enter selects it. The cheapest in each row is ringed and
// named on the row's rule.

type GroupBy = "class" | "country";

const R = 5;
const CH = 6.6; // px per character of 11px mono
const HEAD = 20;
const GAP = 14;
const AXIS = 26;
const PAD = 8;

interface Row {
    key: string;
    label: string;
    color: string | null;
    dots: { p: NmPoint; x: number; dy: number }[];
    cheapest: NmPoint;
    top: number;
    mid: number;
}

const clip = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, Math.max(1, n - 1))}…`);
const nameOf = (p: NmPoint) => byId.get(p.actuatorId)?.name ?? p.actuatorId;

function groupsOf(latest: readonly NmPoint[], by: GroupBy) {
    const keys = by === "class"
        ? CLASSES.map((c) => ({ key: c.slug, label: c.label, color: classColor(c.slug) }))
        : [...new Set(latest.map((p) => p.country ?? "Unknown"))].map((k) => ({ key: k, label: k, color: null }));
    return keys
        .map((g) => ({ ...g, pts: latest.filter((p) => (by === "class" ? p.category : (p.country ?? "Unknown")) === g.key) }))
        .filter((g) => g.pts.length > 0)
        .map((g) => ({ ...g, median: boxStats(g.pts.map((p) => p.usdPerNm))?.median ?? 0 }))
        .sort((a, b) => a.median - b.median || a.label.localeCompare(b.label));
}

export function TodayStrip({ latest, selected, onPick }: {
    latest: readonly NmPoint[];
    selected: string;
    onPick: (id: string) => void;
}) {
    const [box, w] = useWidth<HTMLDivElement>(720);
    const svg = useRef<SVGSVGElement>(null);
    const [by, setBy] = useState<GroupBy>("class");
    const [active, setActive] = useState<string | null>(null);
    const vals = latest.map((p) => p.usdPerNm);
    const lo = Math.min(...vals) / 1.25;
    const hi = Math.max(...vals) * 1.25;
    const x0 = PAD + R + 2;
    const x1 = w - PAD - R - 2;
    const { y: flip, ticks } = logAxis(lo, hi, x0, x1);
    const x = (v: number) => x0 + x1 - flip(v);

    let top = 0;
    const rows: Row[] = groupsOf(latest, by).map((g) => {
        const dots = beeswarm(g.pts, (p) => x(p.usdPerNm), R).map((d) => ({ p: d.item, x: d.x, dy: d.dy }));
        const spread = Math.max(0, ...dots.map((d) => Math.abs(d.dy)));
        const row = {
            key: g.key,
            label: g.label,
            color: g.color,
            dots,
            cheapest: dots[0]?.p as NmPoint,
            top,
            mid: top + HEAD + spread + R + 4,
        };
        top = row.mid + spread + R + GAP;
        return row;
    });
    const h = top + AXIS;
    const order = rows.flatMap((r) => r.dots.map((d) => d.p.actuatorId));
    const tabStop = order.includes(selected) ? selected : order[0];
    const find = (id: string) => rows.flatMap((r) => r.dots.map((d) => ({ ...d, row: r }))).find((d) => d.p.actuatorId === id);
    const shown = active ? find(active) : undefined;

    const onKey = (e: KeyboardEvent, id: string) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onPick(id);
            return;
        }
        const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        const next = order[(order.indexOf(id) + step + order.length) % order.length];
        if (next) svg.current?.querySelector<SVGElement>(`[data-id="${next}"]`)?.focus();
    };

    return <div className="pr-view" ref={box}>
        <div className="pr-controls">
            <span className="pr-seg" role="group" aria-label="Rows">
                {(["class", "country"] as const).map((g) => <button key={g} type="button" aria-pressed={by === g}
                    className={by === g ? "is-on" : undefined} onClick={() => setBy(g)}>{g === "class" ? "By class" : "By country"}</button>)}
            </span>
            {by === "country"
                ? <ul className="pr-legend pr-legend-sm" aria-label="Dot colour is the class">
                    {CLASSES.filter((c) => latest.some((p) => p.category === c.slug)).map((c) =>
                        <li key={c.slug}><i style={{ background: classColor(c.slug) }} aria-hidden="true" />{c.label}</li>)}
                </ul>
                : null}
        </div>
        <svg ref={svg} className="pr-strip" width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="group"
            aria-label={`Price per newton-metre today, log scale, ${latest.length} actuators by ${by}. Arrow keys move between actuators, Enter selects.`}>
            {ticks.map((t) => <g key={t} className="pr-grid">
                <line x1={x(t)} x2={x(t)} y1={0} y2={h - AXIS + 4} />
                <text x={x(t)} y={h - 8} textAnchor="middle">${t}</text>
            </g>)}
            {rows.map((r) => {
                const label = `${r.label} ${r.dots.length}`;
                const per = perNmText(r.cheapest.usdPerNm);
                const room = Math.floor((w - 2 * PAD - (label.length + 3) * CH - (r.color ? 14 : 0)) / CH);
                const lead = room - per.length - 1 >= 14 ? "cheapest " : "";
                const name = clip(nameOf(r.cheapest), room - per.length - 1 - lead.length);
                return <g key={r.key} className="pr-row" data-row={r.key}>
                    <line className="pr-rule" x1={PAD} x2={w - PAD} y1={r.top + HEAD - 4} y2={r.top + HEAD - 4} />
                    {r.color ? <rect x={PAD} y={r.top + 4} width={8} height={8} fill={r.color} /> : null}
                    <text className="pr-row-label" x={PAD + (r.color ? 14 : 0)} y={r.top + 12}>
                        {r.label} <tspan className="pr-muted">{r.dots.length}</tspan>
                    </text>
                    <text className="pr-cheap" x={w - PAD} y={r.top + 12} textAnchor="end" data-cheapest={r.cheapest.actuatorId}>
                        <tspan className="pr-muted">{lead}</tspan>{name} <tspan className="pr-cheap-v">{per}</tspan>
                    </text>
                    <circle className="pr-ring" cx={r.dots[0]?.x} cy={r.mid + (r.dots[0]?.dy ?? 0)} r={R + 3} aria-hidden="true" />
                    {r.dots.map(({ p, x: cx, dy }) => {
                        const n = nameOf(p);
                        return <circle key={p.actuatorId} className={`pr-dot${p.actuatorId === selected ? " is-sel" : ""}`}
                            data-id={p.actuatorId} data-class={p.category} cx={cx} cy={r.mid + dy} r={R}
                            style={{ fill: classColor(p.category) }}
                            role="button" tabIndex={p.actuatorId === tabStop ? 0 : -1}
                            aria-label={`${n}, ${p.brand}: ${perNmText(p.usdPerNm)}`} aria-pressed={p.actuatorId === selected}
                            onMouseEnter={() => setActive(p.actuatorId)} onMouseLeave={() => setActive(null)}
                            onFocus={() => setActive(p.actuatorId)} onBlur={() => setActive(null)}
                            onClick={() => onPick(p.actuatorId)} onKeyDown={(e) => onKey(e, p.actuatorId)} />;
                    })}
                </g>;
            })}
            {shown ? (() => {
                const text = `${nameOf(shown.p)}  ${perNmText(shown.p.usdPerNm)}`;
                const tw = text.length * CH + 12;
                const lx = Math.min(Math.max(PAD, shown.x - tw / 2), w - PAD - tw);
                const ly = shown.row.mid + shown.dy - R - 26;
                return <g className="pr-tip" pointerEvents="none" aria-hidden="true">
                    <rect x={lx} y={ly} width={tw} height={20} />
                    <text x={lx + 6} y={ly + 14} xmlSpace="preserve">{text}</text>
                </g>;
            })() : null}
        </svg>
    </div>;
}
