import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { Patents } from "../src/pages/market/patents/Patents";
import { readState, writeState } from "../src/pages/market/patents/url-state";
import { LANDSCAPE, isCollected } from "../../src/patents/landscape";
import { FIXTURE } from "../../tests/patents/fixture";

const setURL = (path: string) =>
    (window as unknown as { happyDOM: { setURL: (u: string) => void } }).happyDOM.setURL(`http://localhost${path}`);

afterEach(cleanup);

test("without a snapshot only the scope shows, and no counts", () => {
    setURL("/patents");
    const view = render(<Patents snapshot={{ ...LANDSCAPE, collectedAt: null, technologies: [] }} />);
    const c = view.container;
    expect(view.getByRole("heading", { level: 1 }).textContent).toBe("Actuator patent landscape");
    expect([...c.querySelectorAll(".pt-sec > h2")].map((h) => h.textContent)).toEqual(["01What is counted"]);
    expect(c.querySelectorAll(".pt-chip")).toHaveLength(9);
    expect(c.querySelectorAll(".pt-chip b")).toHaveLength(0);
    expect(c.querySelector(".pt-empty")?.textContent).toContain("No counts yet");
    expect(c.querySelectorAll(".pt-cta")).toHaveLength(1);
});

test("the committed snapshot renders without errors", () => {
    setURL("/patents");
    const view = render(<Patents />);
    expect(view.container.querySelector(".pt-empty") === null).toBe(isCollected(LANDSCAPE));
});

test("with data: stream with lag shading, map, leaderboard and families", () => {
    setURL("/patents?tech=strain-wave");
    const view = render(<Patents snapshot={FIXTURE} />);
    const c = view.container;
    expect([...c.querySelectorAll(".pt-sec > h2")].map((h) => h.textContent)).toEqual([
        "01What is counted",
        "02Filings per year",
        "03Where the filers are",
        "04Who files most",
        "05Recent families",
    ]);
    expect(c.querySelector('.pt-chip[data-tech="strain-wave"]')?.getAttribute("aria-pressed")).toBe("true");
    expect(c.querySelector('.pt-chip[data-tech="strain-wave"] b')?.textContent).toBe("40");
    expect(c.querySelector(".pt-lag")?.getAttribute("data-from")).toBe("2025");
    expect([...c.querySelectorAll(".pt-area")].map((p) => p.getAttribute("data-key"))).toEqual(["US", "JP", "CN", "DE"]);
    expect(c.querySelector('.pt-bubble[data-key="harmonic-drive-systems"]')).not.toBeNull();
    expect(c.querySelector('.pt-bubble[data-key="acme-gears"]')?.getAttribute("class")).toContain("is-approx");
    const first = c.querySelector(".pt-board tbody tr");
    expect(first?.getAttribute("data-key")).toBe("harmonic-drive-systems");
    expect(first?.querySelector(".pt-reg")?.getAttribute("data-company")).toBe("harmonic-drive-systems");
    expect(c.querySelector(".pt-top5")?.textContent).toBe("Top 5 hold 100%");
    expect(c.querySelectorAll(".pt-families tbody tr")).toHaveLength(25);
    expect(c.querySelector(".pt-families a")?.getAttribute("href")).toMatch(/^https:\/\/patents\.google\.com\/patent\//);
});

test("controls write the URL", () => {
    setURL("/patents?tech=strain-wave");
    const view = render(<Patents snapshot={FIXTURE} />);
    const c = view.container;
    act(() => {
        fireEvent.click(view.getByRole("button", { name: "By technology" }));
    });
    expect(window.location.search).toBe("?tech=strain-wave&stack=technology");
    expect([...c.querySelectorAll(".pt-area")].map((p) => p.getAttribute("data-key"))).toEqual([
        "robot-joints",
        "strain-wave",
        "ndfeb",
    ]);
    // happy-dom lacks `oninput`, so React's input polyfill reads on keyup.
    act(() => {
        const input = c.querySelector(".pt-search") as HTMLInputElement;
        fireEvent.focusIn(input);
        fireEvent.change(input, { target: { value: "acme" } });
        fireEvent.keyUp(input);
    });
    expect(c.querySelectorAll(".pt-families tbody tr")).toHaveLength(5);
    expect(window.location.search).toBe("?tech=strain-wave&stack=technology&q=acme");
    act(() => {
        fireEvent.click(c.querySelector('.pt-chip[data-tech="ndfeb"]') as HTMLButtonElement);
    });
    expect(window.location.search).toBe("?tech=ndfeb&stack=technology");
    expect(c.querySelector(".pt-board")).toBeNull();
});

test("url state round-trips and ignores unknown values", () => {
    expect(readState("?tech=warp&stack=nope")).toEqual({ tech: "robot-joints", stack: "country", q: "" });
    expect(writeState("?utm=1", { tech: "ndfeb", stack: "country", q: " tdk " })).toBe("?utm=1&tech=ndfeb&q=tdk");
});
