import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { act, cleanup, fireEvent, render, within } from "@testing-library/react";
import { Metals } from "../src/pages/supply-chain/metals/Metals";
import { readState, writeState } from "../src/pages/supply-chain/metals/url-state";

const setURL = (path: string) =>
    (window as unknown as { happyDOM: { setURL: (u: string) => void } }).happyDOM.setURL(`http://localhost${path}`);

const realMatchMedia = window.matchMedia;
afterEach(() => {
    cleanup();
    window.matchMedia = realMatchMedia;
});

const pressed = (root: ParentNode, group: string) =>
    [...root.querySelectorAll(`[aria-label="${group}"] button[aria-pressed="true"]`)].map((b) => b.textContent);

test("renders the five sections, six element tiles and the sources", () => {
    setURL("/metals");
    const view = render(<Metals />);
    const c = view.container;
    expect(view.getByRole("heading", { level: 1 }).textContent).toBe("Magnet metals");
    expect([...c.querySelectorAll(".mt-sec > h2")].map((h) => h.textContent)).toEqual([
        "01What goes in",
        "02Where it comes from",
        "03How much is left",
        "04How the price moved",
        "05Who sets the price",
    ]);
    expect(c.querySelectorAll(".mt-tile")).toHaveLength(6);
    // Default view: Nd mining as one waffle with China on top.
    expect(c.querySelectorAll(".mt-stage")).toHaveLength(1);
    expect(c.querySelector(".mt-top")?.getAttribute("aria-label")).toBe("Top country: China 69%");
    expect(c.querySelector("details.sc-sources")).not.toBeNull();
    // Exactly one call to action.
    expect(c.querySelectorAll(".mt-cta")).toHaveLength(1);
});

test("deep link ?element=dy&stage=separation opens that view", () => {
    setURL("/metals?element=dy&stage=separation");
    const view = render(<Metals />);
    const c = view.container;
    expect(c.querySelector('.mt-tile[data-element="dy"]')?.getAttribute("aria-pressed")).toBe("true");
    expect(pressed(c, "Stage")).toEqual(["Separation"]);
    expect(c.querySelector('.mt-stage[data-stage="separation"] .mt-top')?.getAttribute("aria-label")).toBe(
        "Top country: China 95%",
    );
    // Heavy rare earth mining has no country split: drawn as a gap.
    act(() => {
        fireEvent.click(view.getByRole("button", { name: "Mining" }));
    });
    expect(c.querySelector('.mt-gap[data-stage="mining"]')?.textContent).toContain("Myanmar");
    expect(window.location.search).toBe("?element=dy");
});

test("toggles write the URL and the whole chain stacks four stages", () => {
    setURL("/metals");
    const view = render(<Metals />);
    const c = view.container;
    act(() => {
        fireEvent.click(view.getByRole("button", { name: "Whole chain" }));
    });
    expect(c.querySelectorAll(".mt-stages.is-chain > *")).toHaveLength(4);
    expect(window.location.search).toBe("?chain=1");
    act(() => {
        fireEvent.click(c.querySelector('.mt-tile[data-element="co"]')!);
    });
    expect(window.location.search).toBe("?element=co&chain=1");
    // Cobalt mining is Congo-led; its refining is a gap; reserves follow.
    expect(c.querySelector('.mt-stage[data-stage="mining"] .mt-top')?.getAttribute("aria-label")).toContain("Congo");
    expect(c.querySelector('.mt-gap[data-stage="separation"] figcaption')?.textContent).toBe("Refining");
    expect(pressed(c, "Commodity")).toEqual(["Cobalt"]);
    expect(c.querySelector('.mt-res-list li[data-country="CD"]')).not.toBeNull();
});

test("grade picker changes the composition and the humanoid grams", () => {
    setURL("/metals?grade=eh");
    const view = render(<Metals />);
    const c = view.container;
    expect(pressed(c, "Temperature grade")).toEqual(["EH"]);
    expect(c.querySelector(".mt-bar")?.getAttribute("aria-label")).toContain("Dy 8.5%-11%");
    act(() => {
        fireEvent.click(view.getByRole("button", { name: "N" }));
    });
    expect(window.location.search).toBe("?grade=n");
    expect(c.querySelector(".mt-humanoid dt")?.textContent).toBe("One humanoid, N grade");
});

test("price chart toggles series and scale, with events and the CN/export gap", () => {
    setURL("/metals");
    const view = render(<Metals />);
    const c = view.container;
    const series = () => [...c.querySelectorAll(".mt-series")].map((g) => g.getAttribute("data-series"));
    expect(series()).toContain("dy-oxide");
    expect(series()).not.toContain("co-metal");
    const prices = within(c.querySelector(".mt-prices") as HTMLElement);
    act(() => {
        fireEvent.click(prices.getByRole("button", { name: "Co" }));
    });
    expect(series()).toContain("co-metal");
    const chart = c.querySelector(".mt-chart")!;
    expect(chart.getAttribute("aria-label")).toContain("log scale");
    act(() => {
        fireEvent.click(prices.getByRole("button", { name: "Linear" }));
    });
    expect(chart.getAttribute("aria-label")).toContain("linear scale");
    expect(c.querySelectorAll(".mt-pin")).toHaveLength(c.querySelectorAll(".mt-events li").length);
    expect(c.querySelector('.mt-spread li[data-element="tb"] .mt-spread-pct')?.textContent).toBe("+43%");
    // Every drawn point names its value and source.
    expect(c.querySelector('.mt-series[data-series="dy-oxide"] circle title')?.textContent).toContain("USGS");
});

test("reduced motion holds the page still", () => {
    window.matchMedia = ((query: string) => ({
        matches: query.includes("reduce"),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
    setURL("/metals");
    const view = render(<Metals />);
    expect(view.container.querySelector(".mt-page.is-still")).not.toBeNull();
});

test("URL state drops defaults and rejects unknown values", () => {
    expect(readState("?element=XX&stage=nope&grade=uh")).toEqual({
        element: "nd",
        stage: "mining",
        chain: false,
        grade: "uh",
    });
    expect(writeState("?ref=x", { element: "nd", stage: "magnet", chain: false, grade: "sh" })).toBe("?ref=x&stage=magnet");
});
