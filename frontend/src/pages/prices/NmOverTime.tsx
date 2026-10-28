import { useState } from "react";
import { type Fit, type FitMode, MIN_FIT_DAYS, type NmPoint, learningCurve } from "../../../../src/prices/trends";
import { toTime } from "../../../../src/prices/history";
import { CLASSES, H, M, W, byId, classColor, logAxis, pct, perNmText, tickLabel, timeAxis } from "./shared";

// Every priced point as $/Nm over time, one colour per class, log scale,
// with the fitted learning curve per class. Shown once a class has a year.

const YEAR_MS = 365.25 * 86_400_000;

function fitText(f: Fit): string {
    if (f.status === "insufficient") return `Not fitted: ${f.n} points over ${f.days} days (needs ${MIN_FIT_DAYS})`;
    const per = f.mode === "time" ? "per year" : "per doubling of models";
    return `${pct(f.rate)} ${per}, R² ${f.r2.toFixed(2)}, n=${f.n}`;
}

export function NmOverTime({ points: all }: { points: readonly NmPoint[] }) {
    const [hidden, setHidden] = useState<string[]>([]);
    const [mode, setMode] = useState<FitMode>("time");
    const shown = all.filter((p) => !hidden.includes(p.category));
    const { x, ticks } = timeAxis(all.map((p) => p.date));
    const vals = all.map((p) => p.usdPerNm);
    const lo = Math.max(0.1, Math.min(...vals, 1) / 1.3);
    const hi = Math.max(...vals, 10) * 1.3;
    const { y, ticks: yTicks } = logAxis(lo, hi, M.t, H - M.b);
    const fits = CLASSES.map((c) => ({ c, fit: learningCurve(all.filter((p) => p.category === c.slug), mode) }));
    const toggle = (slug: string) =>
        setHidden((cur) => (cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]));

    return <div className="pr-view">
        <div className="pr-controls">
            <span className="pr-seg" role="group" aria-label="Classes">
                {CLASSES.map((c) => <button key={c.slug} type="button" aria-pressed={!hidden.includes(c.slug)}
                    className={hidden.includes(c.slug) ? undefined : "is-on"} onClick={() => toggle(c.slug)}>
                    <i style={{ background: classColor(c.slug) }} aria-hidden="true" />{c.label}
                </button>)}
            </span>
            <span className="pr-seg" role="group" aria-label="Fit against">
                <button type="button" aria-pressed={mode === "time"} className={mode === "time" ? "is-on" : undefined} onClick={() => setMode("time")}>Time</button>
                <button type="button" aria-pressed={mode === "models"} className={mode === "models" ? "is-on" : undefined} onClick={() => setMode("models")}>Cumulative models</button>
            </span>
        </div>
        <svg className="pr-chart" viewBox={`0 0 ${W} ${H}`} role="img"
            aria-label={`Price per newton-metre over time, log scale, ${shown.length} points`}>
            {yTicks.map((v) => <g key={v} className="pr-grid">
                <line x1={M.l} x2={W - M.r} y1={y(v)} y2={y(v)} />
                <text x={M.l - 6} y={y(v) + 4} textAnchor="end">${v}</text>
            </g>)}
            {ticks.map((t) => <text key={t} className="pr-axis" x={x(t)} y={H - M.b + 16} textAnchor="middle">{tickLabel(t)}</text>)}
            {mode === "time" ? fits.map(({ c, fit }) => {
                if (fit.status !== "fit" || hidden.includes(c.slug)) return null;
                const at = (date: string) => Math.exp(fit.a + fit.b * ((toTime(date) - toTime(fit.from)) / YEAR_MS));
                return <line key={c.slug} className="pr-fit" data-class={c.slug} stroke={classColor(c.slug)}
                    x1={x(fit.from)} y1={y(at(fit.from))} x2={x(fit.to)} y2={y(at(fit.to))} />;
            }) : null}
            {shown.map((p) => <circle key={`${p.actuatorId}-${p.date}`} className="pr-dot" data-class={p.category}
                cx={x(p.date)} cy={y(p.usdPerNm)} r={4} style={{ fill: classColor(p.category) }}>
                <title>{`${byId.get(p.actuatorId)?.name ?? p.actuatorId} (${p.brand}), ${p.date}: ${perNmText(p.usdPerNm)}`}</title>
            </circle>)}
        </svg>
        <table className="pr-fits">
            <caption>Learning curve per class: least squares of ln($/Nm) on {mode === "time" ? "time" : "ln(cumulative models listed)"}</caption>
            <tbody>
                {fits.map(({ c, fit }) => <tr key={c.slug} data-class={c.slug}>
                    <th scope="row"><i style={{ background: classColor(c.slug) }} aria-hidden="true" />{c.label}</th>
                    <td>{fitText(fit)}</td>
                </tr>)}
            </tbody>
        </table>
    </div>;
}
