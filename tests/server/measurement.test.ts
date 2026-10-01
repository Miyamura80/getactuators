import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { measurementHtml } from "../../src/server/measurement";

test("measurement injection is disabled unless runtime ID is strictly valid", () => {
    const html =
        '<html><head></head><body><a href="/actuators/cubemars-ak80-9">Product</a></body></html>';
    expect(measurementHtml(html, "/guides/robot-actuator-selection", undefined)).toBe(
        html,
    );
    expect(
        measurementHtml(
            html,
            "/guides/robot-actuator-selection",
            'G-X" onload="alert(1)',
        ),
    ).toBe(html);
    const configured = measurementHtml(
        html,
        "/guides/robot-actuator-selection",
        "G-TEST123456",
    );
    expect(configured).toContain('src="/measurement.js"');
    expect(configured).toContain('data-measure-event="guide_product_click"');
    expect(configured).toContain('data-product-id="cubemars-ak80-9"');
    expect(configured).not.toContain("googletagmanager.com");
});
import { get } from "./agent-helpers";
test("configured HTML pages alone receive bootstrap and asset works without dist", async () => {
    const previous = process.env.GA4_MEASUREMENT_ID;
    process.env.GA4_MEASUREMENT_ID = "G-TEST123456";
    try {
        for (const path of [
            "/",
            "/all",
            "/privacy",
            "/guides/robot-actuator-selection",
            "/comparisons/cubemars-ak80-9-vs-xiaomi-cybergear",
        ]) {
            const response = await get(path);
            expect(response.status).toBe(200);
            expect(await response.text()).toContain('src="/measurement.js"');
        }
        for (const path of [
            "/guides/robot-actuator-selection.md",
            "/api/v1/actuators",
            "/not-a-page",
        ]) {
            expect(await (await get(path)).text()).not.toContain(
                'src="/measurement.js"',
            );
        }
        expect((await get("/measurement.js")).status).toBe(200);
    } finally {
        if (previous === undefined) process.env.GA4_MEASUREMENT_ID = undefined;
        else process.env.GA4_MEASUREMENT_ID = previous;
    }
});
test("primary product links and explicit comparative datasheets are scoped, never arbitrary citations", async () => {
    const id = "G-TEST123456";
    const product = await get("/actuators/cubemars-ak80-9");
    const html = measurementHtml(
        await product.text(),
        "/actuators/cubemars-ak80-9",
        id,
    );
    expect(html).toContain('data-measure-event="manufacturer_click"');
    expect(html).toContain('data-measure-event="datasheet_click"');
    const comparison = await get("/comparisons/cubemars-ak80-9-vs-xiaomi-cybergear");
    const measured = measurementHtml(
        await comparison.text(),
        "/comparisons/cubemars-ak80-9-vs-xiaomi-cybergear",
        id,
    );
    expect(measured).toContain('data-measure-surface="editorial-source"');
    expect(measured).toContain('data-measure-event="guide_product_click"');
    const paper = measured.match(/<a[^>]+href="https:\/\/arxiv.org\/pdf\/[^>]+>/)?.[0];
    expect(paper).toBeDefined();
    expect(paper).not.toContain("data-measure-event");
});
test("privacy describes conditional opt-in cookies and preference storage without claiming activation", async () => {
    const privacy = await (await get("/privacy.md")).text();
    expect(privacy).toContain("only after you choose Allow analytics");
    expect(privacy).toContain("Analytics preferences");
    expect(privacy).not.toContain("No accounts, no cookies, no analytics");
    expect(privacy).not.toContain("The site sets no cookies and runs no analytics");
});
import { measurementAsset } from "../../src/server/routes/measurement";
test("bootstrap asset resolves built runtime or checked-in public without a build", async () => {
    const directory = await mkdtemp(join(tmpdir(), "measurement-asset-"));
    try {
        await Bun.write(
            `${directory}/measurement.js`,
            await Bun.file("frontend/public/measurement.js").text(),
        );
        const built = await measurementAsset(directory, "missing-public");
        expect(await built.text()).toContain("actuatorlist.analytics.v1");
        const checkout = await measurementAsset("missing-dist", "frontend/public");
        expect(await checkout.text()).toContain("actuatorlist.analytics.v1");
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
});
