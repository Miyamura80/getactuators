import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { mountApp } from "../src/startup";
import { OpenSource } from "../src/pages/open-source/OpenSource";
import { OPENNESS_DIMENSIONS, OPEN_ROBOTS, actuatorUsage, familyTree } from "../../src/open-source";

afterEach(cleanup);

function setUrl(url: string) {
    (window as unknown as { happyDOM: { setURL: (url: string) => void } }).happyDOM.setURL(url);
}

test("the app routes /open-source to the open robot directory", async () => {
    setUrl("http://localhost:1/open-source");
    document.body.innerHTML = '<div id="root"></div>';
    const root = document.getElementById("root")!;
    let mounted: ReturnType<typeof mountApp> | undefined;
    try {
        await act(async () => {
            mounted = mountApp(root);
        });
        expect(root.querySelector("h1")?.textContent).toBe("Robots you can build");
    } finally {
        await act(async () => {
            mounted?.unmount();
        });
        document.body.innerHTML = "";
    }
});

test("gallery, matrix, usage chart, scatter and family tree all render", () => {
    setUrl("http://localhost:1/open-source");
    const view = render(<OpenSource />);
    const cards = view.container.querySelectorAll(".os-card");
    expect(cards).toHaveLength(OPEN_ROBOTS.length);
    expect(view.getByText("YOR", { selector: "h3" })).toBeTruthy();
    expect(view.getByText("Manmaru YOR", { selector: "h3" })).toBeTruthy();
    const rows = view.container.querySelectorAll(".os-matrix tbody tr");
    expect(rows).toHaveLength(OPEN_ROBOTS.length);
    expect(rows[0]?.querySelectorAll("td")).toHaveLength(OPENNESS_DIMENSIONS.length + 1);
    expect(view.container.querySelectorAll(".os-bars button").length).toBeGreaterThan(0);
    expect(view.container.querySelectorAll(".os-bubble").length).toBeGreaterThan(0);
    expect(view.container.querySelectorAll(".os-lineage")).toHaveLength(familyTree().length);
});

test("matrix cells link to the published artefact", () => {
    setUrl("http://localhost:1/open-source");
    const view = render(<OpenSource />);
    const openarm = [...view.container.querySelectorAll(".os-matrix tbody tr")].find((tr) => tr.querySelector("th")?.textContent === "OpenArm");
    expect(openarm?.querySelector('a[href="https://github.com/enactic/openarm_hardware"]')).not.toBeNull();
});

test("clicking an actuator bar filters the robots to its users, and type chips filter too", () => {
    setUrl("http://localhost:1/open-source");
    const view = render(<OpenSource />);
    const top = actuatorUsage()[0]!;
    fireEvent.click(view.container.querySelector(".os-bars button")!);
    expect(view.container.querySelectorAll(".os-card")).toHaveLength(top.robots.length);
    expect(window.location.search).toContain("actuator=");
    fireEvent.click(view.getByLabelText("Clear actuator filter"));
    fireEvent.click(view.getByRole("button", { name: "Legged" }));
    const legged = OPEN_ROBOTS.filter((r) => r.type === "legged").length;
    expect(view.container.querySelectorAll(".os-card")).toHaveLength(legged);
});

test("an unknown actuator in the URL is ignored instead of emptying the directory", () => {
    setUrl("http://localhost:1/open-source?actuator=no-such-motor");
    const view = render(<OpenSource />);
    expect(view.container.querySelectorAll(".os-card")).toHaveLength(OPEN_ROBOTS.length);
    expect(view.queryByLabelText("Clear actuator filter")).toBeNull();
});

test("the catalog robot link targets the matching card, and linked matrix cells name their status", () => {
    setUrl("http://localhost:1/open-source");
    const view = render(<OpenSource />);
    expect(view.container.querySelector('a[href="/robots#manmaru-yor"]')).not.toBeNull();
    expect(view.getByLabelText("OpenArm: Mechanical CAD, Published")).toBeTruthy();
    expect(view.container.querySelector(".os-matrix")?.getAttribute("aria-labelledby")).toBe("os-matrix");
});
