import { expect, test } from "bun:test";
import { HUMANOID_GUIDE_PATH, jointBlock } from "@/server/agent/humanoid-guide";
import { JOINTS, jointShortlist } from "@/server/agent/humanoid-joints";
import { findPage } from "@/server/agent/pages";
import { get, getMarkdown } from "./agent-helpers";

test("joint estimates are the stated static working, rounded", () => {
    const knee = JOINTS.find((j) => j.id === "knee");
    expect(knee?.torqueNm).toBe(69.1);
    expect(knee?.working).toBe("47 × 9.807 × 0.15");
    expect(JOINTS.map((j) => j.n)).toEqual([1, 2, 3, 4, 5, 6, 7]);
});

test("every shortlisted entry is humanoid-tagged and documents enough torque", () => {
    for (const j of JOINTS) {
        const list = jointShortlist(j, Number.POSITIVE_INFINITY);
        expect(list.total).toBeGreaterThan(0);
        for (const { actuator: a, torque } of list.rows) {
            expect(
                a.use_cases.some((u) => u === "humanoid_joint" || u === "humanoid"),
            ).toBe(true);
            const value = torque === "rated" ? a.rated_torque_nm : a.peak_torque_nm;
            expect(value ?? 0).toBeGreaterThanOrEqual(j.torqueNm);
        }
        const block = jointBlock(j);
        for (const { actuator: a } of jointShortlist(j).rows) {
            expect(block).toContain(`(/actuators/${a.id})`);
        }
    }
    // The knee exceeds every tagged rated torque: the guide must say so.
    const knee = JOINTS.find((j) => j.id === "knee");
    if (!knee) throw new Error("knee missing");
    expect(jointBlock(knee)).toContain(
        "No humanoid-tagged entry documents a rated torque this high",
    );
});

test("humanoid guide is an app page whose guide text stays below the joint map", async () => {
    const page = findPage(HUMANOID_GUIDE_PATH);
    expect(page?.kind).toBe("spa");
    expect(page?.description.length).toBeLessThanOrEqual(160);
    const response = await get(HUMANOID_GUIDE_PATH);
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain(
        `<link rel="canonical" href="https://actuatorlist.com${HUMANOID_GUIDE_PATH}">`,
    );
    // Before React mounts, #root holds the H1 and lede; the guide text from
    // "How to read this guide" on persists below it with linkable sections.
    const root = /<div id="root">([\s\S]*?)<\/div>\s*<section/.exec(html)?.[1] ?? "";
    expect(root).toContain("<h1>Humanoid robot actuators: what each joint needs");
    expect(root).not.toContain("How to read this guide");
    const persistent =
        /<section class="ga-page" id="catalog-content"[^>]*>[\s\S]*?<\/section>/.exec(
            html,
        )?.[0] ?? "";
    expect(persistent).toContain('aria-label="Method, joint estimates and shortlists"');
    expect(persistent).toMatch(
        /<h2 id="how-to-read-this-guide"><svg[^>]*>[\s\S]*?<\/svg>How to read this guide<\/h2>/,
    );
    for (const j of JOINTS)
        expect(persistent).toContain(`<h2 id="${j.id}">${j.name}</h2>`);
    // Each joint's catalog list renders as part rows with a gauge against
    // that joint's estimate; the knee has no rated fit, so its gauges read peak.
    expect(persistent.match(/<ol class="req-rows">/g)?.length).toBe(JOINTS.length);
    const knee = persistent.slice(
        persistent.indexOf('<h2 id="knee">'),
        persistent.indexOf('<h2 id="ankle">'),
    );
    expect(knee).toContain('class="fit-gauge peak"');
    expect(knee).not.toContain('class="fit-gauge rated"');
    const graph = JSON.parse(
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)?.[1] ??
            "{}",
    )["@graph"];
    expect(
        graph.find((n: { "@type": string }) => n["@type"] === "TechArticle")
            .description,
    ).toBe(page?.description);
    const twin = await (await get(`${HUMANOID_GUIDE_PATH}.md`)).text();
    // The twin keeps the plain Markdown list.
    expect(twin).toContain("Peak only: short duty.");
    expect(twin).not.toContain("req-rows");
    expect(await (await getMarkdown(HUMANOID_GUIDE_PATH)).text()).toBe(twin);
    expect(twin).not.toContain("{{joint:");
    expect(twin).toContain("**Estimate: 69.1 N·m static.**");
    expect(await (await get("/sitemap.xml")).text()).toContain(
        `https://actuatorlist.com${HUMANOID_GUIDE_PATH}`,
    );
});

test("agents get the joint data over MCP and find it in llms.txt", async () => {
    const { CATALOG_TOOLS } = await import("@/mcp/server");
    const tool = CATALOG_TOOLS.find((t) => t.name === "humanoid_joint_requirements");
    if (!tool) throw new Error("tool missing");
    const out = tool.run({ joint: "knee", limit: 3 } as never) as {
        joints: {
            static_torque_nm: number;
            shortlist: { page_url: string }[];
            section_url: string;
        }[];
        guide_url: string;
    };
    expect(out.joints).toHaveLength(1);
    expect(out.joints[0]?.static_torque_nm).toBe(69.1);
    expect(out.joints[0]?.section_url).toBe(
        `https://actuatorlist.com${HUMANOID_GUIDE_PATH}#knee`,
    );
    expect(out.joints[0]?.shortlist[0]?.page_url).toStartWith(
        "https://actuatorlist.com/actuators/",
    );

    const llms = await (await get("/llms.txt")).text();
    expect(llms).toContain("/guides/humanoid-robot-actuators.md");
    expect(llms).toContain("humanoid_joint_requirements");
});
