import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { Sdk } from "../src/pages/sdk/Sdk";
import { readState, writeState } from "../src/pages/sdk/url-state";
import { leaderboard } from "../../src/sdk";

const setURL = (path: string) =>
    (window as unknown as { happyDOM: { setURL: (u: string) => void } }).happyDOM.setURL(`http://localhost${path}`);

afterEach(cleanup);

test("renders seven numbered views, presets and one call to action", () => {
    setURL("/sdk");
    const view = render(<Sdk />);
    const c = view.container;
    expect(view.getByRole("heading", { level: 1 }).textContent).toBe("Best actuator SDKs");
    expect([...c.querySelectorAll(".sdk-sec > h2")].map((h) => h.querySelector("span")?.textContent)).toEqual([
        "01", "02", "03", "04", "05", "06", "07",
    ]);
    expect(c.querySelectorAll(".sdk-presets button")).toHaveLength(5);
    expect(c.querySelectorAll(".sdk-board li")).toHaveLength(leaderboard().length);
    expect(c.querySelectorAll(".sdk-cta")).toHaveLength(1);
    expect(c.querySelector("details.sdk-method")).not.toBeNull();
});

test("a heatmap cell drills down to checks with evidence links", () => {
    setURL("/sdk");
    const view = render(<Sdk />);
    const c = view.container;
    act(() => {
        fireEvent.click(c.querySelector('[data-cell="mjbots:firmware"]') as Element);
    });
    const panel = c.querySelector(".sdk-cell");
    expect(panel?.textContent).toContain("Firmware source is public");
    expect(panel?.querySelector('a[href^="https://github.com/mjbots/moteus"]')).not.toBeNull();
    expect(window.location.search).toBe("?brand=mjbots&dim=firmware");
});

test("deep link sets preset and compare; presets reorder the board", () => {
    setURL("/sdk?preset=ros2&compare=odrive,mjbots");
    const view = render(<Sdk />);
    const c = view.container;
    expect(c.querySelector('.sdk-presets button[aria-pressed="true"]')?.textContent).toBe("ROS 2 shop");
    expect([...c.querySelectorAll(".sdk-tray li span")].map((s) => s.textContent)).toEqual(["ODrive", "mjbots"]);
    act(() => {
        fireEvent.click(view.getByRole("button", { name: "Balanced" }));
    });
    expect(window.location.search).toBe("?compare=odrive,mjbots");
});

test("url state round-trips and drops unknown values", () => {
    const brands = ["robotis", "mjbots", "odrive"];
    const s = readState("?preset=embedded&brand=mjbots&dim=protocol&compare=x,odrive", brands, ["robotis"]);
    expect(s).toEqual({ preset: "embedded", brand: "mjbots", dim: "protocol", compare: ["odrive"] });
    expect(writeState("?keep=1", s, ["robotis"])).toBe("?keep=1&preset=embedded&brand=mjbots&dim=protocol&compare=odrive");
    expect(readState("?preset=zzz&dim=docs", brands, ["robotis"])).toEqual({ preset: "balanced", brand: null, dim: null, compare: ["robotis"] });
});
