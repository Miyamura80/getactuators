import { useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { countryName } from "../../../../src/country-flag";
import { SUPPLY_CHAIN_PAGES_LIVE } from "../../../../src/public-navigation";
import type { CountryCode } from "../../../../src/supply-chain/countries";
import { COUNTRY_PAGE, type MapArc } from "../../../../src/supply-chain/map";
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
}

interface Chip {
    key: string;
    country: string;
    dir: "in" | "out";
    at: Point;
    arcs: MapArc[];
}

// Great-circle supply arcs, seller to buyer. Estimated links draw dashed;
// investment and partnership links draw dotted in a muted tone (dash-dot
// when also estimated), so only supply reads as a solid flow. Partnerships
// run both ways: no arrowhead, and "A ↔ B" in the tooltip.
const KIND_LABEL = { supply: "Supply", investment: "Investment", partnership: "Partnership" } as const;
// An arc whose other end is off this map stops at the frame edge with a
// country chip that links to that country's page.
export function Arcs({ arcs, hrefFor = liveCountryPage, selectedId, table = "Supply links" }: ArcsProps) {
    const { width, height, project, zoom, scale, svgLayer } = useMap();
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
    const sizeOf = (c: Chip): [number, number] => [60 + (c.arcs.length > 1 ? 4 + 7 * String(c.arcs.length).length : 0), 20];
    // Chips spread along the frame edge so none covers another (CSS pixels:
    // arrow, flag and code, plus the count when there is one).
    const spread = spreadChips([...chips.values()].map((c) => ({
        key: c.key,
        at: [c.at[0] * scale, c.at[1] * scale] as Point,
        w: sizeOf(c)[0],
        h: sizeOf(c)[1],
    })), width * scale, height * scale);
    // Chips keep site and group labels off them.
    useMapLabels(`chips${useId()}`, [...chips.values()].map((c): LabelItem => {
        const at = spread.get(c.key) ?? c.at;
        const [w, h] = sizeOf(c);
        return { id: `chip-${c.key}`, at: [at[0] / scale, at[1] / scale], text: "", priority: 0, tone: "cluster", r: w / 2, ry: h / 2 };
    }));
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
            return <g key={`${arc.id}-${i}`} className={`mk-arc mk-arc-${arc.confidence} mk-arc-kind-${arc.kind}${arc.id === focus ? " is-active" : ""}`}
                onPointerEnter={() => setActive(arc.id)} onPointerLeave={() => setActive(null)}>
                <path className="mk-arc-hit" d={d} />
                <path className="mk-arc-line" d={d} markerEnd={last && arc.kind !== "partnership" ? `url(#${marker})` : undefined} />
            </g>;
        }))}
    </g>;
    const activeArc = drawn.find((d) => d.arc.id === active);
    const mid = activeArc?.clip.runs[0]?.[Math.floor((activeArc.clip.runs[0]?.length ?? 0) / 2)];
    return <>
        {svgLayer ? createPortal(svg, svgLayer) : null}
        {activeArc && mid ? <span className="mk-arc-tip" style={pct(mid, width, height)} aria-hidden="true">
            {`${activeArc.arc.from.label} ${activeArc.arc.kind === "partnership" ? "↔" : "→"} ${activeArc.arc.to.label}`}<i>{activeArc.arc.kind === "supply" ? "" : `${KIND_LABEL[activeArc.arc.kind]}: `}{activeArc.arc.label}</i>
        </span> : null}
        {[...chips.values()].map((c) => {
            const href = hrefFor(c.country);
            const name = countryName(c.country);
            const what = c.arcs.map((a) => `${a.from.label} ${a.kind === "partnership" ? "and" : "to"} ${a.to.label}, ${a.label}`).join("; ");
            // Wording and icon follow the link kind: partnerships run both ways.
            const both = c.arcs.every((a) => a.kind === "partnership");
            const invest = c.arcs.every((a) => a.kind === "investment");
            const relation = both ? "Partners with"
                : invest ? (c.dir === "out" ? "Invests in" : "Invested in from")
                    : c.dir === "out" ? "Supplies to" : "Supplied from";
            const label = `${relation} ${name}: ${what}${href ? `. Open ${name}` : ""}`;
            const body = <>
                <svg viewBox="0 0 10 10" aria-hidden="true" className={`mk-chip-dir is-${both ? "both" : c.dir}`}><path d={both ? "M2 5h6M4 3 2 5l2 2M6 3l2 2-2 2" : "M2 5h6M5 2l3 3-3 3"} /></svg>
                <Flag code={c.country} decorative />
                <span>{c.country}</span>
                {c.arcs.length > 1 ? <b>{c.arcs.length}</b> : null}
            </>;
            const at = spread.get(c.key) ?? c.at;
            const style = pct([at[0] / scale, at[1] / scale], width, height);
            return href
                ? <a key={c.key} className="mk-chip" href={href} style={style} aria-label={label} title={label}>{body}</a>
                : <span key={c.key} className="mk-chip" style={style} role="img" aria-label={label} title={label}>{body}</span>;
        })}
        {table ? <OverlayTable
            caption={table}
            head={["From", "To", "Kind", "What", "Confidence"]}
            rows={arcs.map((a) => [`${a.from.label} (${a.from.country})`, `${a.to.label} (${a.to.country})`, KIND_LABEL[a.kind], a.label, a.confidence])}
        /> : null}
    </>;
}
