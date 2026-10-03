import { expect, test } from "bun:test";
import { get } from "./agent-helpers";

test("static and fallback public headers expose native mobile navigation and active page", async () => {
    for (const path of [
        "/",
        "/robots",
        "/all",
        "/agents",
        "/faq",
        "/guides",
        "/about",
    ]) {
        const html = await (await get(path)).text();
        expect(html).toContain('<header class="site-header">');
        expect(html).toContain('<details class="site-menu">');
        expect(html).toContain(
            '<summary aria-controls="public-navigation">Menu</summary>',
        );
        if (path !== "/about")
            expect(html).toContain(`href="${path}" aria-current="page"`);
        expect(html).toContain('class="alpha-tag">alpha');
    }
});

test("product footer follows the persistent specifications rather than the transient app root", async () => {
    const html = await (await get("/actuators/cubemars-ak80-9")).text();
    expect(html.indexOf('<footer class="site-footer"')).toBeGreaterThan(
        html.indexOf('id="catalog-content"'),
    );
    expect([...html.matchAll(/<footer class="site-footer"/g)]).toHaveLength(1);
});

test("public pages have one grouped footer with valid internal links", async () => {
    for (const path of [
        "/",
        "/all",
        "/robots",
        "/agents",
        "/about",
        "/faq",
        "/guides",
        "/actuators/cubemars-ak80-9",
    ]) {
        const html = await (await get(path)).text();
        const footers = [
            ...html.matchAll(/<footer class="site-footer"[^>]*>([\s\S]*?)<\/footer>/g),
        ];
        expect(footers).toHaveLength(1);
        for (const group of ["Catalog", "Resources", "Project"])
            expect(footers[0]?.[1]).toContain(group);
        const footer = footers[0]?.[1];
        if (!footer) throw new Error(`Missing footer: ${path}`);
        for (const match of footer.matchAll(/href="(\/[^"#]*)"/g)) {
            const href = match[1];
            if (!href) throw new Error("Missing footer href");
            expect((await get(href)).status).toBe(200);
        }
    }
});
