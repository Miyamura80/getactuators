import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { Compare } from "../src/pages/Compare";
import { readFileSync } from "node:fs";
import { ExplodedView } from "../src/pages/ExplodedView";
import { EngineeringEvidencePanel } from "../src/components/EngineeringEvidencePanel";

import { engineeringEvidenceFor } from "../../src/catalog/engineering-evidence";

const researchedIds = ["cubemars-ak80-9", "xiaomi-cybergear", "myactuator-rmd-x8-pro-v2"];

afterEach(cleanup);

test("exploratory CyberGear identification is not labeled validated or peer-reviewed research", () => {
    const view = render(<EngineeringEvidencePanel id="xiaomi-cybergear" compact />);
    const modeling = view.container.querySelector('[data-topic="modeling"]');
    expect(modeling?.textContent).toContain("Exploratory report");
    expect(modeling?.textContent).not.toContain("Published research");
});

test("performance gaps remain visible even when comparison details are closed", () => {
    const view = render(<EngineeringEvidencePanel id="myactuator-rmd-x8-pro-v2" compact />);
    for (const limit of ["Bus-to-output map: unknown", "Repeated duty / recovery: unknown", "Loaded accuracy / repeatability: unknown", "Validated model: unknown"]) {
        const text = view.getByText(limit);
        expect(text.closest("details") === null).toBe(true);
    }
    expect(view.container.textContent).toContain("unchanged winding/driver/firmware not established");
    for (const card of view.container.querySelectorAll(".engineering-card")) {
        expect(card.classList.contains("verified-note")).toBe(false);
    }
});

test("responsive evidence rules apply to mounted cards and wrap expanded source text", () => {
    const view = render(<EngineeringEvidencePanel id="xiaomi-cybergear" />);
    const css = readFileSync(new URL("../src/index.css", import.meta.url), "utf8");
    expect(view.container.querySelector(".engineering-grid") !== null).toBe(true);
    expect(css).toContain(".engineering-grid {");
    expect(css).toContain("grid-template-columns: repeat(4, minmax(0, 1fr))");
    expect(css).toContain(".engineering-evidence--compact .engineering-grid");
    expect(css).toContain(".engineering-sources a, .engineering-sources small");
    expect(css).toContain("overflow-wrap: anywhere");
    expect(css).toContain(".engineering-grid { grid-template-columns: 1fr; }");
    expect(css).toContain(".compare-products > article {");
});

test("three selected products keep photos and use compact evidence disclosures", () => {
    (window as unknown as { happyDOM: { setURL(url: string): void } }).happyDOM.setURL(`http://localhost/compare?compare=${researchedIds.join(",")}`);
    const view = render(<Compare />);
    expect(view.container.querySelectorAll(".compare-products > article")).toHaveLength(3);
    expect(view.container.querySelectorAll(".compare-photo")).toHaveLength(3);
    expect(view.container.querySelectorAll(".engineering-evidence--compact")).toHaveLength(3);
    expect(view.container.querySelectorAll(".compare-products h2")).toHaveLength(3);
    const cards = view.container.querySelectorAll(".engineering-card");
    expect(cards).toHaveLength(12);
    for (const card of cards) {
        expect(card.querySelector("details .engineering-summary") !== null).toBe(true);
        expect(card.querySelector("details")?.open).toBe(false);
    }
});

test("all three researched actuators render real shared evidence with exact source locators", () => {
    for (const id of researchedIds) {
        const evidence = engineeringEvidenceFor(id)!;
        expect(evidence !== undefined).toBe(true);
        const view = render(<EngineeringEvidencePanel id={id} />);
        expect(view.container.textContent).toContain(evidence.revision);
        for (const [topic, item] of Object.entries(evidence.topics)) {
            const card = view.container.querySelector(`[data-topic="${topic}"]`)!;
            expect(card !== null).toBe(true);
            expect(card.getAttribute("data-status")).toBe(item.status);
            expect(card.textContent).toContain(item.summary);
            expect(card.querySelector("details")?.textContent).toContain(item.scope);
            for (const source of item.sources) {
                expect(Array.from(card.querySelectorAll("a")).some(a => a.getAttribute("href") === source.url)).toBe(true);
                expect(card.textContent).toContain(source.locator);
            }
        }
        expect(view.container.textContent).not.toContain("Independently validated");
        cleanup();
    }
});

test("missing evidence stays unknown with labeled glyphs and native disclosures", () => {
    const view = render(<EngineeringEvidencePanel id="unresearched-actuator" />);
    expect(view.container.querySelectorAll(".engineering-card")).toHaveLength(4);
    expect(view.getAllByText("Unknown")).toHaveLength(4);
    for (const name of ["Efficiency", "Thermal duty", "Loaded precision", "Modeling"]) {
        expect(view.getByRole("img", { name: `${name} topic` }).tagName.toLowerCase()).toBe("svg");
    }
    expect(view.container.querySelectorAll("details > summary")).toHaveLength(4);
    expect(view.container.querySelectorAll("a")).toHaveLength(0);
    expect(view.container.textContent).toContain("Unknown is not zero");
    expect(view.container.textContent).not.toContain("winner");
});

test("selected researched product mounts a compact engineering overview", () => {
    const view = render(<ExplodedView id="cubemars-ak80-9" />);
    expect(view.queryByRole("region", { name: "Engineering evidence" }) !== null).toBe(true);
});
