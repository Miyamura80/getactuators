import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { ACTUATORS } from "../src/lib/data";
import { DetailPanel } from "../src/components/DetailPanel";
import { ComparePanel } from "../src/components/ComparePanel";
import { CompareTray } from "../src/components/CompareTray";
import { evidenceFor } from "../../src/catalog/evidence";

const css = readFileSync(new URL("../src/index.css", import.meta.url), "utf8");
afterEach(cleanup);

test("detail evidence reserves green for ordinary spot-checked records", () => {
    const cases = [
        { ...ACTUATORS[0], id: "ordinary-spot-check", verified: true, green: true },
        { ...ACTUATORS[0], id: "ordinary-unverified", verified: false, green: false },
        ...["cubemars-ak80-9", "leaderdrive-lcs", "leaderdrive-lhd", "leaderdrive-lhs", "nidec-flexwave-wpg", "nidec-smart-flexwave-srh"].map(id => ({ ...ACTUATORS.find(a => a.id === id)!, verified: true, green: false })),
    ];
    for (const a of cases) {
        const view = render(<DetailPanel actuator={a} onClose={() => {}} />);
        const status = view.container.querySelector(".drawer > p");
        expect(status?.classList.contains("verified-note")).toBe(a.green);
        if (!a.green) expect(status?.classList.contains("evidence-note")).toBe(true);
        cleanup();
    }
    const neutral = css.match(/\.evidence-note\s*\{([^}]+)\}/)?.[1] ?? "";
    expect(neutral).toContain("background: var(--panel-2)");
    expect(neutral).toContain("border: 1px solid var(--line-strong)");
});

test("compare status has readable text separators and block caveats", () => {
    const records = ["cubemars-ak80-9", "leaderdrive-lcs"].map(id => ACTUATORS.find(a => a.id === id)!);
    const view = render(<ComparePanel actuators={records} onClose={() => {}} onRemove={() => {}} />);
    const cells = view.container.querySelectorAll("tbody tr:first-child td:not(.rowlabel)");
    expect(cells).toHaveLength(records.length);
    records.forEach((a, index) => {
        const evidence = evidenceFor(a);
        expect(cells[index].textContent).toBe(`${evidence.label} ${evidence.caveats.join(" ")}`);
        const notes = cells[index].querySelectorAll("small.compare-evidence-caveat");
        expect(notes).toHaveLength(evidence.caveats.length);
        expect(notes[0].getAttribute("title")).toBe(evidence.caveats[0]);
    });
    const rule = css.match(/\.compare-evidence-caveat\s*\{([^}]+)\}/)?.[1] ?? "";
    expect(rule).toContain("display: block");
    expect(rule).toContain("margin-top:");
});

test("sticky tray compare remains a native link with a visible 44px primary target", () => {
    const rows = ACTUATORS.slice(0, 2);
    const view = render(<CompareTray rows={rows} remove={() => {}} clear={() => {}} />);
    const link = view.getByRole("link", { name: "Compare selected actuators" });
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe(`/compare?compare=${rows.map(a => a.id).sort().join(",")}`);
    expect(link.hasAttribute("role")).toBe(false);
    expect(link.classList.contains("primary")).toBe(true);
    const rule = css.match(/\.pick-tray a\.primary\s*\{([^}]+)\}/)?.[1] ?? "";
    for (const declaration of ["display: inline-flex", "align-items: center", "justify-content: center", "min-height: 44px", "min-width: 44px", "border: 1px solid var(--cyan)", "background: var(--cyan)", "color: var(--black)"]) {
        expect(rule).toContain(declaration);
    }
});
