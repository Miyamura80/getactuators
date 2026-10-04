import { expect, test } from "bun:test";
import { allPages, findPage } from "@/server/agent/pages";
import { get, getMarkdown } from "./agent-helpers";

test("comparison is a real canonical route with Markdown, sitemap, fallback and shared navigation", async () => {
    expect(findPage("/compare")?.kind).toBe("spa");
    expect(allPages().filter((p) => p.path === "/compare")).toHaveLength(1);
    const html = await (await get("/compare")).text();
    expect(html).toContain('href="https://actuatorlist.com/compare"');
    expect(html).toContain("Compare actuators");
    expect(html).toContain('href="/compare.md"');
    expect(html).toContain('href="/compare"');
    expect(await (await getMarkdown("/compare")).text()).toContain("Pick 2–4");
    expect(await (await get("/compare.md")).text()).toContain("Pick 2–4");
    expect(await (await get("/sitemap.xml")).text()).toContain(
        "https://actuatorlist.com/compare</loc>",
    );
    expect((await get("/compare/not-a-route")).status).toBe(404);
});

test("shared comparison renders real photos, aligned specs, unknowns and exact revision caveats without JavaScript", async () => {
    const path = "/compare?compare=xiaomi-cybergear,cubemars-ak80-9";
    const html = await (await get(path)).text();
    expect(html).toContain("/actuator-images/cubemars-ak80-9.webp");
    expect(html).toContain("/actuator-images/xiaomi-cybergear.webp");
    expect(html).toContain("Complete actuator efficiency");
    expect(html).toContain("Cooling / thermal duty");
    expect(html).toContain("Loaded repeatability");
    expect(html).toContain("Calibrated simulation model");
    expect(html).toContain("Unknown: not documented");
    expect(html).toContain("V3.0 KV100");
    expect(html).toContain("Original 24 V, 7.75:1, 317 g");
    const md = await (await get(`${path.replace("/compare?", "/compare.md?")}`)).text();
    expect(md).toContain("AK80-9");
    expect(md).toContain("Complete actuator efficiency");
    expect(await (await getMarkdown(path)).text()).toBe(md);
});
