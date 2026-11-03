import "./happydom";
import { afterEach, beforeEach, expect, test } from "bun:test";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { ALT_TECHS, MARKET_SLICES } from "../../src/supply-chain/alts";
import { Alts } from "../src/pages/supply-chain/alts/Alts";
import { growthPosition } from "../src/pages/supply-chain/alts/Treemap";
import { readState, writeState } from "../src/pages/supply-chain/alts/url-state";
import { setWebGLSupport } from "../src/three/support";

const setURL = (path: string) =>
    (window as unknown as { happyDOM: { setURL: (u: string) => void } }).happyDOM.setURL(`http://localhost${path}`);

beforeEach(() => setWebGLSupport(false));

afterEach(() => {
    cleanup();
    setWebGLSupport(undefined);
});

test("url state keeps grouping and technology, defaults out of the URL", () => {
    expect(readState("?group=country&tech=hasel")).toEqual({ group: "country", tech: "hasel" });
    expect(readState("?group=nope&tech=steam")).toEqual({ group: "family", tech: null });
    expect(writeState("", { group: "family", tech: null })).toBe("");
    expect(writeState("?x=1", { group: "end-market", tech: "cycloidal" })).toBe("?x=1&group=end-market&tech=cycloidal");
});

test("opens with all five views, one tile per market grouped by family", () => {
    setURL("/alts");
    const view = render(<Alts />);
    const c = view.container;
    expect(view.getByRole("heading", { level: 1 }).textContent).toBe("Alternatives");
    for (const id of ["market", "performance", "readiness", "deployments", "under-the-hood"])
        expect(c.querySelector(`section#${id}`)).not.toBeNull();
    expect(c.querySelectorAll(".al-tile")).toHaveLength(MARKET_SLICES.length);
    expect(view.getByRole("radio", { name: "Family" }).getAttribute("aria-checked")).toBe("true");
    expect(c.querySelectorAll(".al-rd-row")).toHaveLength(ALT_TECHS.length);
    expect(c.querySelector(".al-ms.is-announced")).not.toBeNull();
    expect(c.querySelector(".al-card.is-retired")).not.toBeNull();
    expect(c.textContent).not.toContain(String.fromCharCode(0x2014));
});

test("deep link ?group=country&tech=hasel splits tiles and selects HASEL everywhere", () => {
    setURL("/alts?group=country&tech=hasel");
    const view = render(<Alts />);
    const c = view.container;
    expect(c.querySelector(".al-tm-stage")?.getAttribute("data-group")).toBe("country");
    expect(c.querySelectorAll(".al-tile.is-modeled").length).toBeGreaterThan(0);
    expect(c.querySelector(".al-tile.is-on")?.getAttribute("aria-label")).toContain("Artificial muscles");
    expect(c.querySelector(".al-rd-row.is-on .al-rd-name")?.textContent).toBe("HASEL electrohydraulic muscle");
    expect(c.querySelector(".al-uh-side h3")?.textContent).toBe("HASEL electrohydraulic muscle");
    expect(c.querySelector('figure.x3[aria-label^="HASEL pouch"]')).not.toBeNull();
});

test("regrouping keeps the same tiles and writes the URL", () => {
    setURL("/alts");
    const view = render(<Alts />);
    const before = view.container.querySelectorAll(".al-tile").length;
    act(() => {
        fireEvent.click(view.getByRole("radio", { name: "End market" }));
    });
    expect(window.location.search).toBe("?group=end-market");
    expect(view.container.querySelectorAll(".al-tile")).toHaveLength(before);
    expect(view.container.querySelector(".al-tm-frame")?.textContent).toBe("Industrial machines and arms");
    act(() => {
        fireEvent.click(view.getByRole("button", { name: /^Cycloidal reducers:/ }));
    });
    expect(window.location.search).toBe("?group=end-market&tech=cycloidal");
    expect(view.container.querySelector(".al-uh-side h3")?.textContent).toBe("Cycloidal reducer");
});

test("growth colour diverges around the median", () => {
    const sorted = MARKET_SLICES.map((s) => s.cagr.value).sort((a, b) => a - b);
    expect(growthPosition(sorted[0] ?? 0)).toBe(-1);
    expect(growthPosition(sorted.at(-1) ?? 0)).toBe(1);
});
