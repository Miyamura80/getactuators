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

const OTHER_BUCKET = "#3a4042";

function fmt(metric: BomMetric, v: number): string {
    if (metric === "cost") return v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${Math.round(v)}`;
    if (metric === "mass") return `${v.toFixed(1)} kg`;
    return `${v.toFixed(2)} kg`;
}

const color = (s: BomSlice) => (s.key === "other" ? OTHER_BUCKET : ACTUATOR_TYPE_COLOR[s.type]);
// Slices of the same actuator type step down in strength so they stay apart.
const STEPS = [1, 0.72, 0.5, 0.34];
function strengths(slices: BomSlice[]): Map<string, number> {
    const seen = new Map<string, number>();
    const out = new Map<string, number>();
    for (const s of slices) {
        const n = seen.get(s.type) ?? 0;
        seen.set(s.type, n + 1);
        out.set(s.key, STEPS[Math.min(n, STEPS.length - 1)] ?? 1);
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
    const strength = strengths(bom.slices);
    const dim = (s: BomSlice) => (focus && focus !== s.key ? "is-dim" : undefined);
    const pick = (s: BomSlice) => (highlight === s.key ? onHighlight(null, null) : onHighlight(s.key, s.joints));

    let a = 0;
    const paths = bom.slices.map((s) => {
        const a0 = a;
        a += s.share * 2 * Math.PI;
        return { s, d: arc(60, 60, 36, 56, a0, a) };
    });
    const total = bom.total;

    return (
        <div className="hm-bom">
            <div className="hm-bom-tabs" role="group" aria-label="Actuator breakdown by">
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
            <div className="hm-bom-body">
                <svg viewBox="0 0 120 120" className="hm-donut" role="img" aria-label={`Actuator ${metric} breakdown, total ${fmt(metric, total.value)}`}>
                    {paths.map(({ s, d }) => (
                        <path
                            key={s.key}
                            d={d}
                            fill={color(s)}
                            fillOpacity={strength.get(s.key)}
                            className={dim(s)}
                            onMouseEnter={() => setHover(s.key)}
                            onMouseLeave={() => setHover(null)}
                            onClick={() => pick(s)}
                        />
                    ))}
                    <text x="60" y="58" textAnchor="middle" className="hm-donut-v">
                        {active ? `${Math.round(active.share * 100)}%` : fmt(metric, total.value)}
                    </text>
                    <text x="60" y="72" textAnchor="middle" className="hm-donut-r">
                        {active
                            ? fmt(metric, active.value)
                            : total.range[0] !== total.range[1]
                              ? `${fmt(metric, total.range[0])}-${fmt(metric, total.range[1])}`
                              : "actuators"}
                    </text>
                </svg>
                <ol className="hm-bom-legend">
                    {bom.slices.map((s) => (
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
                                <i style={{ background: color(s), opacity: strength.get(s.key) }} />
                                <span className="hm-bom-l">
                                    {s.label} <em>x{s.count}</em>
                                </span>
                                <span className="hm-bom-p">{Math.round(s.share * 100)}%</span>
                            </button>
                        </li>
                    ))}
                </ol>
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
    const unitText =
        u.range && u.range[0] !== u.range[1] ? `${fmt(metric, u.range[0])}-${fmt(metric, u.range[1])}` : fmt(metric, u.value);
    return (
        <>
            <b>{s.label}</b>: {s.count} x {unitText} <span className={`hm-conf is-${u.confidence}`}>{u.confidence}</span> ={" "}
            {fmt(metric, s.value)}, {Math.round(s.share * 100)}% ·{" "}
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
