import { ALT_TECHS, type AltMetrics, type AltTech, MAGNET_USES, MAGNET_USE_LABEL, type MagnetUse } from "../../../../../src/supply-chain/alts";
import { formatSourced } from "../../../../../src/supply-chain/format";
import { NDFEB_PER_HUMANOID } from "../../../../../src/supply-chain/perspective";
import type { Sourced } from "../../../../../src/supply-chain/sourced";
import { SourcedValue } from "../../../components/supply-chain/SourcedValue";
import { useWidth } from "./Treemap";

// How the alternatives perform, one strip per metric: each dot is a cited
// figure for one technology (hollow = the source's own estimate or claim).
// Technologies with no public figure are listed under the strip, never
// placed on it. The magnet row says what each one does for rare earths.

interface Strip {
    key: keyof AltMetrics;
    label: string;
    unit: string;
    scale: "linear" | "log";
    min: number;
    max: number;
    ticks: number[];
    tick: (v: number) => string;
}

const STRIPS: Strip[] = [
    { key: "efficiency", label: "Efficiency", unit: "%", scale: "linear", min: 0, max: 1, ticks: [0, 0.25, 0.5, 0.75, 1], tick: (v) => `${Math.round(v * 100)}%` },
    { key: "specificPower", label: "Specific power", unit: "W/kg", scale: "log", min: 10, max: 10000, ticks: [10, 100, 1000, 10000], tick: (v) => (v >= 1000 ? `${v / 1000}k` : String(v)) },
    { key: "torqueDensity", label: "Torque density", unit: "Nm/kg", scale: "linear", min: 0, max: 40, ticks: [0, 10, 20, 30, 40], tick: String },
];

const PAD = 18;

function xOf(s: Strip, v: number, W: number): number {
    const t = s.scale === "log" ? (Math.log10(v) - Math.log10(s.min)) / (Math.log10(s.max) - Math.log10(s.min)) : (v - s.min) / (s.max - s.min);
    return PAD + Math.min(1, Math.max(0, t)) * (W - 2 * PAD);
}

function StripChart({ strip, tech, W }: { strip: Strip; tech: string | null; W: number }) {
    const has = ALT_TECHS.filter((t) => t.metrics[strip.key]);
    const missing = ALT_TECHS.filter((t) => !t.metrics[strip.key]);
    // Alternate label rows so neighbours do not overprint.
    const placed = [...has].sort((a, b) => (a.metrics[strip.key]?.value ?? 0) - (b.metrics[strip.key]?.value ?? 0));
    return <figure className="al-strip">
        <figcaption><b>{strip.label}</b> <span>{strip.unit}{strip.scale === "log" ? ", log scale" : ""}</span></figcaption>
        <svg viewBox={`0 0 ${W} 74`} role="img" aria-label={`${strip.label}: ${has.map((t) => `${t.short} ${formatSourced(t.metrics[strip.key] as Sourced<number>)}`).join("; ") || "no cited figures"}`}>
            <line className="al-axis" x1={PAD} x2={W - PAD} y1={44} y2={44} />
            {strip.ticks.map((v) => <g key={v} className="al-tick" transform={`translate(${xOf(strip, v, W)},44)`}>
                <line y1={-3} y2={3} />
                <text y={18}>{strip.tick(v)}</text>
            </g>)}
            {placed.map((t, i) => {
                const m = t.metrics[strip.key] as Sourced<number>;
                const x = xOf(strip, m.value, W);
                const up = i % 2 === 0;
                return <g key={t.id} className={`al-dot${t.id === tech ? " is-on" : ""}${m.confidence === "reported" ? "" : " is-est"}`} transform={`translate(${x},44)`}>
                    <title>{`${t.name}: ${m.confidence === "reported" ? "" : "~"}${formatSourced(m)}`}</title>
                    <line y1={0} y2={up ? -14 : -26} />
                    <circle r={5} />
                    <text y={up ? -18 : -30} textAnchor={x < 90 ? "start" : x > W - 90 ? "end" : "middle"}>{t.short}</text>
                </g>;
            })}
        </svg>
        <p className="al-note">No public figure: {missing.length} of {ALT_TECHS.length} ({missing.map((t) => t.short).join(", ")}).</p>
    </figure>;
}

const MAGNET_ICON: Record<MagnetUse, string> = {
    none: "M4 12h16",
    ferrite: "M6 6h12v12H6z",
    "iron-nitride": "M12 4l8 8-8 8-8-8z",
    permanent: "M7 4v9a5 5 0 0 0 10 0V4",
    motor: "M12 3a9 9 0 1 0 0.01 0M12 8v8M8 12h8",
};

function MagnetRow({ tech, onTech }: { tech: string | null; onTech: (id: string) => void }) {
    return <div className="al-magnets">
        <div className="al-baseline">
            <span className="al-label">Today's baseline</span>
            <p>An NdFeB actuator humanoid carries about <SourcedValue value={NDFEB_PER_HUMANOID} /> of rare-earth magnet. <a href="/metals">Where it comes from</a></p>
        </div>
        {MAGNET_USES.map((m) => {
            const techs = ALT_TECHS.filter((t) => t.magnets === m);
            if (techs.length === 0) return null;
            return <div key={m} className={`al-mag al-mag-${m}`}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d={MAGNET_ICON[m]} /></svg>
                <span className="al-label">{MAGNET_USE_LABEL[m]}</span>
                <ul>
                    {techs.map((t) => <li key={t.id}>
                        <button type="button" className={`al-chip${t.id === tech ? " is-on" : ""}`} aria-pressed={t.id === tech} onClick={() => onTech(t.id)}>{t.short}</button>
                        {t.metrics.reeIntensityKgPerKw ? <SourcedValue value={t.metrics.reeIntensityKgPerKw} /> : null}
                    </li>)}
                </ul>
            </div>;
        })}
    </div>;
}

export function Performance({ tech, onTech }: { tech: string | null; onTech: (id: string) => void }) {
    const [ref, width] = useWidth();
    return <div className="al-perf">
        <div className="al-strips" ref={ref}>
            {STRIPS.map((s) => <StripChart key={s.key} strip={s} tech={tech} W={Math.max(300, width - 26)} />)}
        </div>
        <p className="al-note">Hollow dots are a source's own estimate or a company claim. No public cost per Nm was found for any technology, so there is no cost axis yet.</p>
        <MagnetRow tech={tech} onTech={onTech} />
        <details className="al-more">
            <summary>Performance figures and sources</summary>
            <table className="al-table">
                <thead><tr><th>Technology</th><th>Efficiency</th><th>Specific power</th><th>Torque density</th><th>Other</th></tr></thead>
                <tbody>
                    {ALT_TECHS.filter(hasNumbers).map((t) => <tr key={t.id}>
                        <th scope="row">{t.name}</th>
                        <td>{t.metrics.efficiency ? <SourcedValue value={t.metrics.efficiency} /> : "n/a"}</td>
                        <td>{t.metrics.specificPower ? <SourcedValue value={t.metrics.specificPower} /> : "n/a"}</td>
                        <td>{t.metrics.torqueDensity ? <SourcedValue value={t.metrics.torqueDensity} /> : "n/a"}</td>
                        <td>{t.facts.map((f) => <span key={f.label} className="al-fact">{f.label} <SourcedValue value={f.value} /></span>)}</td>
                    </tr>)}
                </tbody>
            </table>
        </details>
    </div>;
}

const hasNumbers = (t: AltTech): boolean =>
    Boolean(t.metrics.efficiency || t.metrics.specificPower || t.metrics.torqueDensity || t.facts.length);
