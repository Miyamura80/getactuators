import { expect, test } from "bun:test";
import { ACTUATORS } from "@/catalog";
import { actuatorBody, actuatorSummary } from "@/server/agent/catalog-md";
import { markdownToHtml } from "@/server/agent/html/body";
import approved from "../catalog/engineering-approved.json";
import { get } from "./agent-helpers";

test("product engineering evidence is persistent HTML and Markdown without metadata enrichment", async () => {
    for (const id of [
        "cubemars-ak80-9",
        "xiaomi-cybergear",
        "myactuator-rmd-x8-pro-v2",
    ]) {
        const a = ACTUATORS.find((record) => record.id === id);
        if (!a) throw new Error(id);
        const body = actuatorBody(a);
        expect(body).toContain("## Engineering evidence\n\n");
        expect(body).toContain("### Efficiency");
        expect(body).toContain("### Thermal duty");
        expect(body).toContain("### Precision");
        expect(body).toContain("### Modeling");
        expect(body).toContain("**Scope / unknowns:**");
        expect(body).toContain("**Source locators:**");
        expect(actuatorSummary(a)).not.toContain("Document review");
        const section = body.slice(
            body.indexOf("## Engineering evidence"),
            body.indexOf("\n\n## Sources"),
        );
        expect(section).toBe(approved[id as keyof typeof approved].section);
        const html = await (await get(`/actuators/${id}`)).text();
        expect(html).toContain(markdownToHtml(section));
        expect(await (await get(`/actuators/${id}.md`)).text()).toContain(body);
    }
});
