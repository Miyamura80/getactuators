import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { PRICE_HISTORY } from "../../src/prices/history";
import type { PriceObservation } from "../../src/prices/types";
import { Prices } from "../src/pages/prices/Prices";
import { beeswarm } from "../src/pages/prices/beeswarm";
import { classColor, readActuator } from "../src/pages/prices/shared";
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
    expect(headings(c)).toEqual(["01$/Nm today", "02Trends unlock as data arrives"]);
    const dots = [...c.querySelectorAll<SVGElement>(".pr-strip .pr-dot")];
    expect(dots.length).toBeGreaterThan(40);
    for (const d of dots) expect(d.style.fill).toBe(classColor(d.dataset.class ?? ""));
    const rows = c.querySelectorAll(".pr-row");
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

test("?actuator= deep links the readout", () => {
    setURL("/prices?actuator=robstride-02");
    expect(readActuator(window.location.search, ["robstride-02"])).toBe("robstride-02");
    expect(readActuator("?actuator=nope", ["robstride-02"])).toBe("");
    const view = render(<Prices />);
    expect(view.container.querySelector(".pr-readout")?.textContent).toContain("$160.99");
});

test("a year of weekly data opens the trend views, dots in class colour", () => {
    setURL("/prices?actuator=robstride-02");
    const view = render(<Prices points={weeklyYear()} />);
    const c = view.container;
    // NdPr in /metals is flat over these months, so there is no r yet: the
    // metals view stays folded, saying why.
    expect(headings(c)).toEqual(["01$/Nm today", "02$/Nm over time", "03One actuator", "04Trends unlock as data arrives"]);
    expect([...c.querySelectorAll("[data-gate]")].map((g) => g.getAttribute("data-gate"))).toEqual(["metals"]);
    expect(c.querySelector('[data-gate="metals"]')?.textContent).toContain("waiting for NdPr to move");
    const overTime = [...c.querySelectorAll<SVGElement>("#per-nm .pr-dot")];
    expect(overTime.length).toBeGreaterThan(1000);
    expect(new Set(overTime.map((d) => d.style.fill)).size).toBeGreaterThan(3);
    for (const d of overTime.slice(0, 50)) expect(d.style.fill).toBe(classColor(d.dataset.class ?? ""));
    expect(c.querySelectorAll(".pr-fit").length).toBeGreaterThan(0);
    expect(c.querySelector<HTMLSelectElement>(".pr-pick select")?.value).toBe("robstride-02");
    expect(c.querySelectorAll("section#history .pr-hist-dot")).toHaveLength(60);
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
