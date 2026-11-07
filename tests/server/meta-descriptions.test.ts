import { expect, test } from "bun:test";
import { findPage, pageMarkdown } from "@/server/agent/pages";
import { get } from "./agent-helpers";

async function expectDescription(path: string, expected: string) {
    const page = findPage(path);
    expect(page).not.toBeNull();
    if (!page) throw new Error(`Missing page ${path}`);
    expect(page.description).toBe(expected);
    // Editorial target for these four summaries, not a Google character limit.
    expect(expected.length).toBeLessThanOrEqual(160);
    const response = await get(path);
    expect(response.status).toBe(200);
    const html = await response.text();
    const escaped = Bun.escapeHTML(expected);
    expect(html).toContain(`<meta name="description" content="${escaped}"`);
    expect(html).toContain(`<meta property="og:description" content="${escaped}"`);
    expect(html).toContain(`<meta name="twitter:description" content="${escaped}"`);
    expect(pageMarkdown(page)).toContain(`description: ${JSON.stringify(expected)}`);
    const article = page.jsonLd().find((node) => node["@type"] === "TechArticle");
    if (article) expect(article.description).toBe(expected);
}

test("selection guide metadata distinguishes specifications from measured performance", async () => {
    await expectDescription(
        "/guides/robot-actuator-selection",
        "Choose robot actuators using efficiency, thermal duty, precision and sim2real evidence. Separate published specifications from unmeasured performance.",
    );
});

test("comparison metadata retains exact revision and the no-bench-test caveat", async () => {
    await expectDescription(
        "/comparisons/cubemars-ak80-9-vs-xiaomi-cybergear",
        "CubeMars AK80-9 V3.0 KV100 vs original 24 V Xiaomi CyberGear: efficiency, thermal duty, encoder conflicts and sim2real limits. Not a bench test.",
    );
});

test("CHA metadata names the family and explicitly marks missing catalog data", async () => {
    await expectDescription(
        "/actuators/harmonic-drive-cha-series",
        "Harmonic Drive CHA hollow-shaft servo actuator family. Torque, mass and price are unspecified in this catalog; confirm model-specific data.",
    );
});

test("homepage metadata summarizes comparison without a long category list", async () => {
    await expectDescription(
        "/",
        "Compare robot actuators by torque, weight, torque density and price. Browse QDD motors, integrated joints, smart servos and reducers.",
    );
});
