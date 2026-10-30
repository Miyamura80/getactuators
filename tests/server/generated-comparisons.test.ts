import { expect, test } from "bun:test";
import { ACTUATORS, getActuator } from "@/catalog";
import { GENERATED_COMPARISON_PAGES } from "@/server/agent/generated-comparisons";
function model(id: string) {
    const record = getActuator(id);
    if (!record) throw new Error(`Missing test model: ${id}`);
    return record;
}
import { COMPARE_SPECS, COMPARISON_PHOTO_NOTE, revisionNote } from "@/catalog/compare";
import {
    type ComparisonPair,
    buildComparisonRegistry,
} from "@/catalog/comparison-registry";
import { comparisonHub } from "@/server/agent/comparison-hub";
import { allPages, findPage } from "@/server/agent/pages";
import { get } from "./agent-helpers";

test("SSR authored features omit removed or renamed catalog references", () => {
    for (const records of [
        ACTUATORS.filter((a) => a.id !== "cubemars-ak80-9"),
        ACTUATORS.map((a) =>
            a.id === "cubemars-ak80-9" ? { ...a, id: "renamed-ak80-9" } : a,
        ),
    ]) {
        expect(comparisonHub("html", records)).not.toContain(
            'class="comparison-feature"',
        );
        expect(comparisonHub("md", records)).not.toContain("original Xiaomi CyberGear");
    }
});

const editorialPath = "/comparisons/cubemars-ak80-9-vs-xiaomi-cybergear";
const pairs = buildComparisonRegistry(ACTUATORS);
test("hub mass qualifies retained AK80-9 revision conflict beside the number", async () => {
    const html = await (await get("/compare")).text();
    expect(html).toContain(
        "485 g: Revision conflict: retained catalog value; confirm installed revision.",
    );
    expect(model("cubemars-ak80-9").weight_g).toBe(485);
});
function firstPair() {
    const pair = pairs.at(0);
    if (!pair) throw new Error("No comparison pairs");
    return pair;
}

test("SSR category fragments target focusable native sections", async () => {
    const html = await (await get("/compare")).text();
    const targets = [...html.matchAll(/href="#(compare-[^"]+)"/g)].map(
        (match) => match[1],
    );
    expect(targets.length).toBeGreaterThan(0);
    for (const id of targets)
        expect(html).toContain(`<section id="${id}" tabindex="-1">`);
});

test("generated Markdown photos retain illustrative provenance", async () => {
    const md = await (await get(`${firstPair().path}.md`)).text();
    expect(md).toContain("illustrative catalog photo; revision/variant unconfirmed");
    expect(md).toContain(
        "Catalog photo; illustrative. Confirm hardware revision/variant.",
    );
});

test("new hub and generated pair photos visibly qualify catalog provenance", async () => {
    for (const path of ["/compare", firstPair().path]) {
        const html = await (await get(path)).text();
        expect(html).toContain(
            "Catalog photo; illustrative. Confirm hardware revision/variant.",
        );
        const alts = [...html.matchAll(/<img[^>]*alt="([^"]+)"/g)].map(
            (match) => match[1],
        );
        expect(
            alts.some((alt) =>
                alt?.includes(
                    "illustrative catalog photo; revision/variant unconfirmed",
                ),
            ),
        ).toBe(true);
    }
});

test("generated catalog pair is served with exact models, evidence, metadata, markdown and sitemap", async () => {
    const pair = pairs.find(
        (p) => p.ids.includes("cubemars-ak80-9") && p.path !== editorialPath,
    );
    if (!pair) throw new Error("Missing researched comparison pair");
    const models = pair.ids.map((id) => model(id));
    const response = await get(pair.path);
    expect(response.status).toBe(200);
    const html = await response.text();
    const mdResponse = await get(`${pair.path}.md`);
    expect(mdResponse.status).toBe(200);
    const md = await mdResponse.text();
    const title = pair.ids.map((id) => model(id).name).join(" vs ");
    expect(html).toContain(`<h1>${Bun.escapeHTML(title)}</h1>`);
    expect(html).toContain(`<title>${Bun.escapeHTML(title)} | actuatorlist</title>`);
    expect(html).toContain(
        `rel="canonical" href="https://actuatorlist.com${pair.path}"`,
    );
    expect(md).toContain(`# ${title}`);
    expect(md).toContain("Arithmetic from catalog values");
    expect(html).toContain("Arithmetic from catalog values");
    for (const a of models) {
        expect(html).toContain(`href="/actuators/${a.id}"`);
        if (a.image_url) expect(html).toContain(`src="${a.image_url}"`);
        expect(html).toContain(Bun.escapeHTML(revisionNote(a)));
        expect(md).toContain(revisionNote(a));
        for (const spec of COMPARE_SPECS) {
            expect(html).toContain(Bun.escapeHTML(spec.display(a)));
            expect(md).toContain(spec.display(a));
        }
    }
    expect(html).toContain('data-actuator-id="cubemars-ak80-9" data-topic="thermal"');
    expect(html).toContain('"@type":"BreadcrumbList"');
    expect(html).not.toContain('"@type":"Review"');
    expect(html).not.toContain('"@type":"AggregateRating"');
    expect(await (await get("/sitemap.xml")).text()).toContain(
        `<loc>https://actuatorlist.com${pair.path}</loc>`,
    );
    expect(allPages().filter((p) => p.path === pair.path)).toHaveLength(1);
    expect(findPage(editorialPath)?.title).toBe(
        "CubeMars AK80-9 V3.0 KV100 vs Xiaomi CyberGear",
    );
});

test("reversed registered URLs redirect to one canonical; unknown, self and noneligible URLs are true 404s", async () => {
    const pair = firstPair();
    const reversed = `/comparisons/${[...pair.ids].reverse().join("-vs-")}`;
    for (const suffix of ["", ".md"]) {
        const response = await get(`${reversed}${suffix}?keep=1`);
        expect(response.status).toBe(301);
        expect(response.headers.get("location")).toBe(`${pair.path}${suffix}?keep=1`);
        const canonical = await get(`${pair.path}${suffix}`);
        expect(canonical.status).toBe(200);
    }
    const editorial = await get("/comparisons/xiaomi-cybergear-vs-cubemars-ak80-9");
    expect(editorial.status).toBe(301);
    expect(editorial.headers.get("location")).toBe(editorialPath);
    for (const slug of [
        "unknown-vs-missing",
        `${pair.ids[0]}-vs-${pair.ids[0]}`,
        "odrive-s1-vs-odrive-pro",
        "cubemars-ak60-6-vs-robstride-02",
    ]) {
        for (const suffix of ["", ".md"])
            expect((await get(`/comparisons/${slug}${suffix}`)).status).toBe(404);
    }
    const selected = await (await get(`/compare?compare=${pair.ids.join(",")}`)).text();
    expect(selected).toContain('<meta name="robots" content="noindex, follow">');
    expect(selected).toContain(
        'rel="canonical" href="https://actuatorlist.com/compare"',
    );
});

test("empty comparison hub exposes grouped native links to every registered pair and the authored dossier", async () => {
    const html = await (await get("/compare")).text();
    const md = await (await get("/compare.md")).text();
    expect(html).toContain('class="comparison-hub"');
    expect(html).toContain("How pairs are selected");
    expect(html).toContain("discoverability heuristic");
    expect(html).toContain(`href="${editorialPath}"`);
    for (const pair of pairs) {
        expect(html).toContain(`href="${pair.path}"`);
        expect(md).toContain(`](${pair.path})`);
    }
    const selected = await (
        await get(`/compare?compare=${firstPair().ids.join(",")}`)
    ).text();
    expect(selected).not.toContain('class="comparison-hub"');
});

test("products and pair pages expose registry-driven related comparisons without orphan links", async () => {
    const pair = firstPair();
    for (const id of pair.ids) {
        const html = await (await get(`/actuators/${id}`)).text();
        const md = await (await get(`/actuators/${id}.md`)).text();
        expect(html).toContain("Catalog comparisons");
        expect(md).toContain("## Catalog comparisons");
        expect(html).toContain(`href="${pair.path}"`);
        expect(md).toContain(`](${pair.path})`);
    }
    const html = await (await get(pair.path)).text();
    expect(html).toContain("Related catalog comparisons");
    const related = pairs.filter(
        (candidate) =>
            candidate.path !== pair.path &&
            candidate.ids.some((id) => pair.ids.includes(id)),
    );
    expect(related.length).toBeGreaterThan(0);
    expect(html).toContain(`href="${related.at(0)?.path}"`);
    expect(html).toContain('href="/compare"');
});

test("standalone pair visual has scoped responsive photo and table styles, not an unstyled SPA fragment", async () => {
    const html = await (await get(firstPair().path)).text();
    expect(html).toContain('<div class="comparison-document">');
    expect(html).toContain(".comparison-document .compare-products");
    expect(html).toContain(".comparison-document .compare-spec-scroll");
    expect(html).toContain("object-fit: contain");
    expect(html).toContain(".comparison-feature-photos");
});

function assertTemplatePage(pair: ComparisonPair, html: string, md: string) {
    const title = pair.ids.map((id) => model(id).name).join(" vs ");
    expect(html).toContain(`<h1>${Bun.escapeHTML(title)}</h1>`);
    expect(html).toContain(`<title>${Bun.escapeHTML(title)} | actuatorlist</title>`);
    const graph = JSON.parse(
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)?.[1] ??
            "{}",
    )["@graph"] as Record<string, unknown>[];
    expect(
        graph.some(
            (node) =>
                node["@type"] === "WebPage" &&
                node.url === `https://actuatorlist.com${pair.path}`,
        ),
    ).toBe(true);
    expect(graph.some((node) => node["@type"] === "BreadcrumbList")).toBe(true);
    const [left, right] = pair.ids.map((id) => model(id));
    if (!left || !right) throw new Error("Missing models");
    const delta = Number(
        ((left.peak_torque_nm ?? 0) - (right.peak_torque_nm ?? 0)).toFixed(3),
    );
    if (left.peak_torque_nm !== null && right.peak_torque_nm !== null)
        expect(md).toContain(`= ${delta} N·m.`);
}

test("every registry URL has unique exact-model metadata, one sitemap entry, a Markdown twin and working native links", async () => {
    const directory = (
        await import("@/catalog/comparison-registry")
    ).comparisonDirectory(ACTUATORS);
    const registered = allPages().filter((page) =>
        page.path.startsWith("/comparisons/"),
    );
    expect(registered.map((page) => page.path).sort()).toEqual(
        directory.map((pair) => pair.path).sort(),
    );
    expect(new Set(registered.map((page) => page.title)).size).toBe(registered.length);
    expect(new Set(registered.map((page) => page.description)).size).toBe(
        registered.length,
    );
    expect(new Set(registered.map((page) => page.body())).size).toBe(registered.length);
    const sitemap = await (await get("/sitemap.xml")).text();
    const internal = new Set<string>();
    for (const pair of directory) {
        const response = await get(pair.path);
        expect(response.status, pair.path).toBe(200);
        const html = await response.text();
        const mdResponse = await get(`${pair.path}.md`);
        expect(mdResponse.status, pair.path).toBe(200);
        const md = await mdResponse.text();
        expect(await (await get(pair.path, { accept: "text/markdown" })).text()).toBe(
            md,
        );
        expect(
            sitemap.split(`<loc>https://actuatorlist.com${pair.path}</loc>`),
        ).toHaveLength(2);
        expect(html).toContain(
            `rel="canonical" href="https://actuatorlist.com${pair.path}"`,
        );
        const reversed = `/comparisons/${[...pair.ids].reverse().join("-vs-")}`;
        expect(sitemap).not.toContain(`<loc>https://actuatorlist.com${reversed}</loc>`);
        expect((await get(reversed)).status).toBe(301);
        const page = findPage(pair.path);
        if (!page) throw new Error(`Unregistered ${pair.path}`);
        expect(md).toContain(`title: ${JSON.stringify(page.title)}`);
        expect(html).toContain(
            `property="og:description" content="${Bun.escapeHTML(page.description)}"`,
        );
        if (pair.path !== editorialPath) assertTemplatePage(pair, html, md);
        new HTMLRewriter()
            .on('a[href^="/"]', {
                element(el) {
                    const href = el.getAttribute("href");
                    if (href) internal.add(href.split("#")[0] ?? href);
                },
            })
            .transform(html);
    }
    for (const path of internal) expect((await get(path)).status, path).toBe(200);
});

test("checked-in client comparison captures match current HTTP output", async () => {
    const captures = (await Bun.file(
        "frontend/tests/fixtures/comparisons.json",
    ).json()) as { path: string; root: string }[];
    expect(captures.map((capture) => capture.path)).toEqual([
        "/compare",
        "/compare?compare=cubemars-ak80-9,xiaomi-cybergear",
    ]);
    for (const capture of captures) {
        const html = await (await get(capture.path)).text();
        const root =
            /<div id="root">([\s\S]*)<\/div>\s*(?:<script[^>]*>[\s\S]*?<\/script>\s*)*<\/body>/.exec(
                html,
            )?.[1];
        expect(root).toBe(capture.root);
    }
});

test("a comparison states each caveat once, not once per model", async () => {
    const page = allPages().find(
        (p) =>
            p.path.startsWith("/comparisons/") && !p.path.includes("xiaomi-cybergear"),
    );
    if (!page) throw new Error("No generated comparison page");
    const html = await (await get(page.path)).text();
    const main = html.slice(html.indexOf("<main"));
    expect(main.split(Bun.escapeHTML(COMPARISON_PHOTO_NOTE))).toHaveLength(2);
    const ids = page.path.replace("/comparisons/", "").split("-vs-");
    for (const id of ids) {
        const note = Bun.escapeHTML(
            revisionNote(
                getActuator(id) as NonNullable<ReturnType<typeof getActuator>>,
            ),
        );
        expect(main.split(note).length - 1).toBeLessThanOrEqual(1);
        expect(main).toContain(note);
    }
});

test("generated markdown opens with its own heading, not the /compare intro", () => {
    for (const page of GENERATED_COMPARISON_PAGES) {
        const body = page.body();
        expect(body.startsWith(`# ${page.title}\n\n${page.description}`)).toBe(true);
        expect(body).not.toContain("# Compare actuators");
        expect(body).not.toContain("Share the selected URL");
    }
});
