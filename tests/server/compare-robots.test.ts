import { expect, test } from "bun:test";
import { get } from "./agent-helpers";

test("query selection is noindex across served HTML, Markdown twins and content negotiation", async () => {
    for (const query of [
        "?compare=cubemars-ak80-9,xiaomi-cybergear",
        "?compare=cubemars-ak80-9",
        "?compare=nope",
        "?compare=",
    ]) {
        for (const [path, headers] of [
            [`/compare${query}`, {}],
            [`/compare.md${query}`, {}],
            [`/compare${query}`, { accept: "text/markdown" }],
        ] as const) {
            const response = await get(path, headers);
            expect(response.status).toBe(200);
            expect(response.headers.get("x-robots-tag")).toBe("noindex, follow");
            const body = await response.text();
            expect(body).toContain(
                path.startsWith("/compare.md") || "accept" in headers
                    ? "canonical: https://actuatorlist.com/compare\n"
                    : '<link rel="canonical" href="https://actuatorlist.com/compare">',
            );
        }
    }
    for (const [path, headers] of [
        ["/compare", {}],
        ["/compare.md", {}],
        ["/compare", { accept: "text/markdown" }],
    ] as const) {
        const response = await get(path, headers);
        expect(response.status).toBe(200);
        expect(response.headers.get("x-robots-tag")).toBeNull();
        expect(await response.text()).not.toContain('content="noindex, follow"');
    }
    expect(await (await get("/sitemap.xml")).text()).not.toContain("?compare=");
});
