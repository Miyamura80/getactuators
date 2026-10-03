import { expect, test } from "bun:test";
import { findPage } from "@/server/agent/pages";
import { get } from "./agent-helpers";

// Backend CI does not build frontend/dist. Exercise the same asset route in
// an isolated process using checked-in public assets, without mutating the
// cached DIST_DIR in the rest of the server tests.
async function targetStatus(path: string): Promise<number> {
    if (!path.startsWith("/actuator-images/")) return (await get(path)).status;
    const child = Bun.spawnSync({
        cmd: [
            process.execPath,
            "--eval",
            `import { get } from "./tests/server/agent-helpers"; console.log((await get(${JSON.stringify(path)})).status);`,
        ],
        cwd: process.cwd(),
        env: { ...process.env, DIST_DIR: "frontend/public" },
    });
    expect(child.exitCode, child.stderr.toString()).toBe(0);
    return Number(child.stdout.toString().trim());
}

test("all root-relative editorial links and images resolve through the real server", async () => {
    const targets = new Set<string>();
    for (const path of editorial) {
        const html = await (await get(path)).text();
        new HTMLRewriter()
            .on("a[href], img[src]", {
                element: (el) => {
                    const target = el.getAttribute("href") ?? el.getAttribute("src");
                    if (target?.startsWith("/") && !target.startsWith("//")) {
                        targets.add(target);
                    }
                },
            })
            .transform(html);
    }
    expect(targets.size).toBeGreaterThan(10);
    for (const target of targets) {
        expect(await targetStatus(target), target).toBe(200);
    }
});

test("AK product page qualifies retained catalog values against reviewed model documents", async () => {
    const md = requiredPage("/actuators/cubemars-ak80-9").body();
    expect(md).toContain("Legacy catalog / revision conflict");
    expect(md).toContain("485 g");
    expect(md).toContain("490 g");
    expect(md).toContain("14-bit");
    expect(md).toContain("16-bit");
    expect(md).toContain("21-bit");
    expect(md).toContain("not revalidated by this editorial review");
    const html = await (await get("/actuators/cubemars-ak80-9")).text();
    expect(html.split('id="catalog-content"')[1]).toContain(
        "Legacy catalog / revision conflict",
    );
});

function requiredPage(path: string) {
    const page = findPage(path);
    if (!page) throw new Error(`Missing page ${path}`);
    return page;
}

const editorial = [
    "/guides",
    "/guides/robot-actuator-selection",
    "/comparisons/cubemars-ak80-9-vs-xiaomi-cybergear",
];

test("editorial freshness reflects the content review rather than the unchanged catalog", async () => {
    const sitemap = await (await get("/sitemap.xml")).text();
    for (const path of editorial) {
        const md = await (await get(`${path}.md`)).text();
        expect(md).toContain("last-updated: 2026-10-01");
        expect(requiredPage(path).jsonLd()[0]?.dateModified).toBe("2026-10-01");
        const entry = sitemap
            .split("<url>")
            .find((value) =>
                value.includes(`<loc>https://actuatorlist.com${path}</loc>`),
            );
        expect(entry).toContain("<lastmod>2026-10-01</lastmod>");
    }
});

test("editorial routes serve static indexed HTML, source links, matching JSONLD and markdown twins", async () => {
    const sitemap = await (await get("/sitemap.xml")).text();
    for (const path of editorial) {
        const response = await get(path);
        expect(response.status).toBe(200);
        const page = requiredPage(path);
        expect(page.kind).toBe("static");
        const html = await response.text();
        expect(html).not.toContain('id="root"');
        expect(html).toContain(
            `rel="canonical" href="https://actuatorlist.com${path}"`,
        );
        expect(html).toContain(`href="${path}.md"`);
        expect(html).not.toContain('name="robots" content="noindex');
        expect(sitemap).toContain(`https://actuatorlist.com${path}`);
        const md = await get(`${path}.md`);
        expect(md.status).toBe(200);
        expect(await md.text()).toContain(page.body());
        const graph = JSON.parse(
            /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(
                html,
            )?.[1] ?? "{}",
        )["@graph"];
        expect(graph).toEqual(page.jsonLd());
        if (path !== "/guides") {
            expect(
                graph.find(
                    (node: Record<string, unknown>) => node["@type"] === "TechArticle",
                ).headline,
            ).toBe(page.body().split("\n")[0]?.replace(/^# /, ""));
            expect(html).toMatch(/href="https:\/\/arxiv.org\/pdf\//);
            expect(html).not.toMatch(/\[\d+\]/);
            expect(page.body().split(/\s+/).length).toBeGreaterThan(
                path.startsWith("/comparisons") ? 700 : 1000,
            );
        }
    }
    const comparison = requiredPage(
        "/comparisons/cubemars-ak80-9-vs-xiaomi-cybergear",
    ).body();
    for (const token of [
        "KV100",
        "24 rpm",
        "25 °C",
        "120 °C",
        "28 s",
        "16-bit",
        "21-bit",
        "expired",
        "third-party",
        "Quantitative estimate not defensible",
    ])
        expect(comparison).toContain(token);
    expect(comparison).not.toContain("20 minutes");
    for (const path of [
        "/guides/missing",
        "/guides/missing.md",
        "/comparisons/missing",
    ])
        expect((await get(path)).status).toBe(404);
});

test("editorial navigation and comparison links remain discoverable outside the SPA fallback", async () => {
    const guide = await (await get("/guides/robot-actuator-selection")).text();
    expect(guide).toContain('<a href="/guides">Guides</a>');
    const comparison = await (
        await get("/comparisons/cubemars-ak80-9-vs-xiaomi-cybergear")
    ).text();
    expect(comparison).toContain('class="ga-table-scroll"');
    expect(guide).toContain("overflow-wrap:anywhere");
    for (const id of ["cubemars-ak80-9", "xiaomi-cybergear"]) {
        const html = await (await get(`/actuators/${id}`)).text();
        expect(html.split('id="catalog-content"')[1]).toContain(
            "/comparisons/cubemars-ak80-9-vs-xiaomi-cybergear",
        );
    }
});

const products = [
    "leaderdrive-lcs",
    "leaderdrive-lhd",
    "leaderdrive-lhs",
    "nidec-flexwave-wpg",
    "nidec-smart-flexwave-srh",
];

test("visual dashboards expose accessible concepts and evidence before expandable methodology", async () => {
    for (const path of editorial.slice(1)) {
        const html = await (await get(path)).text();
        const visible = html.split('<details class="ga-methodology">')[0] ?? "";
        expect(html).toContain('<details class="ga-methodology">');
        expect(html).toContain(
            "<summary>Full methodology and source conflicts</summary>",
        );
        expect(visible.match(/class="ga-evidence-panel"/g)).toHaveLength(4);
        expect(visible.match(/<svg[^>]*role="img"/g)).toHaveLength(4);
        for (const label of [
            "Efficiency",
            "Cooling",
            "Precision",
            "Sim2real",
            "Manufacturer spec",
            "Research measurement",
            "Estimate",
            "Unknown",
            "Conceptual illustration, not a measured chart",
        ])
            expect(visible).toContain(label);
        expect(visible).toContain("ga-dashboard");
        expect(visible).toContain("height:280px");
        expect(visible).toMatch(/href="https:\/\/arxiv.org\/pdf\//);
    }
    const html = await (
        await get("/comparisons/cubemars-ak80-9-vs-xiaomi-cybergear")
    ).text();
    const visible = html.split('<details class="ga-methodology">')[0] ?? "";
    for (const claim of [
        "16-bit",
        "21-bit",
        "28 s",
        "24 rpm",
        "25 °C",
        "120 °C",
        "expired",
        "third-party",
        "not Xiaomi-origin authenticated",
        "recovery time unknown",
        "KV100",
        "7.75:1",
    ])
        expect(visible).toContain(claim);
    expect(visible).not.toContain("most efficient");
    expect(html).toContain("command-to-output");
});

test("editorial layout is scoped, wider and responsive without changing product layout", async () => {
    for (const path of editorial) {
        const html = await (await get(path)).text();
        expect(html).toContain('<body class="ga-page ga-editorial">');
        expect(html).toContain('class="ga-editorial-grid"');
        expect(html).toContain(".ga-page.ga-editorial .ga-main{max-width:75rem");
    }
    const html = await (
        await get("/comparisons/cubemars-ak80-9-vs-xiaomi-cybergear")
    ).text();
    expect(html.match(/class="ga-photo-card"/g)).toHaveLength(2);
    expect(html).toContain('class="ga-photo-copy"');
    const product = await (await get("/actuators/leaderdrive-lcs")).text();
    expect(product).not.toContain('<body class="ga-page ga-editorial">');
    expect(product).not.toContain('class="ga-editorial-grid"');
});

test("editorial product photos use correct local assets, descriptive alt text and product links", async () => {
    const examples = [
        [
            "/comparisons/cubemars-ak80-9-vs-xiaomi-cybergear",
            ["cubemars-ak80-9", "xiaomi-cybergear"],
        ],
        [
            "/guides/robot-actuator-selection",
            ["leaderdrive-lcs", "nidec-smart-flexwave-srh"],
        ],
    ] as const;
    for (const [path, ids] of examples) {
        const html = await (await get(path)).text();
        const photos: { src: string | null; alt: string | null }[] = [];
        const links: string[] = [];
        new HTMLRewriter()
            .on("main img", {
                element: (el) => {
                    photos.push({
                        src: el.getAttribute("src"),
                        alt: el.getAttribute("alt"),
                    });
                },
            })
            .on("main a", {
                element: (el) => {
                    links.push(el.getAttribute("href") ?? "");
                },
            })
            .transform(html);
        expect(photos).toHaveLength(2);
        for (const id of ids) {
            const photo = photos.find((p) => p.src === `/actuator-images/${id}.webp`);
            expect(photo?.alt).toMatch(/product photo/i);
            expect(links).toContain(`/actuators/${id}`);
            expect(await targetStatus(`/actuator-images/${id}.webp`)).toBe(200);
        }
        expect(html).toContain("Manufacturer/distributor product image");
        expect(html).toContain("not a measured test");
        expect(html).toContain("object-fit:contain");
        expect(html).toContain("grid-template-columns:repeat(auto-fit");
        expect(requiredPage(path).body()).toContain("![");
    }
});

test("product Sources lists include the newly reviewed primary documents", () => {
    const primary = [
        ["leaderdrive-lcs", "https://www.leaderdrive.com/product/6.html"],
        ["leaderdrive-lhd", "https://www.leaderdrive.com/product/2.html"],
        ["leaderdrive-lhs", "https://www.leaderdrive.com/product/4.html"],
        [
            "nidec-flexwave-wpg",
            "https://www.nidec-dtc.com/wp-content/uploads/downloads/catalogs/nidec-flexwave-strain-wave-gear-reducer-catalog.pdf",
        ],
        [
            "nidec-smart-flexwave-srh",
            "https://www.nidec-dtc.com/wp-content/uploads/downloads/catalogs/nidec-smart-flexwave-strain-wave-gear-reducer-catalog.pdf",
        ],
    ] as const;
    for (const [id, url] of primary) {
        const sources = requiredPage(`/actuators/${id}`)
            .body()
            .split("## Sources")[1]
            ?.split("## Similar")[0];
        expect(sources).toContain(url);
    }
});

test("family enrichment does not republish legacy zero-backlash placeholders as measured specifications", async () => {
    for (const id of products) {
        const page = requiredPage(`/actuators/${id}`);
        expect(page.body()).not.toContain("Marketed zero-backlash (recorded 0)");
        expect(page.body()).not.toContain("per distributor listings");
        expect(page.body()).toContain(
            "Legacy catalog placeholder; not a measured family rating",
        );
        const product = page.jsonLd().find((node) => node["@type"] === "Product");
        if (!product) throw new Error(`Missing Product ${id}`);
        expect(
            (product.additionalProperty as { name: string }[]).some(
                (p) => p.name === "Backlash",
            ),
        ).toBe(false);
    }
});

test("researched reducer families have distinct summaries and persistent sourced engineering notes", async () => {
    const summaries = new Set<string>();
    for (const id of products) {
        const page = requiredPage(`/actuators/${id}`);
        summaries.add(page.description);
        expect(page.description).not.toContain("n/a");
        expect(page.description).toMatch(/reducer|gearhead/);
        const html = await (await get(page.path)).text();
        const persistent = html.split('id="catalog-content"')[1] ?? "";
        expect(persistent).toContain("Engineering notes");
        expect(persistent).toContain("Manufacturer specifications");
        expect(persistent).toContain("Engineering inference");
        expect(persistent).toContain("Unknown / confirmation required");
        expect(persistent).toMatch(/href="https:\/\/www\.(leaderdrive|nidec-dtc)\.com/);
        expect(persistent).toContain("/guides/robot-actuator-selection");
        expect(persistent).not.toMatch(/efficiency (?:is |of )?\d+%/);
        const product = page.jsonLd().find((node) => node["@type"] === "Product");
        expect(product?.description).toBe(page.description);
    }
    expect(summaries.size).toBe(5);
});
