import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { act, cleanup, fireEvent, render, within } from "@testing-library/react";
import { SCORED_BRANDS, SDK_DIMENSIONS, sdkLeaderboard } from "../../src/sdk";
import { evidenceFor } from "../../src/sdk/evidence";
import { SdkBadge } from "../src/pages/sdk/SdkBadge";
import { Sdk } from "../src/pages/sdk/Sdk";
import { frontier } from "../src/pages/sdk/ValueScatter";

const setURL = (path: string) =>
    (window as unknown as { happyDOM: { setURL: (u: string) => void } }).happyDOM.setURL(`http://localhost${path}`);

afterEach(cleanup);

test("renders all seven views with one row per scored brand", () => {
    setURL("/sdk");
    const view = render(<Sdk />);
    const c = view.container;
    expect(view.getByRole("heading", { level: 1 }).textContent).toBe("Which actuators have the best SDK?");
    expect(c.querySelectorAll(".sdk-board li")).toHaveLength(SCORED_BRANDS.length);
    expect(c.querySelectorAll(".sdk-heat tbody tr")).toHaveLength(SCORED_BRANDS.length);
    expect(c.querySelectorAll(".sdk-cell")).toHaveLength(SCORED_BRANDS.length * SDK_DIMENSIONS.length);
    expect(c.querySelectorAll(".sdk-radar-shape")).toHaveLength(3);
    expect(c.querySelector(".sdk-scatter")).not.toBeNull();
    expect(c.querySelector(".sdk-timeline, .sdk-muted")).not.toBeNull();
    expect(c.querySelectorAll(".sdk-caps tbody tr")).toHaveLength(SCORED_BRANDS.length);
    expect(c.querySelector(".sdk-method")).not.toBeNull();
    expect(c.querySelectorAll(".sdk-cta")).toHaveLength(1);
});

test("a heatmap cell drills down to cited checks and linked posts, and lands in the URL", () => {
    setURL("/sdk");
    const view = render(<Sdk />);
    const c = view.container;
    const top = sdkLeaderboard()[0];
    if (!top) throw new Error("no brands");
    act(() => {
        fireEvent.click(view.getByRole("button", { name: new RegExp(`^${top.brand.name}, Docs and examples`) }));
    });
    const panel = c.querySelector(".sdk-panel");
    expect(panel?.getAttribute("data-brand")).toBe(top.brand.id);
    expect(panel?.querySelectorAll(".sdk-check").length).toBeGreaterThan(0);
    expect(panel?.querySelectorAll(".sc-ref a").length).toBeGreaterThan(0);
    expect(panel?.querySelectorAll(".sdk-ev a[href^='https://']")).toHaveLength(evidenceFor(top.brand.id, "docs").length);
    expect(window.location.hash).toBe(`#brand=${top.brand.id}&dim=docs`);
    act(() => { fireEvent.click(view.getByRole("button", { name: "Close evidence" })); });
    expect(c.querySelector(".sdk-panel")).toBeNull();
});

test("presets re-rank the leaderboard and write ?preset=", () => {
    setURL("/sdk");
    const view = render(<Sdk />);
    act(() => { fireEvent.click(within(view.getByRole("group", { name: "Reader preset" })).getByRole("button", { name: "ROS 2 shop" })); });
    expect(window.location.search).toBe("?preset=ros2");
    const names = [...view.container.querySelectorAll(".sdk-board .sdk-name")].map((n) => n.textContent);
    expect(names).toEqual(sdkLeaderboard("ros2").map((s) => s.brand.name));
});

test("compare mode holds at most four brands", () => {
    setURL("/sdk");
    const view = render(<Sdk />);
    const c = view.container;
    const adds = () => [...c.querySelectorAll<HTMLButtonElement>(".sdk-pick[aria-pressed='false']")];
    act(() => { adds()[0]?.click(); });
    expect(c.querySelectorAll(".sdk-radar-shape")).toHaveLength(4);
    expect(adds().every((b) => b.disabled)).toBe(true);
    act(() => { fireEvent.click(view.getByRole("button", { name: "Clear" })); });
    expect(c.querySelectorAll(".sdk-radar-shape")).toHaveLength(0);
});

test("SDK badge links an actuator to its brand and hides for reducers", () => {
    const badge = render(<SdkBadge actuatorId="odrive-s1" />).container.querySelector("a.sdk-badge");
    expect(badge?.getAttribute("href")).toBe("/sdk#brand=odrive");
    cleanup();
    expect(render(<SdkBadge actuatorId="nabtesco-rv-42n" />).container.innerHTML).toBe("");
});

test("frontier keeps brands nobody beats on both price and score", () => {
    expect(frontier([
        { id: "a", x: 5, y: 50 },
        { id: "b", x: 10, y: 80 },
        { id: "c", x: 12, y: 60 },
        { id: "d", x: 4, y: 30 },
    ])).toEqual(["d", "a", "b"]);
});
