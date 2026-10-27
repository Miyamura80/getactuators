import { useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { countryName } from "../../../../src/country-flag";
import { SUPPLY_CHAIN_PAGES_LIVE } from "../../../../src/public-navigation";
import type { CountryCode } from "../../../../src/supply-chain/countries";
import { COUNTRY_PAGE, type MapArc } from "../../../../src/supply-chain/map";
import { Flag } from "../Flag";
import { clipArc, polyline, sampleGreatCircle } from "./arc-geometry";
import { type Point, pct, toScreen, useMap } from "./map-context";
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
}

interface Chip {
    key: string;
    country: string;
    dir: "in" | "out";
    at: Point;
    arcs: MapArc[];
}

// Great-circle supply arcs, seller to buyer. Estimated links draw dashed.
// An arc whose other end is off this map stops at the frame edge with a
// country chip that links to that country's page.
export function Arcs({ arcs, hrefFor = liveCountryPage, selectedId, table = "Supply links" }: ArcsProps) {
    const { width, height, project, zoom, scale, svgLayer } = useMap();
    // Chip half-size in viewBox units, to keep chips inside the frame.
    const mx = 40 / scale;
    const my = 12 / scale;
    const marker = useId().replace(/:/g, "");
    const [active, setActive] = useState<string | null>(null);
    const projected = useMemo(() => arcs.map((a) => ({
        arc: a,
        base: sampleGreatCircle(a.from, a.to).map(([lon, lat]) => project(lon, lat)),
    })), [arcs, project]);
    const drawn = projected.map(({ arc, base }) => ({
        arc,
        clip: clipArc(base.map((p) => (p ? toScreen(p, zoom) : null)), width, height),
    }));
    const chips = new Map<string, Chip>();
    for (const { arc, clip } of drawn) {
        if (!clip.exit) continue;
        const end = clip.exit.end === "to" ? arc.to : arc.from;
        const dir = clip.exit.end === "to" ? "out" : "in";
        const key = `${dir}-${end.country}`;
        const chip = chips.get(key) ?? { key, country: end.country, dir, at: clip.exit.at, arcs: [] };
        chip.arcs.push(arc);
        chips.set(key, chip);
    }
    const focus = active ?? selectedId ?? null;
    const svg = <g className={`mk-arcs${focus ? " has-focus" : ""}`}>
        <defs>
            <marker id={marker} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 0 8 4 0 8Z" className="mk-arrow" />
            </marker>
        </defs>
        {drawn.map(({ arc, clip }) => clip.runs.map((run, i) => {
            const last = i === clip.runs.length - 1 && clip.toVisible;
            const d = polyline(run);
            return <g key={`${arc.id}-${i}`} className={`mk-arc mk-arc-${arc.confidence}${arc.id === focus ? " is-active" : ""}`}
                onPointerEnter={() => setActive(arc.id)} onPointerLeave={() => setActive(null)}>
                <path className="mk-arc-hit" d={d} />
                <path className="mk-arc-line" d={d} markerEnd={last ? `url(#${marker})` : undefined} />
            </g>;
        }))}
    </g>;
    const activeArc = drawn.find((d) => d.arc.id === active);
    const mid = activeArc?.clip.runs[0]?.[Math.floor((activeArc.clip.runs[0]?.length ?? 0) / 2)];
    return <>
        {svgLayer ? createPortal(svg, svgLayer) : null}
        {activeArc && mid ? <span className="mk-arc-tip" style={pct(mid, width, height)} aria-hidden="true">
            {activeArc.arc.from.label} → {activeArc.arc.to.label}<i>{activeArc.arc.label}</i>
        </span> : null}
        {[...chips.values()].map((c) => {
            const href = hrefFor(c.country);
            const name = countryName(c.country);
            const what = c.arcs.map((a) => `${a.from.label} to ${a.to.label}, ${a.label}`).join("; ");
            const label = `${c.dir === "out" ? "Supplies to" : "Supplied from"} ${name}: ${what}${href ? `. Open ${name}` : ""}`;
            const body = <>
                <svg viewBox="0 0 10 10" aria-hidden="true" className={`mk-chip-dir is-${c.dir}`}><path d="M2 5h6M5 2l3 3-3 3" /></svg>
                <Flag code={c.country} decorative />
                <span>{c.country}</span>
                {c.arcs.length > 1 ? <b>{c.arcs.length}</b> : null}
            </>;
            // Keep the chip inside the frame (it is centred on the exit point).
            const style = pct([Math.min(width - mx, Math.max(mx, c.at[0])), Math.min(height - my, Math.max(my, c.at[1]))], width, height);
            return href
                ? <a key={c.key} className="mk-chip" href={href} style={style} aria-label={label} title={label}>{body}</a>
                : <span key={c.key} className="mk-chip" style={style} role="img" aria-label={label} title={label}>{body}</span>;
        })}
        {table ? <OverlayTable
            caption={table}
            head={["From", "To", "What", "Confidence"]}
            rows={arcs.map((a) => [`${a.from.label} (${a.from.country})`, `${a.to.label} (${a.to.country})`, a.label, a.confidence])}
        /> : null}
    </>;
}
