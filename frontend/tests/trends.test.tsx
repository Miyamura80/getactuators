import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { mountApp } from "../src/startup";
import { Trends } from "../src/pages/trends/Trends";
import { TREND_CHARTS, TREND_SECTIONS } from "../../src/trends";

afterEach(cleanup);

function setUrl(url: string) {
    (window as unknown as { happyDOM: { setURL: (url: string) => void } }).happyDOM.setURL(url);
}

test("the app routes /trends to the trends page", async () => {
    setUrl("http://localhost:1/trends");
    document.body.innerHTML = '<div id="root"></div>';
    const root = document.getElementById("root")!;
    let mounted: ReturnType<typeof mountApp> | undefined;
    try {
        await act(async () => {
            mounted = mountApp(root);
        });
        expect(root.querySelector("h1")?.textContent).toBe("What changed, and how fast");
    } finally {
        await act(async () => {
            mounted?.unmount();
        });
        document.body.innerHTML = "";
    }
});

test("every chart renders an SVG with notes, licence and its sources", () => {
    setUrl("http://localhost:1/trends");
    const view = render(<Trends />);
    expect(view.container.querySelectorAll(".tr-section")).toHaveLength(TREND_SECTIONS.length);
    const figures = view.container.querySelectorAll(".tr-figure");
    expect(figures).toHaveLength(TREND_CHARTS.length);
    for (const f of figures) {
        expect(f.querySelector("svg.tr-svg")).toBeTruthy();
        expect(f.querySelector(".tr-licence")?.textContent?.length).toBeGreaterThan(0);
        expect(f.querySelectorAll(".tr-sources li").length).toBeGreaterThan(0);
    }
    expect(view.container.querySelectorAll(".tr-sparse").length).toBe(TREND_CHARTS.filter((c) => c.sparse).length);
    for (const f of figures) expect(f.lastElementChild?.tagName).toBe("FIGCAPTION");
    expect(view.container.querySelector("#actuator-prices .tr-series-note")?.textContent).toContain("CubeMars AK80-9");
    const epoch = view.container.querySelector("#price-of-ai");
    expect(epoch?.querySelector('a[href="https://epoch.ai/publications/the-plunging-price-of-thought"]')).toBeTruthy();
});

test("the price chart switches to $/N·m and the legend highlights a series", () => {
    setUrl("http://localhost:1/trends");
    const view = render(<Trends />);
    const prices = view.container.querySelector("#actuator-prices") as HTMLElement;
    const perNm = Array.from(prices.querySelectorAll(".tr-toggle button")).find((b) => b.textContent === "$/N·m") as HTMLElement;
    fireEvent.click(perNm);
    expect(perNm.getAttribute("aria-pressed")).toBe("true");
    expect(prices.querySelector("svg")?.getAttribute("aria-label")).toContain("USD per N·m");
    const first = prices.querySelector(".tr-legend button") as HTMLElement;
    fireEvent.click(first);
    expect(first.getAttribute("aria-pressed")).toBe("true");
    expect(prices.querySelectorAll(".tr-series.is-dim").length).toBeGreaterThan(0);
});
