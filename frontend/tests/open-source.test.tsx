import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { OPEN_ROBOTS } from "../../src/open-source";
import { OpenSource } from "../src/pages/open-source/OpenSource";

const setURL = (path: string) =>
    (window as unknown as { happyDOM: { setURL: (u: string) => void } }).happyDOM.setURL(`http://localhost${path}`);

afterEach(cleanup);

test("renders the gallery, matrix, usage bars, scatter and family tree", () => {
    setURL("/open-source");
    const view = render(<OpenSource />);
    expect(view.getByRole("heading", { level: 1 }).textContent).toBe("Robots you can build");
    expect(view.container.querySelectorAll(".os-card")).toHaveLength(OPEN_ROBOTS.length);
    // Manmaru YOR falls short of the inclusion rule and is drawn dashed.
    expect(view.container.querySelector('.os-card[data-robot="manmaru-yor"]')?.className).toContain("is-flagged");
    expect(view.container.querySelectorAll(".os-matrix tbody tr")).toHaveLength(OPEN_ROBOTS.length);
    expect(view.container.querySelectorAll(".os-matrix tbody td[data-dim]")).toHaveLength(OPEN_ROBOTS.length * 8);
    expect(view.container.querySelector(".os-bar")?.getAttribute("data-key")).toBe("feetech-sts3215");
    expect(view.container.querySelector('.os-dot[data-robot="so-101"]')).not.toBeNull();
    expect(view.container.querySelector('.os-node[data-robot="manmaru-yor"]')).not.toBeNull();
    expect(view.container.textContent).toContain("Checked and left out");
});

test("picking a usage bar filters the gallery and lands in the URL", () => {
    setURL("/open-source");
    const view = render(<OpenSource />);
    const bar = view.container.querySelector('.os-bar[data-key="damiao-dm-j4310-2ec"]')!;
    act(() => {
        fireEvent.click(bar);
    });
    const cards = [...view.container.querySelectorAll(".os-card")].map((c) => c.getAttribute("data-robot"));
    expect(cards).toEqual(["manmaru-yor", "openarm"]);
    expect(window.location.search).toContain("uses=damiao-dm-j4310-2ec");
    act(() => {
        fireEvent.click(view.getByRole("button", { name: /Clear filter/ }));
    });
    expect(view.container.querySelectorAll(".os-card")).toHaveLength(OPEN_ROBOTS.length);
});

test("a robot from the URL opens its detail with catalog links and openness", () => {
    setURL("/open-source?robot=openarm");
    const view = render(<OpenSource />);
    const detail = view.container.querySelector(".os-detail")!;
    expect(detail.querySelector("h3")?.textContent).toBe("OpenArm");
    expect(detail.querySelector('a[href="/actuators/damiao-dm-j8009-2ec"]')).not.toBeNull();
    expect(detail.querySelectorAll(".os-dims li")).toHaveLength(8);
    // Picking the parent of a derivative switches the detail.
    cleanup();
    setURL("/open-source?robot=manmaru-yor");
    const second = render(<OpenSource />);
    act(() => {
        fireEvent.click(second.getByRole("button", { name: "Derived from YOR" }));
    });
    expect(second.container.querySelector(".os-detail h3")?.textContent).toBe("YOR");
    expect(window.location.search).toContain("robot=yor");
});

test("type filter narrows every view", () => {
    setURL("/open-source?type=legged");
    const view = render(<OpenSource />);
    const legged = OPEN_ROBOTS.filter((r) => r.type === "legged").length;
    expect(view.container.querySelectorAll(".os-card")).toHaveLength(legged);
    expect(view.container.querySelectorAll(".os-matrix tbody tr")).toHaveLength(legged);
    act(() => {
        fireEvent.click(view.getByRole("button", { name: "All" }));
    });
    expect(view.container.querySelectorAll(".os-card")).toHaveLength(OPEN_ROBOTS.length);
    expect(window.location.search).not.toContain("type=");
});
