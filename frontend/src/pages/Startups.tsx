import { useEffect, useState } from "react";
import { PublicHeader } from "../components/PublicHeader";
import { PublicFooter } from "../components/PublicFooter";
import { CompanyLogo } from "../components/CompanyLogo";
import {
    formatMetric,
    STARTUP_METRICS,
    STARTUPS,
    STARTUPS_PATH,
    type Startup,
    type StartupMetric,
} from "../../../src/startups";
import "./tools.css";
import "./startups.css";

const TITLE = "Actuator startups";
// Canvas per view: one wide map, or two squarer ones side by side.
const SIZE = { single: { W: 1000, H: 440 }, both: { W: 640, H: 440 } };
// An undisclosed figure still gets a tile so the company stays on the map,
// at this share of the smallest disclosed value (or of the canvas when none is).
const UNDISCLOSED_SHARE = 0.25;
const COLORS: Record<string, string> = {
    "atlas-motion": "var(--cyan)",
    westmag: "#8fb4ff",
    caldera: "#ffc48a",
};

type View = StartupMetric | "both";
const VIEWS: { id: View; label: string }[] = [
    { id: "raisedUsd", label: "Money raised" },
    { id: "unitsPerMonth", label: "Actuators made" },
    { id: "both", label: "Side by side" },
];

interface Tile {
    s: Startup;
    value: number | null;
    x: number;
    y: number;
    w: number;
    h: number;
}

interface Item {
    s: Startup;
    value: number | null;
    area: number;
}

// Squarified treemap (Bruls, Huizing, van Wijk): lay rows along the short side,
// adding items while the worst aspect ratio in the row keeps improving.
function squarify(items: Item[], x: number, y: number, w: number, h: number): Tile[] {
    const out: Tile[] = [];
    let rest = [...items].sort((a, b) => b.area - a.area);
    while (rest.length) {
        const side = Math.min(w, h);
        const worst = (row: Item[]) => {
            const sum = row.reduce((t, r) => t + r.area, 0);
            const max = Math.max(...row.map((r) => r.area));
            const min = Math.min(...row.map((r) => r.area));
            return Math.max((side * side * max) / (sum * sum), (sum * sum) / (side * side * min));
        };
        let row = [rest[0] as Item];
        let i = 1;
        while (i < rest.length && worst([...row, rest[i] as Item]) <= worst(row)) {
            row = [...row, rest[i] as Item];
            i++;
        }
        rest = rest.slice(i);
        const sum = row.reduce((t, r) => t + r.area, 0);
        const thick = sum / side;
        let offset = 0;
        for (const r of row) {
            const len = r.area / thick;
            out.push(
                w >= h
                    ? { s: r.s, value: r.value, x, y: y + offset, w: thick, h: len }
                    : { s: r.s, value: r.value, x: x + offset, y, w: len, h: thick },
            );
            offset += len;
        }
        if (w >= h) {
            x += thick;
            w -= thick;
        } else {
            y += thick;
            h -= thick;
        }
    }
    return out;
}

function layout(metric: StartupMetric, W: number, H: number): Tile[] {
    const known = STARTUPS.map((s) => s[metric]).filter((v): v is number => v !== null);
    const stub = known.length ? Math.min(...known) * UNDISCLOSED_SHARE : 1;
    const items = STARTUPS.map((s) => ({ s, value: s[metric], area: s[metric] ?? stub }));
    const scale = (W * H) / items.reduce((t, i) => t + i.area, 0);
    return squarify(
        items.map((i) => ({ ...i, area: i.area * scale })),
        0,
        0,
        W,
        H,
    );
}

function Treemap({
    metric,
    both,
    focus,
    setFocus,
}: {
    metric: StartupMetric;
    both: boolean;
    focus: string | null;
    setFocus: (id: string | null) => void;
}) {
    const { W, H } = SIZE[both ? "both" : "single"];
    const tiles = layout(metric, W, H);
    const label = STARTUP_METRICS[metric].label;
    return (
        <figure className="su-map">
            <figcaption>{label}</figcaption>
            <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Treemap of ${label.toLowerCase()}`}>
                <defs>
                    <pattern id={`su-hatch-${metric}`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                        <line x1="0" y1="0" x2="0" y2="8" stroke="var(--line-strong)" strokeWidth="2" />
                    </pattern>
                </defs>
                {tiles.map((t) => {
                    const known = t.value !== null;
                    const dim = focus !== null && focus !== t.s.id;
                    const roomy = known && t.w > 200 && t.h > 100;
                    const clip = `su-clip-${metric}-${t.s.id}`;
                    const logo = t.w > 120 && t.h > 70;
                    const textX = t.x + (logo ? 56 : 16);
                    return (
                        <g
                            key={t.s.id}
                            className={`su-tile${dim ? " dim" : ""}`}
                            tabIndex={0}
                            onMouseEnter={() => setFocus(t.s.id)}
                            onMouseLeave={() => setFocus(null)}
                            onFocus={() => setFocus(t.s.id)}
                            onBlur={() => setFocus(null)}
                        >
                            <title>{`${t.s.name}: ${formatMetric(metric, t.value)}`}</title>
                            <rect
                                x={t.x + 1}
                                y={t.y + 1}
                                width={Math.max(0, t.w - 2)}
                                height={Math.max(0, t.h - 2)}
                                fill={known ? COLORS[t.s.id] : `url(#su-hatch-${metric})`}
                                fillOpacity={known ? 0.9 : 1}
                                stroke={known ? "none" : "var(--line-strong)"}
                                strokeDasharray={known ? undefined : "4 4"}
                            />
                            <clipPath id={clip}>
                                <rect x={t.x} y={t.y} width={t.w} height={t.h} />
                            </clipPath>
                            {logo && (
                                <>
                                    <clipPath id={`${clip}-logo`}>
                                        <rect x={t.x + 14} y={t.y + 12} width={30} height={30} rx={6} />
                                    </clipPath>
                                    <rect x={t.x + 14} y={t.y + 12} width={30} height={30} rx={6} fill="#fff" />
                                    <image
                                        href={t.s.logo}
                                        x={t.x + 14}
                                        y={t.y + 12}
                                        width={30}
                                        height={30}
                                        clipPath={`url(#${clip}-logo)`}
                                    />
                                </>
                            )}
                            <text clipPath={`url(#${clip})`} x={textX} y={t.y + 36} className={`su-name${known ? "" : " muted"}`}>
                                {t.s.name}
                            </text>
                            <text
                                clipPath={`url(#${clip})`}
                                x={t.x + 16}
                                y={t.y + (roomy ? 80 : 62)}
                                className={`su-value${known ? "" : " muted"}${roomy ? " big" : ""}`}
                            >
                                {formatMetric(metric, t.value)}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </figure>
    );
}

export function Startups({ menuOpen = false }: { menuOpen?: boolean }) {
    const [view, setView] = useState<View>("raisedUsd");
    const [focus, setFocus] = useState<string | null>(null);
    useEffect(() => {
        const prev = document.title;
        document.title = TITLE;
        return () => {
            document.title = prev;
        };
    }, []);
    const metrics: StartupMetric[] = view === "both" ? ["raisedUsd", "unitsPerMonth"] : [view];

    return (
        <div className="tool-page">
            <PublicHeader path={STARTUPS_PATH} initialOpen={menuOpen} />
            <main className="tool-main">
                <header className="tool-head">
                    <p className="tool-kicker">Startups</p>
                    <h1>Actuator startups</h1>
                    <p className="tool-lede">
                        New companies building robot actuators and motors, sized by money raised or
                        by the production they report. Hatched tiles have not disclosed the figure.
                    </p>
                </header>

                <fieldset className="calc-solve su-toggle">
                    <legend>View</legend>
                    <div className="calc-solve-opts">
                        {VIEWS.map((v) => (
                            <label key={v.id} className={view === v.id ? "on" : ""}>
                                <input
                                    type="radio"
                                    name="su-view"
                                    value={v.id}
                                    checked={view === v.id}
                                    onChange={() => setView(v.id)}
                                />
                                {v.label}
                            </label>
                        ))}
                    </div>
                </fieldset>

                <div className={`su-maps${view === "both" ? " both" : ""}`}>
                    {metrics.map((m) => (
                        <Treemap key={m} metric={m} both={view === "both"} focus={focus} setFocus={setFocus} />
                    ))}
                </div>

                <div className="su-list">
                    <div className="su-head" aria-hidden="true">
                        <span>Company</span>
                        <span>Raised</span>
                        <span>Output</span>
                        <span />
                    </div>
                    {STARTUPS.map((s) => (
                        <details
                            key={s.id}
                            className={`su-row${focus === s.id ? " on" : ""}`}
                            onMouseEnter={() => setFocus(s.id)}
                            onMouseLeave={() => setFocus(null)}
                        >
                            <summary>
                                <span className="su-co">
                                    <i className="su-swatch" style={{ background: COLORS[s.id] }} />
                                    <CompanyLogo name={s.id} size={22} className="su-logo" />
                                    {s.name}
                                </span>
                                <span className="su-fig">{formatMetric("raisedUsd", s.raisedUsd)}</span>
                                <span className="su-fig">{formatMetric("unitsPerMonth", s.unitsPerMonth)}</span>
                                <svg className="su-chev" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" />
                                </svg>
                            </summary>
                            <dl className="su-detail">
                                <dt>HQ</dt>
                                <dd>{s.hq}</dd>
                                <dt>Round</dt>
                                <dd>{s.round ?? "Undisclosed"}</dd>
                                <dt>Lead</dt>
                                <dd>
                                    {s.leadInvestor ? (
                                        <span className="with-logo">
                                            <CompanyLogo name={s.leadInvestor} size={16} />
                                            {s.leadInvestor}
                                        </span>
                                    ) : (
                                        "Undisclosed"
                                    )}
                                </dd>
                                <dt>Output</dt>
                                <dd>{s.volumeNote}</dd>
                                <dt>Links</dt>
                                <dd>
                                    <a href={s.url} rel="noopener" target="_blank">
                                        Website
                                    </a>
                                    {" · "}
                                    <a href={s.source.url} rel="noopener" target="_blank">
                                        {s.source.label}
                                    </a>
                                </dd>
                            </dl>
                        </details>
                    ))}
                </div>
                <p className="su-note">
                    Figures are company-reported or from press coverage and are not independently verified.
                </p>
            </main>
            <PublicFooter />
        </div>
    );
}
