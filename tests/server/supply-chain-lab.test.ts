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
        const md = await res.text();
        expect(md).toContain("| Separation | CN 91%[^");
        expect(md).toContain("MP Materials revenue: $224.4M[^");
        expect(md).toContain("~$5.8-6B[^");
        expect(md).toContain("(model");
        expect(md).toContain("## Sources");
        expect(md).toMatch(
            /\[\^1\]: USGS, "Mineral Commodity Summaries 2026: Rare Earths"\. https:\/\/pubs\.usgs\.gov/,
        );
    }
});
