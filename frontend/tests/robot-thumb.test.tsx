// DOM test for the robot-card thumbnail's photo/schematic fallback.
// `./happydom` must be imported first so the DOM globals exist before React
// and testing-library are evaluated.
import "./happydom";
import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { RobotShowcase } from "../src/components/RobotShowcase";

afterEach(cleanup);

describe("RobotThumb fallback", () => {
    test("renders the product photo for robots that have an image_url", () => {
        const { container } = render(<RobotShowcase />);
        const photos = container.querySelectorAll("img.robot-photo");
        // The dataset ships a photo for every robot, so every card shows one.
        expect(photos.length).toBeGreaterThan(0);
    });

    test("falls back to the schematic svg when the image fails to load", () => {
        const { container } = render(<RobotShowcase />);
        const thumb = container.querySelector(".robot-thumb");
        expect(thumb).not.toBeNull();

        const img = thumb?.querySelector("img.robot-photo");
        expect(img).not.toBeNull();
        expect(thumb?.getAttribute("data-photo")).toBe("true");

        // Simulate a broken hotlink: the CDN image 404s.
        fireEvent.error(img as HTMLImageElement);

        // The photo is replaced by the schematic render, not a broken icon.
        expect(thumb?.querySelector("img.robot-photo")).toBeNull();
        expect(thumb?.querySelector("svg")).not.toBeNull();
        expect(thumb?.getAttribute("data-photo")).toBe("false");
    });
});
