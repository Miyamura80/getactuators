import { useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { countryName } from "../../../../src/country-flag";
import { SUPPLY_CHAIN_PAGES_LIVE } from "../../../../src/public-navigation";
import type { CountryCode } from "../../../../src/supply-chain/countries";
import { COUNTRY_PAGE, type MapArc, type MapArcEnd } from "../../../../src/supply-chain/map";
import { Flag } from "../Flag";
import { clipArc, polyline, sampleGreatCircle, spreadChips } from "./arc-geometry";
import type { LabelItem } from "./labels";
import { type Point, pct, toScreen, useMap } from "./map-context";
import { useMapLabels } from "./MapLabels";
import { OverlayTable } from "./MapTable";

// A country page link once that page is live; until then the chip is inert.
export function liveCountryPage(code: string): string | undefined {
    const href = COUNTRY_PAGE[code as CountryCode];
    return href && SUPPLY_CHAIN_PAGES_LIVE.has(href) ? href : undefined;
}

export interface ArcsProps {
    arcs: readonly MapArc[];
    hrefFor?: (country: string) => string | undefined;
    selectedId?: string | null;
    table?: string | false;
    // A domestic end off the frame (the map zoomed to one region) gets a
    // chip naming its region ("CA") instead of the country, and the chip
    // zooms there.
    regionOf?: (end: MapArcEnd) => string | undefined;
    onRegion?: (code: string) => void;
}

// Below this frame width (CSS pixels) chips shrink to a flag.
const COMPACT_PX = 600;

interface Chip {
    key: string;
    // Country code, or region code for a domestic chip.
    code: string;
    region: boolean;
    // The place's full name, for the accessible label.
    name: string;
    dirs: Set<"in" | "out">;
    at: Point;
    arcs: MapArc[];
}

// Arcs leaving the frame from one site to one chip draw as one stroke,
// thicker the more links it carries.
interface Bundle {
    key: string;
    chip: string;
    near: Point;
    // The on-map end's name.
    nearLabel: string;
    arcs: MapArc[];
    dirs: Set<"in" | "out">;
}

const KIND_LABEL = { supply: "Supply", investment: "Investment", partnership: "Partnership" } as const;

// A bundle holds links of one kind and one confidence, so its stroke keeps
// the encoding (dotted investment or partnership, dashed estimate).
function bundleClass(arcs: readonly MapArc[]): string {
    const a = arcs[0];
    return `mk-arc mk-arc-${a?.confidence ?? "reported"} mk-arc-kind-${a?.kind ?? "supply"}`;
}

// A gentle curve from a site to its chip.
function curve(a: Point, b: Point): string {
    const mx = (a[0] + b[0]) / 2;
    const my = (a[1] + b[1]) / 2;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const c: Point = [mx - dy * 0.12, my + dx * 0.12];
    return `M${a[0].toFixed(1)},${a[1].toFixed(1)}Q${c[0].toFixed(1)},${c[1].toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)}`;
}

// Great-circle supply arcs, seller to buyer, for links with both ends on
// the map. Estimated links draw dashed; investment and partnership links
// draw dotted in a muted tone (dash-dot when also estimated), so only supply
// reads as a solid flow. Partnerships run both ways: no arrowhead, and
// "A ↔ B" in the tooltip.
//
// A link whose other end is off the map runs to a chip on the frame edge:
// one chip per country (or, zoomed into a region, per domestic region),
// whichever way its links run, with their count; links from one site to one
// chip bundle into a single stroke.
export function Arcs({ arcs, hrefFor = liveCountryPage, selectedId, table = "Supply links", regionOf, onRegion }: ArcsProps) {
    const { width, height, project, zoom, scale, svgLayer, reserved } = useMap();
    const marker = useId().replace(/:/g, "");
    const [active, setActive] = useState<string | null>(null);
    const projected = useMemo(() => arcs.map((a) => ({
        arc: a,
        base: sampleGreatCircle(a.from, a.to).map(([lon, lat]) => project(lon, lat)),
    })), [arcs, project]);
    const drawn = projected.map(({ arc, base }) => ({
        arc,
        base,
        clip: clipArc(base.map((p) => (p ? toScreen(p, zoom) : null)), width, height),
    }));
    // On a phone-width map a chip is just its flag (or region code) and count.
    const compact = width * scale < COMPACT_PX;
    const chips = new Map<string, Chip>();
    const bundles = new Map<string, Bundle>();
    for (const { arc, base, clip } of drawn) {
        if (!clip.exit) continue;
        const far = clip.exit.end === "to" ? arc.to : arc.from;
        const near = clip.exit.end === "to" ? arc.from : arc.to;
        const dir = clip.exit.end === "to" ? "out" : "in";
        const region = regionOf?.(far);
        const code = region ?? far.country;
        const key = region ? `r-${region}` : far.country;
        const chip = chips.get(key) ?? { key, code, region: !!region, name: region ? (far.admin1 ?? region) : countryName(far.country), dirs: new Set(), at: clip.exit.at, arcs: [] };
        chip.dirs.add(dir);
        chip.arcs.push(arc);
        chips.set(key, chip);
        const nearBase = clip.exit.end === "to" ? base[0] : base.at(-1);
        if (!nearBase) continue;
        const bkey = `${near.id}|${key}|${arc.kind}|${arc.confidence}`;
        const bundle = bundles.get(bkey) ?? { key: bkey, chip: key, near: toScreen(nearBase, zoom), nearLabel: near.label, arcs: [], dirs: new Set() };
        bundle.arcs.push(arc);
        bundle.dirs.add(dir);
        bundles.set(bkey, bundle);
    }
    const sizeOf = (c: Chip): [number, number] => {
        const text = compact ? 30 : c.region ? 50 : 60;
        return [text + (c.arcs.length > 1 ? 4 + 7 * String(c.arcs.length).length : 0), 20];
    };
    // Chips spread along the frame edge so none covers another, clear of
    // the map's controls.
    const spread = spreadChips([...chips.values()].map((c) => ({
        key: c.key,
        at: [c.at[0] * scale, c.at[1] * scale] as Point,
        w: sizeOf(c)[0],
        h: sizeOf(c)[1],
    })), width * scale, height * scale, reserved);
    const chipAt = (c: Chip): Point => {
        const at = spread.get(c.key);
        return at ? [at[0] / scale, at[1] / scale] : c.at;
    };
    // Chips keep site and group labels off them.
    useMapLabels(`chips${useId()}`, [...chips.values()].map((c): LabelItem => {
        const [w, h] = sizeOf(c);
        return { id: `chip-${c.key}`, at: chipAt(c), text: "", priority: 0, tone: "cluster", r: w / 2, ry: h / 2 };
    }));
    const focus = active ?? selectedId ?? null;
    const svg = <g className={`mk-arcs${focus ? " has-focus" : ""}`}>
        <defs>
            <marker id={marker} viewBox="0 0 8 8" refX="7" refY="4" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                <path d="M0 0 8 4 0 8Z" className="mk-arrow" />
            </marker>
        </defs>
        {drawn.map(({ arc, clip }) => (clip.exit ? null : clip.runs.map((run, i) => {
            const last = i === clip.runs.length - 1 && clip.toVisible;
            const d = polyline(run);
            return <g key={`${arc.id}-${i}`} className={`mk-arc mk-arc-${arc.confidence} mk-arc-kind-${arc.kind}${arc.id === focus ? " is-active" : ""}`}
                onPointerEnter={() => setActive(arc.id)} onPointerLeave={() => setActive(null)}>
                <path className="mk-arc-hit" d={d} />
                <path className="mk-arc-line" d={d} markerEnd={last && arc.kind !== "partnership" ? `url(#${marker})` : undefined} />
            </g>;
        })))}
        {[...bundles.values()].map((b) => {
            const chip = chips.get(b.chip);
            if (!chip) return null;
            const d = curve(b.near, chipAt(chip));
            const one = b.dirs.size === 1 && b.arcs.every((a) => a.kind !== "partnership");
            const out = b.dirs.has("out");
            const on = b.key === focus || b.chip === focus || b.arcs.some((a) => a.id === focus);
            return <g key={b.key} className={`${bundleClass(b.arcs)}${on ? " is-active" : ""}`}
                onPointerEnter={() => setActive(b.key)} onPointerLeave={() => setActive(null)}>
                <path className="mk-arc-hit" d={d} />
                <path className="mk-arc-line" d={d} style={b.arcs.length > 1 ? { strokeWidth: Math.min(1.2 + 0.8 * (b.arcs.length - 1), 4.4) } : undefined}
                    markerEnd={one && out ? `url(#${marker})` : undefined} markerStart={one && !out ? `url(#${marker})` : undefined} />
            </g>;
        })}
    </g>;
    // Tooltip for the hovered arc or bundle, at its middle.
    const tip = (() => {
        const bundle = active ? bundles.get(active) : undefined;
        if (bundle) {
            const chip = chips.get(bundle.chip);
            if (!chip) return null;
            const a = bundle.arcs[0] as MapArc;
            const at = chipAt(chip);
            const mid: Point = [(bundle.near[0] + at[0]) / 2, (bundle.near[1] + at[1]) / 2];
            // Several links read as the site and the place, with the arrow
            // their direction (both ways only when they run both ways).
            const near = bundle.nearLabel;
            const many = bundle.dirs.size > 1 || a.kind === "partnership" ? `${near} ↔ ${chip.name}`
                : bundle.dirs.has("out") ? `${near} → ${chip.name}` : `${chip.name} → ${near}`;
            return { mid, head: bundle.arcs.length > 1 ? many : `${a.from.label} ${a.kind === "partnership" ? "↔" : "→"} ${a.to.label}`, body: bundle.arcs.length > 1 ? `${bundle.arcs.length} ${a.kind === "supply" ? "" : `${KIND_LABEL[a.kind].toLowerCase()} `}links` : `${a.kind === "supply" ? "" : `${KIND_LABEL[a.kind]}: `}${a.label}` };
        }
        const d = drawn.find((x) => x.arc.id === active && !x.clip.exit);
        const run = d?.clip.runs[0];
        const mid = run?.[Math.floor(run.length / 2)];
        if (!d || !mid) return null;
        return { mid, head: `${d.arc.from.label} ${d.arc.kind === "partnership" ? "↔" : "→"} ${d.arc.to.label}`, body: `${d.arc.kind === "supply" ? "" : `${KIND_LABEL[d.arc.kind]}: `}${d.arc.label}` };
    })();
    return <>
        {svgLayer ? createPortal(svg, svgLayer) : null}
        {tip ? <span className="mk-arc-tip" style={pct(tip.mid, width, height)} aria-hidden="true">{tip.head}<i>{tip.body}</i></span> : null}
        {[...chips.values()].map((c) => {
            const href = c.region ? undefined : hrefFor(c.code);
            const what = c.arcs.map((a) => `${a.from.label} ${a.kind === "partnership" ? "and" : "to"} ${a.to.label}, ${a.label}`).join("; ");
            // Wording and icon follow the link kind and direction:
            // partnerships, and chips with links both ways, run both ways.
            const both = c.dirs.size > 1 || c.arcs.every((a) => a.kind === "partnership");
            const dir = c.dirs.has("out") ? "out" : "in";
            const invest = c.arcs.every((a) => a.kind === "investment");
            const relation = c.dirs.size > 1 ? "Linked with"
                : c.arcs.every((a) => a.kind === "partnership") ? "Partners with"
                    : invest ? (dir === "out" ? "Invests in" : "Invested in from")
                        : dir === "out" ? "Supplies to" : "Supplied from";
            const go = c.region ? `. Zoom to ${c.name}` : href ? `. Open ${c.name}` : "";
            const label = `${relation} ${c.name}: ${what}${go}`;
            const body = <>
                {compact ? null : <svg viewBox="0 0 10 10" aria-hidden="true" className={`mk-chip-dir is-${both ? "both" : dir}`}><path d={both ? "M2 5h6M4 3 2 5l2 2M6 3l2 2-2 2" : "M2 5h6M5 2l3 3-3 3"} /></svg>}
                {c.region ? null : <Flag code={c.code} decorative />}
                {compact && !c.region ? null : <span>{c.code}</span>}
                {c.arcs.length > 1 ? <b>{c.arcs.length}</b> : null}
            </>;
            const style = pct(chipAt(c), width, height);
            const hover = { onPointerEnter: () => setActive(c.key), onPointerLeave: () => setActive(null) };
            if (c.region && onRegion) {
                return <button key={c.key} type="button" className="mk-chip is-region" style={style} aria-label={label} title={label} onClick={() => onRegion(c.code)} {...hover}>{body}</button>;
            }
            return href
                ? <a key={c.key} className="mk-chip" href={href} style={style} aria-label={label} title={label} {...hover}>{body}</a>
                : <span key={c.key} className={`mk-chip${c.region ? " is-region" : ""}`} style={style} role="img" aria-label={label} title={label} {...hover}>{body}</span>;
        })}
        {table ? <OverlayTable
            caption={table}
            head={["From", "To", "Kind", "What", "Confidence"]}
            rows={arcs.map((a) => [`${a.from.label} (${a.from.country})`, `${a.to.label} (${a.to.country})`, KIND_LABEL[a.kind], a.label, a.confidence])}
        /> : null}
    </>;
}
