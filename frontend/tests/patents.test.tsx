import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { mountApp } from "../src/startup";
import { Patents, SCOPES } from "../src/pages/patents/Patents";
import { BAND_COLORS, bandsFor, COMPLETE_THROUGH } from "../src/pages/patents/Stream";
import { hqBubbles } from "../src/pages/patents/AssigneeMap";
import { LANDSCAPE, TECHNOLOGIES, familiesFor, leaderboard } from "../../src/patents";

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
