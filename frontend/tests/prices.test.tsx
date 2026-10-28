import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { PRICE_HISTORY } from "../../src/prices/history";
import type { PriceObservation } from "../../src/prices/types";
import { Prices } from "../src/pages/prices/Prices";
import { beeswarm } from "../src/pages/prices/beeswarm";
import { buildListings, frontier, rank } from "../src/pages/prices/listings";
import { classColor } from "../src/pages/prices/shared";
import { EMPTY_SPEC, readSpec, specUrl } from "../src/pages/prices/url-state";
import { PriceSparkline } from "../src/pages/prices/Sparkline";
import { ExplodedView } from "../src/pages/ExplodedView";

const setURL = (path: string) =>
    (window as unknown as { happyDOM: { setURL: (u: string) => void } }).happyDOM.setURL(`http://localhost${path}`);

const headings = (c: HTMLElement) => [...c.querySelectorAll(".pr-sec > h2")].map((h) => h.textContent);

// A year and a bit of weekly readings, each actuator drifting 0.2% cheaper a
// week, so every trend gate opens.
function weeklyYear(): PriceObservation[] {
    const start = Date.UTC(2025, 8, 1);
    return PRICE_HISTORY.points.flatMap((p) => p.priceUsd === null ? [] : Array.from({ length: 60 }, (_, w) => ({
        ...p,
        date: new Date(start + w * 7 * 86_400_000).toISOString().slice(0, 10),
        priceUsd: Math.round((p.priceUsd ?? 0) * 0.998 ** w * 100) / 100,
    })));
}

afterEach(cleanup);

test("one snapshot: today's strip leads, trends wait in one panel with progress", () => {
    setURL("/prices");
    const view = render(<Prices />);
    const c = view.container;
    expect(view.getByRole("heading", { level: 1 }).textContent).toBe("Actuator prices");
    expect(headings(c)).toEqual(["01$/Nm today", "02Find one for your spec", "03Trends unlock as data arrives"]);
    const dots = [...c.querySelectorAll<SVGElement>(".pr-strip .pr-dot")];
    expect(dots.length).toBeGreaterThan(40);
    for (const d of dots) expect(d.style.fill).toBe(classColor(d.dataset.class ?? ""));
    const rows = c.querySelectorAll(".pr-strip .pr-row");
    expect(rows.length).toBeGreaterThan(3);
    expect(c.querySelectorAll(".pr-cheap")).toHaveLength(rows.length);
    expect(c.querySelectorAll(".pr-ring")).toHaveLength(rows.length);
    expect([...c.querySelectorAll("[data-gate]")].map((g) => g.getAttribute("data-gate"))).toEqual(["curve", "history", "metals"]);
    expect(c.querySelector('[data-gate="curve"]')?.textContent).toContain("of 365 days");
    expect(c.querySelector('[data-gate="metals"]')?.textContent).toContain("of 6 paired months");
    expect(c.querySelector(".pr-readout-k")?.textContent).toBe("Cheapest today");
    expect(c.querySelector("section#per-nm, section#history, section#metals")).toBeNull();
});

test("picking a dot selects it and writes the URL; rows regroup by country", () => {
    setURL("/prices");
    const view = render(<Prices />);
    const c = view.container;
    const dot = c.querySelector<SVGElement>('.pr-dot[data-id="robstride-04"]');
    act(() => {
        if (dot) fireEvent.click(dot);
    });
    expect(window.location.search).toBe("?actuator=robstride-04");
    expect(c.querySelector(".pr-readout-k")?.textContent).toBe("Selected");
    expect(c.querySelector(".pr-readout")?.textContent).toContain("$255");
    expect(c.querySelector('.pr-dot[data-id="robstride-04"]')?.getAttribute("aria-pressed")).toBe("true");
    act(() => {
        fireEvent.click(view.getByRole("button", { name: "By country" }));
    });
    expect(c.querySelector('.pr-row[data-row="China"]')).not.toBeNull();
});

test("?actuator= deep links the readout, the strip and the match row", () => {
    setURL("/prices?actuator=robstride-02");
    const view = render(<Prices />);
    const c = view.container;
    expect(c.querySelector("#history.pr-readout")?.textContent).toContain("$160.99");
    expect(c.querySelector('.pr-dot[data-id="robstride-02"]')?.getAttribute("aria-pressed")).toBe("true");
    expect(c.querySelector(".pr-match.is-sel")?.getAttribute("data-id")).toBe("robstride-02");
    cleanup();
    // An unknown id falls back to the cheapest.
    setURL("/prices?actuator=nope");
    expect(render(<Prices />).container.querySelector(".pr-readout-k")?.textContent).toBe("Cheapest today");
});

const LISTINGS = buildListings(PRICE_HISTORY.points);

test("spec round-trips through the query string and drops empties", () => {
    const spec = readSpec("?nm=20&budget=300&class=smart_servo&country=China&actuator=robstride-02&x=1");
    expect(spec).toEqual({ nm: 20, budget: 300, cls: "smart_servo", country: "China", actuator: "robstride-02" });
    expect(readSpec("?nm=-3&budget=abc")).toEqual(EMPTY_SPEC);
    expect(specUrl({ ...spec, budget: null, cls: "" }, "?x=1&budget=300", "#find"))
        .toBe("/prices?x=1&nm=20&country=China&actuator=robstride-02#find");
    expect(specUrl(EMPTY_SPEC, "")).toBe("/prices");
});

test("rank keeps only matches, cheapest per Nm first; frontier is undominated", () => {
    const r = rank(LISTINGS, { ...EMPTY_SPEC, nm: 50, budget: 400 });
    expect(r.length).toBeGreaterThan(1);
    for (const l of r) expect(l.torque >= 50 && l.price <= 400).toBe(true);
    for (let i = 1; i < r.length; i++) expect((r[i]?.perNm ?? 0) >= (r[i - 1]?.perNm ?? 0)).toBe(true);
    const f = frontier(LISTINGS);
    for (const l of f)
        expect(LISTINGS.some((o) => o !== l && o.torque >= l.torque && o.price < l.price)).toBe(false);
    // Torque ascending means price ascending along the frontier.
    for (let i = 1; i < f.length; i++) expect((f[i]?.price ?? 0) > (f[i - 1]?.price ?? 0)).toBe(true);
});

test("spec section: the strip's actuators, top ten ranked, scatter with frontier", () => {
    setURL("/prices");
    const view = render(<Prices />);
    const c = view.container;
    expect(LISTINGS.length).toBe(c.querySelectorAll(".pr-strip .pr-dot").length);
    expect(c.querySelectorAll(".pr-match")).toHaveLength(10);
    expect(c.querySelectorAll(".pr-sc-dot")).toHaveLength(LISTINGS.length);
    expect(c.querySelector(".pr-frontier")?.getAttribute("d")).toMatch(/^M/);
    // One snapshot: no sparklines in the rows yet.
    expect(c.querySelector(".pr-match .pr-spark-svg")).toBeNull();
    act(() => {
        fireEvent.click(view.getByRole("button", { name: /Show all/ }));
    });
    expect(c.querySelectorAll(".pr-match")).toHaveLength(LISTINGS.length);
});

test("typing a spec filters, re-ranks and writes the URL", () => {
    setURL("/prices");
    const view = render(<Prices />);
    const c = view.container;
    const nm = c.querySelector<HTMLInputElement>(".pr-field-nm input");
    const want = rank(LISTINGS, { ...EMPTY_SPEC, nm: 100 }).map((l) => l.a.id);
    // happy-dom lacks `oninput` on document, so React's input polyfill
    // reads the new value on keyup.
    act(() => {
        if (!nm) return;
        fireEvent.focusIn(nm);
        fireEvent.change(nm, { target: { value: "100" } });
        fireEvent.keyUp(nm);
    });
    expect(window.location.search).toBe("?nm=100");
    expect([...c.querySelectorAll<HTMLElement>(".pr-match")].map((r) => r.dataset.id)).toEqual(want.slice(0, 10));
    expect(c.querySelectorAll(".pr-sc-dot.is-match")).toHaveLength(want.length);
    expect(c.querySelector(".pr-zone")).not.toBeNull();
    // Picking a dot in the strip keeps the spec: one shared query state.
    act(() => {
        const dot = c.querySelector<SVGElement>('.pr-strip .pr-dot[data-id="robstride-04"]');
        if (dot) fireEvent.click(dot);
    });
    expect(window.location.search).toBe("?nm=100&actuator=robstride-04");
    act(() => {
        fireEvent.click(view.getByRole("button", { name: "Clear" }));
    });
    expect(window.location.search).toBe("?actuator=robstride-04");
});

test("?actuator= outside the spec is pinned above the list; its button clears it", () => {
    setURL("/prices?nm=100&actuator=robstride-02");
    const view = render(<Prices />);
    const c = view.container;
    const sel = c.querySelector(".pr-match.is-sel");
    expect(sel?.getAttribute("data-id")).toBe("robstride-02");
    expect(sel?.querySelector(".pr-rank")?.textContent).toBe("out");
    expect(c.querySelector(".pr-match")).toBe(sel);
    act(() => {
        const btn = sel?.querySelector<HTMLButtonElement>(".pr-sel-btn");
        if (btn) fireEvent.click(btn);
    });
    expect(window.location.search).toBe("?nm=100");
    expect(c.querySelector(".pr-match.is-sel")).toBeNull();
    expect(c.querySelector(".pr-readout-k")?.textContent).toBe("Cheapest today");
});

test("a year of weekly data opens the trend views, dots in class colour", () => {
    setURL("/prices?actuator=robstride-02");
    const view = render(<Prices points={weeklyYear()} />);
    const c = view.container;
    // NdPr in /metals is flat over these months, so there is no r yet: the
    // metals view stays folded, saying why.
    expect(headings(c)).toEqual(["01$/Nm today", "02Find one for your spec", "03$/Nm over time", "04One actuator", "05Trends unlock as data arrives"]);
    expect([...c.querySelectorAll("[data-gate]")].map((g) => g.getAttribute("data-gate"))).toEqual(["metals"]);
    expect(c.querySelector('[data-gate="metals"]')?.textContent).toContain("waiting for NdPr to move");
    const overTime = [...c.querySelectorAll<SVGElement>("#per-nm .pr-dot")];
    expect(overTime.length).toBeGreaterThan(1000);
    expect(new Set(overTime.map((d) => d.style.fill)).size).toBeGreaterThan(3);
    for (const d of overTime.slice(0, 50)) expect(d.style.fill).toBe(classColor(d.dataset.class ?? ""));
    expect(c.querySelectorAll(".pr-fit").length).toBeGreaterThan(0);
    expect(c.querySelector<HTMLSelectElement>(".pr-pick select")?.value).toBe("robstride-02");
    expect(c.querySelectorAll("section#history .pr-hist-dot")).toHaveLength(60);
    // With history, each match row carries its sparkline: the top ten plus
    // the selection, pinned because it ranks below them.
    expect(c.querySelectorAll(".pr-match .pr-spark-svg")).toHaveLength(11);
});

test("beeswarm keeps x and never overlaps", () => {
    const dots = beeswarm([10, 10, 10, 11, 30], (v) => v, 5);
    expect(dots.map((d) => d.x)).toEqual([10, 10, 10, 11, 30]);
    for (const a of dots)
        for (const b of dots)
            if (a !== b) expect(Math.hypot(a.x - b.x, a.dy - b.dy)).toBeGreaterThanOrEqual(10);
});

test("sparkline on catalog pages links to the full chart, absent without history", () => {
    setURL("/actuators/robstride-02");
    const view = render(<ExplodedView id="robstride-02" />);
    const link = view.container.querySelector<HTMLAnchorElement>("a.pr-spark");
    expect(link?.getAttribute("href")).toBe("/prices?actuator=robstride-02#history");
    expect(link?.textContent).toContain("Price history since 2026-09-23");
    cleanup();
    expect(render(<PriceSparkline id="nabtesco-rv-42n" />).container.innerHTML).toBe("");
});
