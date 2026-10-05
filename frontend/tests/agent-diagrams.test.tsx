import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { cleanup, render, waitFor } from "@testing-library/react";
import { DEFAULT_ARM, armToQuery } from "../../src/engineering/arm-torque";
import { buildTools, type WebMcpTool } from "../src/lib/webmcp";
import { ArmTorqueCalculator } from "../src/pages/ArmTorqueCalculator";

afterEach(() => {
    cleanup();
    delete (document as unknown as { modelContext?: unknown }).modelContext;
});

function setUrl(url: string) {
    (window as unknown as { happyDOM: { setURL: (u: string) => void } }).happyDOM.setURL(url);
}

const ARGS = {
    links: [
        { length_m: 0.4, mass_kg: 1.2, actuator_mass_kg: 1 },
        { length_m: 0.35, mass_kg: 0.8, actuator_mass_kg: 0.5 },
        { length_m: 0.12, mass_kg: 0.3 },
    ],
    payload_kg: 2,
};

test("site-wide WebMCP computes arm holding torque and rejects bad input", async () => {
    const tool = buildTools().find((t) => t.name === "calculate_arm_holding_torque");
    if (!tool) throw new Error("tool missing");
    const ok = (await tool.execute(ARGS)).structuredContent as {
        joints: { holding_torque_nm: number }[];
        calculator_url: string;
    };
    expect(ok.joints.map((j) => j.holding_torque_nm)).toEqual([33.91, 13.51, 2.53]);
    expect(ok.calculator_url).toBe(`https://actuatorlist.com/tools/robot-arm-torque-calculator${armToQuery(DEFAULT_ARM)}`);
    expect((await tool.execute({ links: [], payload_kg: 1 })).isError).toBe(true);
    expect((await tool.execute({ links: [{ length_m: 0, mass_kg: 1 }], payload_kg: 1 })).isError).toBe(true);
});

test("the calculator registers page tools that drive its UI and unregister on unmount", async () => {
    const tools: WebMcpTool[] = [];
    const signals: AbortSignal[] = [];
    (document as unknown as { modelContext: unknown }).modelContext = {
        registerTool: (t: WebMcpTool, o?: { signal?: AbortSignal }) => {
            tools.push(t);
            if (o?.signal) signals.push(o.signal);
        },
    };
    setUrl("http://localhost/tools/robot-arm-torque-calculator");
    const view = render(<ArmTorqueCalculator />);
    expect(tools.map((t) => t.name)).toEqual(["set_arm_model", "select_arm_joint"]);
    await tools[0]?.execute({ links: [{ length_m: 0.5, mass_kg: 1, actuator_mass_kg: 0 }], payload_kg: 1 });
    await waitFor(() =>
        expect([...view.container.querySelectorAll(".arm-val")].map((e) => e.textContent)).toEqual(["7.35 N·m"]),
    );
    const joint = await tools[1]?.execute({ joint: 1 });
    expect((joint?.structuredContent as { name: string }).name).toBe("Shoulder");
    expect((await tools[1]?.execute({ joint: 2 }))?.isError).toBe(true);
    view.unmount();
    expect(signals.every((s) => s.aborted)).toBe(true);
});
