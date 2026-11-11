import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { mountApp } from "../src/startup";
import { Patents, SCOPES } from "../src/pages/patents/Patents";
import { BAND_COLORS, bandsFor, COMPLETE_THROUGH, filterLine } from "../src/pages/patents/Stream";
import { placeLabels } from "../src/pages/patents/Value";
import { MIN_RIBBON, ribbons } from "../src/pages/patents/Areas";
import { hqBubbles } from "../src/pages/patents/AssigneeMap";
import { indexed, spreadLabels } from "../src/pages/patents/Momentum";
import { LANDSCAPE, MOMENTUM_EARLY, TECHNOLOGIES, familiesFor, leaderboard, momentum, valueRows } from "../../src/patents";

afterEach(cleanup);

const setUrl = (url: string) => (window as unknown as { happyDOM: { setURL: (url: string) => void } }).happyDOM.setURL(url);

const scopeButton = (root: HTMLElement, label: string) =>
    [...root.querySelectorAll(".pt-scopes button")].find((b) => b.textContent?.startsWith(label)) as HTMLButtonElement;

test("the app routes /patents to the lazily loaded page", async () => {
    setUrl("http://localhost:1/patents");
    document.body.innerHTML = '<div id="root"></div>';
    const root = document.getElementById("root") as HTMLElement;
    let mounted: ReturnType<typeof mountApp> | undefined;
    try {
        await act(async () => {
            mounted = mountApp(root);
        });
        for (let i = 0; i < 50 && root.querySelector("h1")?.textContent !== "Who patents actuator technology"; i++)
            await act(() => new Promise((r) => setTimeout(r, 20)));
        expect(root.querySelector("h1")?.textContent).toBe("Who patents actuator technology");
    } finally {
        await act(async () => {
            mounted?.unmount();
        });
        document.body.innerHTML = "";
    }
});

test("renders the stream with a lag shade, the leaderboard and the family list", () => {
    setUrl("http://localhost:1/patents");
    const view = render(<Patents />);
    const c = view.container;
    expect(c.querySelectorAll(".pt-scopes button")).toHaveLength(SCOPES.length);
    expect(SCOPES).toHaveLength(TECHNOLOGIES.length + 1);
    // A cutoff line after the last complete year, with the later years greyed out.
    const bands = bandsFor("all", "country").length;
    expect(c.querySelector(".pt-cutoff")).toBeTruthy();
    expect(c.querySelector(".pt-cutoff-text")?.textContent).toBe(`complete through ${COMPLETE_THROUGH}`);
    expect(c.querySelectorAll(".pt-band-tbd")).toHaveLength(bands);
    expect(c.querySelectorAll(".pt-band:not(.pt-band-tbd)")).toHaveLength(bands);
    expect(c.querySelectorAll(".pt-table tbody tr")).toHaveLength(15);
    expect(c.querySelector(".fk-tier")).toBeTruthy();
    const links = c.querySelectorAll(".pt-list a");
    expect(links).toHaveLength(25);
    expect(links[0]?.getAttribute("href")).toMatch(/^https:\/\/patents\.google\.com\/patent\/[A-Z]{2}\d/);
});

test("picking a technology and stacking by technology is kept in the URL", () => {
    setUrl("http://localhost:1/patents");
    const view = render(<Patents />);
    fireEvent.click(scopeButton(view.container, "Strain-wave gears"));
    expect(window.location.search).toBe("?technology=strain-wave");
    const first = view.container.querySelector(".pt-table tbody tr .pt-who")?.textContent;
    expect(first).toContain(leaderboard("strain-wave")[0]?.name ?? "missing");
    const byTech = [...view.container.querySelectorAll(".tr-toggle button")].find((b) => b.textContent === "By technology") as HTMLButtonElement;
    fireEvent.click(byTech);
    expect(window.location.search).toBe("?technology=strain-wave&stack=technology");
    expect(view.container.querySelectorAll(".pt-band:not(.pt-band-tbd)").length).toBeLessThanOrEqual(BAND_COLORS.length);
    // The selected technology stays lit; the rest dim.
    expect(view.container.querySelectorAll(".pt-band.is-dim").length).toBe(bandsFor("strain-wave", "technology").length - 1);
});

test("search filters the families and reads ?technology on load", () => {
    setUrl("http://localhost:1/patents?technology=ndfeb");
    const view = render(<Patents />);
    expect(scopeButton(view.container, "NdFeB magnets").getAttribute("aria-pressed")).toBe("true");
    const input = view.container.querySelector(".pt-search input") as HTMLInputElement;
    // happy-dom lacks `oninput` on document; React's polyfill reads on keyup.
    const type = (value: string) =>
        act(() => {
            fireEvent.focusIn(input);
            fireEvent.change(input, { target: { value } });
            fireEvent.keyUp(input);
        });
    type("zzzz-no-such-title");
    expect(view.container.querySelectorAll(".pt-list li")).toHaveLength(0);
    expect(view.container.querySelector(".pt-count")?.textContent).toBe("0 families");
    type("");
    expect(view.container.querySelector(".pt-count")?.textContent).toBe(`${familiesFor("ndfeb").length} families`);
});

test("map bubbles sit at top assignees' headquarters countries", () => {
    const bubbles = hqBubbles("all");
    expect(bubbles.length).toBeGreaterThan(1);
    expect(bubbles.reduce((s, b) => s + b.families, 0)).toBeLessThanOrEqual(LANDSCAPE.all.families);
    expect(bubbles[0]?.families).toBeGreaterThanOrEqual(bubbles.at(-1)?.families ?? 0);
});

const toggle = (root: HTMLElement, group: string, label: string) =>
    [...root.querySelectorAll(`[aria-label="${group}"] button`)].find((b) => b.textContent === label) as HTMLButtonElement;

test("the quality filter is kept in the URL and keeps the y axis", () => {
    setUrl("http://localhost:1/patents");
    const view = render(<Patents />);
    const c = view.container;
    const ticks = () => [...c.querySelectorAll(".pt-stream svg .tr-axis")].map((t) => t.textContent).join(",");
    const before = ticks();
    expect(c.querySelector(".pt-filter-line")?.textContent).toBe(filterLine("all", "all"));
    fireEvent.click(toggle(c, "Quality filter", "2+ offices"));
    expect(window.location.search).toBe("?filter=intl");
    expect(toggle(c, "Quality filter", "2+ offices").getAttribute("aria-pressed")).toBe("true");
    expect(c.querySelector(".pt-filter-line")?.textContent).toBe(filterLine("all", "intl"));
    expect(filterLine("all", "intl")).toMatch(/^[\d,]+ of [\d,]+ families 2010-\d\d \(\d+%\) · China \d+%$/);
    // Same scale: the filtered stream shrinks instead of rescaling.
    expect(ticks()).toBe(before);
    fireEvent.click(scopeButton(c, "NdFeB magnets"));
    expect(window.location.search).toBe("?technology=ndfeb&filter=intl");
    fireEvent.click(toggle(c, "Quality filter", "All"));
    expect(window.location.search).toBe("?technology=ndfeb");
});

test("reads ?filter on load", () => {
    setUrl("http://localhost:1/patents?filter=triadic&stack=technology");
    const view = render(<Patents />);
    expect(toggle(view.container, "Quality filter", "US+EP+JP").getAttribute("aria-pressed")).toBe("true");
    expect(view.container.querySelector(".pt-filter-line")?.textContent).toBe(filterLine("all", "triadic"));
});

test("the value scatter draws at most 40 bubbles with labels that never overlap", () => {
    setUrl("http://localhost:1/patents?technology=strain-wave");
    const view = render(<Patents />);
    const dots = view.container.querySelectorAll(".pt-dot");
    expect(dots.length).toBe(valueRows("strain-wave").length);
    expect(dots.length).toBeLessThanOrEqual(40);
    expect(dots.length).toBeGreaterThan(10);
    expect(view.container.querySelectorAll(".pt-label text").length).toBe(12);
    // Focus opens the same detail as hover.
    fireEvent.focus(dots[0] as Element);
    expect(view.container.querySelector(".pt-dot-tip")?.textContent).toMatch(/families.*filed in 2\+ offices.*granted/);
});

test("label placement keeps every label and lets none overlap", () => {
    // Twelve bubbles stacked on one spot: the worst case.
    const items = Array.from({ length: 12 }, () => ({ cx: 200, cy: 150, r: 10, w: 120 }));
    const box = { x: 0, y: 0, w: 400, h: 300 };
    const placed = placeLabels(items, items.map((i) => ({ x: i.cx, y: i.cy, r: i.r })), box);
    expect(placed).toHaveLength(12);
    for (const [i, a] of placed.entries()) {
        expect(a.x >= box.x && a.y >= box.y && a.x + a.w <= box.w && a.y + a.h <= box.h).toBe(true);
        for (const b of placed.slice(i + 1)) expect(a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h).toBe(false);
    }
});

test("the flow lights the selected technology's ribbons only", () => {
    setUrl("http://localhost:1/patents?technology=strain-wave&areas=flow");
    const view = render(<Patents />);
    const c = view.container;
    const mine = ribbons().shown.filter((r) => r.tech === "strain-wave").length;
    expect(mine).toBeGreaterThan(0);
    expect(c.querySelectorAll(".pt-ribbon.is-on")).toHaveLength(mine);
    expect(c.querySelectorAll(".pt-ribbon.is-off")).toHaveLength(ribbons().shown.length - mine);
    expect(ribbons().shown.every((r) => r.families >= MIN_RIBBON)).toBe(true);
    expect(c.querySelector(".pt-areas")?.textContent).toContain(`Links under ${MIN_RIBBON} families not drawn`);
    expect(c.querySelector(".pt-areas")?.textContent).toContain("CPC co-classification");
});

test("in All, focusing an area highlights its ribbons", () => {
    setUrl("http://localhost:1/patents?areas=flow");
    const view = render(<Patents />);
    const c = view.container;
    expect(c.querySelectorAll(".pt-ribbon.is-on")).toHaveLength(0);
    const node = [...c.querySelectorAll(".pt-node")].find((n) => n.textContent?.startsWith("Vehicles")) as Element;
    fireEvent.focus(node);
    expect(c.querySelectorAll(".pt-ribbon.is-on")).toHaveLength(ribbons().shown.filter((r) => r.area === "vehicles").length);
});

test("the Flow / Grid toggle is kept in the URL and the grid marks the scope's row", () => {
    setUrl("http://localhost:1/patents?technology=screws");
    const view = render(<Patents />);
    const c = view.container;
    fireEvent.click(toggle(c, "Application view", "Grid"));
    expect(window.location.search).toBe("?technology=screws&areas=grid");
    expect(c.querySelector(".pt-flow")).toBeNull();
    expect(c.querySelectorAll(".pt-grid tbody tr")).toHaveLength(TECHNOLOGIES.length);
    expect(c.querySelector(".pt-grid tr.is-on th")?.textContent).toBe("Roller & ball screws");
    expect(c.querySelectorAll(".pt-grid tr.is-dim")).toHaveLength(TECHNOLOGIES.length - 1);
    fireEvent.click(toggle(c, "Application view", "Flow"));
    expect(window.location.search).toBe("?technology=screws&areas=flow");
    expect(c.querySelector(".pt-flow")).toBeTruthy();
});

test("momentum tiles sort by change and a tile picks the technology", () => {
    setUrl("http://localhost:1/patents");
    const view = render(<Patents />);
    const c = view.container;
    const tiles = c.querySelectorAll(".pt-tile");
    expect(tiles).toHaveLength(TECHNOLOGIES.length);
    const rows = momentum();
    expect(tiles[0]?.textContent).toContain(rows[0]?.label ?? "missing");
    for (const [i, r] of rows.slice(1).entries()) expect(r.change ?? -1).toBeLessThanOrEqual(rows[i]?.change ?? 1);
    fireEvent.click(tiles[0] as Element);
    expect(window.location.search).toBe(`?technology=${rows[0]?.id}`);
    expect(c.querySelector(".pt-tile.is-on")).toBeTruthy();
});

test("outside China drops CN applicants and is kept in the URL with the indexed view", () => {
    setUrl("http://localhost:1/patents");
    const view = render(<Patents />);
    const c = view.container;
    fireEvent.click(toggle(c, "Applicants", "Outside China"));
    fireEvent.click(toggle(c, "Momentum view", "Indexed"));
    expect(window.location.search).toBe("?trend=index&applicants=ex-cn");
    expect(c.querySelectorAll(".pt-index-line")).toHaveLength(TECHNOLOGIES.length);
    const all = momentum("all");
    const ex = momentum("ex-cn");
    for (const r of ex) expect(r.late).toBeLessThanOrEqual(all.find((a) => a.id === r.id)?.late ?? 0);
});

test("indexing puts each technology's early-window average at 100", () => {
    const span = MOMENTUM_EARLY[1] - MOMENTUM_EARLY[0] + 1;
    for (const r of momentum()) {
        const v = indexed(r);
        expect(v.at(-1)).toBeDefined();
        expect(v.length).toBe(LANDSCAPE.years.indexOf(LANDSCAPE.completeThrough) + 1);
        const from = LANDSCAPE.years.indexOf(MOMENTUM_EARLY[0]);
        const mean = v.slice(from, from + span).reduce((s, x) => s + x, 0) / span;
        expect(Math.round(mean)).toBe(100);
    }
});

test("end labels never overlap and stay in bounds", () => {
    const ys = spreadLabels([50, 50, 51, 52, 300, 299], 13, 10, 300);
    const sorted = [...ys].sort((a, b) => a - b);
    for (const [i, y] of sorted.slice(1).entries()) expect(y - (sorted[i] ?? 0)).toBeGreaterThanOrEqual(13);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(10);
    expect(Math.max(...ys)).toBeLessThanOrEqual(300);
});

test("technologies can be hidden and shown, kept in ?hide", () => {
    setUrl("http://localhost:1/patents?trend=index");
    const view = render(<Patents />);
    const c = view.container;
    const chip = (label: string) => [...c.querySelectorAll(".pt-pick button")].find((b) => b.textContent === label) as HTMLButtonElement;
    expect(c.querySelectorAll(".pt-pick button[aria-pressed]")).toHaveLength(TECHNOLOGIES.length);
    fireEvent.click(chip("RE-free magnets"));
    fireEvent.click(chip("Robot joints"));
    expect(chip("RE-free magnets").getAttribute("aria-pressed")).toBe("false");
    expect(new URLSearchParams(window.location.search).get("hide")).toBe("re-free-magnets,robot-joints");
    expect(c.querySelectorAll(".pt-index-line")).toHaveLength(TECHNOLOGIES.length - 2);
    fireEvent.click(toggle(c, "Momentum view", "Tiles"));
    expect(c.querySelectorAll(".pt-tile")).toHaveLength(TECHNOLOGIES.length - 2);
    fireEvent.click(chip("Show all"));
    expect(new URLSearchParams(window.location.search).get("hide")).toBeNull();
    fireEvent.click(chip("Hide all"));
    expect(c.querySelector(".pt-empty")).toBeTruthy();
});

test("reads ?hide on load and ignores unknown ids", () => {
    setUrl("http://localhost:1/patents?hide=ndfeb,nope");
    const view = render(<Patents />);
    expect(view.container.querySelectorAll(".pt-tile")).toHaveLength(TECHNOLOGIES.length - 1);
});
