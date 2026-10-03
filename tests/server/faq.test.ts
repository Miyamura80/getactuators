import { expect, test } from "bun:test";
import { allPages, findPage } from "@/server/agent/pages";
import { faqItems } from "@/server/agent/pages-md";
import { get, getMarkdown } from "./agent-helpers";

test("FAQ answers are independently closed native disclosures", async () => {
    const html = await (await get("/faq")).text();
    expect([...html.matchAll(/<details class="ga-faq-item">/g)]).toHaveLength(7);
    expect(html).not.toContain('<details class="ga-faq-item" open');
    expect([...html.matchAll(/<summary><h3>/g)]).toHaveLength(7);
});

test("homepage no longer exposes FAQ content or FAQPage schema", async () => {
    const html = await (await get("/")).text();
    expect(html).not.toContain('class="ga-faq-item"');
    expect(html).not.toContain('"@type":"FAQPage"');
    expect(findPage("/")?.body()).not.toContain("## Frequently asked questions");
    expect(
        findPage("/")
            ?.jsonLd()
            .some((node) => node["@type"] === "FAQPage"),
    ).toBe(false);
});

test("FAQ has a real canonical route, Markdown twin, sitemap entry and seven complete answers", async () => {
    const response = await get("/faq");
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('rel="canonical" href="https://actuatorlist.com/faq"');
    expect(html).toContain('"@id":"https://actuatorlist.com/faq#faq"');
    expect(html).toContain('"url":"https://actuatorlist.com/faq"');
    const markdown = await (await get("/faq.md")).text();
    expect(await (await getMarkdown("/faq")).text()).toBe(markdown);
    expect(allPages()).toHaveLength(80);
    expect(await (await get("/sitemap.xml")).text()).toContain(
        "https://actuatorlist.com/faq",
    );
    const questions = faqItems();
    expect(questions).toHaveLength(7);
    expect(
        findPage("/faq")
            ?.jsonLd()
            .find((node) => node["@type"] === "FAQPage")?.mainEntity,
    ).toEqual(
        questions.map(({ q, a }) => ({
            "@type": "Question",
            name: q,
            acceptedAnswer: { "@type": "Answer", text: a },
        })),
    );
    for (const { q, a } of questions) {
        expect(markdown).toContain(`### ${q}`);
        expect(findPage("/faq")?.body()).toContain(a);
    }
});
