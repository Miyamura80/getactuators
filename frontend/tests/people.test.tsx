import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { mountApp } from "../src/startup";
import { People } from "../src/pages/people/People";
import { DIRECTORY, ORGS } from "../../src/people";
import { orgLogoUrl } from "../../src/people/views";

afterEach(cleanup);

const setUrl = (url: string) => (window as unknown as { happyDOM: { setURL: (url: string) => void } }).happyDOM.setURL(url);

test("the app routes /people to the people network", async () => {
    setUrl("http://localhost:1/people");
    document.body.innerHTML = '<div id="root"></div>';
    const root = document.getElementById("root")!;
    let mounted: ReturnType<typeof mountApp> | undefined;
    try {
        await act(async () => {
            mounted = mountApp(root);
        });
        expect(root.querySelector("h1")?.textContent).toBe("Who shapes actuators and the magnet supply chain");
    } finally {
        await act(async () => {
            mounted?.unmount();
        });
        document.body.innerHTML = "";
    }
});

test("no card grid: the network is the index and a hidden list keeps every name", () => {
    setUrl("http://localhost:1/people");
    const view = render(<People />);
    expect(view.container.querySelectorAll("article.pc")).toHaveLength(0);
    expect(view.container.querySelector(".pp-panel")).toBeNull();
    expect(view.container.querySelectorAll(".pp-net a.pp-person")).toHaveLength(DIRECTORY.length);
    const hidden = [...view.container.querySelectorAll("nav.sr-only a")].map((a) => a.getAttribute("href"));
    expect(hidden).toEqual(DIRECTORY.map((p) => `?p=${p.id}`));
});

test("clicking a person opens the detail panel, sets ?p= and Escape closes it", () => {
    setUrl("http://localhost:1/people");
    const view = render(<People />);
    const node = view.container.querySelector('.pp-net a[href="?p=hugh-herr"]')!;
    fireEvent.click(node);
    const panel = view.container.querySelector(".pp-panel")!;
    expect(panel.getAttribute("aria-label")).toBe("Hugh Herr");
    expect(panel.querySelector("article.pc h3")?.textContent).toBe("Hugh Herr");
    expect(panel.querySelector(".pp-works a")).not.toBeNull();
    expect(window.location.search).toBe("?p=hugh-herr");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(view.container.querySelector(".pp-panel")).toBeNull();
    expect(window.location.search).toBe("");
});

test("?p= and old #id anchors deep-link to a person", () => {
    setUrl("http://localhost:1/people?p=masato-sagawa");
    let view = render(<People />);
    expect(view.container.querySelector(".pp-panel")?.getAttribute("aria-label")).toBe("Masato Sagawa");
    cleanup();
    setUrl("http://localhost:1/people#gill-pratt");
    view = render(<People />);
    expect(view.container.querySelector(".pp-panel")?.getAttribute("aria-label")).toBe("Gill Pratt");
    expect(window.location.search).toBe("?p=gill-pratt");
});

test("org nodes draw the org logo as an <image>, monogram otherwise; clicking lists its people", () => {
    setUrl("http://localhost:1/people");
    const view = render(<People />);
    // Unitree has a self-hosted mark; MIT resolves only through the logo
    // provider, which needs a token the tests do not set.
    const unitree = view.container.querySelector('.pp-net a[href="?org=unitree"]')!;
    expect(unitree.querySelector("image")?.getAttribute("href")).toBe(orgLogoUrl(ORGS.unitree)!);
    fireEvent.mouseEnter(unitree);
    expect(view.container.querySelector(".pp-tip img")?.getAttribute("src")).toBe(orgLogoUrl(ORGS.unitree)!);
    fireEvent.mouseLeave(unitree);
    const mit = view.container.querySelector('.pp-net a[href="?org=mit"]')!;
    expect(orgLogoUrl(ORGS.mit)).toBeNull();
    expect(mit.querySelector("image")).toBeNull();
    expect(mit.querySelector("text")?.textContent).toBe("M");
    fireEvent.click(mit);
    const chips = [...view.container.querySelectorAll(".pp-panel .pp-chip")];
    expect(chips.length).toBeGreaterThanOrEqual(5);
    fireEvent.click(chips.find((c) => c.textContent?.includes("Hugh Herr"))!);
    expect(view.container.querySelector(".pp-panel")?.getAttribute("aria-label")).toBe("Hugh Herr");
});

test("a logo that fails to load falls back to the monogram", () => {
    setUrl("http://localhost:1/people");
    const view = render(<People />);
    const unitree = view.container.querySelector('.pp-net a[href="?org=unitree"]')!;
    fireEvent.error(unitree.querySelector("image")!);
    expect(unitree.querySelector("image")).toBeNull();
    expect(unitree.querySelector("text")?.textContent).toBe("UR");
});

test("org logos come from the provider when a token is set", () => {
    expect(orgLogoUrl(ORGS.mit, 72, "pk_test1234")).toStartWith("https://img.logo.dev/mit.edu?");
});

test("modifier clicks keep the link default, so a deep link can open in a new tab", () => {
    setUrl("http://localhost:1/people");
    const view = render(<People />);
    const node = view.container.querySelector('.pp-net a[href="?p=hugh-herr"]')!;
    fireEvent.click(node, { ctrlKey: true });
    expect(view.container.querySelector(".pp-panel")).toBeNull();
});

test("with a domain selected, the country panel counts only that domain", () => {
    setUrl("http://localhost:1/people?country=US");
    const view = render(<People />);
    const all = view.container.querySelectorAll(".pp-panel .pp-chip").length;
    const magnets = [...view.container.querySelectorAll(".pp-filter button")].find((b) => b.textContent?.includes("REE and magnets"))!;
    fireEvent.click(magnets);
    const some = view.container.querySelectorAll(".pp-panel .pp-chip").length;
    expect(some).toBe(DIRECTORY.filter((p) => p.domain === "magnets" && ORGS[p.orgId].country === "US").length);
    expect(some).toBeLessThan(all);
});

test("the domain filter dims people outside it", () => {
    setUrl("http://localhost:1/people");
    const view = render(<People />);
    const magnets = [...view.container.querySelectorAll(".pp-filter button")].find((b) => b.textContent?.includes("REE and magnets"))!;
    fireEvent.click(magnets);
    const lit = view.container.querySelectorAll(".pp-net a.pp-person:not(.is-dim)");
    expect(lit).toHaveLength(DIRECTORY.filter((p) => p.domain === "magnets").length);
});
