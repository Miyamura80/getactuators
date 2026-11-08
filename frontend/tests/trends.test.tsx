import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { mountApp } from "../src/startup";
import { Trends } from "../src/pages/trends/Trends";
import { headline } from "../src/pages/trends/headline";
import { TREND_CHARTS, TREND_SECTIONS, getTrendChart } from "../../src/trends";

afterEach(cleanup);

function setUrl(url: string) {
    (window as unknown as { happyDOM: { setURL: (url: string) => void } }).happyDOM.setURL(url);
}

const panel = (root: HTMLElement) => root.querySelector("#tr-panel") as HTMLElement;

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

test("every chart has a thumbnail with its headline number and a sparkline", () => {
    setUrl("http://localhost:1/trends");
    const view = render(<Trends />);
    expect(view.container.querySelectorAll(".tr-list section")).toHaveLength(TREND_SECTIONS.length);
    const thumbs = view.container.querySelectorAll(".tr-thumb");
    expect(thumbs).toHaveLength(TREND_CHARTS.length);
    for (const c of TREND_CHARTS) {
        const t = view.container.querySelector(`.tr-thumb[data-chart="${c.id}"]`) as HTMLElement;
        expect(t.querySelector(".tr-thumb-title")?.textContent).toBe(c.title);
        expect(t.querySelector(".tr-thumb-num b")?.textContent).toBe(headline(c).value);
        expect(t.querySelector("svg.tr-spark")).toBeTruthy();
    }
    // The panel opens on the first chart, and only one chart is drawn in full.
    expect(view.container.querySelectorAll(".tr-figure")).toHaveLength(1);
    expect(panel(view.container).querySelector("h3")?.textContent).toBe(TREND_CHARTS[0]!.title);
    expect(thumbs[0]?.getAttribute("aria-pressed")).toBe("true");
});

test("selecting a thumbnail shows that chart in the panel and records it in the URL", () => {
    setUrl("http://localhost:1/trends");
    const view = render(<Trends />);
    const thumb = view.container.querySelector('.tr-thumb[data-chart="price-of-ai"]') as HTMLElement;
    fireEvent.click(thumb);
    expect(thumb.getAttribute("aria-pressed")).toBe("true");
    expect(panel(view.container).querySelector("h3")?.textContent).toBe(getTrendChart("price-of-ai")?.title);
    expect(panel(view.container).querySelector('a[href="https://epoch.ai/publications/the-plunging-price-of-thought"]')).toBeTruthy();
    expect(window.location.search).toBe("?chart=price-of-ai");
});

test("?chart= and #chart deep links open that chart", () => {
    setUrl("http://localhost:1/trends?chart=battery-runtime");
    const a = render(<Trends />);
    expect(panel(a.container).querySelector("h3")?.textContent).toBe("Humanoid battery runtime");
    cleanup();
    setUrl("http://localhost:1/trends#rated-life");
    const b = render(<Trends />);
    expect(panel(b.container).querySelector("h3")?.textContent).toBe("Rated life of strain-wave gears");
    expect(panel(b.container).querySelector(".tr-sparse")).toBeTruthy();
    cleanup();
    setUrl("http://localhost:1/trends?chart=nope");
    const c = render(<Trends />);
    expect(panel(c.container).querySelector("h3")?.textContent).toBe(TREND_CHARTS[0]!.title);
});

test("notes, licence and sources sit behind toggles; the figcaption stays last", () => {
    setUrl("http://localhost:1/trends?chart=actuator-prices");
    const view = render(<Trends />);
    const fig = panel(view.container).querySelector(".tr-figure") as HTMLElement;
    expect(fig.lastElementChild?.tagName).toBe("FIGCAPTION");
    const notes = fig.querySelector("figcaption details") as HTMLDetailsElement;
    expect(notes.querySelector("summary")?.textContent).toBe("Notes and licence");
    expect(notes.open).toBe(false);
    expect(notes.querySelector(".tr-licence")?.textContent?.length).toBeGreaterThan(0);
    expect(notes.querySelector(".tr-series-note")?.textContent).toContain("CubeMars AK80-9");
    const data = fig.querySelector("details.tr-data") as HTMLDetailsElement;
    expect(data.open).toBe(false);
    expect(data.querySelectorAll(".tr-sources li").length).toBeGreaterThan(0);
});

test("the price chart switches to $/N·m and the legend highlights a series", () => {
    setUrl("http://localhost:1/trends?chart=actuator-prices");
    const view = render(<Trends />);
    const prices = panel(view.container);
    const perNm = Array.from(prices.querySelectorAll(".tr-toggle button")).find((b) => b.textContent === "$/N·m") as HTMLElement;
    fireEvent.click(perNm);
    expect(perNm.getAttribute("aria-pressed")).toBe("true");
    expect(prices.querySelector("svg.tr-svg")?.getAttribute("aria-label")).toContain("USD per N·m");
    const first = prices.querySelector(".tr-legend button") as HTMLElement;
    fireEvent.click(first);
    expect(first.getAttribute("aria-pressed")).toBe("true");
    expect(prices.querySelectorAll(".tr-series.is-dim").length).toBeGreaterThan(0);
});
