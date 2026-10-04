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

test("humanoid guide serves a linked joint map, article metadata and a twin", async () => {
    const page = findPage(HUMANOID_GUIDE_PATH);
    expect(page?.kind).toBe("static");
    expect(page?.description.length).toBeLessThanOrEqual(160);
    const response = await get(HUMANOID_GUIDE_PATH);
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain(
        `<link rel="canonical" href="https://actuatorlist.com${HUMANOID_GUIDE_PATH}">`,
    );
    // The map follows the lede and every balloon targets a real section.
    expect(html.indexOf('<div class="jm">')).toBeGreaterThan(html.indexOf("</h1>"));
    for (const j of JOINTS) {
        expect(html).toContain(`<a class="jm-callout jm-${j.id}" href="#${j.id}"`);
        expect(html).toContain(`<h2 id="${j.id}">${j.name}</h2>`);
    }
    const graph = JSON.parse(
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)?.[1] ??
            "{}",
    )["@graph"];
    expect(
        graph.find((n: { "@type": string }) => n["@type"] === "TechArticle")
            .description,
    ).toBe(page?.description);
    const twin = await (await get(`${HUMANOID_GUIDE_PATH}.md`)).text();
    expect(await (await getMarkdown(HUMANOID_GUIDE_PATH)).text()).toBe(twin);
    expect(twin).not.toContain("{{joint:");
    expect(twin).toContain("**Estimate: 69.1 N·m static.**");
    expect(await (await get("/sitemap.xml")).text()).toContain(
        `https://actuatorlist.com${HUMANOID_GUIDE_PATH}`,
    );
});
