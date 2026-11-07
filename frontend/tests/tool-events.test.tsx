import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { ARM_TORQUE_PATH } from "../../src/engineering/arm-torque";
import { TOOL_QUANTITIES } from "../src/lib/tool-events";
import type { WebMcpTool } from "../src/lib/webmcp";
import { ArmTorqueCalculator } from "../src/pages/ArmTorqueCalculator";
import { MOTOR_TORQUE_PATH, MotorTorqueCalculator } from "../src/pages/MotorTorqueCalculator";

let results: unknown[] = [];
const record = (e: Event) => results.push((e as CustomEvent).detail);
window.addEventListener("actuatorlist:tool-result", record);

afterEach(() => {
    cleanup();
    results = [];
    delete (document as unknown as { modelContext?: unknown }).modelContext;
});

function setUrl(url: string) {
    (window as unknown as { happyDOM: { setURL: (u: string) => void } }).happyDOM.setURL(url);
}

test("a motor result shown at load is not a use; a visitor control change is", () => {
    setUrl(`http://localhost${MOTOR_TORQUE_PATH}?solve=torque&p=100&n=300`);
    const view = render(<MotorTorqueCalculator />);
    expect(results).toEqual([]);
    // Every visitor control goes through the page's one setter.
    fireEvent.change(view.getByLabelText("Speed unit"), { target: { value: "rads" } });
    expect(results).toEqual([{ quantity: "torque" }]);
    fireEvent.click(view.getByRole("button", { name: /Leg joint/ }));
    expect(results).toEqual([{ quantity: "torque" }, { quantity: "power" }]);
});

test("an in-page agent loading an arm is not a visitor use; a preset click is", async () => {
    const tools: WebMcpTool[] = [];
    (document as unknown as { modelContext: unknown }).modelContext = {
        registerTool: (t: WebMcpTool) => tools.push(t),
    };
    setUrl(`http://localhost${ARM_TORQUE_PATH}`);
    const view = render(<ArmTorqueCalculator />);
    await tools[0]?.execute({ links: [{ length_m: 0.5, mass_kg: 1 }, { length_m: 0.3, mass_kg: 0.5 }], payload_kg: 1 });
    await waitFor(() => expect(view.container.querySelectorAll(".arm-val")).toHaveLength(2));
    expect(results).toEqual([]);
    const preset = view.container.querySelector(".calc-examples button");
    if (!preset) throw new Error("preset missing");
    fireEvent.click(preset);
    expect(results).toEqual([{ quantity: "holding" }]);
});

test("shortlist links carry the measurement attributes the bootstrap checks against their href", () => {
    setUrl(`http://localhost${MOTOR_TORQUE_PATH}?solve=power&t=12&n=300`);
    const view = render(<MotorTorqueCalculator />);
    const rows = [...view.container.querySelectorAll<HTMLAnchorElement>("a.req-name")];
    expect(rows.length).toBeGreaterThan(0);
    for (const a of rows) {
        expect(a.dataset).toMatchObject({ measureEvent: "tool_shortlist_click", measureSurface: "tool" });
        expect(a.getAttribute("href")).toBe(`/actuators/${a.dataset.productId}`);
    }
    const cta = view.container.querySelector<HTMLAnchorElement>("a.req-cta");
    expect(cta?.dataset.productId).toBeUndefined();
    expect(cta?.dataset.measureEvent).toBe("tool_shortlist_click");
});

test("the bootstrap allowlists every tool route and quantity the pages send", async () => {
    const source = await Bun.file(`${import.meta.dir}/../public/measurement.js`).text();
    for (const value of [MOTOR_TORQUE_PATH, ARM_TORQUE_PATH, ...TOOL_QUANTITIES]) expect(source).toContain(`"${value}"`);
});
