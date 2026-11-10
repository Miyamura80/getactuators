import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { mountApp } from "../src/startup";
import { PRICE_VIEWS, Prices } from "../src/pages/prices/Prices";
import { PriceSparkline } from "../src/components/prices/PriceSparkline";
import { ExplodedView } from "../src/pages/ExplodedView";
import { actuatorsWithHistory, classTrends, historyFor, metalsOverlay } from "../../src/prices";

afterEach(cleanup);

function setUrl(url: string) {
    (window as unknown as { happyDOM: { setURL: (url: string) => void } }).happyDOM.setURL(url);
}

const button = (root: HTMLElement, text: string) =>
    [...root.querySelectorAll(".pr-tabs button")].find((b) => b.textContent === text) as HTMLButtonElement;

test("the app routes /prices to the prices page", async () => {
    setUrl("http://localhost:1/prices");
    document.body.innerHTML = '<div id="root"></div>';
    const root = document.getElementById("root")!;
    let mounted: ReturnType<typeof mountApp> | undefined;
    try {
        await act(async () => {
            mounted = mountApp(root);
        });
        expect(root.querySelector("h1")?.textContent).toBe("How actuator prices move");
    } finally {
        await act(async () => {
            mounted?.unmount();
        });
        document.body.innerHTML = "";
    }
});

test("opens on the class trend with a legend entry and fit text per class", () => {
    setUrl("http://localhost:1/prices");
    const view = render(<Prices />);
    expect(view.container.querySelectorAll(".pr-tabs button")).toHaveLength(PRICE_VIEWS.length);
    expect(view.container.querySelector("#pr-trend-title")).toBeTruthy();
    const trends = classTrends();
    const legend = view.container.querySelectorAll(".tr-legend button");
    expect(legend).toHaveLength(trends.length);
    for (const [i, t] of trends.entries()) {
        const text = legend[i]?.textContent ?? "";
        expect(text).toContain(t.label);
        expect(text).toContain(t.fit ? "R²" : "no fit yet");
    }
    expect(view.container.querySelectorAll(".pr-fit-line").length).toBe(trends.filter((t) => t.fit).length);
    // Legend buttons highlight one class.
    fireEvent.click(legend[0] as HTMLElement);
    expect(legend[0]?.getAttribute("aria-pressed")).toBe("true");
    expect(view.container.querySelectorAll(".tr-series.is-dim").length).toBe(trends.length - 1);
});

test("each view renders and is recorded in the URL", () => {
    setUrl("http://localhost:1/prices");
    const view = render(<Prices />);
    fireEvent.click(button(view.container, "Country & brand"));
    expect(window.location.search).toBe("?view=compare");
    expect(view.container.querySelectorAll(".pr-box-label").length).toBeGreaterThan(2);
    const brand = [...view.container.querySelectorAll(".pr-controls button")].find((b) => b.textContent === "Brand") as HTMLElement;
    fireEvent.click(brand);
    expect(view.container.querySelector("#pr-compare-title")?.textContent).toContain("by brand");

    fireEvent.click(button(view.container, "vs NdPr"));
    expect(window.location.search).toBe("?view=metals");
    expect(view.container.querySelector(".pr-caution")?.textContent).toContain("Correlation is not causation");
    expect(view.container.querySelectorAll(".pr-lags tbody tr")).toHaveLength(metalsOverlay().lags.length);

    fireEvent.click(button(view.container, "One actuator"));
    expect(window.location.search).toBe(`?actuator=${actuatorsWithHistory()[0]}`);

    fireEvent.click(button(view.container, "$/N·m trend"));
    expect(window.location.search).toBe("");
});

test("?actuator=<id> opens that actuator's step chart and data table", () => {
    setUrl("http://localhost:1/prices?actuator=dynamixel-xm430-w350-t");
    const view = render(<Prices />);
    const select = view.container.querySelector(".pr-pick select") as HTMLSelectElement;
    expect(select.value).toBe("dynamixel-xm430-w350-t");
    const rows = view.container.querySelectorAll(".tr-data tbody tr");
    expect(rows).toHaveLength(historyFor("dynamixel-xm430-w350-t").length);
    expect(rows[0]?.textContent).toContain("wayback");
    expect(view.container.querySelectorAll(".pr-step-dot")).toHaveLength(rows.length);
    fireEvent.change(select, { target: { value: "robstride-04" } });
    expect(window.location.search).toBe("?actuator=robstride-04");
    expect(view.container.querySelectorAll(".tr-data tbody tr")).toHaveLength(historyFor("robstride-04").length);
});

test("an actuator without a price says so", () => {
    setUrl("http://localhost:1/prices?actuator=odrive-s1");
    const priced = historyFor("odrive-s1").length > 0;
    const view = render(<Prices />);
    expect(Boolean(view.container.querySelector(".pr-stats"))).toBe(priced);
});

test("actuator pages show a sparkline linking to the history", () => {
    setUrl("http://localhost:1/actuators/dynamixel-xm430-w350-t");
    const view = render(<ExplodedView id="dynamixel-xm430-w350-t" />);
    const link = view.container.querySelector(".xp-spec .pr-spark-link") as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("/prices?actuator=dynamixel-xm430-w350-t");
    expect(link.querySelector("svg path")).toBeTruthy();
    expect(link.getAttribute("aria-label")).toContain("Price history");
    // One price: a link, no line. No price: nothing.
    const one = render(<PriceSparkline id="cubemars-ak10-9" />);
    expect(one.container.querySelector("a")).toBeTruthy();
    expect(one.container.querySelector("svg")).toBeNull();
    const none = render(<PriceSparkline id="no-such-actuator" />);
    expect(none.container.innerHTML).toBe("");
});
