import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { ACTUATORS } from "@/catalog";
import { actuatorPath } from "@/server/agent/catalog-md";
import { CATALOG_UPDATED_DATE } from "@/server/agent/freshness";
import { GENERATED_COMPARISON_PAGES } from "@/server/agent/generated-comparisons";
import { markdownToHtml, pageBody } from "@/server/agent/html/body";
import { documentTitle } from "@/server/agent/html/head";
import { withToolCards } from "@/server/agent/html/tool-cards";
import { allPages, pageMarkdown } from "@/server/agent/pages";
import { expectTitles } from "./agent-helpers";
import baseline from "./short-titles-baseline.json";

// Golden metadata check for the page-title work. Not a *.test.ts file, so bun
// never discovers it: short-titles.test.ts runs it in a child process with
// short-titles-freeze.ts preloaded, so it always sees the frozen catalog.
// It locks titles, descriptions and head meta only; page content is covered
// by tests/server/agent-*.test.ts.

function sha256(value: string) {
    return createHash("sha256").update(value).digest("hex");
}

async function expectCatalogPage(
    page: ReturnType<typeof allPages>[number],
    original: (typeof baseline.pages)[number],
) {
    expect({ path: page.path, title: page.title }).toEqual({
        path: original.path,
        title: original.title,
    });
    expect(page.description).toBe(original.description);
    if (page.path === "/about") {
        expect(page.body()).toContain(
            `The catalog was last updated on ${CATALOG_UPDATED_DATE}.`,
        );
    }
    const currentBody = page.body();
    const actuator = ACTUATORS.find((a) => actuatorPath(a.id) === page.path);
    const html = await expectTitles(page.path, documentTitle(page.title));
    // The approved gallery replaces its transient Markdown fallback with
    // real cards: require the served tree.
    const builtGallery =
        page.path === "/actuators" && html.includes('data-gallery-prerender="true"');
    if (builtGallery) {
        // The built gallery comes from the frontend build of the live catalog,
        // which the freeze does not reach.
        const live = await Bun.file(
            `${import.meta.dir}/../../frontend/src/data/actuators.json`,
        ).json();
        expect([...html.matchAll(/class="bento-card(?: [^"]*)?"/g)]).toHaveLength(
            live.length,
        );
        expect(html).not.toContain("<summary>Catalog details</summary>");
    }
    const contentPattern =
        /<section class="ga-page" id="catalog-content"[^>]*>[\s\S]*?<\/section>|<main class="ga-main">[\s\S]*?<\/main>/;
    const content = contentPattern.exec(
        builtGallery ? pageBody(currentBody) : html,
    )?.[0];
    expect(content).toBeDefined();
    if (actuator) {
        // Check the real HTTP response against today's Markdown.
        const split = currentBody.indexOf("\n\n## Specifications");
        expect(split).toBeGreaterThan(0);
        const currentRendering = contentPattern.exec(
            pageBody(currentBody.slice(0, split)),
        )?.[0];
        expect(currentRendering).toBeDefined();
        expect(content).toBe(currentRendering);
        const persistent =
            /<section class="ga-page" id="catalog-content"[^>]*>([\s\S]*?)<\/section>/.exec(
                html,
            );
        expect(persistent).not.toBeNull();
        expect(persistent?.[1]).toBe(
            `<div class="ga-main">${withToolCards(markdownToHtml(currentBody.slice(split)))}</div>`,
        );
    }
    expect(html).toContain(
        `<link rel="canonical" href="https://actuatorlist.com${page.path}">`,
    );
    expect(html).toContain(
        `<meta name="description" content="${Bun.escapeHTML(original.description)}"`,
    );
    expect(html).toContain(
        `<meta property="og:description" content="${Bun.escapeHTML(original.description)}">`,
    );
    expect(html).toContain(
        `<meta name="twitter:description" content="${Bun.escapeHTML(original.description)}">`,
    );
    expect(pageMarkdown(page)).toContain(`title: ${JSON.stringify(page.title)}`);
    const item = page.jsonLd().find((node) => node["@type"] === "ItemPage");
    if (item) expect(item.name).toBe(page.title);
}

// Captured from the clean main baseline before implementation.
test("the full catalog has distinct reviewed metadata", async () => {
    const registered = allPages();
    expect(registered).toHaveLength(89 + GENERATED_COMPARISON_PAGES.length);
    // Pages added after the baseline capture have their own tests.
    const added = new Set([
        "/faq",
        "/compare",
        ...GENERATED_COMPARISON_PAGES.map((page) => page.path),
        "/tools/motor-torque-calculator",
        "/guides/humanoid-robot-actuators",
        "/tools/robot-arm-torque-calculator",
        "/startups",
        "/investors",
        "/humanoids",
        "/contributors",
        "/metals",
        "/policy",
    ]);
    const pages = registered.filter((page) => !added.has(page.path));
    expect(ACTUATORS).toHaveLength(68);
    expect(pages).toHaveLength(78);
    expect(pages.map((page) => page.path)).toEqual(
        baseline.pages.map((page) => page.path),
    );
    expect(new Set(pages.map((page) => documentTitle(page.title))).size).toBe(
        pages.length,
    );
    expect(sha256(JSON.stringify(ACTUATORS))).toBe(baseline.catalogSha256);
    for (const [index, page] of pages.entries()) {
        const original = baseline.pages[index];
        if (!original) throw new Error(`Missing baseline for ${page.path}`);
        await expectCatalogPage(page, original);
    }
});
