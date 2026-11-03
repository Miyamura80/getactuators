import "./happydom";
import { afterEach, beforeEach, expect, test } from "bun:test";
import { act, cleanup, fireEvent, render, within } from "@testing-library/react";
import { MAGNET_CHAIN } from "../../src/supply-chain/processes";
import { Manufacturing } from "../src/pages/supply-chain/manufacturing/Manufacturing";
import { isTarget, readChain, writeChain } from "../src/pages/supply-chain/manufacturing/url-state";
import { readSelection, selectionHash } from "../src/lib/supply-chain-selection";
import { setWebGLSupport } from "../src/three/support";

const setURL = (path: string) =>
    (window as unknown as { happyDOM: { setURL: (u: string) => void } }).happyDOM.setURL(`http://localhost${path}`);

const realMatchMedia = window.matchMedia;

function narrowScreen(on: boolean) {
    window.matchMedia = ((query: string) => ({
        matches: on && query.includes("max-width"),
        media: query,
        addEventListener() {},
        removeEventListener() {},
    })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
    // No WebGL: every vignette shows its poster.
    setWebGLSupport(false);
    narrowScreen(false);
});

afterEach(() => {
    cleanup();
    setWebGLSupport(undefined);
    window.matchMedia = realMatchMedia;
});

test("opens on the stage overview: four clusters with their concentration", () => {
    setURL("/manufacturing");
    const view = render(<Manufacturing />);
    const c = view.container;
    expect(view.getByRole("heading", { level: 1 }).textContent).toBe("Manufacturing");
    expect(c.querySelector(".mf-map")?.getAttribute("data-detail")).toBe("clusters");
    expect(c.querySelectorAll(".mf-cluster")).toHaveLength(4);
    expect(c.querySelector(".mf-cluster-big")?.textContent).toContain("MINING");
    expect(c.textContent).toContain("MONOPOLIZED");
    expect(c.querySelector(".mf-minimap")).not.toBeNull();
    for (const name of ["Fit map", "Zoom in", "Zoom out"]) expect(view.getByRole("button", { name })).toBeTruthy();
    expect(view.getByRole("radio", { name: "Magnet" }).getAttribute("aria-checked")).toBe("true");
    expect(c.querySelector(".mf-card")).toBeNull();
});

test("deep link #step= zooms to steps and opens the step card with its poster", () => {
    setURL("/manufacturing#step=jet-milling");
    const view = render(<Manufacturing />);
    const c = view.container;
    expect(c.querySelector(".mf-map")?.getAttribute("data-detail")).toBe("steps");
    expect(c.querySelectorAll(".mf-node")).toHaveLength(MAGNET_CHAIN.steps.length + 1);
    expect(c.querySelector(".mf-node.is-focus")?.getAttribute("data-step")).toBe("jet-milling");
    const card = c.querySelector(".mf-card");
    expect(card?.getAttribute("data-step")).toBe("jet-milling");
    expect(card?.querySelector(".mf-numbers")?.textContent).toContain("2-5 µm");
    // One 3D figure on the page, and it is a poster (no live WebGL here).
    expect(c.querySelectorAll("figure.x3")).toHaveLength(1);
    expect(c.querySelector("figure.x3")?.getAttribute("data-mode")).toBe("poster");
    expect(c.querySelector("figure.x3 img")?.getAttribute("src")).toBe("/posters/jet-milling-loop.png");
    expect(card?.querySelector('a[href="/metals?element=nd"]')).not.toBeNull();
    expect(card?.textContent).toContain("Monopolized");
});

test("card navigation, keyboard moves and Escape keep the hash in step", () => {
    setURL("/manufacturing#step=jet-milling");
    const view = render(<Manufacturing />);
    const c = view.container;
    // The nav button names the next step.
    const next = [...c.querySelectorAll(".mf-card-nav button")].find((b) => b.textContent?.includes("Pressing in field"));
    act(() => { if (next) fireEvent.click(next); });
    expect(window.location.hash).toBe("#step=field-pressing");
    expect(c.querySelector(".mf-card")?.getAttribute("data-step")).toBe("field-pressing");
    // Arrow keys move along edges from a focused node.
    const node = c.querySelector('.mf-node[data-step="field-pressing"]') as SVGGElement;
    act(() => { fireEvent.keyDown(node, { key: "ArrowRight" }); });
    expect(window.location.hash).toBe("#step=sintering");
    act(() => { fireEvent.keyDown(c.querySelector('.mf-node[data-step="sintering"]') as Element, { key: "ArrowLeft" }); });
    expect(window.location.hash).toBe("#step=field-pressing");
    act(() => { window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })); });
    expect(c.querySelector(".mf-card")).toBeNull();
    expect(window.location.hash).toBe("");
});

test("a company in the card opens the company drawer", () => {
    setURL("/manufacturing#step=electrolysis");
    const view = render(<Manufacturing />);
    act(() => { fireEvent.click(within(view.container.querySelector(".mf-who") as HTMLElement).getByRole("button", { name: /MP Materials/ })); });
    const drawer = view.container.querySelector(".mk-drawer");
    expect(drawer?.getAttribute("aria-label")).toBe("MP Materials");
    expect(drawer?.querySelector('a[href="/api/v1/companies/mp-materials"]')).not.toBeNull();
});

test("the product node shows the rotor explode", () => {
    setURL("/manufacturing#step=product");
    const c = render(<Manufacturing />).container;
    expect(c.querySelector(".mf-card h3")?.textContent).toBe("Rotor segment");
    expect(c.querySelector("figure.x3 img")?.getAttribute("src")).toBe("/posters/magnet-rotor.png");
});

test("phones get stage cards; tapping a step opens a full-screen card", () => {
    narrowScreen(true);
    setURL("/manufacturing");
    const view = render(<Manufacturing />);
    const c = view.container;
    expect(c.querySelector(".mf-map")).toBeNull();
    expect(c.querySelectorAll(".mf-cluster-card")).toHaveLength(4);
    act(() => { fireEvent.click(c.querySelector('[data-step="sintering"]') as Element); });
    expect(c.querySelector(".mf-card.is-sheet")?.getAttribute("data-step")).toBe("sintering");
    expect(window.location.hash).toBe("#step=sintering");
});

test("url state: chain in the query, step in the hash", () => {
    expect(readChain("")).toBe("magnet");
    expect(readChain("?chain=nope")).toBe("magnet");
    expect(writeChain("?x=1", "magnet")).toBe("?x=1");
    expect(writeChain("", "precision")).toBe("?chain=precision");
    expect(isTarget("magnet", "jet-milling")).toBe(true);
    expect(isTarget("magnet", "product")).toBe(true);
    expect(isTarget("magnet", "welding")).toBe(false);
    expect(readSelection("#step=jet-milling", "step")).toBe("jet-milling");
    expect(readSelection("#step=Bad_Id", "step")).toBeNull();
    expect(readSelection("#node=rotor-magnet", "step")).toBeNull();
    expect(selectionHash("node", "rotor-magnet")).toBe("#node=rotor-magnet");
    expect(selectionHash("step", null)).toBe("");
});
