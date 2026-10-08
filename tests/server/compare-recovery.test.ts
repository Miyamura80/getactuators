import { expect, test } from "bun:test";
import { get } from "./agent-helpers";

test("one-ID HTML startup fallback keeps the remaining selection and recovery above bounded help", async () => {
    const response = await get("/compare?compare=cubemars-ak80-9");
    const html = await response.text();
    const root = html.slice(
        html.indexOf('<div id="root"'),
        html.indexOf('<section id="catalog-content"'),
    );
    expect(root).not.toContain('class="comparison-hub"');
    expect(root).toContain('class="compare-products"');
    expect(root).toContain('role="status"');
    expect(root).toContain('href="/actuators/cubemars-ak80-9"');
});
