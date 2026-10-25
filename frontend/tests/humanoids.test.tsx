import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { HUMANOIDS } from "../../src/humanoids";
import { Humanoids } from "../src/pages/humanoids/Humanoids";

const setURL = (path: string) =>
    (window as unknown as { happyDOM: { setURL: (u: string) => void } }).happyDOM.setURL(`http://localhost${path}`);

afterEach(cleanup);

test("draws the canonical joint set and opens a joint's drill-down", () => {
    setURL("/humanoids?robot=kscale-kbot");
    const view = render(<Humanoids />);
    expect(view.getByRole("heading", { level: 1 }).textContent).toBe("What moves each joint");
    // 2 central + 12 sided joints per side.
    const nodes = view.container.querySelectorAll(".hm-card .hm-node");
    expect(nodes).toHaveLength(26);
    const knee = view.container.querySelector('.hm-node[data-joint="l-knee"]');
    expect(knee?.getAttribute("aria-label")).toBe("Left knee: 1 x Rotary QDD");
    // Default panel lists the joints; picking one opens its actuator.
    expect(view.container.querySelector(".hm-list")).not.toBeNull();
    act(() => {
        fireEvent.click(knee!);
    });
    const panel = view.container.querySelector(".hm-panel")!;
    expect(panel.querySelector("h3")?.textContent).toBe("Left knee");
    expect(panel.textContent).toContain("RobStride 04");
    expect(panel.querySelector('a[href="/actuators/robstride-04"]')).not.toBeNull();
    expect(window.location.search).toContain("joint=l-knee");
    // Estimated magnet range is labelled as such.
    expect(panel.querySelector(".hm-conf.is-estimated")).not.toBeNull();
});

test("estimated types draw as rings, reported as filled dots", () => {
    setURL("/humanoids?robot=tesla-optimus");
    const view = render(<Humanoids />);
    const elbow = view.container.querySelector('.hm-node[data-joint="r-elbow"] .hm-dot');
    expect(elbow?.getAttribute("fill")).toBe("var(--black)");
    expect(Number(elbow?.getAttribute("stroke-width"))).toBeGreaterThan(0);
    cleanup();
    setURL("/humanoids?robot=kscale-kbot");
    const kbot = render(<Humanoids />);
    const hip = kbot.container.querySelector('.hm-node[data-joint="r-hip-pitch"] .hm-dot');
    expect(hip?.getAttribute("fill")).toBe("#51cf66");
});

test("compare mode puts two silhouettes and two panels side by side", () => {
    setURL("/humanoids?robot=unitree-g1&vs=tesla-optimus&joint=l-elbow");
    const view = render(<Humanoids />);
    expect(view.container.querySelector(".hm-stage.is-compare")).not.toBeNull();
    const captions = [...view.container.querySelectorAll(".hm-card figcaption b")].map((b) => b.textContent);
    expect(captions).toEqual(["G1", "Optimus Gen 2"]);
    const panels = [...view.container.querySelectorAll(".hm-panel")];
    expect(panels).toHaveLength(2);
    expect(panels[0]?.textContent).toContain("Planetary");
    expect(panels[1]?.textContent).toContain("Roller screw");
});

const rowNames = (root: HTMLElement) =>
    [...root.querySelectorAll(".hm-fleet tbody td:first-child:not(.hm-empty) > button")].map((b) => b.textContent);
const header = (root: HTMLElement, label: string) =>
    [...root.querySelectorAll<HTMLButtonElement>(".hm-fleet th button")].find((b) => b.textContent?.startsWith(label))!;
// happy-dom lacks `oninput` on document, so React falls back to its input
// polyfill, which reads the new value on keyup.
const search = (root: HTMLElement, q: string) =>
    act(() => {
        const input = root.querySelector<HTMLInputElement>(".hm-search input")!;
        fireEvent.focusIn(input);
        fireEvent.change(input, { target: { value: q } });
        fireEvent.keyUp(input);
    });

test("the fleet folds by default with a count and a one-line hint", () => {
    setURL("/humanoids");
    const view = render(<Humanoids />);
    const fleet = view.container.querySelector<HTMLDetailsElement>("details.hm-fleet")!;
    expect(fleet.open).toBe(false);
    expect(fleet.querySelector("summary")?.textContent).toBe("Fleet (21)Most magnet: H2, 2.76 kg");
    cleanup();
    setURL("/humanoids?page=2");
    const deep = render(<Humanoids />);
    expect(deep.container.querySelector<HTMLDetailsElement>("details.hm-fleet")!.open).toBe(true);
});

test("the fleet paginates 10 rows a page and sorts across every page", () => {
    setURL("/humanoids");
    const view = render(<Humanoids />);
    const root = view.container;
    expect(rowNames(root)).toHaveLength(10);
    expect(root.querySelector(".hm-fleet-n")?.textContent).toBe(`${HUMANOIDS.length} of ${HUMANOIDS.length}`);
    act(() => {
        fireEvent.click(view.getByRole("button", { name: "Page 3" }));
    });
    expect(rowNames(root)).toHaveLength(1);
    expect(new URLSearchParams(window.location.search).get("page")).toBe("3");
    // Sorting by name resets to page 1 and orders the whole fleet, not the page.
    act(() => {
        fireEvent.click(header(root, "Robot"));
    });
    expect(new URLSearchParams(window.location.search).get("page")).toBeNull();
    expect(new URLSearchParams(window.location.search).get("sort")).toBe("name");
    const all = [...HUMANOIDS].map((h) => h.name).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    expect(rowNames(root)).toEqual(all.slice(0, 10));
    act(() => {
        fireEvent.click(view.getByRole("button", { name: "Next" }));
    });
    expect(rowNames(root)).toEqual(all.slice(10, 20));
    act(() => {
        fireEvent.click(header(root, "DOF"));
    });
    expect(rowNames(root)[0]).toBe("IRON");
    expect(window.location.search).toContain("sort=-dof");
});

test("search filters by name, maker, country and actuator type", () => {
    setURL("/humanoids?page=2");
    const view = render(<Humanoids />);
    const root = view.container;
    search(root, "unitree");
    expect(rowNames(root).sort()).toEqual(["G1", "H1", "H2"]);
    expect(root.querySelector(".hm-fleet-n")?.textContent).toBe(`3 of ${HUMANOIDS.length}`);
    expect(window.location.search).toContain("q=unitree");
    expect(window.location.search).not.toContain("page=");
    search(root, "Roller screw");
    expect(rowNames(root).sort()).toEqual(["Forerunner K2", "Optimus Gen 2"]);
    search(root, "canada");
    expect(rowNames(root)).toEqual(["Phoenix Gen 7"]);
    search(root, "zzz");
    expect(rowNames(root)).toEqual([]);
    expect(root.querySelector(".hm-empty")?.textContent).toContain('No robot matches "zzz"');
    act(() => {
        fireEvent.click(view.getByRole("button", { name: "Clear search" }));
    });
    expect(rowNames(root)).toHaveLength(10);
});

test("fleet state restores from the URL and follows the back button", () => {
    setURL("/humanoids?robot=unitree-g1&q=unitree&sort=name");
    const view = render(<Humanoids />);
    const root = view.container;
    expect(rowNames(root)).toEqual(["G1", "H1", "H2"]);
    expect(root.querySelector(".hm-fleet tr.is-active")?.textContent).toContain("G1");
    const pushedFrom = window.history.length;
    act(() => {
        fireEvent.click(header(root, "Robot"));
    });
    expect(rowNames(root)).toEqual(["H2", "H1", "G1"]);
    // Sorting pushed a history entry; going back restores the earlier URL and
    // fires popstate, which the table follows.
    expect(window.history.length).toBe(pushedFrom + 1);
    expect(window.location.search).toContain("sort=-name");
    act(() => {
        window.history.replaceState(null, "", "/humanoids?robot=unitree-g1&q=unitree&sort=name");
        window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(rowNames(root)).toEqual(["G1", "H1", "H2"]);
    // A row still switches the robot and keeps the fleet state.
    act(() => {
        fireEvent.click(view.getByRole("button", { name: "H1" }));
    });
    expect(root.querySelector(".hm-card figcaption b")?.textContent).toBe("H1");
    expect(window.location.search).toContain("q=unitree");
});

test("each row carries a data confidence meter with an explanation", () => {
    setURL("/humanoids?q=k-bot");
    const view = render(<Humanoids />);
    const meter = view.container.querySelector(".hm-fleet .hm-meter");
    expect(meter?.className).toContain("is-reported");
    expect(meter?.getAttribute("title")).toContain("100% of joint fields");
    expect(meter?.querySelectorAll("i.on")).toHaveLength(3);
});

test("the magnet method is folded in a details element with the size classes", () => {
    setURL("/humanoids");
    const view = render(<Humanoids />);
    const fold = view.container.querySelector("details.hm-fold");
    expect(fold?.querySelector("summary")?.textContent).toBe("Magnet mass method");
    expect(fold?.querySelectorAll("tbody tr")).toHaveLength(5);
});
