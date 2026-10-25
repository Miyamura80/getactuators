import { useMemo, useState } from "react";
import {
    ACTUATOR_TYPE_COLOR,
    type BomMetric,
    type BomSlice,
    bomPriceShare,
    type CanonicalJoint,
    type Humanoid,
    humanoidBom,
    sourceOf,
} from "../../../../src/humanoids";

const METRICS: { id: BomMetric; label: string }[] = [
    { id: "cost", label: "Cost $" },
    { id: "mass", label: "Mass kg" },
    { id: "magnet", label: "Magnet kg" },
];

const OTHER_ACTUATORS = "#3f6663";
// Non-actuator categories: distinct grey steps from Graphene Grey to near-white.
const GREYS = ["#9ba4a6", "#c9cfd0", "#e8ebeb", "#7c8587", "#b2babc"];

function fmt(metric: BomMetric, v: number): string {
    if (metric === "cost") return v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${Math.round(v)}`;
    if (metric === "mass") return `${v.toFixed(1)} kg`;
    return `${v.toFixed(2)} kg`;
}

const span = (metric: BomMetric, r: readonly [number, number]) =>
    r[0] === r[1] ? fmt(metric, r[0]) : `${fmt(metric, r[0])}-${fmt(metric, r[1])}`;

// Mix a hex color toward white by t (0 to 1).
function tint(hex: string, t: number): string {
    const n = Number.parseInt(hex.slice(1), 16);
    const ch = (s: number) => Math.round(((n >> s) & 255) + (255 - ((n >> s) & 255)) * t);
    return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
}

// Actuator slices keep their type color; repeats of a type step lighter.
// Non-actuator slices take grey steps; a lumped total is hatched.
function colors(slices: BomSlice[], hatch: string): Map<string, string> {
    const seen = new Map<string, number>();
    const out = new Map<string, string>();
    let grey = 0;
    for (const s of slices) {
        if (s.category === "non-actuator") {
            out.set(s.key, s.lumped ? `url(#${hatch})` : (GREYS[grey++ % GREYS.length] ?? GREYS[0]!));
        } else if (s.key === "other") {
            out.set(s.key, OTHER_ACTUATORS);
        } else {
            const n = seen.get(s.type) ?? 0;
            seen.set(s.type, n + 1);
            out.set(s.key, tint(ACTUATOR_TYPE_COLOR[s.type], [0, 0.3, 0.5, 0.62][Math.min(n, 3)] ?? 0));
        }
    }
    return out;
}

function arc(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number): string {
    const p = (r: number, a: number) => `${cx + r * Math.sin(a)} ${cy - r * Math.cos(a)}`;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    // A full ring cannot be one arc; stop just short of closing it.
    const end = a1 - a0 >= 2 * Math.PI ? a1 - 1e-4 : a1;
    return `M${p(r1, a0)} A${r1} ${r1} 0 ${large} 1 ${p(r1, end)} L${p(r0, end)} A${r0} ${r0} 0 ${large} 0 ${p(r0, a0)} Z`;
}

interface Props {
    robot: Humanoid;
    highlight: string | null;
    onHighlight: (key: string | null, joints: CanonicalJoint[] | null) => void;
}

export function BomDonut({ robot, highlight, onHighlight }: Props) {
    const [metric, setMetric] = useState<BomMetric>("cost");
    const [hover, setHover] = useState<string | null>(null);
    const bom = useMemo(() => humanoidBom(robot, metric), [robot, metric]);
    const share = bomPriceShare(robot, bom);
    const active = bom.slices.find((s) => s.key === (hover ?? highlight)) ?? null;
    const focus = hover ?? highlight;
    const hatch = `hm-hatch-${robot.id}`;
    const fill = colors(bom.slices, hatch);
    const dim = (s: BomSlice) => (focus && focus !== s.key ? "is-dim" : undefined);
    const pick = (s: BomSlice) => (highlight === s.key ? onHighlight(null, null) : onHighlight(s.key, s.joints));
    const total = bom.total;
    const actShare = bom.rest && total.value ? bom.actuators.value / total.value : null;

    const starts = bom.slices.map((_, i) => bom.slices.slice(0, i).reduce((n, s) => n + s.share, 0) * 2 * Math.PI);
    const paths = bom.slices.map((s, i) => ({
        s,
        d: arc(60, 60, 34, 53, starts[i] ?? 0, (starts[i] ?? 0) + s.share * 2 * Math.PI),
    }));
    const split = actShare === null ? null : actShare * 2 * Math.PI;
    const groups: { title: string; value: { value: number; range: [number, number] } | null; rows: BomSlice[] }[] = [
        { title: "Actuators", value: bom.rest ? bom.actuators : null, rows: bom.slices.filter((s) => s.category === "actuator") },
        ...(bom.rest
            ? [{ title: "Rest of robot", value: bom.rest, rows: bom.slices.filter((s) => s.category === "non-actuator") }]
            : []),
    ];

    return (
        <div className="hm-bom">
            <div className="hm-sec-head">
                <p className="ree-title">Bill of materials</p>
                <div className="hm-seg" role="group" aria-label="Breakdown by">
                    {METRICS.map((m) => (
                        <button
                            key={m.id}
                            type="button"
                            aria-pressed={metric === m.id}
                            onClick={() => {
                                setMetric(m.id);
                                onHighlight(null, null);
                            }}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="hm-bom-body">
                <svg viewBox="0 0 120 120" className="hm-donut" role="img" aria-label={`${metric} breakdown, total ${fmt(metric, total.value)}`}>
                    <defs>
                        <pattern id={hatch} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                            <rect width="4" height="4" fill="#2a2f30" />
                            <rect width="1.6" height="4" fill="#9ba4a6" />
                        </pattern>
                    </defs>
                    {split !== null && (
                        <g className="hm-donut-ring" aria-hidden="true">
                            <path d={arc(60, 60, 56, 58.5, 0, split)} className="is-act" />
                            <path d={arc(60, 60, 56, 58.5, split, 2 * Math.PI)} className="is-rest" />
                        </g>
                    )}
                    {paths.map(({ s, d }) => (
                        <path
                            key={s.key}
                            d={d}
                            fill={fill.get(s.key)}
                            className={dim(s)}
                            onMouseEnter={() => setHover(s.key)}
                            onMouseLeave={() => setHover(null)}
                            onClick={() => pick(s)}
                        />
                    ))}
                    <text x="60" y="58" textAnchor="middle" className="hm-donut-v">
                        {active ? `${Math.round(active.share * 100)}%` : fmt(metric, total.value)}
                    </text>
                    <text x="60" y="71" textAnchor="middle" className="hm-donut-r">
                        {active
                            ? fmt(metric, active.value)
                            : actShare !== null
                              ? `actuators ${Math.round(actShare * 100)}%`
                              : total.range[0] !== total.range[1]
                                ? span(metric, total.range)
                                : "actuators"}
                    </text>
                    {!active && actShare !== null && total.range[0] !== total.range[1] && (
                        <text x="60" y="81" textAnchor="middle" className="hm-donut-r">
                            {span(metric, total.range)}
                        </text>
                    )}
                </svg>
                <div className="hm-bom-legend">
                    {groups.map((g) => (
                        <div key={g.title} className="hm-bom-group">
                            {g.value && (
                                <p className="hm-bom-gh">
                                    <span>{g.title}</span>
                                    <b>
                                        {fmt(metric, g.value.value)}
                                        {total.value ? ` · ${Math.round((g.value.value / total.value) * 100)}%` : ""}
                                    </b>
                                </p>
                            )}
                            <ol>
                                {g.rows.map((s) => (
                                    <li key={s.key}>
                                        <button
                                            type="button"
                                            aria-pressed={highlight === s.key}
                                            className={dim(s)}
                                            onMouseEnter={() => setHover(s.key)}
                                            onMouseLeave={() => setHover(null)}
                                            onFocus={() => setHover(s.key)}
                                            onBlur={() => setHover(null)}
                                            onClick={() => pick(s)}
                                        >
                                            <i
                                                className={s.lumped ? "is-hatch" : undefined}
                                                style={s.lumped ? undefined : { background: fill.get(s.key) }}
                                            />
                                            <span className="hm-bom-l">
                                                {s.label}
                                                {s.category === "actuator" && <> <em>x{s.count}</em></>}
                                            </span>
                                            <span className="hm-bom-p">{Math.round(s.share * 100)}%</span>
                                        </button>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    ))}
                </div>
            </div>
            <div className="hm-bom-detail" aria-live="polite">
                {active ? <Detail s={active} metric={metric} /> : <Footnote bom={bom} share={share} />}
            </div>
        </div>
    );
}

function Detail({ s, metric }: { s: BomSlice; metric: BomMetric }) {
    if (!s.unit) {
        return (
            <>
                {s.count} actuators in smaller groups: {fmt(metric, s.value)}, {Math.round(s.share * 100)}%.
            </>
        );
    }
    const src = sourceOf(s.unit.sources[0] ?? "");
    const u = s.unit;
    const head =
        s.category === "actuator" ? (
            <>
                {s.count} x {span(metric, u.range ?? [u.value, u.value])}
            </>
        ) : (
            span(metric, s.range)
        );
    return (
        <>
            <b>{s.label}</b>: {head} <span className={`hm-conf is-${u.confidence}`}>{u.confidence}</span>
            {s.category === "actuator" && <> = {fmt(metric, s.value)}</>}, {Math.round(s.share * 100)}%
            {s.lumped ? ", not broken into categories" : ""} ·{" "}
            <a href={src.url} target={src.url.startsWith("/") ? undefined : "_blank"} rel="noopener">
                source
            </a>
        </>
    );
}

function Footnote({ bom, share }: { bom: ReturnType<typeof humanoidBom>; share: ReturnType<typeof bomPriceShare> }) {
    const out = bom.excluded.reduce((n, e) => n + e.count, 0);
    return (
        <>
            {bom.metric === "cost" && !bom.rest && <span className="hm-bom-np">Non-actuator BOM not published. </span>}
            {share && (
                <span className="hm-bom-share">
                    Actuators ≈ {Math.round(share.value * 100)}% of the robot's price
                    {share.range[0] !== share.range[1]
                        ? ` (${Math.round(share.range[0] * 100)}-${Math.round(share.range[1] * 100)}%)`
                        : ""}
                    .{" "}
                </span>
            )}
            {out > 0 && (
                <details className="hm-bom-out">
                    <summary>{out} not counted</summary>
                    <ul>
                        {bom.excluded.map((e) => (
                            <li key={e.label}>
                                {e.label} x{e.count}: {e.reason}
                            </li>
                        ))}
                    </ul>
                </details>
            )}
        </>
    );
}
