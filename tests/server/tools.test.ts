import { expect, test } from "bun:test";
import { findPage } from "@/server/agent/pages";
import { MOTOR_TORQUE_PATH } from "@/server/agent/tools";
import { get, getMarkdown } from "./agent-helpers";

test("motor torque calculator is an indexable tool with persistent method content", async () => {
    const page = findPage(MOTOR_TORQUE_PATH);
    expect(page?.kind).toBe("spa");
    expect(page?.description.length).toBeLessThanOrEqual(160);
    const response = await get(MOTOR_TORQUE_PATH);
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain(
        `<link rel="canonical" href="https://actuatorlist.com${MOTOR_TORQUE_PATH}">`,
    );
    expect(html).toContain(
        "<title>Motor torque calculator: torque, power and RPM | actuatorlist</title>",
    );
    // Fallback inside #root carries the H1; the method stays after React mounts.
    const root = /<div id="root">([\s\S]*?)<\/div>\s*<section/.exec(html)?.[1] ?? "";
    expect(root).toContain("<h1>Motor torque calculator: torque, power and RPM</h1>");
    expect(root).not.toContain("How the calculator works");
    const persistent =
        /<section class="ga-page" id="catalog-content"[^>]*>[\s\S]*?<\/section>/.exec(
            html,
        )?.[0] ?? "";
    expect(persistent).toContain('aria-label="Method, examples and questions"');
    expect(persistent).toContain(
        '<h2 id="how-the-calculator-works">How the calculator works</h2>',
    );
    // Sections fold behind a heading and a one-line payload; the text stays in the page.
    expect(persistent).toContain(
        '<details class="ga-fold"><summary><h2 id="formulas">Formulas</h2>',
    );
    expect(persistent).toContain("100 W at 300 rpm is 3.18 N·m");
    expect(persistent).toContain("T = 9.549 × P / n");
    expect(persistent).toContain("Not a stall rating.");
    expect(html.match(/<footer class="site-footer"/g)).toHaveLength(1);
    const graph = JSON.parse(
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)?.[1] ??
            "{}",
    )["@graph"];
    const app = graph.find((n: { "@type": string }) => n["@type"] === "WebApplication");
    expect(app.url).toBe(`https://actuatorlist.com${MOTOR_TORQUE_PATH}`);
    expect(app.offers.price).toBe("0");
});

test("motor torque calculator has a markdown twin, sitemap entry and footer link", async () => {
    const twin = await (await get(`${MOTOR_TORQUE_PATH}.md`)).text();
    expect(twin).toContain("# Motor torque calculator: torque, power and RPM");
    expect(await (await getMarkdown(MOTOR_TORQUE_PATH)).text()).toBe(twin);
    expect(await (await get("/sitemap.xml")).text()).toContain(
        `https://actuatorlist.com${MOTOR_TORQUE_PATH}`,
    );
    expect(await (await get("/")).text()).toContain(
        `<a href="${MOTOR_TORQUE_PATH}">Motor torque calculator</a>`,
    );
});

test("robot arm calculator is a separate indexable tool with its method below", async () => {
    const path = "/tools/robot-arm-torque-calculator";
    expect(findPage(path)?.description.length).toBeLessThanOrEqual(160);
    const html = await (await get(path)).text();
    expect(html).toContain(
        "<title>Robot arm torque calculator: holding torque per joint | actuatorlist</title>",
    );
    const persistent =
        /<section class="ga-page" id="catalog-content"[^>]*>[\s\S]*?<\/section>/.exec(
            html,
        )?.[0] ?? "";
    expect(persistent).toContain(
        '<h2 id="how-the-calculation-works">How the calculation works</h2>',
    );
    expect(persistent).toContain(
        '<span class="ga-fold-meta">Shoulder 33.9, elbow 13.5, wrist 2.5 N·m</span>',
    );
    expect(persistent).toContain("Not motion torque.");
    expect(persistent).toContain("No universal margin.");
    expect(await (await get(`${path}.md`)).text()).toContain("| Shoulder | 33.9 N·m |");
    expect(await (await get("/sitemap.xml")).text()).toContain(
        `https://actuatorlist.com${path}`,
    );
});

test("arm_holding_torque MCP tool matches the calculator and links back to it", async () => {
    const { CATALOG_TOOLS } = await import("@/mcp/server");
    const tool = CATALOG_TOOLS.find((t) => t.name === "arm_holding_torque");
    if (!tool) throw new Error("tool missing");
    const out = tool.run({
        links: [
            { length_m: 0.4, mass_kg: 1.2, actuator_mass_kg: 1 },
            { length_m: 0.35, mass_kg: 0.8, actuator_mass_kg: 0.5 },
            // Ignored: the payload sits on the last link's far end.
            { length_m: 0.12, mass_kg: 0.3, actuator_mass_kg: 9 },
        ],
        payload_kg: 2,
        com_fraction: 0.5,
        limit: 3,
    } as never) as {
        joints: {
            name: string;
            holding_torque_nm: number;
            shortlist: { page_url: string; fit: string }[];
        }[];
        calculator_url: string;
    };
    expect(out.joints.map((j) => [j.name, j.holding_torque_nm])).toEqual([
        ["Shoulder", 33.91],
        ["Elbow", 13.51],
        ["Wrist", 2.53],
    ]);
    expect(out.joints[0]?.shortlist[0]?.page_url).toStartWith(
        "https://actuatorlist.com/actuators/",
    );
    expect(out.calculator_url).toBe(
        "https://actuatorlist.com/tools/robot-arm-torque-calculator?L=0.4,0.35,0.12&m=1.2,0.8,0.3&a=1,0.5,0&p=2",
    );
    const llms = await (await get("/llms.txt")).text();
    expect(llms).toContain("/tools/robot-arm-torque-calculator.md");
    expect(llms).toContain("arm_holding_torque");
});
