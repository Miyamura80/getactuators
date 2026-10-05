import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { ACTUATORS, type Actuator } from "@/catalog";
import { evidenceFor, fieldCaveat } from "@/catalog/evidence";
import { actuatorPath, categoryLabel } from "@/server/agent/catalog-md";
import { CATALOG_UPDATED_DATE } from "@/server/agent/freshness";
import { markdownToHtml, pageBody } from "@/server/agent/html/body";
import { documentTitle } from "@/server/agent/html/head";
import { humanize, mdText, num, usd } from "@/server/agent/md";
import { allPages, findPage, pageMarkdown } from "@/server/agent/pages";
import { faqSection } from "@/server/agent/pages-md";
import { productSummary } from "@/server/agent/product-content";
import approvedEngineering from "../catalog/engineering-approved.json";
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
// MCP tools added after the capture are listed in the /agents tool line; drop
// only those names so the rest of that line stays locked.
const TOOLS_ADDED_AFTER_BASELINE = [
    "humanoid_joint_requirements",
    "arm_holding_torque",
];
function snapshotContent(value: string) {
    let out = value.replace(
        `The catalog was last updated on ${CATALOG_UPDATED_DATE}.`,
        `The catalog was last updated on ${baseline.catalogUpdatedDate}.`,
    );
    for (const name of TOOLS_ADDED_AFTER_BASELINE)
        out = out.replaceAll(`, ${name}`, "");
    return out;
}

// Old specification values recovered with git show HEAD:src/server/agent/catalog-md.ts.
// Normalize only complete, unique specification rows. The original golden hashes
// still protect all surrounding prose (including the existing AK revision note).
function legacyBoolean(value: boolean | null): string {
    if (value === null) return "n/a";
    return value ? "yes" : "no";
}

function legacyProductRows(a: Actuator): [string, string][] {
    return [
        ["Category", categoryLabel(a.category)],
        ["Peak torque", num(a.peak_torque_nm, "Nm")],
        ["Rated torque", num(a.rated_torque_nm, "Nm")],
        ["Max speed", num(a.max_speed_rpm, "rpm", 0)],
        ["Gear ratio", a.gear_ratio ?? "n/a"],
        ["Weight", num(a.weight_g, "g", 0)],
        ["Torque density", num(a.torque_density_nm_per_kg, "Nm/kg")],
        ["Price", usd(a.price_usd)],
        ["Price per Nm", a.price_per_nm === null ? "n/a" : `$${num(a.price_per_nm)}`],
        ["Backdrivable", legacyBoolean(a.backdrivable)],
        ["Backlash", num(a.backlash_arcmin, "arcmin")],
        ["Voltage", a.voltage_v === null ? "n/a" : `${a.voltage_v} V`],
        ["Peak current", num(a.peak_current_a, "A")],
        ["Communication", a.comm?.join(", ") || "n/a"],
        ["Control modes", a.control_modes?.join(", ") || "n/a"],
        ["Encoder", a.encoder ?? "n/a"],
        ["Integrated driver", legacyBoolean(a.integrated_driver)],
        ["Availability", a.availability ? humanize(a.availability) : "n/a"],
        ["Data status", a.verified ? "verified against sources" : "unverified"],
    ];
}

function productSnapshotRows(
    a: Actuator,
    label: string,
    value: string,
): [string, string] {
    const fields: Record<string, string> = {
        "Peak torque": "peak_torque_nm",
        "Rated torque": "rated_torque_nm",
        "Max speed": "max_speed_rpm",
        "Gear ratio": "gear_ratio",
        Price: "price_usd",
        "Price per Nm": "price_per_nm",
        Voltage: "voltage_v",
        "Peak current": "peak_current_a",
        Weight: "weight_g",
        Encoder: "encoder",
        "Torque density": "torque_density_nm_per_kg",
        Backdrivable: "backdrivable",
        Backlash: "backlash_arcmin",
    };
    const placeholder =
        productSummary(a.id) && ["Backlash", "Backdrivable", "Encoder"].includes(label);
    const oldValue = placeholder
        ? "Legacy catalog placeholder; not a measured family rating. See engineering notes."
        : value;
    const field = fields[label];
    const caveat = !field || placeholder ? undefined : fieldCaveat(a, field);
    const currentValue =
        label === "Data status"
            ? evidenceFor(a).label
            : `${oldValue}${caveat ? `: ${caveat}` : ""}`;
    const oldRow = `\n| ${label} | ${mdText(oldValue)} |\n`;
    const approvedMyRows: Record<string, string> =
        approvedEngineering["myactuator-rmd-x8-pro-v2"].rows;
    const approvedRow =
        a.id === "myactuator-rmd-x8-pro-v2" ? approvedMyRows[label] : undefined;
    const currentRow =
        a.id === "myactuator-rmd-x8-pro-v2"
            ? approvedRow
                ? `\n${approvedRow}\n`
                : oldRow
            : `\n| ${label} | ${mdText(currentValue)} |\n`;
    return [oldRow, currentRow];
}

function snapshotProduct(body: string, a: Actuator): string {
    let normalized = body;
    const replacements: [string, string][] = [];
    for (const [label, value] of legacyProductRows(a)) {
        const [oldRow, currentRow] = productSnapshotRows(a, label, value);
        // Data status is the final table row, still followed by two newlines.
        expect(body.split(currentRow)).toHaveLength(2);
        if (currentRow !== oldRow) {
            expect(body).not.toContain(oldRow);
            normalized = normalized.replace(currentRow, oldRow);
            replacements.push([oldRow, currentRow]);
        }
    }
    // Reversibility proves normalization changed only the listed exact cells.
    let restored = normalized;
    for (const [oldRow, currentRow] of replacements) {
        expect(restored.split(oldRow)).toHaveLength(2);
        restored = restored.replace(oldRow, currentRow);
    }
    expect(restored).toBe(body);
    return snapshotEngineering(normalized, a.id);
}

function snapshotEngineering(body: string, id: string): string {
    const approved = approvedEngineering[id as keyof typeof approvedEngineering];
    if (!approved) {
        expect(body).not.toContain("## Engineering evidence");
        return body;
    }
    const inserted = `\n\n${approved.section}`;
    const anchor = "\n\n## Sources\n\n";
    expect(body.split(inserted)).toHaveLength(2);
    expect(body).toContain(`${inserted}${anchor}`);
    const normalized = body.replace(`${inserted}${anchor}`, anchor);
    expect(normalized.split(anchor)).toHaveLength(2);
    expect(normalized.replace(anchor, `${inserted}${anchor}`)).toBe(body);
    return normalized;
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
    const preservedBody = actuator
        ? snapshotProduct(currentBody, actuator)
        : currentBody;
    const originalBody =
        page.path === "/"
            ? `${preservedBody}\n\n## Frequently asked questions\n\n${faqSection()}`
            : preservedBody;
    expect(sha256(snapshotContent(originalBody))).toBe(original.bodySha256);
    const html = await expectTitles(page.path, documentTitle(page.title));
    // The approved gallery replaces its transient Markdown fallback with
    // real cards. Still lock its canonical prose rendering to the original
    // hash, and require the served tree; never regenerate golden hashes.
    const builtGallery =
        page.path === "/actuators" && html.includes('data-gallery-prerender="true"');
    if (builtGallery) {
        expect([...html.matchAll(/class="bento-card(?: [^"]*)?"/g)]).toHaveLength(68);
        expect(html).not.toContain("<summary>Catalog details</summary>");
    }
    const contentPattern =
        /<section class="ga-page" id="catalog-content"[^>]*>[\s\S]*?<\/section>|<main class="ga-main">[\s\S]*?<\/main>/;
    const content = contentPattern.exec(
        builtGallery ? pageBody(currentBody) : html,
    )?.[0];
    expect(content).toBeDefined();
    if (actuator) {
        // Check the real HTTP response against today's Markdown independently
        // of the narrow backwards normalization used for golden hashes.
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
            `<div class="ga-main">${markdownToHtml(currentBody.slice(split))}</div>`,
        );
    }
    const preservedContent = actuator
        ? contentPattern.exec(
              pageBody(
                  preservedBody.slice(
                      0,
                      preservedBody.indexOf("\n\n## Specifications"),
                  ),
              ),
          )?.[0]
        : content;
    expect(preservedContent).toBeDefined();
    expect(sha256(snapshotContent(preservedContent ?? ""))).toBe(
        original.htmlContentSha256,
    );
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

// Captured from the clean main baseline before implementation. Only expected
// metadata labels differ; hashes lock down original content, not head markup.
test("the full catalog has distinct reviewed metadata without content changes", async () => {
    const registered = allPages();
    expect(registered).toHaveLength(84);
    // Pages added after the baseline capture have their own tests.
    const added = new Set([
        "/faq",
        "/compare",
        "/tools/motor-torque-calculator",
        "/guides/humanoid-robot-actuators",
        "/tools/robot-arm-torque-calculator",
    ]);
    const pages = registered.filter((page) => !added.has(page.path));
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
        await expectCatalogPage(page, original);
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
