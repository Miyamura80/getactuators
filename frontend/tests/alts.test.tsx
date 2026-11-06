import "./happydom";
import { afterEach, beforeEach, expect, test } from "bun:test";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { ALT_TECHS } from "../../src/supply-chain/alts";
import { Alts } from "../src/pages/supply-chain/alts/Alts";
import { BASELINE_ID, layout, placeMilestones } from "../src/pages/supply-chain/alts/landscape-model";
import { readState, writeState } from "../src/pages/supply-chain/alts/url-state";
import { setWebGLSupport } from "../src/three/support";

const setURL = (path: string) =>
    (window as unknown as { happyDOM: { setURL: (u: string) => void } }).happyDOM.setURL(`http://localhost${path}`);

beforeEach(() => setWebGLSupport(false));

afterEach(() => {
    cleanup();
    setWebGLSupport(undefined);
});

test("url state keeps only the focused technology or the NdFeB baseline", () => {
    expect(readState("?tech=hasel")).toEqual({ tech: "hasel" });
    expect(readState("?tech=ndfeb")).toEqual({ tech: BASELINE_ID });
    expect(readState("?tech=steam")).toEqual({ tech: null });
    expect(writeState("", { tech: null })).toBe("");
    expect(writeState("?x=1&group=country", { tech: "cycloidal" })).toBe("?x=1&tech=cycloidal");
});

test("layout places every technology once, plus the NdFeB baseline, without overlaps", () => {
    const geo = layout();
    expect(geo.nodes.filter((n) => n.tech)).toHaveLength(ALT_TECHS.length);
    expect(geo.nodes.filter((n) => n.id === BASELINE_ID)).toHaveLength(1);
    for (const n of geo.nodes) {
        expect(n.x).toBeGreaterThan(0);
        expect(n.y).toBeLessThan(geo.plotBottom);
    }
    const keys = new Set(geo.nodes.map((n) => `${Math.round(n.x)}:${Math.round(n.y)}`));
    expect(keys.size).toBe(geo.nodes.length);
    // TRL 9 splits into family stacks, so no stack is taller than four.
    expect(geo.columns[8]?.sub).toBeGreaterThan(2);
    const { items } = placeMilestones(ALT_TECHS, 1000);
    expect(items).toHaveLength(ALT_TECHS.reduce((a, t) => a + t.milestones.length, 0));
});

test("opens on the landscape with every node, the ladder and the milestone strip", () => {
    setURL("/alts");
    const view = render(<Alts />);
    const c = view.container;
    expect(view.getByRole("heading", { level: 1 }).textContent).toBe("What could replace the rare-earth motor?");
    expect(c.querySelectorAll(".al-land [data-tech]")).toHaveLength(ALT_TECHS.length + 1);
    expect(c.querySelectorAll(".al-ladder [data-tech]")).toHaveLength(ALT_TECHS.length + 1);
    expect(c.querySelector(".al-strip .al-ms.is-announced")).not.toBeNull();
    expect(c.querySelector(".al-sp")).toBeNull();
    expect(c.querySelectorAll(".al-cta")).toHaveLength(1);
    expect(c.textContent).not.toContain(String.fromCharCode(0x2014));
});

test("deep link ?tech=hasel opens its spec card with gaps; close clears the URL", () => {
    setURL("/alts?tech=hasel");
    const view = render(<Alts />);
    const c = view.container;
    expect(c.querySelector(".al-sp h2")?.textContent).toBe("HASEL electrohydraulic muscle");
    expect(c.querySelector('figure.x3[aria-label^="HASEL pouch"]')).not.toBeNull();
    expect(c.querySelector('.al-land [data-tech="hasel"]')?.classList.contains("is-focus")).toBe(true);
    expect(c.querySelector(".al-sp-spec .is-gap")?.textContent).toContain("no public figure");
    expect(c.querySelector(".al-track .is-gap")).not.toBeNull();
    act(() => {
        fireEvent.click(view.getByRole("button", { name: "Close" }));
    });
    expect(c.querySelector(".al-sp")).toBeNull();
    expect(window.location.search).toBe("");
});

test("?tech=ndfeb opens the reference card and Escape closes it", () => {
    setURL("/alts?tech=ndfeb");
    const view = render(<Alts />);
    const c = view.container;
    expect(c.querySelector(".al-sp h2")?.textContent).toBe("NdFeB permanent magnet motor");
    act(() => {
        fireEvent.keyDown(window, { key: "Escape" });
    });
    expect(c.querySelector(".al-sp")).toBeNull();
});

test("clicking a node opens its card and a family toggle hides its nodes", () => {
    setURL("/alts");
    const view = render(<Alts />);
    const c = view.container;
    act(() => {
        fireEvent.click(c.querySelector('.al-land [data-tech="cycloidal"]') as Element);
    });
    expect(window.location.search).toBe("?tech=cycloidal");
    expect(c.querySelector(".al-sp h2")?.textContent).toBe("Cycloidal reducer");
    act(() => {
        fireEvent.click(view.getByRole("button", { name: /^Artificial muscles/ }));
    });
    expect(c.querySelector('.al-land [data-tech="hasel"]')).toBeNull();
    expect(c.querySelector('.al-ladder [data-tech="hasel"]')).toBeNull();
});
