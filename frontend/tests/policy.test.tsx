import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { act, cleanup, fireEvent, render, within } from "@testing-library/react";
import { POLICY_MEASURES } from "../../src/supply-chain/policy";
import { Policy } from "../src/pages/supply-chain/policy/Policy";
import { readFilters, readMeasure, writeFilters } from "../src/pages/supply-chain/policy/url-state";

const setURL = (path: string) =>
    (window as unknown as { happyDOM: { setURL: (u: string) => void } }).happyDOM.setURL(`http://localhost${path}`);

afterEach(cleanup);

test("renders seven lanes, one marker per measure and a single call to action", () => {
    setURL("/policy");
    const view = render(<Policy />);
    const c = view.container;
    expect(view.getByRole("heading", { level: 1 }).textContent).toBe("Policy");
    expect(c.querySelectorAll(".pl-lane")).toHaveLength(7);
    expect(c.querySelectorAll(".pl-marker")).toHaveLength(POLICY_MEASURES.length);
    expect(c.querySelectorAll(".pl-cta")).toHaveLength(1);
    expect(c.querySelector(".pl-card")).toBeNull();
    expect(c.querySelector('a[href="/policy/feed.xml"]')).not.toBeNull();
});

test("deep link #measure= opens the card and draws only that bar", () => {
    setURL("/policy#measure=cn-mofcom-2025-57");
    const c = render(<Policy />).container;
    expect(c.querySelector(".pl-card")?.getAttribute("data-measure")).toBe("cn-mofcom-2025-57");
    expect(c.querySelector(".pl-scroll")?.classList.contains("has-focus")).toBe(true);
    const bars = [...c.querySelectorAll(".pl-bar")];
    expect(bars.length).toBeGreaterThan(0);
    expect(bars.every((b) => b.closest(".pl-item")?.getAttribute("data-measure") === "cn-mofcom-2025-57")).toBe(true);
    expect(c.querySelector('.pl-card a[href="/metals?event=controls-2025-10#prices"]')).not.toBeNull();
    // Escape closes it and clears the hash.
    act(() => { window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })); });
    expect(c.querySelector(".pl-card")).toBeNull();
    expect(window.location.hash).toBe("");
});

test("type and status filters narrow the markers and land in the URL", () => {
    setURL("/policy");
    const view = render(<Policy />);
    const c = view.container;
    act(() => { fireEvent.click(within(view.getByRole("group", { name: "Type" })).getByRole("button", { name: /Export control/ })); });
    const controls = POLICY_MEASURES.filter((m) => m.type === "export-control");
    expect(c.querySelectorAll(".pl-marker")).toHaveLength(controls.length);
    expect(window.location.search).toBe("?type=export-control");
    act(() => { fireEvent.click(within(view.getByRole("group", { name: "Status" })).getByRole("button", { name: /Suspended/ })); });
    expect(window.location.search).toBe("?type=export-control&status=suspended");
    expect(c.querySelectorAll(".pl-marker")).toHaveLength(controls.filter((m) => m.status === "suspended").length);
    act(() => { fireEvent.click(view.getByRole("button", { name: /clear/ })); });
    expect(c.querySelectorAll(".pl-marker")).toHaveLength(POLICY_MEASURES.length);
    expect(window.location.search).toBe("");
});

test("clicking a marker opens its card; the url state round-trips", () => {
    setURL("/policy");
    const c = render(<Policy />).container;
    const marker = c.querySelector('[data-measure="us-301-magnets-2026"] .pl-marker') as HTMLButtonElement;
    act(() => { fireEvent.click(marker); });
    expect(c.querySelector(".pl-card h3")?.textContent).toBe("Section 301: 25% on Chinese permanent magnets from 2026");
    expect(window.location.hash).toBe("#measure=us-301-magnets-2026");
    const f = readFilters("?type=tariff,subsidy&stage=magnet&status=in-force&x=1");
    expect(f).toEqual({ types: ["tariff", "subsidy"], stage: "magnet", statuses: ["in-force"] });
    expect(writeFilters("?x=1", f)).toBe("?x=1&type=tariff,subsidy&stage=magnet&status=in-force");
    expect(readFilters("?type=bogus").types).toHaveLength(4);
    expect(readMeasure("#measure=cn-mofcom-2025-18")).toBe("cn-mofcom-2025-18");
    expect(readMeasure("#sc-source-3")).toBeNull();
});
