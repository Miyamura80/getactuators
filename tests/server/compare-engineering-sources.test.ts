import { expect, test } from "bun:test";
import { ACTUATORS } from "@/catalog";
import { COMPARE_SPECS } from "@/catalog/compare";
import approved from "../catalog/engineering-approved.json";
import { get } from "./agent-helpers";

const ids = ["cubemars-ak80-9", "xiaomi-cybergear", "myactuator-rmd-x8-pro-v2"];

test("no-JS comparison keeps exact sources and locators associated with each model and topic", async () => {
    const query = `?compare=${ids.join(",")}`;
    const html = await (await get(`/compare${query}`)).text();
    const md = await (await get(`/compare.md${query}`)).text();
    for (const id of ids) {
        const a = ACTUATORS.find((record) => record.id === id);
        if (!a) throw new Error(`Missing catalog model ${id}`);
        const frozen = approved[id as keyof typeof approved].evidence;
        for (const [topic, item] of Object.entries(frozen.topics)) {
            const marker = `<details data-actuator-id="${id}" data-topic="${topic}">`;
            expect(html).toContain(marker);
            const detail = html.slice(
                html.indexOf(marker),
                html.indexOf("</details>", html.indexOf(marker)),
            );
            expect(detail).toContain(
                `<summary>${a.name.replaceAll("&", "&amp;")} / ${topic}: scope &amp; sources</summary>`,
            );
            const heading = `### ${a.name} / ${topic}`;
            expect(md).toContain(heading);
            const section = md.slice(md.indexOf(heading)).split("\n\n### ")[0];
            for (const source of item.sources) {
                expect(detail).toContain(
                    `href="${source.url.replaceAll("&", "&amp;")}"`,
                );
                expect(detail).toContain(source.locator.replaceAll("&", "&amp;"));
                expect(section).toContain(`[${source.label}](${source.url})`);
                expect(section).toContain(source.locator);
            }
        }
        for (const spec of COMPARE_SPECS) {
            const cell = spec.display(a);
            expect(cell.length).toBeLessThan(240);
            expect(cell).not.toContain("https://");
        }
    }
});
