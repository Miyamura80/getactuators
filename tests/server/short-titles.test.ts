import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { ACTUATORS } from "@/catalog";
import { CATALOG_UPDATED_DATE } from "@/server/agent/freshness";
import { pageBody } from "@/server/agent/html/body";
import { documentTitle } from "@/server/agent/html/head";
import { allPages, findPage, pageMarkdown } from "@/server/agent/pages";
import { get } from "./agent-helpers";
import baseline from "./short-titles-baseline.json";

async function expectTitles(path: string, title: string) {
    const response = await get(path);
    expect(response.status).toBe(200);
    const html = await response.text();
    const escaped = Bun.escapeHTML(title);
    expect(html).toContain(`<title>${escaped}</title>`);
    expect(html).toContain(`<meta property="og:title" content="${escaped}">`);
    expect(html).toContain(`<meta name="twitter:title" content="${escaped}">`);
    return html;
}

function sha256(value: string) {
    return createHash("sha256").update(value).digest("hex");
}

// Freshness is resolved from env, git history or filesystem mtime. Shallow CI
// checkouts need not resolve the same date as the clean-main capture. Normalize
// only this specific catalog-freshness sentence; preserve every other byte.
function snapshotContent(value: string) {
    return value.replace(
        `The catalog was last updated on ${CATALOG_UPDATED_DATE}.`,
        `The catalog was last updated on ${baseline.catalogUpdatedDate}.`,
    );
}

// Captured from the clean main baseline before implementation. Only expected
// metadata labels differ; hashes lock down original content, not head markup.
test("the full catalog has distinct reviewed metadata without content changes", async () => {
    const pages = allPages();
    expect(ACTUATORS).toHaveLength(68);
    expect(pages).toHaveLength(79);
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
        expect(sha256(snapshotContent(page.body()))).toBe(original.bodySha256);
        const html = await expectTitles(page.path, documentTitle(page.title));
        // The approved gallery replaces its transient Markdown fallback with
        // real cards. Still lock its canonical prose rendering to the original
        // hash, and require the served tree; never regenerate golden hashes.
        const builtGallery =
            page.path === "/actuators" &&
            html.includes('data-gallery-prerender="true"');
        if (builtGallery) {
            expect([...html.matchAll(/class="bento-card(?: [^"]*)?"/g)]).toHaveLength(
                68,
            );
            expect(html).not.toContain("<summary>Catalog details</summary>");
        }
        const content =
            /<section class="ga-page" id="catalog-content"[^>]*>[\s\S]*?<\/section>|<main class="ga-main">[\s\S]*?<\/main>/.exec(
                builtGallery ? pageBody(page.body()) : html,
            )?.[0];
        expect(content).toBeDefined();
        expect(sha256(snapshotContent(content ?? ""))).toBe(original.htmlContentSha256);
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
});

test("editorial metadata is independent of the research headline", async () => {
    for (const [path, title] of [
        ["/guides/robot-actuator-selection", "Robot actuator selection guide"],
        [
            "/comparisons/cubemars-ak80-9-vs-xiaomi-cybergear",
            "CubeMars AK80-9 V3.0 KV100 vs Xiaomi CyberGear",
        ],
    ]) {
        const page = findPage(path ?? "");
        expect(page?.title).toBe(title);
        const headline = page?.body().split("\n")[0]?.slice(2);
        expect(headline).not.toBe(title);
        expect(
            page?.jsonLd().find((node) => node["@type"] === "TechArticle")?.headline,
        ).toBe(headline);
        const html = await expectTitles(path ?? "", `${title} | actuatorlist`);
        expect(html).toContain(Bun.escapeHTML(headline ?? ""));
    }
});

test("product metadata uses a compact brand and keeps voltage qualifiers", async () => {
    const path = "/actuators/steadywin-gim6010-36";
    const page = findPage(path);
    expect(page?.title).toBe("Steadywin GIM6010-36 (48V) specs");
    const html = await expectTitles(
        path,
        "Steadywin GIM6010-36 (48V) specs | actuatorlist",
    );
    expect(html).toContain("GIM6010-36 (48V)");
    expect(page?.body()).toStartWith("# GIM6010-36 (48V)");
});
