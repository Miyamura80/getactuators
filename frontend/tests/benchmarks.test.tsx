import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { BENCHMARK_RUNS, curveRuns, datasheetDeltas, measuredLeaderboard } from "../../src/benchmarks";
import { MeasuredPanel } from "../src/components/benchmarks/MeasuredPanel";
import { MeasuredOverlay } from "../src/components/benchmarks/MeasuredOverlay";
import { Benchmarks } from "../src/pages/benchmarks/Benchmarks";
import { readOpenRun, readPicks, writePicks } from "../src/pages/benchmarks/url-state";
import { ACTUATORS } from "../src/lib/data";

const setURL = (path: string) =>
    (window as unknown as { happyDOM: { setURL: (u: string) => void } }).happyDOM.setURL(`http://localhost${path}`);

afterEach(cleanup);

test("renders the five sections, one call to action and a row per actuator and run", () => {
    setURL("/benchmarks");
    const view = render(<Benchmarks />);
    const c = view.container;
    expect(view.getByRole("heading", { level: 1 }).textContent).toBe("Benchmarks");
    expect([...c.querySelectorAll(".bm-sec h2")].map((h) => h.textContent)).toEqual([
        "01Datasheet vs measured",
        "02Torque-speed",
        "03Thermal derating",
        "04Measured leaderboard",
        "05All runs",
    ]);
    expect(c.querySelectorAll(".bm-cta")).toHaveLength(1);
    expect(c.querySelectorAll(".bm-delta li")).toHaveLength(datasheetDeltas(ACTUATORS).length);
    expect(c.querySelectorAll(".bm-leader li")).toHaveLength(measuredLeaderboard(ACTUATORS).length);
    expect(c.querySelectorAll(".bm-run")).toHaveLength(BENCHMARK_RUNS.length);
    expect(c.querySelector(".bm-delta li")?.getAttribute("data-actuator")).toBe("dynamixel-xc430-w150-t");
    // The driver-limited GIM6010-8 stall is shown with its reason, not ranked.
    expect(c.querySelector('.bm-delta li[data-actuator="steadywin-gim6010-8"]')).toBeNull();
    expect(c.querySelector(".bm-bar.is-short")).not.toBeNull();
    expect(c.querySelectorAll(".bm-badge-published").length).toBeGreaterThan(0);
    expect([...c.querySelectorAll(".bm-flag")].map((f) => f.textContent).join(" ")).toContain("Not ranked: The log puts the 3 N·m stall down to the ODrive");
});

test("the T-N overlay holds at most four curves and keeps its picks in the URL", () => {
    setURL("/benchmarks");
    const c = render(<Benchmarks />).container;
    expect(c.querySelectorAll(".bm-tn .bm-series")).toHaveLength(4);
    const picks = [...c.querySelectorAll<HTMLButtonElement>(".bm-picks button")];
    expect(picks.length).toBe(new Set(curveRuns().map((r) => r.actuatorId)).size);
    expect(picks.filter((b) => b.disabled).length).toBe(picks.length - 4);
    const on = picks.find((b) => b.getAttribute("aria-pressed") === "true");
    if (!on) throw new Error("no picked curve");
    fireEvent.click(on);
    expect(c.querySelectorAll(".bm-tn .bm-series")).toHaveLength(3);
    expect(window.location.search).toStartWith("?tn=");
    expect(window.location.search.split(",")).toHaveLength(3);
});

test("?tn= and #run= deep links", () => {
    setURL("/benchmarks?tn=robstride-04,mjbots-qdd100,nope#run=robstride-04/robstride-manual-2026-07");
    const c = render(<Benchmarks />).container;
    // qdd100 has no curve and nope is unknown: one curve is drawn.
    expect([...c.querySelectorAll(".bm-tn .bm-series")].map((g) => g.getAttribute("data-series"))).toEqual(["robstride-04"]);
    const open = [...c.querySelectorAll<HTMLDetailsElement>(".bm-run")].filter((d) => d.open);
    expect(open.map((d) => d.getAttribute("data-run"))).toEqual(["robstride-04/robstride-manual-2026-07"]);
    expect(readPicks("?tn=a,b,a,BAD")).toEqual(["a", "b"]);
    expect(writePicks("?x=1", ["a", "b"])).toBe("?x=1&tn=a,b");
    expect(writePicks("?tn=a", [])).toBe("?tn=");
    expect(readPicks("?tn=")).toEqual([]);
    expect(readPicks("?x=1")).toBeNull();
    expect(readOpenRun("#run=a/b")).toBe("a/b");
    expect(readOpenRun("#measure=a")).toBeNull();
    // A legend link on the page changes the hash: the run opens.
    act(() => {
        window.location.hash = "#run=xiaomi-cybergear/xiaomi-manual-2023";
        window.dispatchEvent(new Event("hashchange"));
    });
    const nowOpen = [...c.querySelectorAll<HTMLDetailsElement>(".bm-run")].filter((d) => d.open);
    expect(nowOpen.map((d) => d.getAttribute("data-run"))).toEqual(["xiaomi-cybergear/xiaomi-manual-2023"]);
});

test("clearing every overlay pick survives a reload", () => {
    setURL("/benchmarks?tn=");
    const c = render(<Benchmarks />).container;
    expect(c.querySelectorAll(".bm-tn .bm-series")).toHaveLength(0);
});

test("Measured panel shows datasheet deltas and a curve, and nothing without runs", () => {
    const cg = render(<MeasuredPanel id="xiaomi-cybergear" />).container;
    expect(cg.querySelector('[data-kpi="peak"]')?.textContent).toContain("12 N·m");
    expect(cg.querySelector('[data-kpi="continuous"]')?.textContent).toContain("6 N·m");
    expect(cg.querySelectorAll(".bm-tn .bm-series")).toHaveLength(1);
    cleanup();
    const ak = render(<MeasuredPanel id="cubemars-ak80-9" />).container;
    expect(ak.querySelector('[data-kpi="backlashArcmin"]')?.textContent).toContain("9 arcmin");
    // Friction comes only from an other-revision run, so it is no headline KPI.
    expect(ak.querySelector('[data-kpi="frictionNm"]')).toBeNull();
    expect(ak.textContent).toContain("other revision");
    expect(ak.querySelector(".bm-tn")).toBeNull();
    cleanup();
    expect(render(<MeasuredPanel id="nabtesco-rv-42n" />).container.innerHTML).toBe("");
});

test("compare overlay draws curves for picked actuators that have one", () => {
    const view = render(<MeasuredOverlay ids={["robstride-02", "xiaomi-cybergear", "nabtesco-rv-42n"]} />);
    expect(view.container.querySelector("summary")?.textContent).toBe("Measured T-N overlay (2 of 3 with a curve)");
    expect(view.container.querySelectorAll(".bm-series")).toHaveLength(2);
    expect(view.container.textContent).toContain("Curves come from different rigs and voltages");
    cleanup();
    // Two ROBOTIS graphs at the same assumed 12 V: no claim of different rigs.
    const robotis = render(<MeasuredOverlay ids={["dynamixel-xm430-w350-t", "dynamixel-xm540-w270-t"]} />);
    expect(robotis.container.textContent).toContain("share a rig description and bus voltage");
    cleanup();
    expect(render(<MeasuredOverlay ids={["nabtesco-rv-42n", "harmonic-drive-lpa-20"]} />).container.innerHTML).toBe("");
});
