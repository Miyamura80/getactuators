import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { Prices } from "../src/pages/prices/Prices";
import { HISTORY_IDS, readActuator } from "../src/pages/prices/shared";
import { PriceSparkline } from "../src/pages/prices/Sparkline";
import { ExplodedView } from "../src/pages/ExplodedView";

const setURL = (path: string) =>
    (window as unknown as { happyDOM: { setURL: (u: string) => void } }).happyDOM.setURL(`http://localhost${path}`);

afterEach(cleanup);

test("renders the four views with coverage, fits and the NdPr note", () => {
    setURL("/prices");
    const view = render(<Prices />);
    const c = view.container;
    expect(view.getByRole("heading", { level: 1 }).textContent).toBe("Actuator prices");
    expect([...c.querySelectorAll(".pr-sec > h2")].map((h) => h.textContent)).toEqual([
        "01$/Nm over time",
        "02Where it is cheapest",
        "03One actuator",
        "04Price vs metals",
    ]);
    expect(c.querySelectorAll(".pr-dot").length).toBeGreaterThan(40);
    // Six classes in the fit table; none fitted on six weeks of history.
    expect(c.querySelectorAll(".pr-fits:not(.pr-corr) tr")).toHaveLength(6);
    expect(c.querySelector(".pr-fits")?.textContent).toContain("Not fitted");
    expect(c.querySelectorAll(".pr-box").length).toBeGreaterThan(1);
    expect(c.textContent).toContain("Correlation is not causation");
});

test("class toggles hide points; country/brand switch regroups", () => {
    setURL("/prices");
    const view = render(<Prices />);
    const c = view.container;
    const before = c.querySelectorAll(".pr-dot[data-class]").length;
    act(() => {
        fireEvent.click(view.getByRole("button", { name: "Smart Servo" }));
    });
    expect(c.querySelectorAll('.pr-dot[data-class="smart_servo"]')).toHaveLength(0);
    expect(c.querySelectorAll(".pr-dot[data-class]").length).toBeLessThan(before);
    act(() => {
        fireEvent.click(view.getByRole("button", { name: "Brand" }));
    });
    expect(c.querySelector('.pr-box[data-group="RobStride"]')).not.toBeNull();
});

test("?actuator= deep links the history and picking writes the URL", () => {
    setURL("/prices?actuator=robstride-02");
    expect(readActuator(window.location.search)).toBe("robstride-02");
    expect(readActuator("?actuator=nope")).toBe(HISTORY_IDS[0] ?? "");
    const view = render(<Prices />);
    const select = view.container.querySelector<HTMLSelectElement>(".pr-pick select");
    expect(select?.value).toBe("robstride-02");
    expect(view.container.querySelector(".pr-latest")?.textContent).toContain("$160.99");
    act(() => {
        if (select) fireEvent.change(select, { target: { value: "robstride-04" } });
    });
    expect(window.location.search).toBe("?actuator=robstride-04");
    expect(view.container.querySelector(".pr-latest")?.textContent).toContain("$255");
});

test("sparkline on catalog pages links to the full chart, absent without history", () => {
    setURL("/actuators/robstride-02");
    const view = render(<ExplodedView id="robstride-02" />);
    const link = view.container.querySelector<HTMLAnchorElement>("a.pr-spark");
    expect(link?.getAttribute("href")).toBe("/prices?actuator=robstride-02#history");
    expect(link?.textContent).toContain("Price history since 2026-09-23");
    cleanup();
    expect(render(<PriceSparkline id="nabtesco-rv-42n" />).container.innerHTML).toBe("");
});
