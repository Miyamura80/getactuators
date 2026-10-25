import "./happydom";
import { afterEach, beforeEach, expect, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { ActuatorsGallery } from "../src/pages/ActuatorsGallery";
import { ActuatorThumb } from "../src/components/ActuatorThumb";
import { ACTUATORS } from "../src/lib/data";

beforeEach(() => {
    (window as unknown as { happyDOM: { setURL: (url: string) => void } }).happyDOM.setURL("http://localhost:1/actuators");
});
afterEach(cleanup);

test("leading gallery photo is eager and high priority, every other photo stays lazy", () => {
    const { container } = render(<ActuatorsGallery />);
    const first = container.querySelector('.bento-card img');
    expect(first?.getAttribute("src")).toBe("/actuator-images/steadywin-gim8108-8.webp");
    expect(first?.getAttribute("loading")).toBe("eager");
    expect(first?.getAttribute("fetchpriority")).toBe("high");
    expect(first?.getAttribute("decoding")).toBe("auto");
    const photos = [...container.querySelectorAll('.bento-card img')];
    expect(photos.length).toBeGreaterThan(20);
    expect(photos.filter(image => image.getAttribute("fetchpriority") === "high")).toHaveLength(1);
    for (const image of photos.slice(1)) {
        expect(image.getAttribute("loading")).toBe("lazy");
        expect(image.getAttribute("fetchpriority")).not.toBe("high");
        expect(image.getAttribute("decoding")).toBe("async");
    }
});

test("failed product photos still render the accessible schematic", () => {
    const actuator = ACTUATORS.find(a => a.image_url)!;
    const { container } = render(<ActuatorThumb actuator={actuator} />);
    fireEvent.error(container.querySelector('img')!);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe(`${actuator.name} render`);
});

test("absent product photos render the accessible schematic on a fresh mount", () => {
    const actuator = ACTUATORS.find(a => a.image_url)!;
    const { container } = render(<ActuatorThumb actuator={{...actuator, image_url: null}} />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe(`${actuator.name} render`);
});
