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

test("countries render as flags named for assistive tech, and search by name or code", () => {
    setURL("/humanoids?robot=unitree-g1");
    const view = render(<Humanoids />);
    const root = view.container;
    const flag = root.querySelector(".hm-card figcaption .flag");
    expect(flag?.textContent).toBe("\u{1F1E8}\u{1F1F3}");
    expect(flag?.getAttribute("aria-label")).toBe("China");
    expect(flag?.getAttribute("title")).toBe("China");
    expect(root.querySelector(".hm-card figcaption")?.textContent).not.toContain("China");
    search(root, "china");
    expect(rowNames(root)).toContain("G1");
    const chinaHits = rowNames(root).length;
    search(root, "cn");
    expect(rowNames(root)).toHaveLength(chinaHits);
    expect(root.querySelector(".hm-fleet tbody .flag")?.getAttribute("aria-label")).toBe("China");
});

test("the actuator BOM donut breaks cost down by part and highlights its joints", () => {
    setURL("/humanoids?robot=kscale-kbot");
    const view = render(<Humanoids />);
    const bom = view.container.querySelector(".hm-card .hm-bom")!;
    const rows = [...bom.querySelectorAll(".hm-bom-legend button")];
    expect(rows.map((r) => r.querySelector(".hm-bom-l")?.textContent)).toEqual([
        "RobStride 03 x8",
        "RobStride 04 x4",
        "RobStride 02 x6",
        "RobStride 00 x2",
    ]);
    expect(bom.querySelectorAll(".hm-donut path")).toHaveLength(4);
    expect(bom.querySelector(".hm-donut-v")?.textContent).toBe("$4.2k");
    // Picking a slice dims every joint that does not use that part.
    act(() => {
        fireEvent.click(rows[1]!);
    });
    const node = (j: string) => view.container.querySelector(`.hm-card .hm-node[data-joint="${j}"]`);
    expect(node("l-knee")?.classList.contains("is-dim")).toBe(false);
    expect(node("l-elbow")?.classList.contains("is-dim")).toBe(true);
    expect(bom.querySelector(".hm-bom-detail")?.textContent).toContain("RobStride 04: 4 x $255");
    expect(bom.querySelector(".hm-bom-detail .hm-conf.is-reported")).not.toBeNull();
    // The toggle switches the same breakdown to mass, and clears the pick.
    act(() => {
        fireEvent.click(view.getAllByRole("button", { name: "Mass kg" })[0]!);
    });
    // Mass adds the rest of the robot: published weight (34 kg) minus actuators.
    expect(bom.querySelector(".hm-donut-v")?.textContent).toBe("34.0 kg");
    expect([...bom.querySelectorAll(".hm-bom-gh span")].map((s) => s.textContent)).toEqual([
        "Actuators",
        "Rest of robot",
    ]);
    expect(node("l-elbow")?.classList.contains("is-dim")).toBe(false);
});

test("the cost view splits actuators from the rest of the robot where a full BOM exists", () => {
    setURL("/humanoids?robot=berkeley-humanoid-lite");
    const view = render(<Humanoids />);
    const bom = view.container.querySelector(".hm-card .hm-bom")!;
    const groups = [...bom.querySelectorAll(".hm-bom-group")];
    expect(groups.map((g) => g.querySelector(".hm-bom-gh span")?.textContent)).toEqual(["Actuators", "Rest of robot"]);
    const rest = [...groups[1]!.querySelectorAll(".hm-bom-l")].map((l) => l.textContent);
    expect(rest).toEqual(["Compute & electronics", "Printed structure", "Grippers", "Battery", "Wiring, fasteners & other"]);
    // Non-actuator slices are greys, distinct from each other.
    const greys = [...groups[1]!.querySelectorAll("i")].map((i) => (i as HTMLElement).style.background);
    expect(new Set(greys).size).toBe(5);
    expect(bom.querySelector(".hm-donut-ring")).not.toBeNull();
    expect(bom.querySelector(".hm-donut-r")?.textContent).toMatch(/^actuators \d+%$/);
    cleanup();
    setURL("/humanoids?robot=tesla-optimus");
    const optimus = render(<Humanoids />);
    expect(optimus.container.querySelector(".hm-card .hm-bom-legend i.is-hatch")).not.toBeNull();
    cleanup();
    setURL("/humanoids?robot=kscale-kbot");
    const kbot = render(<Humanoids />);
    expect(kbot.container.querySelector(".hm-bom-np")?.textContent).toContain("Non-actuator BOM not published");
    expect(kbot.container.querySelector(".hm-donut-ring")).toBeNull();
});

test("rare earth is broken down by actuator design, matching the BOM grouping", () => {
    setURL("/humanoids?robot=tesla-optimus");
    const view = render(<Humanoids />);
    const ree = view.container.querySelector(".hm-card .ree")!;
    expect(ree.querySelector(".ree-title")?.textContent).toBe("Rare earth by actuator, estimated");
    const names = [...ree.querySelectorAll(".ree-name")].map((n) => n.textContent);
    expect(names[0]).toBe("Harmonic 180 N·m x6");
    expect(names).toContain("Hand (tendon) x12");
    expect(names).toContain("Undisclosed, XS class x2");
    expect(names).toHaveLength(8);
    // The legend carries the robot's per-element totals; the old text line is gone.
    const key = [...ree.querySelectorAll(".ree-key span")].map((k) => k.textContent);
    expect(key[0]).toBe("Nd neodymium337-700 g");
    expect(view.container.querySelector(".hm-ree")).toBeNull();
    // Values fall from largest to smallest.
    const vals = [...ree.querySelectorAll(".ree-val")].map((v) => Number(v.textContent?.replace(/[^0-9]/g, "")));
    expect([...vals].sort((a, b) => b - a)).toEqual(vals);
});

test("the BOM notes the price share and what it leaves out", () => {
    setURL("/humanoids?robot=unitree-g1");
    const g1 = render(<Humanoids />);
    expect(g1.container.querySelector(".hm-bom-share")?.textContent).toMatch(/^Actuators ≈ \d+% of the robot's price/);
    cleanup();
    setURL("/humanoids?robot=sanctuary-phoenix");
    const phoenix = render(<Humanoids />);
    expect(phoenix.container.querySelector(".hm-bom-share")).toBeNull();
    expect(phoenix.container.querySelector(".hm-bom-out summary")?.textContent).toBe("42 not counted");
});

test("the fleet table sorts by actuator BOM", () => {
    setURL("/humanoids?sort=bom");
    const view = render(<Humanoids />);
    expect(rowNames(view.container)[0]).toBe("Berkeley Humanoid Lite");
    expect([...view.container.querySelectorAll(".hm-fleet th")].some((th) => th.textContent?.startsWith("Actuator BOM $"))).toBe(true);
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
    expect(fold?.querySelector("summary")?.textContent).toBe("Method: magnets, cost and mass");
    expect(fold?.querySelectorAll("tbody tr")).toHaveLength(5);
});
