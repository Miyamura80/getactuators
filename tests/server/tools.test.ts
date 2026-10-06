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
    // Each method section carries a line icon before its heading text.
    expect(persistent).toMatch(
        /<h2><svg class="ga-h2-icon ga-ic-method"[^>]*>[\s\S]*?<\/svg>How the calculator works<\/h2>/,
    );
    // Worked examples lead with the result; the working folds under it.
    expect(persistent).toContain(
        '<details class="ga-example"><summary><h3>7.85 N·m to hold 2 kg at 0.4 m on an arm</h3></summary><p>A 2 kg mass',
    );
    expect(persistent).toContain("T = 9.549 × P / n");
    // Each caveat is a chip: glyph and label up front, the reason on tap.
    expect(persistent).toMatch(
        /<ul class="ga-limits">[\s\S]*?<details class="ga-limit"><summary><svg[^>]*><path d="[^"]+"\/><\/svg><span>Stall torque is a motor rating<\/span><\/summary><p>At zero speed/,
    );
    expect(persistent.match(/class="ga-limit"/g)).toHaveLength(4);
    // Questions fold under themselves; the answers stay in the page.
    expect(persistent).toContain(
        '<details class="ga-example ga-faq"><summary><h3>Does a gearbox increase power?</h3></summary><p>No.',
    );
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
    expect(persistent).toMatch(
        /<h2><svg[^>]*>[\s\S]*?<\/svg>How the calculation works<\/h2>/,
    );
    // The results table stays open; inputs and working fold.
    expect(persistent).toMatch(
        /<h2><svg[^>]*>[\s\S]*?<\/svg>Worked example<\/h2>[\s\S]*?<td>Shoulder<\/td><td>33\.9 N·m<\/td>[\s\S]*?<details class="ga-example">/,
    );
    expect(persistent).toContain("<span>Motion torque</span></summary>");
    expect(persistent).toContain("<span>Safety margin</span></summary>");
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

test("actuator pages link each tool at that part's own numbers", async () => {
    const html = await (await get("/actuators/myactuator-rmd-x8-120")).text();
    const persistent =
        /<section class="ga-page" id="catalog-content"[^>]*>[\s\S]*?<\/section>/.exec(
            html,
        )?.[0] ?? "";
    // Server-rendered below the app as cards, so crawlers follow the links.
    expect(persistent).toContain('<h2>Size a joint</h2>\n<ul class="ga-tool-cards">');
    expect(persistent).toMatch(
        /<a class="ga-tool-card" href="\/tools\/motor-torque-calculator\?solve=power&amp;t=43&amp;n=127"><svg[^>]*><path d="[^"]+"\/><\/svg><strong>572 W<\/strong><span class="ga-tool-note">of shaft power at its rated 43 N·m and 127 rpm.<\/span><span class="ga-tool-name">Motor torque calculator →<\/span><\/a>/,
    );
    expect(persistent).toContain(
        'href="/tools/robot-arm-torque-calculator?L=0.4,0.35,0.12&amp;m=1.2,0.8,0.3&amp;a=1.4,0.5,0&amp;p=2"',
    );
    expect(persistent).toContain("<strong>35.5 N·m</strong>");
    expect(persistent).toContain('href="/guides/humanoid-robot-actuators#hip"');
    expect(persistent).toContain("<strong>6 of 7 joints</strong>");
    expect(persistent.match(/class="ga-tool-card"/g)).toHaveLength(3);
    // The Markdown twin keeps the plain list.
    const md = await (await getMarkdown("/actuators/myactuator-rmd-x8-120")).text();
    expect(md).toContain(
        "- [Motor torque calculator](/tools/motor-torque-calculator?solve=power&t=43&n=127): **572 W** of shaft power",
    );
    // Drives and reducers document no torque or mass: no section.
    const drive = await (await get("/actuators/odrive-v36")).text();
    expect(drive).not.toContain("Size a joint");
    const guide = await (await get("/guides/robot-actuator-selection")).text();
    expect(guide).toContain('href="/tools/robot-arm-torque-calculator"');
});
