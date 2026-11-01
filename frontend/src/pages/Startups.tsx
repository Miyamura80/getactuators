import { useEffect, useState } from "react";
import { PublicHeader } from "../components/PublicHeader";
import { PublicFooter } from "../components/PublicFooter";
import { CompanyLogo } from "../components/CompanyLogo";
import { resolveBrand } from "../../../src/brands";
import { countryFlag } from "../../../src/country-flag";
import {
    countryLabel,
    formatMetric,
    STARTUP_METRICS,
    STARTUP_SEGMENTS,
    STARTUPS,
    STARTUPS_PATH,
    type Startup,
    type StartupMetric,
    type StartupSegment,
} from "../../../src/startups";
import "./tools.css";
import "./startups.css";

const TITLE = "Actuator startups";
// Tiles show a mark only when a real logo can load: self-hosted, or a known
// domain with the logo provider's key set. Initials would just repeat the name.
const HAS_LOGO_KEY = Boolean(import.meta.env.VITE_LOGO_DEV_TOKEN);
const hasLogo = (id: string): boolean => {
    const b = resolveBrand(id);
    return Boolean(b?.logo || (b?.domain && HAS_LOGO_KEY));
};
// Canvas per view: one wide map, or two squarer ones side by side.
const SIZE = { single: { W: 1000, H: 440 }, both: { W: 640, H: 440 } };
// An undisclosed figure still gets a tile so the company stays on the map,
// at this share of the smallest disclosed value (or of the canvas when none is).
const UNDISCLOSED_SHARE = 0.25;
// One pale fill per startup, assigned in list order so neighbours differ.
const PALETTE = [
    "#ffb3c7", "#8fb4ff", "#ffc48a", "#b9f2a1", "#d4b8ff", "#8de0d6",
    "#ffe08a", "#f5a8e0", "#a8d8ff", "#c8e88f", "#ffb59e", "#b0c4ff",
    "#9fe8b8", "#e8c8a0", "#c9b3ff", "#f0d0ff",
];
const pick = (i: number): string => PALETTE[i % PALETTE.length] as string;
const COMPANY_COLORS: Record<string, string> = Object.fromEntries(
    STARTUPS.map((s, i) => [s.id, s.id === "atlas-motion" ? "var(--cyan)" : pick(i)]),
);
const SEGMENT_COLORS: Record<StartupSegment, string> = {
    joint: "#8fb4ff",
    linear: "#b9f2a1",
    reducer: "#ffe08a",
    motor: "var(--cyan)",
    soft: "#f5a8e0",
};
const COUNTRY_COLORS: Record<string, string> = Object.fromEntries(
    [...new Set(STARTUPS.map((s) => s.country))].map((c, i) => [c, pick(i)]),
);

// How tiles are coloured and clustered: one colour per company, or nested
// treemaps per segment or per country.
type Group = "company" | "segment" | "country";
// "company" is the resting state, so only the two groupings get a pill.
const PILLS: { id: Exclude<Group, "company">; label: string }[] = [
    { id: "segment", label: "Segment" },
    { id: "country", label: "Country" },
];

function groupKey(s: Startup, group: Group): string {
    if (group === "segment") return s.segment;
    if (group === "country") return s.country;
    return s.id;
}

function groupColor(key: string, group: Group): string {
    if (group === "segment") return SEGMENT_COLORS[key as StartupSegment];
    if (group === "country") return COUNTRY_COLORS[key] ?? pick(0);
    return COMPANY_COLORS[key] ?? pick(0);
}

function groupLabel(key: string, group: Group): string {
    if (group === "segment") return STARTUP_SEGMENTS[key as StartupSegment].label;
    if (group === "country") return countryLabel(key);
    return key;
}

interface GroupSummary {
    key: string;
    members: Startup[];
    raised: number;
    floor: boolean;
}

// Groups ordered by money raised, members keeping their list order.
function summarise(group: Group): GroupSummary[] {
    const map = new Map<string, Startup[]>();
    for (const s of STARTUPS) {
        const k = groupKey(s, group);
        map.set(k, [...(map.get(k) ?? []), s]);
    }
    return [...map.entries()]
        .map(([key, members]) => ({
            key,
            members,
            raised: members.reduce((t, s) => t + (s.raisedUsd ?? 0), 0),
            floor: members.some((s) => s.raisedIsFloor || s.raisedUsd === null),
        }))
        .sort((a, b) => b.raised - a.raised);
}

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

interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

// Squarified treemap (Bruls, Huizing, van Wijk): lay rows along the short side,
// adding items while the worst aspect ratio in the row keeps improving.
function squarify<T extends { area: number }>(
    items: T[],
    x: number,
    y: number,
    w: number,
    h: number,
): (T & Rect)[] {
    const out: (T & Rect)[] = [];
    let rest = [...items].sort((a, b) => b.area - a.area);
    while (rest.length) {
        const side = Math.min(w, h);
        const worst = (row: T[]) => {
            const sum = row.reduce((t, r) => t + r.area, 0);
            const max = Math.max(...row.map((r) => r.area));
            const min = Math.min(...row.map((r) => r.area));
            return Math.max((side * side * max) / (sum * sum), (sum * sum) / (side * side * min));
        };
        let row = [rest[0] as T];
        let i = 1;
        while (i < rest.length && worst([...row, rest[i] as T]) <= worst(row)) {
            row = [...row, rest[i] as T];
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
                    ? { ...r, x, y: y + offset, w: thick, h: len }
                    : { ...r, x: x + offset, y, w: len, h: thick },
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

// Gap between nested group treemaps, in viewBox units.
const GROUP_GAP = 4;

function layout(metric: StartupMetric, W: number, H: number, group: Group): Tile[] {
    const known = STARTUPS.map((s) => s[metric]).filter((v): v is number => v !== null);
    const stub = known.length ? Math.min(...known) * UNDISCLOSED_SHARE : 1;
    const item = (s: Startup): Item => ({ s, value: s[metric], area: s[metric] ?? stub });
    const fill = (items: Item[], r: Rect): Tile[] => {
        const scale = (r.w * r.h) / items.reduce((t, i) => t + i.area, 0);
        return squarify(
            items.map((i) => ({ ...i, area: i.area * scale })),
            r.x,
            r.y,
            r.w,
            r.h,
        );
    };
    if (group === "company") return fill(STARTUPS.map(item), { x: 0, y: 0, w: W, h: H });
    // Two levels: groups share the canvas by their total, then each group's
    // members share its rectangle, inset so the black gap reads as a border.
    const groups = summarise(group).map((g) => {
        const items = g.members.map(item);
        return { items, area: items.reduce((t, i) => t + i.area, 0) };
    });
    const total = groups.reduce((t, g) => t + g.area, 0);
    return squarify(
        groups.map((g) => ({ ...g, area: (g.area * W * H) / total })),
        0,
        0,
        W,
        H,
    ).flatMap((g) =>
        fill(g.items, {
            x: g.x + GROUP_GAP / 2,
            y: g.y + GROUP_GAP / 2,
            w: Math.max(1, g.w - GROUP_GAP),
            h: Math.max(1, g.h - GROUP_GAP),
        }),
    );
}

// Shorten a label to the characters that fit `room` px at `charPx` per glyph.
function fit(text: string, room: number, charPx: number): string {
    const max = Math.floor(room / charPx);
    if (text.length <= max) return text;
    return max < 4 ? "" : `${text.slice(0, max - 1)}…`;
}

function Treemap({
    metric,
    both,
    group,
    focus,
    setFocus,
}: {
    metric: StartupMetric;
    both: boolean;
    group: Group;
    focus: string | null;
    setFocus: (id: string | null) => void;
}) {
    const { W, H } = SIZE[both ? "both" : "single"];
    const tiles = layout(metric, W, H, group);
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
                    const clip = `su-clip-${metric}-${t.s.id}`;
                    const logo = hasLogo(t.s.id) && t.w > 120 && t.h > 70;
                    const textX = t.x + (logo ? 56 : 16);
                    const valueText = formatMetric(metric, t.value, metric === "raisedUsd" && t.s.raisedIsFloor);
                    // Big figures only where the whole value fits at that size.
                    const roomy = known && t.h > 100 && valueText.length * 23 <= t.w - 24;
                    // Tiles too small for a label rely on the hover title and the list below.
                    const name = t.h >= 46 ? fit(t.s.name, t.x + t.w - textX - 8, 14) : "";
                    const value = t.h >= 72 ? fit(valueText, t.w - 24, roomy ? 23 : 12) : "";
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
                            <title>{`${t.s.name}: ${valueText}`}</title>
                            <rect
                                x={t.x + 1}
                                y={t.y + 1}
                                width={Math.max(0, t.w - 2)}
                                height={Math.max(0, t.h - 2)}
                                fill={known ? groupColor(groupKey(t.s, group), group) : `url(#su-hatch-${metric})`}
                                fillOpacity={known ? 0.9 : 1}
                                stroke={known ? "none" : "var(--line-strong)"}
                                strokeDasharray={known ? undefined : "4 4"}
                            />
                            <clipPath id={clip}>
                                <rect x={t.x} y={t.y} width={t.w} height={t.h} />
                            </clipPath>
                            {logo && (
                                <foreignObject x={t.x + 14} y={t.y + 12} width={30} height={30}>
                                    <CompanyLogo name={t.s.id} size={30} className="su-tile-logo" />
                                </foreignObject>
                            )}
                            <text clipPath={`url(#${clip})`} x={textX} y={t.y + 36} className={`su-name${known ? "" : " muted"}`}>
                                {name}
                            </text>
                            <text
                                clipPath={`url(#${clip})`}
                                x={t.x + 16}
                                y={t.y + (roomy ? 80 : 62)}
                                className={`su-value${known ? "" : " muted"}${roomy ? " big" : ""}`}
                            >
                                {value}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </figure>
    );
}

export function Startups({ menuOpen = false }: { menuOpen?: boolean }) {
    const [group, setGroup] = useState<Group>("company");
    const [focus, setFocus] = useState<string | null>(null);
    useEffect(() => {
        const prev = document.title;
        document.title = TITLE;
        return () => {
            document.title = prev;
        };
    }, []);
    const metrics: StartupMetric[] = ["raisedUsd", "unitsPerMonth"];
    const summary = group === "company" ? [] : summarise(group);
    const rows = group === "company" ? STARTUPS : summary.flatMap((g) => g.members);

    return (
        <div className="tool-page">
            <PublicHeader path={STARTUPS_PATH} initialOpen={menuOpen} />
            <main className="tool-main">
                <header className="tool-head">
                    <p className="tool-kicker">Startups</p>
                    <h1>Actuator startups</h1>
                    <p className="tool-lede">
                        New companies building robot actuators and motors, sized by money raised
                        (grants included) or by the production they report. A + marks a floor where
                        some rounds are undisclosed; hatched tiles have not disclosed the figure.
                    </p>
                </header>

                {/* Colour is per company until a pill is pressed; the legend exists only
                    while one is, so the default view carries no key at all. */}
                <div className="su-controls">
                    {group !== "company" && (
                        <ul className="su-legend" aria-label={`${group === "segment" ? "Segments" : "Countries"}, by money raised`}>
                            {summary.map((g) => (
                                <li key={g.key} title={group === "segment" ? STARTUP_SEGMENTS[g.key as StartupSegment].blurb : undefined}>
                                    <i className="su-swatch" style={{ background: groupColor(g.key, group) }} />
                                    <span className="su-legend-name">{groupLabel(g.key, group)}</span>
                                    <span className="su-fig">{formatMetric("raisedUsd", g.raised || null, g.floor)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                    <div className="su-pills" role="group" aria-label="Colour by">
                        {PILLS.map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                className="su-pill"
                                aria-pressed={group === p.id}
                                onClick={() => setGroup(group === p.id ? "company" : p.id)}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="su-maps both">
                    {metrics.map((m) => (
                        <Treemap key={m} metric={m} both group={group} focus={focus} setFocus={setFocus} />
                    ))}
                </div>

                <div className="su-list">
                    <div className="su-head" aria-hidden="true">
                        <span>Company</span>
                        <span>Raised</span>
                        <span>Output</span>
                        <span />
                    </div>
                    {rows.map((s) => (
                        <details
                            key={s.id}
                            className={`su-row${focus === s.id ? " on" : ""}`}
                            onMouseEnter={() => setFocus(s.id)}
                            onMouseLeave={() => setFocus(null)}
                        >
                            <summary>
                                <span className="su-co">
                                    <i className="su-swatch" style={{ background: groupColor(groupKey(s, group), group) }} />
                                    <CompanyLogo name={s.id} size={22} className="su-logo" />
                                    {s.name}
                                    <span className="su-flag" role="img" aria-label={countryLabel(s.country)} title={countryLabel(s.country)}>
                                        {countryFlag(s.country)}
                                    </span>
                                </span>
                                <span className="su-fig">{formatMetric("raisedUsd", s.raisedUsd, s.raisedIsFloor)}</span>
                                <span className="su-fig">{formatMetric("unitsPerMonth", s.unitsPerMonth)}</span>
                                <svg className="su-chev" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" />
                                </svg>
                            </summary>
                            <dl className="su-detail">
                                <dt>HQ</dt>
                                <dd>{s.hq}</dd>
                                <dt>Segment</dt>
                                <dd>{STARTUP_SEGMENTS[s.segment].label}</dd>
                                <dt>Country</dt>
                                <dd>{countryLabel(s.country)}</dd>
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
                                    {s.url && (
                                        <>
                                            <a href={s.url} rel="noopener" target="_blank">
                                                Website
                                            </a>
                                            {" · "}
                                        </>
                                    )}
                                    {[s.source, ...(s.moreSources ?? [])].map((src, i) => (
                                        <span key={src.url}>
                                            {i > 0 && " · "}
                                            <a href={src.url} rel="noopener" target="_blank">
                                                {src.label}
                                            </a>
                                        </span>
                                    ))}
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
