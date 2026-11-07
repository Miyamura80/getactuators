import "./happydom";
import { afterEach, beforeEach, expect, test } from "bun:test";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { Manufacturing } from "../src/pages/supply-chain/manufacturing/Manufacturing";
import { isTarget, readChain } from "../src/pages/supply-chain/manufacturing/url-state";
import { setWebGLSupport } from "../src/three/support";

// /manufacturing?chain=precision: the four precision sub-chains side by side.

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
    setWebGLSupport(false);
    narrowScreen(false);
});

afterEach(() => {
    cleanup();
    setWebGLSupport(undefined);
    window.matchMedia = realMatchMedia;
});

test("?chain=precision opens four sub-chains, each feeding the product", () => {
    setURL("/manufacturing?chain=precision");
    const view = render(<Manufacturing />);
    const c = view.container;
    expect(view.getByRole("radio", { name: "Precision" }).getAttribute("aria-checked")).toBe("true");
    expect(c.querySelector(".tool-lede")?.textContent).toBe("How an actuator's precision parts are made, bar stock to tested part.");
    expect(c.querySelectorAll(".mf-cluster")).toHaveLength(4);
    expect(c.querySelectorAll(".mf-cluster-edge")).toHaveLength(4);
    expect(c.querySelector('.mf-node[data-step="product"]')?.getAttribute("aria-label")).toContain("Precision set");
    // The product is a tab stop on the overview, as the stages are.
    expect(c.querySelector('.mf-node[data-step="product"]')?.getAttribute("tabindex")).toBe("0");
    expect(c.textContent).toContain("78% (model)");
    expect(c.textContent).toContain("~40%");
    expect(c.textContent).toContain("STRAIN-WAVE GEAR");
    expect(c.textContent).toContain("CONCENTRATED");
    expect(view.getByRole("button", { name: /^Encoder: zoom in to its 7 steps$/ })).toBeTruthy();
});

test("a precision deep link opens the step card with its poster and makers", () => {
    setURL("/manufacturing?chain=precision#step=roller-thread-grinding");
    const view = render(<Manufacturing />);
    const c = view.container;
    const card = c.querySelector(".mf-card");
    expect(card?.getAttribute("data-step")).toBe("roller-thread-grinding");
    expect(card?.querySelector("figure.x3 img")?.getAttribute("src")).toBe("/posters/roller-thread-grinding-loop.png");
    expect(card?.textContent).toContain("Rollvis");
    expect(card?.textContent).toContain("Model");
    // The last step of a sub-chain leads to the product.
    setURL("/manufacturing?chain=precision#step=encoder-sealing");
    cleanup();
    const end = render(<Manufacturing />).container;
    expect([...end.querySelectorAll(".mf-card-nav button")].some((b) => b.textContent?.includes("Precision set"))).toBe(true);
});

test("the precision product shows the joint explode", () => {
    setURL("/manufacturing?chain=precision#step=product");
    const c = render(<Manufacturing />).container;
    expect(c.querySelector(".mf-card h3")?.textContent).toBe("Precision set");
    expect(c.querySelector("figure.x3 img")?.getAttribute("src")).toBe("/posters/precision-joint.png");
});

test("switching chains drops the focused step and writes the query", () => {
    setURL("/manufacturing#step=jet-milling");
    const view = render(<Manufacturing />);
    act(() => { fireEvent.click(view.getByRole("radio", { name: "Precision" })); });
    expect(window.location.search).toBe("?chain=precision");
    expect(view.container.querySelector(".mf-card")).toBeNull();
    expect(readChain("?chain=precision")).toBe("precision");
    expect(isTarget("precision", "flexspline-forming")).toBe(true);
    expect(isTarget("precision", "jet-milling")).toBe(false);
});

test("phones get a card per sub-chain plus the product", () => {
    narrowScreen(true);
    setURL("/manufacturing?chain=precision");
    const c = render(<Manufacturing />).container;
    expect(c.querySelectorAll(".mf-cluster-card")).toHaveLength(5);
    expect(c.querySelector(".mf-cluster-card.is-product [data-step=\"product\"]")?.textContent).toContain("Precision set");
});
