import "./happydom";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, expect, test } from "bun:test";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { clipArc, edgePoint } from "../src/components/maps/arc-geometry";
import { choroplethScale } from "../src/components/maps/choropleth";
import { groupName, groupPoints } from "../src/components/maps/cluster";
import { ClusterZoom } from "../src/components/maps/ClusterZoom";
import { labelSize, placeLabels } from "../src/components/maps/labels";
import { niceScale } from "../src/components/maps/ScaleBar";
import { LAB_CLUSTERS } from "../../src/supply-chain/lab-kit";
import type { MapTopology } from "../src/components/maps/geo";
import { Pins } from "../src/components/maps/Pins";
import { readSelection, useMapSelection, withSelection } from "../src/components/maps/use-map-selection";
import { WorldMap } from "../src/components/maps/WorldMap";
import { CountryMap } from "../src/components/maps/CountryMap";
import { Arcs } from "../src/components/maps/Arcs";
import { layers, monogram } from "../src/components/flows/graph-layout";
import { NodeBadge } from "../src/components/flows/NodeBadge";
import { ProcessStepChip } from "../src/components/flows/ProcessStepChip";
import { flowPath, layoutSankey } from "../src/components/flows/sankey-layout";
import { SupplyGraph } from "../src/components/flows/SupplyGraph";
import { ValueSankey } from "../src/components/flows/ValueSankey";
import { FootnotesProvider } from "../src/components/supply-chain/footnotes";
import { LabMaps } from "../src/pages/supply-chain/lab/LabMaps";
import { SEGMENT_COLOR, arcsTouching, sitePins, supplyArcs } from "../../src/supply-chain/map";
const geo = (f: string) => JSON.parse(readFileSync(new URL(`../public/geo/${f}`, import.meta.url), "utf8")) as MapTopology;
const WORLD = geo("world-110m.json");
const JP = geo("jp-admin1.json");

afterEach(cleanup);
beforeEach(() => window.history.replaceState({}, "", "/lab/supply-chain"));

const PINS = sitePins();

function Harness() {
    const sel = useMapSelection();
    return <WorldMap label="Sites" topology={WORLD}>
        <Pins pins={PINS} selectedId={sel.site} onSelect={(p) => sel.select({ site: p.id, company: p.companyId ?? null })} />
    </WorldMap>;
}

test("?site= selects a pin, and picking another pin rewrites the query", () => {
    window.history.replaceState({}, "", "/lab/supply-chain?site=mp-mountain-pass#maps");
    const c = render(<Harness />).container;
    const pressed = () => [...c.querySelectorAll('.mk-pin[aria-pressed="true"]')].map((b) => b.getAttribute("data-pin"));
    expect(pressed()).toEqual(["mp-mountain-pass"]);
    const other = c.querySelector('[data-pin="hds-hotaka"]') as HTMLButtonElement;
    act(() => { fireEvent.click(other); });
    expect(readSelection(window.location.search)).toEqual({ site: "hds-hotaka", company: "harmonic-drive-systems", cluster: null });
    expect(window.location.hash).toBe("#maps");
    expect(pressed()).toEqual(["hds-hotaka"]);
});

test("?company= opens the drawer with the company's sites", () => {
    window.history.replaceState({}, "", "/lab/supply-chain?company=jl-mag");
    const c = render(<LabMaps topologies={{ world: WORLD, JP }} />).container;
    const drawer = c.querySelector(".mk-drawer");
    expect(drawer?.querySelector("h3")?.textContent).toBe("JL MAG Rare-Earth");
    expect(drawer?.querySelectorAll(".sc-lab-sites li").length).toBeGreaterThanOrEqual(3);
    act(() => { fireEvent.click(drawer?.querySelector(".mk-drawer-close") as Element); });
    expect(window.location.search).toBe("");
    expect(c.querySelector(".mk-drawer")).toBeNull();
});

test("pins are keyboard-focusable buttons named by site, segment and precision", () => {
    const c = render(<WorldMap label="Sites" topology={WORLD}><Pins pins={PINS} /></WorldMap>).container;
    const pin = c.querySelector('[data-pin="mp-mountain-pass"]') as HTMLButtonElement;
    expect(pin.tagName).toBe("BUTTON");
    pin.focus();
    expect(document.activeElement).toBe(pin);
    expect(pin.getAttribute("aria-label")).toContain("Rare earth mining & refining");
    const hollow = c.querySelector('[data-pin="mp-las-vegas"]');
    expect(hollow?.getAttribute("aria-label")).toContain("(city centre)");
    expect(hollow?.querySelector(".mk-glyph.is-hollow")).not.toBeNull();
    // Shape encodes the segment.
    expect(pin.querySelector("circle")).not.toBeNull();
    expect(c.querySelector('[data-pin="tesla-austin"] path')?.getAttribute("d")).toContain("Z");
});

test("every map carries a hidden table equivalent", () => {
    const c = render(<WorldMap label="Magnet share" values={{ CN: 0.94 }} topology={WORLD}><Pins pins={PINS} /></WorldMap>).container;
    const tables = [...c.querySelectorAll(".mk-sr table")];
    expect(tables.map((t) => t.querySelector("caption")?.textContent)).toEqual(["Magnet share", "Sites"]);
    expect(tables[0]?.querySelector("tbody tr")?.textContent).toBe("China0.94");
    expect(tables[1]?.querySelectorAll("tbody tr")).toHaveLength(PINS.length);
    expect(c.querySelector('path[data-id="CN"]')?.getAttribute("data-step")).toBe("5");
});

test("country map fits admin-1 outlines and arcs leaving it end in a country chip", () => {
    const arcs = arcsTouching(supplyArcs(), "JP");
    const c = render(<CountryMap code="JP" topology={JP}><Arcs arcs={arcs} hrefFor={(code) => `/${code.toLowerCase()}`} /></CountryMap>).container;
    expect(c.querySelectorAll(".mk-land").length).toBe(47);
    // Nabtesco to FANUC and Yaskawa are domestic: no chips, two arcs.
    expect(c.querySelectorAll(".mk-chip")).toHaveLength(0);
    const leaving = render(<CountryMap code="JP" topology={JP}><Arcs arcs={supplyArcs().filter((a) => a.id === "hyundai-mobis--boston-dynamics")} hrefFor={(code) => `/${code.toLowerCase()}`} /></CountryMap>).container;
    expect(leaving.querySelectorAll(".mk-chip").length).toBeGreaterThan(0);
});

test("arc geometry: clip at the frame and drop floating runs", () => {
    const pts: ([number, number] | null)[] = [[200, 10], [250, 10], [290, 10], [350, 10], null];
    const c = clipArc(pts, 300, 100);
    expect(c.runs).toEqual([[[200, 10], [250, 10], [290, 10]]]);
    expect(c.exit).toEqual({ end: "to", at: [300, 10] });
    // A stretch visible only in the middle (an inset) is not drawn.
    const mid = clipArc([[-50, 5], [20, 5], [30, 5], null, [400, 5]], 300, 100);
    expect(mid.runs).toEqual([]);
    expect(edgePoint([50, 50], [50, 150], 100, 100)).toEqual([50, 100]);
});

test("pins pair segment colour with shape; hover card carries the monogram and site", () => {
    const c = render(<WorldMap label="Sites" topology={WORLD}><Pins pins={PINS} /></WorldMap>).container;
    const pin = c.querySelector('[data-pin="mp-mountain-pass"]') as HTMLElement;
    const glyph = pin.querySelector(".mk-glyph") as SVGElement;
    expect(glyph.getAttribute("style")).toContain(SEGMENT_COLOR["ree-mining-refining"]);
    expect(glyph.querySelector("circle")).not.toBeNull();
    expect(pin.querySelector(".mk-mono")?.textContent).toBe("MM");
    expect(pin.querySelector(".mk-tip i")?.textContent).toBe("Mountain Pass mine and separation plant");
});

test("country map: site density shading, coastline, scale bar, cities and placed labels", () => {
    const here = PINS.filter((p) => p.country === "JP");
    const c = render(<CountryMap code="JP" sites={here} topology={JP}>
        <ClusterZoom pins={here} clusters={LAB_CLUSTERS} />
    </CountryMap>).container;
    // Nagano holds a site: shaded, and listed in the hidden table.
    expect(c.querySelector('path[data-id="JP-20"]')?.getAttribute("data-step")).not.toBeNull();
    expect(c.querySelector('path[data-id="JP-01"]')?.getAttribute("data-step")).toBeNull();
    const table = [...c.querySelectorAll(".mk-sr table")].find((t) => t.querySelector("caption")?.textContent?.includes("sites per region"));
    expect(table?.textContent).toContain("Nagano");
    expect(c.querySelector(".mk-coast")?.getAttribute("d")?.length).toBeGreaterThan(100);
    expect(c.querySelector(".mk-scale")?.getAttribute("aria-label")).toMatch(/^Scale: bar is [\d,]+ km$/);
    // The key lists only the segments on this map, with counts.
    const key = [...c.querySelectorAll(".mk-keyrow .mk-key li")].map((li) => li.textContent);
    expect(key.some((t) => t?.startsWith("Rare earths"))).toBe(false);
    expect(key).toContain(`Gears & bearings${here.filter((p) => p.segment === "gears-screws-bearings").length}`);
    // Labels are decorative and never overlap.
    const layer = c.querySelector(".mk-labels");
    expect(layer?.getAttribute("aria-hidden")).toBe("true");
    expect(layer?.querySelector(".is-city")).not.toBeNull();
    expect(c.querySelectorAll(".mk-city-dot.is-capital")).toHaveLength(1);
});

test("label placement: priority first, no overlaps, markers and HUD kept clear", () => {
    const item = (id: string, x: number, priority: number, text = "Label text") => ({ id, at: [x, 50] as [number, number], text, priority, tone: "site" as const, r: 6 });
    const placed = placeLabels([item("low", 100, 0), item("high", 104, 2), item("far", 300, 1), item("bare", 200, 1, "")], 400, 100, 1, [[280, 0, 400, 100]]);
    const ids = placed.map((p) => p.item.id);
    // The two near markers both fit (one each side); the HUD box hides "far";
    // a bare marker never gets a label.
    expect(ids).toEqual(["high", "low"]);
    expect(placed[0]?.side).toBe("right");
    expect(placed[1]?.side).toBe("left");
    expect(labelSize(item("x", 0, 0)).every((n) => n > 0)).toBe(true);
});

test("groups take the name their members share: cluster, company, then region", () => {
    const at = (id: string) => PINS.find((p) => p.id === id) as (typeof PINS)[number];
    const jl = PINS.filter((p) => p.companyId === "jl-mag");
    expect(groupName(jl.filter((p) => p.country === "CN" && p.lat > 40), LAB_CLUSTERS)).toBe("Baotou");
    expect(groupName([at("mp-mountain-pass"), at("mp-las-vegas")], [])).toBe("MP Materials");
    expect(groupName([at("mp-mountain-pass"), at("tesla-austin")], [])).toBeNull();
    const { km, px } = niceScale(3.3);
    expect([1, 2, 5].some((s) => Number(String(km).replace(/0+$/, "")) === s)).toBe(true);
    expect(px).toBeGreaterThan(40);
});

test("clusters group nearby points, choropleth buckets five steps", () => {
    const groups = groupPoints([{ id: "a", at: [0, 0] }, { id: "b", at: [5, 0] }, { id: "c", at: [100, 0] }], 10);
    expect(groups.map((g) => g.ids.sort())).toEqual([["a", "b"], ["c"]]);
    const step = choroplethScale({ CN: 0.9, US: 0.1 }, 1);
    expect([step(0.9), step(0.1), step(0), step(undefined)]).toEqual([5, 1, 0, 0]);
    expect(withSelection("/x?a=1&site=s#h", { site: null, company: "c" })).toBe("/x?a=1&company=c#h");
});

const NODES = [
    { id: "ore", label: "Ore" },
    { id: "oxide", label: "Oxide" },
    { id: "labour", label: "Labour" },
    { id: "magnet", label: "Magnet" },
    { id: "other", label: "Other input" },
    { id: "motor", label: "Motor" },
];
const LINKS = [
    { source: "ore", target: "oxide", value: 10 },
    { source: "oxide", target: "magnet", value: 10 },
    { source: "labour", target: "magnet", value: 20 },
    { source: "magnet", target: "motor", value: 30 },
    { source: "other", target: "motor", value: 40 },
];

test("Sankey: hover lights a node's upstream and downstream paths only", () => {
    const p = flowPath(LINKS, "oxide");
    expect([...p.nodes].sort()).toEqual(["magnet", "motor", "ore", "oxide"]);
    expect(p.links.has("other->motor")).toBe(false);
    const c = render(<ValueSankey label="Chain" nodes={NODES} links={LINKS} />).container;
    const hit = c.querySelector('.fk-node-hit[aria-label^="Oxide"]') as Element;
    act(() => { fireEvent.pointerEnter(hit); });
    expect(c.querySelector(".fk-sankey")?.classList.contains("has-focus")).toBe(true);
    expect(c.querySelectorAll(".fk-link.is-lit")).toHaveLength(3);
    expect(c.querySelector(".fk-readout-name")?.textContent).toBe("Oxide");
    act(() => { fireEvent.pointerLeave(hit); });
    expect(c.querySelector(".fk-sankey")?.classList.contains("has-focus")).toBe(false);
});

test("Sankey: click selects through onSelectNode; layout turns vertical when asked", () => {
    const picked: string[] = [];
    const c = render(<ValueSankey label="Chain" nodes={NODES} links={LINKS} onSelectNode={(id) => picked.push(id)} />).container;
    act(() => { fireEvent.click(c.querySelector('.fk-node-hit[aria-label^="Magnet"]') as Element); });
    expect(picked).toEqual(["magnet"]);
    const h = layoutSankey(NODES.map((n) => n.id), LINKS, { width: 600, height: 300 });
    const v = layoutSankey(NODES.map((n) => n.id), LINKS, { width: 300, height: 600, vertical: true });
    const motorH = h.nodes.find((n) => n.id === "motor");
    const motorV = v.nodes.find((n) => n.id === "motor");
    expect(motorH && motorH.x0 > 500).toBe(true);
    expect(motorV && motorV.y0 > 500).toBe(true);
    const vc = render(<ValueSankey label="Chain" nodes={NODES} links={LINKS} orientation="vertical" />).container;
    expect(vc.querySelector(".fk-sankey")?.classList.contains("is-vertical")).toBe(true);
});

test("SupplyGraph layers suppliers before buyers; badges and step chips render", () => {
    expect(layers(["c", "a", "b"], [{ from: "a", to: "b" }, { from: "b", to: "c" }])).toEqual([["a"], ["b"], ["c"]]);
    expect(monogram("JL MAG Rare-Earth")).toBe("JM");
    const c = render(<FootnotesProvider>
        <SupplyGraph label="Links" nodes={[{ id: "a", name: "Alpha", country: "CN", stage: "magnet" }, { id: "b", name: "Beta", country: "JP" }]}
            edges={[{ from: "a", to: "b", label: "Magnets" }]} />
        <NodeBadge kind="idiot-index" value={9.14} />
        <NodeBadge kind="margin" value={{ value: 0.38, sources: ["usgs-mcs-2026-ree"], asOf: "2025", confidence: "estimated", note: "x" }} />
        <NodeBadge kind="concentration" shares={{ CN: 0.91, other: 0.09 }} />
        <ProcessStepChip stepId="strip-casting" />
    </FootnotesProvider>).container;
    const cols = [...c.querySelectorAll(".fk-layer")].map((l) => l.textContent);
    expect(cols[0]).toContain("Alpha");
    expect(cols[1]).toContain("Beta");
    expect(c.querySelector(".fk-badge-idiot-index")?.textContent).toContain("9.1x");
    expect(c.querySelector(".fk-badge-margin.sc-value-estimated")?.textContent).toContain("~38%");
    expect(c.querySelector(".fk-badge-concentration.is-dominant [role=img]")?.getAttribute("aria-label")).toBe("China 91% of this stage");
    const step = c.querySelector(".fk-step");
    expect(step?.getAttribute("href")).toBe("/manufacturing#step=strip-casting");
    expect(step?.textContent).toBe("Strip casting");
    act(() => { fireEvent.focus(c.querySelector(".fk-card-main") as Element); });
    expect(c.querySelector(".fk-graph")?.classList.contains("has-focus")).toBe(true);
});
