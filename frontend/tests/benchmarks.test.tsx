import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { Benchmarks } from "../src/pages/benchmarks/Benchmarks";
import { Compare } from "../src/pages/Compare";
import { MeasuredPanel } from "../src/components/benchmarks/BenchmarkViews";
import { BENCHMARK_RUNS } from "../../src/benchmarks";

const setURL = (path: string) =>
    (window as unknown as { happyDOM: { setURL: (u: string) => void } }).happyDOM.setURL(`http://localhost${path}`);

afterEach(cleanup);

test("renders the five sections, one CTA and an origin badge per run", () => {
    setURL("/benchmarks");
    const view = render(<Benchmarks />);
    const c = view.container;
    expect(view.getByRole("heading", { level: 1 }).textContent).toBe("Actuator benchmarks");
    expect([...c.querySelectorAll(".bm-sec > h2")].map((h) => h.textContent)).toEqual([
        "01Datasheet vs measured",
        "02Torque-speed",
        "03Thermal derating",
        "04Measured leaderboard",
        "05All runs",
    ]);
    expect(c.querySelectorAll(".bm-cta")).toHaveLength(1);
    expect(c.querySelectorAll(".bm-runs .bm-origin")).toHaveLength(BENCHMARK_RUNS.length);
    // Every run carries an independence badge with its evidence.
    const badges = [...c.querySelectorAll<HTMLElement>(".bm-runs .bm-indep")];
    expect(badges).toHaveLength(BENCHMARK_RUNS.length);
    expect(badges.every((b) => (b.getAttribute("title") ?? "").length > 0)).toBe(true);
    // Datasheet vs measured: a badge per row; only independent runs get a verdict.
    const rows = [...c.querySelectorAll("#datasheet-vs-measured .bm-dvm-row")];
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
        const ind = row.querySelector(".bm-indep")?.getAttribute("data-independence");
        const verdict = row.querySelector(".bm-delta")?.getAttribute("data-verdict");
        if (ind === "independent") expect(verdict).not.toBe("none");
        else expect(verdict).toBe("none");
    }
    const sts = c.querySelector('.bm-dvm-row:has(.bm-indep[data-independence="vendor-affiliated"]) .bm-verdict');
    expect(sts?.textContent).toBe("Affiliated test");
    expect(c.querySelector('.bm-dvm-row:has(.bm-indep[data-independence="vendor"]) .bm-verdict')?.textContent).toBe("Maker-reported");
    expect(c.querySelector('.bm-delta[data-verdict="beats"]')?.textContent).toContain("Backlash");
    expect(c.textContent).not.toMatch(/over-promis/i);
    // Leaderboard: qdd100 is the only continuous hold.
    expect([...c.querySelectorAll(".bm-board li a")].map((a) => a.textContent)).toEqual(["qdd100 beta 3"]);
    // Thermal chart: one series per thermal run.
    expect(c.querySelectorAll('#thermal .bm-series')).toHaveLength(2);
});

test("torque-speed overlay toggles actuators", () => {
    setURL("/benchmarks");
    const view = render(<Benchmarks />);
    const c = view.container;
    const buttons = [...c.querySelectorAll<HTMLButtonElement>(".bm-picks button")];
    expect(buttons.length).toBeGreaterThan(0);
    const before = c.querySelectorAll("#torque-speed .bm-series, #torque-speed .bm-stall li").length;
    act(() => { fireEvent.click(buttons[0]!); });
    expect(buttons[0]!.getAttribute("aria-pressed")).toBe("false");
    expect(c.querySelectorAll("#torque-speed .bm-series, #torque-speed .bm-stall li").length).toBe(before - 1);
});

test("Measured panel appears only for actuators with runs", () => {
    const panel = render(<MeasuredPanel id="feetech-sts3215" />);
    expect(panel.container.querySelector(".bm-panel h2")?.textContent).toBe("Measured");
    expect(panel.container.querySelectorAll(".bm-run")).toHaveLength(2);
    cleanup();
    const none = render(<MeasuredPanel id="robstride-02" />);
    expect(none.container.querySelector(".bm-panel")).toBeNull();
});

test("compare offers a measured overlay when a pick has torque-speed data", () => {
    setURL("/compare?compare=feetech-sts3250,steadywin-gim6010-8");
    const view = render(<Compare />);
    expect(view.container.querySelector(".compare-measured summary")?.textContent).toBe("Measured torque-speed overlay");
    expect(view.container.querySelectorAll(".compare-measured .bm-series, .compare-measured .bm-stall li")).toHaveLength(2);
    cleanup();
    setURL("/compare?compare=robstride-02,robstride-03");
    const plain = render(<Compare />);
    expect(plain.container.querySelector(".compare-measured")).toBeNull();
});
