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

test("the fleet table lists every robot and sorts by a column", () => {
    setURL("/humanoids");
    const view = render(<Humanoids />);
    const names = () =>
        [...view.container.querySelectorAll(".hm-fleet tbody tr td:first-child button")].map((b) => b.textContent);
    expect(names()).toHaveLength(HUMANOIDS.length);
    const dof = [...view.container.querySelectorAll(".hm-fleet th button")].find((b) => b.textContent?.startsWith("DOF"));
    act(() => {
        fireEvent.click(dof!);
    });
    expect(names()[0]).toBe("IRON");
    act(() => {
        fireEvent.click(view.getByRole("button", { name: "G1" }));
    });
    expect(view.container.querySelector(".hm-card figcaption b")?.textContent).toBe("G1");
});

test("the magnet method is folded in a details element with the size classes", () => {
    setURL("/humanoids");
    const view = render(<Humanoids />);
    const fold = view.container.querySelector("details.hm-fold");
    expect(fold?.querySelector("summary")?.textContent).toBe("Magnet mass method");
    expect(fold?.querySelectorAll("tbody tr")).toHaveLength(5);
});
