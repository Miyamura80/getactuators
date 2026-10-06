import "./happydom";
import { afterEach, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { cleanup, render, within } from "@testing-library/react";
import { JOINTS } from "../../src/server/agent/humanoid-joints";
import { buildTools, type WebMcpTool } from "../src/lib/webmcp";
import { HumanoidGuide } from "../src/pages/HumanoidGuide";

afterEach(() => {
    cleanup();
    delete (document as unknown as { modelContext?: unknown }).modelContext;
});

const markdown = readFileSync(
    new URL("../../src/server/agent/content/humanoid-robot-actuators.md", import.meta.url),
    "utf8",
);

test("the guide draws the /robots humanoid with a numbered link per joint", () => {
    (window as unknown as { happyDOM: { setURL: (u: string) => void } }).happyDOM.setURL(
        "http://localhost/guides/humanoid-robot-actuators",
    );
    const view = render(<HumanoidGuide />);
    // Same heading and lede as the server fallback and the .md twin.
    const [h1, , lede] = markdown.split("\n");
    expect(view.getByRole("heading", { level: 1 }).textContent).toBe(h1?.replace(/^# /, ""));
    expect(view.container.querySelector(".tool-lede")?.textContent).toBe(lede);
    // The drawing is the /robots canvas renderer; links ride on top of it.
    const figure = view.container.querySelector(".jm .draft-fig");
    expect(figure?.querySelector("canvas")).not.toBeNull();
    for (const j of JOINTS) {
        const callout = figure?.querySelector(`a.jm-callout.jm-${j.id}`);
        expect(callout?.getAttribute("href")).toBe(`#${j.id}`);
        expect(callout?.getAttribute("aria-label")).toBe(`${j.n}. ${j.name}: ${j.torqueNm.toFixed(1)} N·m static estimate`);
    }
    const knee = view.getByRole("row", { name: /Knee/ });
    expect(knee.textContent).toContain("69.1");
    // No rated fit: every pip is hollow and the screen carries a warning mark.
    expect(within(knee).getByRole("img", { name: /0 rated, \d+ peak only/ })).toBeTruthy();
    expect(knee.querySelector(".jm-warn")).toBeTruthy();
});

test("WebMCP: joint data site-wide, and a page tool that scrolls to a joint", async () => {
    const site = buildTools().find((t) => t.name === "get_humanoid_joint_requirements");
    if (!site) throw new Error("tool missing");
    const knee = (await site.execute({ joint: "knee" })).structuredContent as {
        joints: { static_torque_nm: number; section_url: string; shortlist: { page_url: string }[] }[];
    };
    expect(knee.joints).toHaveLength(1);
    expect(knee.joints[0]?.static_torque_nm).toBe(69.1);
    expect(knee.joints[0]?.section_url).toBe("https://actuatorlist.com/guides/humanoid-robot-actuators#knee");
    expect(knee.joints[0]?.shortlist[0]?.page_url).toStartWith("https://actuatorlist.com/actuators/");
    expect((await site.execute({ joint: "tail" })).isError).toBe(true);

    const tools: WebMcpTool[] = [];
    const signals: AbortSignal[] = [];
    (document as unknown as { modelContext: unknown }).modelContext = {
        registerTool: (t: WebMcpTool, o?: { signal?: AbortSignal }) => {
            tools.push(t);
            if (o?.signal) signals.push(o.signal);
        },
    };
    const view = render(<HumanoidGuide />);
    expect(tools.map((t) => t.name)).toEqual(["show_humanoid_joint"]);
    await tools[0]?.execute({ joint: "ankle" });
    expect(window.location.hash).toBe("#ankle");
    expect((await tools[0]?.execute({ joint: "tail" }))?.isError).toBe(true);
    view.unmount();
    expect(signals.every((s) => s.aborted)).toBe(true);
});
