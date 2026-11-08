// The /robots kind filter: chips per robot type, ?kind= narrows the cards,
// and quadrupeds without a photo fall back to the drawn quadruped.
import "./happydom";
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { RobotShowcase } from "../src/components/RobotShowcase";
import { ROBOTS } from "../src/lib/robots";

afterEach(() => {
    cleanup();
    window.history.replaceState({}, "", "/robots");
});

const quadrupeds = ROBOTS.filter((r) => r.kind === "quadruped");

describe("robot kind filter", () => {
    test("offers All plus one chip per kind, with counts", () => {
        const { getByRole } = render(<RobotShowcase />);
        const group = getByRole("group", { name: "Robot type" });
        const labels = [...group.querySelectorAll("button")].map((b) => b.textContent);
        expect(labels).toEqual([
            `All ${ROBOTS.length}`,
            `Humanoids ${ROBOTS.filter((r) => r.kind === "humanoid").length}`,
            `Robot arms ${ROBOTS.filter((r) => r.kind === "robot_arm").length}`,
            `Quadrupeds ${quadrupeds.length}`,
        ]);
    });

    test("?kind=quadruped shows only quadruped cards", () => {
        window.history.replaceState({}, "", "/robots?kind=quadruped");
        const { container } = render(<RobotShowcase />);
        const cards = container.querySelectorAll(".robot-card");
        expect(cards.length).toBe(quadrupeds.length);
        expect(container.querySelector(".robot-group-title")?.textContent).toContain("Quadrupeds");
        // No quadruped has an in-repo photo yet, so each draws the render.
        for (const c of cards) expect(c.querySelector(".robot-thumb")?.getAttribute("data-photo")).toBe("false");
    });

    test("clicking a chip filters, and All clears it", () => {
        const { container, getByRole } = render(<RobotShowcase />);
        fireEvent.click(getByRole("button", { name: /^Quadrupeds/ }));
        expect(window.location.search).toBe("?kind=quadruped");
        expect(container.querySelectorAll(".robot-card").length).toBe(quadrupeds.length);
        fireEvent.click(getByRole("button", { name: /^All/ }));
        expect(container.querySelectorAll(".robot-card").length).toBe(ROBOTS.length);
    });

    test("a chart bar jumps to the card and keeps the kind filter", () => {
        window.history.replaceState({}, "", "/robots?kind=quadruped");
        const { container } = render(<RobotShowcase />);
        const bar = container.querySelector(".bar-g");
        expect(bar).not.toBeNull();
        fireEvent.click(bar as Element);
        expect(window.location.search).toBe("?kind=quadruped");
        // The hash names a quadruped shown in the filtered view, and its card exists.
        const id = window.location.hash.slice(1);
        expect(quadrupeds.map((r) => r.id)).toContain(id);
        expect(container.querySelector(`#robot-${id}`)).not.toBeNull();
    });

    test("unnamed joint motors read as such, with role and count", () => {
        window.history.replaceState({}, "", "/robots?kind=quadruped");
        const { container } = render(<RobotShowcase />);
        const spot = container.querySelector("#robot-boston-dynamics-spot");
        const rows = [...(spot?.querySelectorAll(".motor-row") ?? [])].map((r) => r.textContent);
        expect(rows).toEqual([
            "4× motor not namedHip x (abduction)",
            "4× motor not namedHip y (flexion)",
            "4× motor not namedKnee",
        ]);
    });
});
