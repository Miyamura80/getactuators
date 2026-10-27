import { expect, test } from "bun:test";
import { allPages } from "@/server/agent/pages";
import { get, getMarkdown } from "./agent-helpers";

test("/lab/supply-chain is served, noindex and kept out of discovery", async () => {
    const res = await get("/lab/supply-chain");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('<meta name="robots" content="noindex, follow">');
    expect(allPages().some((p) => p.path.startsWith("/lab"))).toBe(false);
    expect(await (await get("/sitemap.xml")).text()).not.toContain("/lab/");
    expect(await (await get("/llms.txt")).text()).not.toContain("/lab/");
});

test("the lab twin renders markdown footnotes and a Sources section", async () => {
    for (const res of [
        await get("/lab/supply-chain.md"),
        await getMarkdown("/lab/supply-chain"),
    ]) {
        expect(res.status).toBe(200);
        expect(res.headers.get("x-robots-tag")).toBe("noindex");
        const md = await res.text();
        expect(md).toContain("| Separation | 🇨🇳 CN ~91%[^");
        expect(md).toContain("| AgiBot | 🇨🇳 CN | 39%[^");
        expect(md).toContain("| Harmonic Drive Systems | 🇯🇵 JP | - |");
        expect(md).toContain("MP Materials revenue: $224.4M[^");
        expect(md).toContain("~$5.8-6B[^");
        expect(md).toContain("(model");
        expect(md).toContain("## 3D explode kit");
        expect(md).toContain("- **Strain-wave joint**: Optical encoder, Housing,");
        expect(md).toContain("Fill > Align > Press > Eject.");
        expect(md).toContain("## Sources");
        expect(md).toMatch(
            /\[\^1\]: USGS, "Mineral Commodity Summaries 2026: Rare Earths"\. https:\/\/pubs\.usgs\.gov/,
        );
    }
});

test("the lab HTML carries a server-rendered world map before hydration", async () => {
    const html = await (await get("/lab/supply-chain")).text();
    const svg = html.match(
        /<figure class="ga-map"[^>]*><svg viewBox="0 0 960 500" role="img"[\s\S]*?<\/svg>/,
    )?.[0];
    expect(svg).toBeDefined();
    // China shaded on the magnet-share ramp, pins drawn with titles.
    expect(svg).toContain("<title>China</title>");
    expect(svg).toContain(
        "<title>JL MAG Rare-Earth · Ganzhou headquarters and magnet plant</title>",
    );
    expect((svg?.match(/<g fill=/g) ?? []).length).toBeGreaterThan(20);
});

test("the lab twin has the map and flow kits as tables", async () => {
    const md = await (await get("/lab/supply-chain.md")).text();
    expect(md).toContain("## Map kit");
    expect(md).toContain("| China (CN) | 94% |");
    expect(md).toMatch(
        /\| JL MAG Rare-Earth · Ganzhou [^|]*\| Magnets & motors \| 🇨🇳 CN \| city \|/,
    );
    expect(md).toContain(
        "| Ningbo Tuopu Group (CN) | Tesla (US) | Optimus actuator assemblies | estimated |",
    );
    expect(md).not.toContain("Shenghe Resources (CN) |");
    expect(md).toContain("## Flow kit");
    expect(md).toContain("| Actuators | Berkeley Humanoid Lite | $3,616 |");
});

test("indexed pages keep their markdown twin indexable", async () => {
    expect((await get("/robots.md")).headers.get("x-robots-tag")).toBeNull();
});
